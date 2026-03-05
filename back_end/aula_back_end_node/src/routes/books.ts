import { Router } from "express";
import {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
} from "../services/bookService";
import { Book } from "../model/Book";
import multer from "multer";
import fs from 'fs';
import { uploadImage } from "../services/storageService";


const router = Router();

// Config multer para salvar em ./uploads/
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = './uploads';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   }
// });

// 1. Usamos MemoryStorage para ter flexibilidade total
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(null, false);
  }
});

const maybeUploadPhoto = (req: any, res: any, next: any) => {
  const ct = req.headers["content-type"] || "";
  if (ct.includes("multipart/form-data")) {
    return upload.single("photo")(req, res, next);
  }
  return next();
};

/**
 * @openapi
 * tags:
 *   - name: Books
 *     description: Operações do catálogo de livros
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateBookMultipart:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - year
 *       properties:
 *         title:
 *           type: string
 *           example: Domain-Driven Design
 *         author:
 *           type: string
 *           example: Eric Evans
 *         year:
 *           type: integer
 *           example: 2003
 *         photo:
 *           description: Arquivo de imagem (campo photo). Opcional.
 *           type: string
 *           format: binary
 *         photoUrl:
 *           description: Alternativa opcional quando você quer enviar URL em vez do arquivo (se você quiser manter isso como req.body.photo).
 *           type: string
 *           format: uri
 *           example: https://example.com/images/ddd.jpg
 *
 *     UpdateBookMultipart:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: Clean Architecture
 *         author:
 *           type: string
 *           example: Robert C. Martin
 *         year:
 *           type: integer
 *           example: 2017
 *         photo:
 *           description: Arquivo de imagem (campo photo). Opcional.
 *           type: string
 *           format: binary
 */
/**
 * @openapi
 * /books:
 *   get:
 *     summary: Lista todos os livros
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: Lista de livros
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       500:
 *         description: Erro interno
 */
router.get("/", async (_req, res) => {
  try {
    const books = await getAllBooks();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /books/{id}:
 *   get:
 *     summary: Busca um livro pelo ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Livro encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Livro não encontrado
 *       500:
 *         description: Erro interno
 */
router.get("/:id", async (req, res) => {
  try {
    const book = await getBookById(Number(req.params.id));
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});


/**
 * @openapi
 * /books:
 *   post:
 *     summary: Cria um novo livro (com upload opcional da foto)
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookMultipart'
 *     responses:
 *       201:
 *         description: Livro criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Dados inválidos
 */
// REMOVA o multer do POST e use condicional
router.post("/", maybeUploadPhoto, async (req, res) => {
  try {
    let photoPath: string | null = null;

    // ✅ Se veio arquivo, usa a lógica híbrida que criamos (MinIO ou Local)
    if (req.file) {
      photoPath = await uploadImage(req.file); 
    } 
    // ✅ Se veio apenas uma string/URL no body
    else if (req.body.photo) {
      photoPath = req.body.photo;
    }

    const { title, author, year: yearRaw } = req.body;
    const year = Number(yearRaw);

    if (!title || !author || !Number.isFinite(year)) {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    const newBook = await createBook({ title, author, year, photo: photoPath });
    res.status(201).json(newBook);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});



/**
 * @openapi
 * /books/{id}:
 *   put:
 *     summary: Atualiza um livro existente (upload opcional da foto)
 *     description: Atualização parcial — envie apenas os campos que deseja alterar.
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookMultipart'
 *     responses:
 *       200:
 *         description: Livro atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Livro não encontrado
 */
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, author, year } = req.body;
    const updateData: Partial<Omit<Book, 'id'>> = {};
    
    if (title) updateData.title = title;
    if (author) updateData.author = author;
    if (year) updateData.year = parseInt(year);
    
    // ✅ Se enviou nova foto, processa conforme o ambiente
    if (req.file) {
      updateData.photo = await uploadImage(req.file);
    }
    
    const updatedBook = await updateBook(id, updateData);
    if (!updatedBook) return res.status(404).json({ error: 'Livro não encontrado' });
    
    res.json(updatedBook);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * @openapi
 * /books/{id}:
 *   delete:
 *     summary: Remove um livro
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Livro removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Book deleted
 *       404:
 *         description: Livro não encontrado
 *       500:
 *         description: Erro interno
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await deleteBook(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Book not found" });
    res.json({ message: "Book deleted" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
