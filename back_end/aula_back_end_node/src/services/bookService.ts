import { db } from '../db/database'; // Importa o db exportado pelo seletor
import { Book } from '../model/Book';
import path from 'path';
import fs from "fs";
import * as dotenv from 'dotenv'; // Melhor forma de importar dotenv no TS
import { minioClient } from '../db/minIOConfig';

dotenv.config();



export const createBook = async (book: Omit<Book, 'id'>): Promise<Book> => {
  const sql = 'INSERT INTO books (title, author, year, photo) VALUES ($1, $2, $3, $4) RETURNING *';
  const params = [book.title, book.author, book.year, book.photo ?? null];
  
  // O nosso mock remove o "RETURNING *" e resolve com o row criado
  const result = await db.query(sql, params);
  return result.rows[0];
};

export const getAllBooks = async (): Promise<Book[]> => {
  const result = await db.query('SELECT * FROM books ORDER BY year DESC');
  return result.rows;
};

export const getBookById = async (id: number): Promise<Book | null> => {
  const result = await db.query('SELECT * FROM books WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const updateBook = async (id: number, book: Partial<Omit<Book, 'id'>>): Promise<Book | null> => {
  const keys = Object.keys(book);
  const values = Object.values(book);
  
  // Constrói a query dinamicamente: SET title = $1, author = $2...
  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const sql = `UPDATE books SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
  
  const result = await db.query(sql, [...values, id]);
  return result.rows[0] || null;
};

function deletePhotoIfLocal(photo: string) {
  try {
    // Só apaga se for upload local
    if (!photo.includes("/uploads/")) return;

    // Extrai apenas o nome do arquivo
    const filename = path.basename(photo);
    const filePath = path.resolve("uploads", filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ Foto removida:", filePath);
    }
  } catch (err) {
    // Não quebra o delete se falhar a remoção do arquivo
    console.warn("⚠️ Falha ao remover foto:", err);
  }
}

async function deletePhotoMinIO(photo: string) {
  try {
      // 1. Extrair o nome do bucket e o nome do arquivo da URL
      // Exemplo de URL: http://localhost:9000/fotos-livros/17123456-foto.jpg
      const urlParts = photo.split('/');
      const bucketName = 'fotos-livros';
      const fileName = urlParts[urlParts.length - 1];

      if (!fileName) return;

      // 2. Comando oficial da biblioteca Minio (Open Source)
      await minioClient.removeObject(bucketName, fileName);
      console.log(`🗑️ Arquivo removido do MinIO: ${fileName}`);
    } catch (err) {
      console.error("⚠️ Erro ao remover do MinIO:", err);
    }
}

export const deleteBook = async (id: number): Promise<boolean> => {
  // 1. Busca a foto antes (usando o nosso método universal)
  const book = await getBookById(id);
  if (!book) return false;

  // 2. Deleta no banco
  await db.query('DELETE FROM books WHERE id = $1', [id]);
  if (process.env.MINIO_ACTIVE === "true") {
  // 3. Lógica de arquivo (MinIO ou Local)
    if (book.photo) {
      // Se você estiver usando MinIO, aqui você chamaria o minioClient.removeObject
      deletePhotoMinIO(book.photo);
    }
  }else{
    if (book.photo) {
      // Se você estiver usando MinIO, aqui você chamaria o minioClient.removeObject
      deletePhotoIfLocal(book.photo);
    }
  }

  return true;
};
