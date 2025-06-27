import express from 'express';
import cors from 'cors';
import { S3Client } from './s3-client.js';
import { S3Config } from './types.js';

export class HTTPServer {
  private app: express.Application;
  private s3Client: S3Client;
  private port: number;

  constructor(s3Config: S3Config, port: number = 3000) {
    this.port = port;
    this.s3Client = new S3Client(s3Config);
    this.app = express();

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // List documents
    this.app.get('/documents', async (req, res) => {
      try {
        const { prefix, maxKeys } = req.query;
        const documents = await this.s3Client.listDocuments({
          prefix: prefix as string,
          maxKeys: maxKeys ? parseInt(maxKeys as string) : undefined,
        });
        res.json({ success: true, data: documents });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Read document
    this.app.get('/documents/:key(*)', async (req, res) => {
      try {
        const { key } = req.params;
        const { encoding = 'utf8' } = req.query;
        
        const document = await this.s3Client.readDocument({
          key: decodeURIComponent(key),
          encoding: encoding as 'utf8' | 'base64',
        });
        
        res.json({ success: true, data: document });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Get document info
    this.app.head('/documents/:key(*)', async (req, res) => {
      try {
        const { key } = req.params;
        const info = await this.s3Client.getDocumentInfo(decodeURIComponent(key));
        
        if (!info) {
          return res.status(404).json({
            success: false,
            error: 'Document not found',
          });
        }
        
        res.json({ success: true, data: info });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Check if document exists
    this.app.get('/documents/:key(*)/exists', async (req, res) => {
      try {
        const { key } = req.params;
        const exists = await this.s3Client.documentExists(decodeURIComponent(key));
        
        res.json({ success: true, data: { exists } });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // MCP-compatible endpoint for n8n
    this.app.post('/mcp', async (req, res) => {
      try {
        const { method, params } = req.body;
        
        if (method === 'tools/list') {
          res.json({
            jsonrpc: '2.0',
            id: req.body.id || 1,
            result: {
              tools: [
                {
                  name: 'list_documents',
                  description: 'List documents in the S3 bucket with optional prefix filtering',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      prefix: { type: 'string' },
                      maxKeys: { type: 'number' },
                    },
                  },
                },
                {
                  name: 'read_document',
                  description: 'Read the content of a specific document from the S3 bucket',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      key: { type: 'string' },
                      encoding: { type: 'string', enum: ['utf8', 'base64'] },
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
                      key: { type: 'string' },
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
                      key: { type: 'string' },
                    },
                    required: ['key'],
                  },
                },
              ],
            },
          });
        } else if (method === 'tools/call') {
          const { name, arguments: args } = params;
          let result: any;

          switch (name) {
            case 'list_documents':
              const documents = await this.s3Client.listDocuments({
                prefix: args.prefix,
                maxKeys: args.maxKeys,
              });
              result = {
                content: [
                  {
                    type: 'text',
                    text: `Found ${documents.length} document(s):\n${documents.map(doc => 
                      `- ${doc.key} (${doc.size} bytes, modified: ${doc.lastModified.toISOString()})`
                    ).join('\n')}`,
                  },
                ],
              };
              break;

            case 'read_document':
              const document = await this.s3Client.readDocument({
                key: args.key,
                encoding: args.encoding || 'utf8',
              });
              result = {
                content: [
                  {
                    type: 'text',
                    text: `Document: ${document.key}\nContent Type: ${document.contentType}\nSize: ${document.size} bytes\nLast Modified: ${document.lastModified.toISOString()}\n\nContent:\n${document.content}`,
                  },
                ],
              };
              break;

            case 'get_document_info':
              const info = await this.s3Client.getDocumentInfo(args.key);
              if (!info) {
                result = {
                  content: [
                    {
                      type: 'text',
                      text: `Document '${args.key}' not found`,
                    },
                  ],
                };
              } else {
                result = {
                  content: [
                    {
                      type: 'text',
                      text: `Document: ${info.key}\nContent Type: ${info.contentType || 'unknown'}\nSize: ${info.size} bytes\nLast Modified: ${info.lastModified.toISOString()}`,
                    },
                  ],
                };
              }
              break;

            case 'document_exists':
              const exists = await this.s3Client.documentExists(args.key);
              result = {
                content: [
                  {
                    type: 'text',
                    text: `Document '${args.key}' ${exists ? 'exists' : 'does not exist'}`,
                  },
                ],
              };
              break;

            default:
              throw new Error(`Unknown tool: ${name}`);
          }

          res.json({
            jsonrpc: '2.0',
            id: req.body.id || 1,
            result,
          });
        } else {
          res.status(400).json({
            jsonrpc: '2.0',
            id: req.body.id || 1,
            error: {
              code: -32601,
              message: 'Method not found',
            },
          });
        }
      } catch (error) {
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body.id || 1,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error',
          },
        });
      }
    });

    // Error handling middleware
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    });
  }

  start() {
    return new Promise<void>((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`HTTP Server running on port ${this.port}`);
        console.log(`Health check: http://localhost:${this.port}/health`);
        console.log(`MCP endpoint: http://localhost:${this.port}/mcp`);
        resolve();
      });
    });
  }
} 