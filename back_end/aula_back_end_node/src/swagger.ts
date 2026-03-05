import path from "path";
import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Aula Angular",
      version: "1.0.0",
      description: "Documentação da API de livros",
    },
    servers: [{ url: "http://localhost:3000" }],

    components: {
      schemas: {
        Book: {
          type: "object",
          required: ["id", "title", "author", "year"],
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Clean Code" },
            author: { type: "string", example: "Robert C. Martin" },
            year: { type: "integer", example: 2008 },
            photo: {
              type: "string",
              format: "uri",
              nullable: true,
              example: "http://localhost:3000/uploads/clean-code.jpg",
            },
          },
        },

        CreateBookMultipart: {
          type: "object",
          required: ["title", "author", "year"],
          properties: {
            title: { type: "string", example: "Domain-Driven Design" },
            author: { type: "string", example: "Eric Evans" },
            year: { type: "integer", example: 2003 },
            photo: {
              description: "Arquivo de imagem (campo photo). Opcional.",
              type: "string",
              format: "binary",
            },
            photoUrl: {
              description: "Opcional: enviar URL em vez do arquivo.",
              type: "string",
              format: "uri",
              nullable: true,
              example: "https://example.com/images/ddd.jpg",
            },
          },
        },

        UpdateBookMultipart: {
          type: "object",
          description: "Atualização parcial (envie só o que quiser).",
          properties: {
            title: { type: "string", example: "Clean Architecture" },
            author: { type: "string", example: "Robert C. Martin" },
            year: { type: "integer", example: 2017 },
            photo: {
              description: "Arquivo de imagem (campo photo). Opcional.",
              type: "string",
              format: "binary",
            },
          },
        },
      },
    },
  },

  apis: [
    path.join(process.cwd(), "src", "routes", "*.ts"),
    path.join(process.cwd(), "src", "server.ts"),
    path.join(process.cwd(), "dist", "routes", "*.js"),
    path.join(process.cwd(), "dist", "server.js"),
  ],
});
