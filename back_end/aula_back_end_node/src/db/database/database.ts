import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

/**
 * Função para resetar e recriar o esquema.
 * CUIDADO: Em produção, você geralmente usaria Migrations para não perder dados.
 */
export const setupDatabase = async () => {
  try {
    console.log("🔄 Atualizando esquema do banco...");
    
    // 1. Deletar se existir (conforme solicitado)
    await pool.query('DROP TABLE IF EXISTS books;');

    // 2. Criar tabela do zero
    const createTableQuery = `
      CREATE TABLE books (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        year INTEGER NOT NULL,
        photo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createTableQuery);
    
    console.log("✅ Banco de dados atualizado com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao atualizar o banco:", err);
    process.exit(1); // Para o container se o banco falhar
  }
};

export default pool;