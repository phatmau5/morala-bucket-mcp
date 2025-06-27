# Morala Bucket MCP Server

An MCP (Model Context Protocol) server that allows you to read documents from an S3 bucket stored on Hetzner Cloud Storage. This server can be integrated with n8n workflows to access and process documents stored in your S3 bucket.

## Features

- **List Documents**: List all documents in the S3 bucket with optional prefix filtering
- **Read Documents**: Read the content of specific documents with UTF-8 or Base64 encoding
- **Document Metadata**: Get information about document size, type, and modification date
- **Document Existence Check**: Verify if a specific document exists in the bucket
- **n8n Integration**: Compatible with n8n workflows for document processing
- **HTTP API**: RESTful API endpoints for easy integration
- **Docker Support**: Containerized deployment with Docker and Docker Compose

## Prerequisites

- Node.js 18+ installed
- Access to a Hetzner Cloud Storage S3 bucket
- S3 access credentials (Access Key ID and Secret Access Key)

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd morala-bucket-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the example:
```bash
cp env.example .env
```

4. Configure your S3 credentials in the `.env` file:
```env
# S3 Configuration for Hetzner
S3_ENDPOINT=https://your-hetzner-s3-endpoint.com
S3_ACCESS_KEY_ID=your_access_key_id
S3_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=your_bucket_name
S3_REGION=eu-central-1

# MCP Server Configuration
MCP_SERVER_PORT=3000
```

5. Test your S3 connection:
```bash
npm run test:s3
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t morala-bucket-mcp .
docker run -p 3000:3000 --env-file .env morala-bucket-mcp
```

## API Endpoints

The server provides both REST API endpoints and MCP-compatible endpoints:

### REST API Endpoints

- `GET /health` - Health check
- `GET /documents` - List documents (with query params: `prefix`, `maxKeys`)
- `GET /documents/:key` - Read document content (with query param: `encoding`)
- `HEAD /documents/:key` - Get document metadata
- `GET /documents/:key/exists` - Check if document exists

### MCP Endpoint

- `POST /mcp` - MCP-compatible endpoint for tool calls

## Available Tools

The MCP server provides the following tools:

### 1. list_documents
Lists documents in the S3 bucket with optional filtering.

**Parameters:**
- `prefix` (optional): Filter documents by path prefix
- `maxKeys` (optional): Maximum number of documents to return (default: 1000)

**Example:**
```json
{
  "name": "list_documents",
  "arguments": {
    "prefix": "documents/",
    "maxKeys": 50
  }
}
```

### 2. read_document
Reads the content of a specific document.

**Parameters:**
- `key` (required): The S3 key (path) of the document
- `encoding` (optional): Content encoding - "utf8" or "base64" (default: "utf8")

**Example:**
```json
{
  "name": "read_document",
  "arguments": {
    "key": "documents/report.pdf",
    "encoding": "base64"
  }
}
```

### 3. get_document_info
Gets metadata information about a document.

**Parameters:**
- `key` (required): The S3 key (path) of the document

**Example:**
```json
{
  "name": "get_document_info",
  "arguments": {
    "key": "documents/report.pdf"
  }
}
```

### 4. document_exists
Checks if a document exists in the bucket.

**Parameters:**
- `key` (required): The S3 key (path) of the document

**Example:**
```json
{
  "name": "document_exists",
  "arguments": {
    "key": "documents/report.pdf"
  }
}
```

## n8n Integration

### Method 1: HTTP Request Nodes

Use HTTP Request nodes in n8n to call the REST API endpoints:

1. **Health Check**:
   - Method: GET
   - URL: `http://localhost:3000/health`

2. **List Documents**:
   - Method: GET
   - URL: `http://localhost:3000/documents?maxKeys=10`

3. **Read Document**:
   - Method: GET
   - URL: `http://localhost:3000/documents/{{ $json.data[0].key }}?encoding=utf8`

### Method 2: MCP Endpoint

Use the MCP-compatible endpoint for more structured tool calls:

**List Documents**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_documents",
    "arguments": {
      "maxKeys": 10
    }
  }
}
```

**Read Document**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "read_document",
    "arguments": {
      "key": "documents/report.pdf",
      "encoding": "utf8"
    }
  }
}
```

### Import n8n Workflow

Import the provided `n8n-example.json` file into your n8n instance for a complete working example.

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `S3_ENDPOINT` | Hetzner S3 endpoint URL | Yes |
| `S3_ACCESS_KEY_ID` | S3 access key ID | Yes |
| `S3_SECRET_ACCESS_KEY` | S3 secret access key | Yes |
| `S3_BUCKET_NAME` | Name of the S3 bucket | Yes |
| `S3_REGION` | S3 region (e.g., eu-central-1) | Yes |
| `MCP_SERVER_PORT` | HTTP server port (default: 3000) | No |

### Hetzner Cloud Storage Configuration

For Hetzner Cloud Storage, your endpoint will typically be:
```
https://your-bucket-name.your-location.hetzner.com
```

## Error Handling

The server includes comprehensive error handling for:
- Invalid S3 credentials
- Network connectivity issues
- Missing documents
- Invalid parameters
- S3 service errors

All errors are returned with descriptive messages to help with debugging.

## Security Considerations

- Store your `.env` file securely and never commit it to version control
- Use IAM roles and policies to limit S3 access to only necessary operations
- Consider using temporary credentials for production deployments
- Enable HTTPS for all communications with the S3 endpoint
- Use Docker secrets or environment variables for production deployments

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check your S3 endpoint URL and credentials
2. **Access Denied**: Verify your S3 access key has the necessary permissions
3. **Document Not Found**: Ensure the document key (path) is correct
4. **Encoding Issues**: Use "base64" encoding for binary files

### Testing

Run the S3 connection test:
```bash
npm run test:s3
```

### Debug Mode

Enable debug logging by setting the `DEBUG` environment variable:
```bash
DEBUG=* npm run dev
```

### Docker Logs

Check Docker container logs:
```bash
docker-compose logs -f
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the error messages in the logs
3. Verify your S3 configuration
4. Run the test script to verify connectivity
5. Open an issue on GitHub with detailed information 