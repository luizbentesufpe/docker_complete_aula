// src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import booksRouter from './routes/books';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import path from 'path';
import { ensureBucket } from './db/ensureBucket';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ⚠️ Alguns recursos de Helmet bloqueiam imagens/estáticos cross-origin.
// Se você precisa exibir imagens do MinIO ou do /uploads, desative a policy estrita:
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS (evite duplicar middleware)
app.use(cors({ origin: 'http://localhost:4200' }));

app.use(express.json());

// Servir arquivos locais quando MOCK=true (ex.: http://localhost:3000/uploads/...)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


import filesRouter from './routes/files';
app.use('/api/files', filesRouter);


// Rotas da API
app.use('/api/books', booksRouter);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs-json', (_req, res) => res.json(swaggerSpec));

// Bootstrap assíncrono garantindo bucket do MinIO
async function start() {
  // 🔸 garante o bucket na primeira execução (e valida nas próximas)
  await ensureBucket();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});