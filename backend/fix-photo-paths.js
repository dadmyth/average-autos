import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'data/carsales.db');

const db = new sqlite3.Database(dbPath);

db.all('SELECT id, photos FROM cars WHERE photos IS NOT NULL', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }

  rows.forEach(row => {
    try {
      const photos = JSON.parse(row.photos);
      const fixedPhotos = photos.map(photo => {
        // Remove 'uploads/cars/' prefix if it exists
        return photo.replace(/^uploads\/cars\//, '');
      });
      
      const fixedPhotosJson = JSON.stringify(fixedPhotos);
      
      db.run('UPDATE cars SET photos = ? WHERE id = ?', [fixedPhotosJson, row.id], (err) => {
        if (err) {
          console.error(`Error updating car ${row.id}:`, err);
        } else {
          console.log(`✅ Fixed photos for car ${row.id}`);
        }
      });
    } catch (e) {
      console.error(`Error processing car ${row.id}:`, e);
    }
  });

  setTimeout(() => {
    db.close();
    console.log('✅ Migration complete!');
  }, 1000);
});
