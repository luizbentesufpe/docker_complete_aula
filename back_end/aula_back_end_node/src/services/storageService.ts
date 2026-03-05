import fs from 'fs';
import path from 'path';
import mime from 'mime';                 // npm i mime
import { minioClient } from '../db/minIOConfig';

export const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  const bucket = process.env.MINIO_BUCKET || 'fotos-livros';
  const publicMinioUrl = process.env.PUBLIC_MINIO_URL || 'http://localhost:9000';
  const mock = (process.env.MOCK_DATA || 'false').toLowerCase() === 'true';

  const ext = path.extname(file.originalname) || '';
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  if (mock) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, fileName), file.buffer);
    return `${process.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/files/${fileName}`;
  }

  const contentType: string =
    file.mimetype || mime.getType(ext) || 'application/octet-stream';
  const size: number = typeof file.size === 'number' ? file.size : file.buffer.length;

  await minioClient.putObject(bucket, fileName, file.buffer, size, {
    'Content-Type': contentType,
  });

  // Se o bucket estiver com política pública, essa URL abre direto no navegador:
  return `${publicMinioUrl.replace(/\/$/, '')}/${bucket}/${fileName}`;

  // (opção mais segura)
  // return `${process.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/files/${fileName}`;
};