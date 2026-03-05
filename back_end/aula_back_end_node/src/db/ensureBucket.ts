import { minioClient } from '../db/minIOConfig';

export async function ensureBucket(): Promise<void> {
  const bucket = process.env.MINIO_BUCKET || 'fotos-livros';
  const region = process.env.MINIO_REGION || 'us-east-1';

  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      console.log(`[MinIO] Bucket '${bucket}' não existe. Criando...`);
      await minioClient.makeBucket(bucket, region);
      console.log(`[MinIO] Bucket '${bucket}' criado em ${region}.`);

      // Se quiser deixá-lo público para leitura anônima:
      if ((process.env.MINIO_PUBLIC_READ || 'false').toLowerCase() === 'true') {
        await setBucketPublicRead(bucket);
      }
    } else {
      console.log(`[MinIO] Bucket '${bucket}' OK.`);
    }
  } catch (err) {
    // Alguns ambientes lançam erro no bucketExists; tente criar mesmo assim.
    console.warn(`[MinIO] Falha ao verificar bucket '${bucket}'. Tentando criar...`, err);
    await minioClient.makeBucket(bucket, region);
    console.log(`[MinIO] Bucket '${bucket}' criado em ${region} (fallback).`);

    if ((process.env.MINIO_PUBLIC_READ || 'false').toLowerCase() === 'true') {
      await setBucketPublicRead(bucket);
    }
  }
}

/** Deixa o bucket com leitura pública (download anônimo) */
async function setBucketPublicRead(bucket: string) {
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetBucketLocation', 's3:ListBucket'],
        Resource: [`arn:aws:s3:::${bucket}`],
      },
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  };

  await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
  console.log(`[MinIO] Política pública aplicada ao bucket '${bucket}'.`);
}