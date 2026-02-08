import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  createCar,
  getAllCars,
  getCarById,
  getCarWithServices,
  updateCar,
  deleteCar,
  getTotalCosts
} from '../models/Car.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getUploadDir = (subdir) => process.env.UPLOAD_PATH
  ? path.join(process.env.UPLOAD_PATH, subdir)
  : path.join(__dirname, '../../uploads', subdir);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getUploadDir('cars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'car-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Get all cars
export const getCars = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (search) filters.search = search;

    const cars = await getAllCars(filters);

    res.json({
      success: true,
      data: cars,
      count: cars.length
    });
  } catch (error) {
    next(error);
  }
};

// Get single car
export const getCar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const car = await getCarWithServices(id);

    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    // Get total costs
    const costs = await getTotalCosts(id);

    res.json({
      success: true,
      data: {
        ...car,
        costs
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new car
export const addCar = async (req, res, next) => {
  try {
    const car = await createCar(req.body);

    res.status(201).json({
      success: true,
      data: car,
      message: 'Car added successfully'
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        error: 'A car with this registration plate already exists'
      });
    }
    next(error);
  }
};

// Update car
export const editCar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCar = await getCarById(id);
    if (!existingCar) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    const updatedCar = await updateCar(id, req.body);

    res.json({
      success: true,
      data: updatedCar,
      message: 'Car updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete car
export const removeCar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const car = await getCarById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    // Delete photos from filesystem
    if (car.photos && car.photos.length > 0) {
      car.photos.forEach(photo => {
        const photoPath = path.join(getUploadDir('cars'), photo);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      });
    }

    await deleteCar(id);

    res.json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('Cannot delete a sold car')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

// Upload car photos
export const uploadPhotos = async (req, res, next) => {
  try {
    const { id } = req.params;

    const car = await getCarById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    // Get existing photos
    const existingPhotos = car.photos || [];

    // Add new photo filenames (just the filename, not the full path)
    const newPhotos = req.files.map(file => file.filename);
    const allPhotos = [...existingPhotos, ...newPhotos];

    // Update car with new photos
    const updatedCar = await updateCar(id, { photos: allPhotos });

    res.json({
      success: true,
      data: updatedCar,
      message: `${newPhotos.length} photo(s) uploaded successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Delete car photo
export const deletePhoto = async (req, res, next) => {
  try {
    const { id, filename } = req.params;

    const car = await getCarById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    const updatedPhotos = car.photos.filter(photo => photo !== filename);

    // Delete file from filesystem
    const fullPath = path.join(getUploadDir('cars'), filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Update car
    const updatedCar = await updateCar(id, { photos: updatedPhotos });

    res.json({
      success: true,
      data: updatedCar,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCars,
  getCar,
  addCar,
  editCar,
  removeCar,
  uploadPhotos,
  deletePhoto,
  upload
};
