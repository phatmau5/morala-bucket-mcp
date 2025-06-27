import AWS from 'aws-sdk';
import { S3Config, DocumentInfo, DocumentContent, ListDocumentsParams, ReadDocumentParams } from './types.js';

export class S3Client {
  private s3: AWS.S3;
  private bucketName: string;

  constructor(config: S3Config) {
    this.bucketName = config.bucketName;
    
    this.s3 = new AWS.S3({
      endpoint: config.endpoint,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
      s3ForcePathStyle: true, // Required for some S3-compatible services
      signatureVersion: 'v4'
    });
  }

  async listDocuments(params: ListDocumentsParams = {}): Promise<DocumentInfo[]> {
    try {
      const listParams: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucketName,
        MaxKeys: params.maxKeys || 1000
      };

      if (params.prefix) {
        listParams.Prefix = params.prefix;
      }

      const result = await this.s3.listObjectsV2(listParams).promise();
      
      if (!result.Contents) {
        return [];
      }

      return result.Contents.map(obj => ({
        key: obj.Key!,
        size: obj.Size!,
        lastModified: obj.LastModified!,
        contentType: (obj as any).ContentType || undefined
      }));
    } catch (error) {
      console.error('Error listing documents:', error);
      throw new Error(`Failed to list documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async readDocument(params: ReadDocumentParams): Promise<DocumentContent> {
    try {
      const getParams: AWS.S3.GetObjectRequest = {
        Bucket: this.bucketName,
        Key: params.key
      };

      const result = await this.s3.getObject(getParams).promise();
      
      if (!result.Body) {
        throw new Error('Document has no content');
      }

      let content: string;
      if (params.encoding === 'base64') {
        content = result.Body.toString('base64');
      } else {
        content = result.Body.toString('utf8');
      }

      return {
        key: params.key,
        content,
        contentType: result.ContentType || 'application/octet-stream',
        size: result.ContentLength || 0,
        lastModified: result.LastModified || new Date()
      };
    } catch (error) {
      console.error('Error reading document:', error);
      throw new Error(`Failed to read document ${params.key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDocumentInfo(key: string): Promise<DocumentInfo | null> {
    try {
      const headParams: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucketName,
        Key: key
      };

      const result = await this.s3.headObject(headParams).promise();
      
      return {
        key,
        size: result.ContentLength || 0,
        lastModified: result.LastModified || new Date(),
        contentType: result.ContentType
      };
    } catch (error) {
      if ((error as any).code === 'NotFound') {
        return null;
      }
      console.error('Error getting document info:', error);
      throw new Error(`Failed to get document info for ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async documentExists(key: string): Promise<boolean> {
    const info = await this.getDocumentInfo(key);
    return info !== null;
  }
} 