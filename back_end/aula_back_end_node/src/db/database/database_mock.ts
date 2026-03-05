// database_mock.ts
import sqlite3 from 'sqlite3';
import { Book } from '../../model/Book';

const DB_PATH = './books.db';
const internalDb = new sqlite3.Database(DB_PATH); // Nome alterado para evitar conflito

// ... (internalDb.serialize)

const mock = {
  query: (text: string, params: any[] = []): Promise<{ rows: any[] }> => {
    return new Promise((resolve, reject) => {
      const sql = text.replace(/RETURNING \*/gi, "").trim();

      if (sql.toUpperCase().startsWith('SELECT')) {
        internalDb.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows });
        });
      } else {
        // O TS precisa saber que o callback tem o contexto do RunResult
        internalDb.run(sql, params, function (this: any, err: Error | null) {
          if (err) return reject(err);
          resolve({ 
            rows: [{ id: this.lastID, ...params }] 
          });
        });
      }
    });
  }
};

export default mock;