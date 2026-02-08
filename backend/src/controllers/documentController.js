import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbRun, dbAll } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getUploadDir = (subdir) => process.env.UPLOAD_PATH
  ? path.join(process.env.UPLOAD_PATH, subdir)
  : path.join(__dirname, '../../uploads', subdir);

// Configure multer for document upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getUploadDir('documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files and PDFs are allowed'));
  }
};

export const uploadDoc = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// Upload documents for a car
export const uploadDocuments = async (req, res) => {
  try {
    const { carId } = req.params;
    const { documentType, expiryDate } = req.body; // license, payment_confirmation, other

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const filenames = req.files.map(file => file.filename);

    // Store document metadata in database
    for (const filename of filenames) {
      await dbRun(
        `INSERT INTO documents (car_id, filename, document_type, uploaded_at, expiry_date)
         VALUES (?, ?, ?, datetime('now'), ?)`,
        [carId, filename, documentType || 'other', expiryDate || null]
      );
    }

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      files: filenames
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
};

// Get documents for a car
export const getDocuments = async (req, res) => {
  try {
    const { carId } = req.params;

    const documents = await dbAll(
      'SELECT * FROM documents WHERE car_id = ? ORDER BY uploaded_at DESC',
      [carId]
    );

    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Delete a document
export const deleteDocument = async (req, res) => {
  try {
    const { carId, filename } = req.params;

    // Delete from database
    const result = await dbRun(
      'DELETE FROM documents WHERE car_id = ? AND filename = ?',
      [carId, filename]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file
    const filePath = path.join(getUploadDir('documents'), filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
