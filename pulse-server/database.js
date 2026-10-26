import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Descobre o caminho da pasta onde este arquivo está
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cria (ou abre) o arquivo do banco de dados
const db = new Database(path.join(__dirname, 'pulse.db'));

// Cria a tabela de usuários se ela não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    course TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('🗄️ Banco de dados SQLite conectado com sucesso!');

export default db;