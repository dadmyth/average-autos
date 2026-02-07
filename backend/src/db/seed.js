import bcrypt from 'bcryptjs';
import { initializeDatabase, dbGet, dbRun } from '../config/database.js';

const seedDatabase = async () => {
  try {
    console.log('Initializing database schema...');
    await initializeDatabase();

    // Check if admin user already exists
    const existingUser = await dbGet('SELECT * FROM users WHERE username = ?', ['admin']);

    if (existingUser) {
      console.log('Admin user already exists. Skipping seed.');
      process.exit(0);
    }

    // Create default admin user
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    await dbRun(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      ['admin', 'admin@carsales.local', hashedPassword]
    );

    console.log('✓ Database seeded successfully!');
    console.log('Default credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
