import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('data/carsales.db');
db.all('SELECT id, make, model, photos FROM cars', (err, rows) => {
  if (err) console.error(err);
  rows.forEach(r => {
    console.log(`Car ${r.id}: ${r.make} ${r.model}`);
    console.log(`  Photos: ${r.photos}`);
  });
  db.close();
});
