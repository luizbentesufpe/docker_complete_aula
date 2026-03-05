// src/db/minIOConfig.ts
import * as Minio from 'minio';
import * as dotenv from 'dotenv';
dotenv.config();

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'storage',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: (process.env.MINIO_USE_SSL || 'false') === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'password123',
});