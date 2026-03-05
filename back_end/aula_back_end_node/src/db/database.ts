// database_selector.ts
import postgresPool from './database/database';
import sqliteMock from './database/database_mock';
import * as dotenv from 'dotenv'; // Melhor forma de importar dotenv no TS
dotenv.config();

let dbInstance: any; // Use 'any' ou crie uma Interface para os dois

if (process.env.MOCK_DATA === "true") {
  console.log("🧪 Modo Teste: Usando SQLite");
  dbInstance = sqliteMock;
} else {
  console.log("🐘 Modo Produção: Usando PostgreSQL");
  
  // Como você já importa postgresPool (default) e setupDatabase (named), 
  // não precisa do import() dinâmico aqui, basta chamar a função:
  import('./database/database').then(m => m.setupDatabase());
  
  dbInstance = postgresPool;
}

// Exportamos com um nome que não conflite com os imports internos
export const db = dbInstance;