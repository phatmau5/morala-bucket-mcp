export interface S3Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
}

export interface DocumentInfo {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

export interface DocumentContent {
  key: string;
  content: string;
  contentType: string;
  size: number;
  lastModified: Date;
}

export interface ListDocumentsParams {
  prefix?: string;
  maxKeys?: number;
}

export interface ReadDocumentParams {
  key: string;
  encoding?: 'utf8' | 'base64';
} 