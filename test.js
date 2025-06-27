#!/usr/bin/env node

import dotenv from 'dotenv';
import { S3Client } from './src/s3-client.js';

// Load environment variables
dotenv.config();

async function testS3Connection() {
  console.log('Testing S3 connection...\n');

  // Check required environment variables
  const requiredEnvVars = [
    'S3_ENDPOINT',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME',
    'S3_REGION'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      return;
    }
    console.log(`✅ ${envVar}: ${envVar.includes('SECRET') ? '***' : process.env[envVar]}`);
  }

  try {
    // Create S3 client
    const s3Config = {
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucketName: process.env.S3_BUCKET_NAME,
      region: process.env.S3_REGION
    };

    const s3Client = new S3Client(s3Config);

    // Test listing documents
    console.log('\n📋 Testing document listing...');
    const documents = await s3Client.listDocuments({ maxKeys: 5 });
    console.log(`✅ Found ${documents.length} document(s)`);
    
    if (documents.length > 0) {
      console.log('Sample documents:');
      documents.slice(0, 3).forEach(doc => {
        console.log(`  - ${doc.key} (${doc.size} bytes)`);
      });
    }

    // Test document info if documents exist
    if (documents.length > 0) {
      const firstDoc = documents[0];
      console.log(`\n📄 Testing document info for: ${firstDoc.key}`);
      const info = await s3Client.getDocumentInfo(firstDoc.key);
      if (info) {
        console.log(`✅ Document info retrieved: ${info.size} bytes, ${info.contentType || 'unknown type'}`);
      } else {
        console.log('❌ Failed to get document info');
      }
    }

    console.log('\n🎉 S3 connection test completed successfully!');
    console.log('Your MCP server should work correctly with these settings.');

  } catch (error) {
    console.error('\n❌ S3 connection test failed:');
    console.error(error.message);
    console.log('\nPlease check your S3 configuration and credentials.');
  }
}

testS3Connection(); 