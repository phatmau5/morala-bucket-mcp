import dotenv from 'dotenv';
import { HTTPServer } from './http-server.js';
import { S3Config } from './types.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'S3_ENDPOINT',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'S3_REGION'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create S3 configuration
const s3Config: S3Config = {
  endpoint: process.env.S3_ENDPOINT!,
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  bucketName: process.env.S3_BUCKET_NAME!,
  region: process.env.S3_REGION!
};

// Get port from environment or use default
const port = parseInt(process.env.MCP_SERVER_PORT || '3000');

// Start the HTTP server
async function startServer() {
  try {
    console.log('Starting Morala Bucket MCP HTTP Server...');
    console.log(`Connecting to S3 bucket: ${s3Config.bucketName} at ${s3Config.endpoint}`);
    
    const server = new HTTPServer(s3Config, port);
    await server.start();
    
    console.log('HTTP Server started successfully');
    console.log(`Server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`MCP endpoint: http://localhost:${port}/mcp`);
    console.log(`Documents endpoint: http://localhost:${port}/documents`);
  } catch (error) {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

startServer(); 