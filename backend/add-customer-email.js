import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data/carsales.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding customer_email column to sales table...');

db.run(`ALTER TABLE sales ADD COLUMN customer_email TEXT`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column')) {
      console.log('✅ Column already exists');
    } else {
      console.error('❌ Error:', err.message);
    }
  } else {
    console.log('✅ customer_email column added successfully');
  }

  db.close();
});
