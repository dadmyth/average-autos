import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, dbGet, dbRun } from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables first
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import carRoutes from './routes/cars.js';
import saleRoutes from './routes/sales.js';
import dashboardRoutes from './routes/dashboard.js';
import documentRoutes from './routes/documents.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Request logger
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Serve frontend in production
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// SPA fallback - serve index.html for non-API routes
app.get('{*path}', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();

    // Migrate old admin user to josh, or create if none exist
    const adminUser = await dbGet('SELECT * FROM users WHERE username = ?', ['admin']);
    if (adminUser) {
      const hashedPassword = await bcrypt.hash('S67kz5N8', 12);
      await dbRun('UPDATE users SET username = ?, email = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['josh', 'joshc88@pm.me', hashedPassword, adminUser.id]);
      console.log('Admin account migrated to josh');
    } else {
      const joshUser = await dbGet('SELECT * FROM users WHERE username = ?', ['josh']);
      if (!joshUser) {
        const hashedPassword = await bcrypt.hash('S67kz5N8', 12);
        await dbRun('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', ['josh', 'joshc88@pm.me', hashedPassword]);
        console.log('Default user created');
      }
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 CORS enabled for: ${CORS_ORIGIN}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
