# Morala Bucket HTTP Server

A lightweight HTTP server that provides REST API access to documents stored in an S3 bucket on Hetzner Cloud Storage. Perfect for integration with n8n, web applications, and automation workflows.

## Features

- **List Documents**: List all documents in the S3 bucket with optional prefix filtering
- **Read Documents**: Read the content of specific documents with UTF-8 or Base64 encoding
- **Document Metadata**: Get information about document size, type, and modification date
- **Document Existence Check**: Verify if a specific document exists in the bucket
- **n8n Integration**: Compatible with n8n workflows for document processing
- **RESTful API**: Clean HTTP endpoints for easy integration
- **Docker Support**: Containerized deployment with Docker and Docker Compose

## Prerequisites

- Node.js 18+ installed
- Access to a Hetzner Cloud Storage S3 bucket
- S3 access credentials (Access Key ID and Secret Access Key)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
# Edit .env with your S3 credentials
```

### 3. Test Connection
```bash
npm run test:s3
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Health Check
```http
GET /health
```
Returns server status and timestamp.

### List Documents
```http
GET /documents?prefix=docs/&maxKeys=50
```
Lists documents in the bucket with optional filtering.

**Query Parameters:**
- `prefix` (optional): Filter by path prefix
- `maxKeys` (optional): Maximum number of documents (default: 1000)

### Read Document
```http
GET /documents/{key}?encoding=utf8
```
Reads document content.

**Query Parameters:**
- `encoding` (optional): `utf8` or `base64` (default: `utf8`)

### Document Info
```http
HEAD /documents/{key}
```
Gets document metadata.

### Check Existence
```http
GET /documents/{key}/exists
```
Checks if document exists.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `S3_ENDPOINT` | Hetzner S3 endpoint URL | Yes |
| `S3_ACCESS_KEY_ID` | S3 access key ID | Yes |
| `S3_SECRET_ACCESS_KEY` | S3 secret access key | Yes |
| `S3_BUCKET_NAME` | Name of the S3 bucket | Yes |
| `S3_REGION` | S3 region (e.g., eu-central-1) | Yes |
| `PORT` | HTTP server port (default: 3000) | No |

## Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t morala-bucket-server .
docker run -p 3000:3000 --env-file .env morala-bucket-server
```

### Production Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Configuration
For production, set environment variables:
```bash
export S3_ENDPOINT="https://your-bucket.your-location.hetzner.com"
export S3_ACCESS_KEY_ID="your_access_key"
export S3_SECRET_ACCESS_KEY="your_secret_key"
export S3_BUCKET_NAME="your_bucket_name"
export S3_REGION="eu-central-1"
export PORT="3000"
```

## n8n Integration

### Import Workflow
Import the provided `n8n-example.json` file into your n8n instance.

### Manual Setup
1. Add an **HTTP Request** node
2. Configure the endpoint URL (e.g., `http://your-server:3000/documents`)
3. Use the response data in your workflow

### Example n8n HTTP Request
```json
{
  "method": "GET",
  "url": "http://localhost:3000/documents",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

## Security Considerations

- Store environment variables securely
- Use HTTPS in production
- Implement proper authentication if needed
- Consider using IAM roles for S3 access
- Enable CORS only for trusted domains

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check S3 endpoint and credentials
2. **Access Denied**: Verify S3 permissions
3. **Document Not Found**: Check document key/path
4. **Port Already in Use**: Change PORT environment variable

### Debug Mode
```bash
DEBUG=* npm run dev
```

### Check Logs
```bash
# Docker logs
docker-compose logs -f

# Application logs
npm run dev
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review error messages in logs
3. Verify S3 configuration
4. Run the test script: `npm run test:s3` 