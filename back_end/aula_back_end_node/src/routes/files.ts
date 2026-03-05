// src/routes/files.ts
import { Router } from 'express';
import { minioClient } from '../db/minIOConfig';

const router = Router();
const bucket = process.env.MINIO_BUCKET || 'fotos-livros';

router.get('/:key', async (req, res) => {
  try {
    const obj = await minioClient.getObject(bucket, req.params.key);
    // @ts-ignore (stream do MinIO)
    obj.on('response', (resp: any) => {
      res.setHeader('Content-Type', resp.headers['content-type'] || 'application/octet-stream');
    });
    // @ts-ignore
    obj.pipe(res);
  } catch (e) {
    res.status(404).json({ message: 'Arquivo não encontrado' });
  }
});

export default router;