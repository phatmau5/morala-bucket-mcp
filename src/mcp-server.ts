import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { S3Client } from './s3-client.js';
import { S3Config } from './types.js';

export class MCPServer {
  private server: Server;
  private s3Client: S3Client;

  constructor(s3Config: S3Config) {
    this.s3Client = new S3Client(s3Config);
    
    const transport = new StdioServerTransport();
    this.server = new Server(
      {
        name: 'morala-bucket-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.server.connect(transport);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_documents',
            description: 'List documents in the S3 bucket with optional prefix filtering',
            inputSchema: {
              type: 'object',
              properties: {
                prefix: {
                  type: 'string',
                  description: 'Optional prefix to filter documents by path',
                },
                maxKeys: {
                  type: 'number',
                  description: 'Maximum number of documents to return (default: 1000)',
                },
              },
            },
          },
          {
            name: 'read_document',
            description: 'Read the content of a specific document from the S3 bucket',
            inputSchema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'The S3 key (path) of the document to read',
                },
                encoding: {
                  type: 'string',
                  enum: ['utf8', 'base64'],
                  description: 'Encoding for the document content (default: utf8)',
                },
              },
              required: ['key'],
            },
          },
          {
            name: 'get_document_info',
            description: 'Get metadata information about a specific document',
            inputSchema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'The S3 key (path) of the document',
                },
              },
              required: ['key'],
            },
          },
          {
            name: 'document_exists',
            description: 'Check if a document exists in the S3 bucket',
            inputSchema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'The S3 key (path) of the document to check',
                },
              },
              required: ['key'],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_documents':
            return await this.handleListDocuments(args);
          
          case 'read_document':
            return await this.handleReadDocument(args);
          
          case 'get_document_info':
            return await this.handleGetDocumentInfo(args);
          
          case 'document_exists':
            return await this.handleDocumentExists(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  private async handleListDocuments(args: any) {
    const documents = await this.s3Client.listDocuments({
      prefix: args.prefix,
      maxKeys: args.maxKeys,
    });

    const documentList = documents.map(doc => 
      `- ${doc.key} (${doc.size} bytes, modified: ${doc.lastModified.toISOString()})`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${documents.length} document(s):\n${documentList}`,
        },
      ],
    };
  }

  private async handleReadDocument(args: any) {
    const document = await this.s3Client.readDocument({
      key: args.key,
      encoding: args.encoding || 'utf8',
    });

    return {
      content: [
        {
          type: 'text',
          text: `Document: ${document.key}\nContent Type: ${document.contentType}\nSize: ${document.size} bytes\nLast Modified: ${document.lastModified.toISOString()}\n\nContent:\n${document.content}`,
        },
      ],
    };
  }

  private async handleGetDocumentInfo(args: any) {
    const info = await this.s3Client.getDocumentInfo(args.key);

    if (!info) {
      return {
        content: [
          {
            type: 'text',
            text: `Document '${args.key}' not found`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Document: ${info.key}\nContent Type: ${info.contentType || 'unknown'}\nSize: ${info.size} bytes\nLast Modified: ${info.lastModified.toISOString()}`,
        },
      ],
    };
  }

  private async handleDocumentExists(args: any) {
    const exists = await this.s3Client.documentExists(args.key);

    return {
      content: [
        {
          type: 'text',
          text: `Document '${args.key}' ${exists ? 'exists' : 'does not exist'}`,
        },
      ],
    };
  }
} 