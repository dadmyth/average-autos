import { dbRun, dbGet, dbAll } from '../config/database.js';

export const createCar = async (carData) => {
  const {
    registration_plate,
    make,
    model,
    year,
    color,
    odometer,
    vin,
    registration_expiry,
    wof_expiry,
    purchase_date,
    purchase_price,
    notes,
    photos
  } = carData;

  const result = await dbRun(
    `INSERT INTO cars (
      registration_plate, make, model, year, color, odometer, vin,
      registration_expiry, wof_expiry, purchase_date, purchase_price, notes, photos
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      registration_plate,
      make,
      model,
      year,
      color || null,
      odometer || null,
      vin || null,
      registration_expiry,
      wof_expiry,
      purchase_date,
      purchase_price,
      notes || null,
      photos ? JSON.stringify(photos) : '[]'
    ]
  );

  return await getCarById(result.id);
};

export const getAllCars = async (filters = {}) => {
  let query = 'SELECT * FROM cars';
  const params = [];
  const conditions = [];

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  if (filters.search) {
    conditions.push('(registration_plate LIKE ? OR make LIKE ? OR model LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const cars = await dbAll(query, params);

  // Parse photos JSON for each car
  return cars.map(car => ({
    ...car,
    photos: car.photos ? JSON.parse(car.photos) : []
  }));
};

export const getCarById = async (id) => {
  const car = await dbGet('SELECT * FROM cars WHERE id = ?', [id]);

  if (!car) {
    return null;
  }

  // Parse photos JSON
  car.photos = car.photos ? JSON.parse(car.photos) : [];

  return car;
};

export const getCarWithServices = async (id) => {
  const car = await getCarById(id);

  if (!car) {
    return null;
  }

  // Get all service records for this car
  const services = await dbAll(
    'SELECT * FROM service_records WHERE car_id = ? ORDER BY service_date DESC',
    [id]
  );

  // Get sale information if car is sold
  let sale = null;
  if (car.status === 'sold') {
    sale = await dbGet('SELECT * FROM sales WHERE car_id = ?', [id]);
  }

  return {
    ...car,
    service_records: services,
    sale
  };
};

export const updateCar = async (id, carData) => {
  const {
    registration_plate,
    make,
    model,
    year,
    color,
    odometer,
    vin,
    registration_expiry,
    wof_expiry,
    purchase_date,
    purchase_price,
    notes,
    photos,
    status
  } = carData;

  await dbRun(
    `UPDATE cars SET
      registration_plate = COALESCE(?, registration_plate),
      make = COALESCE(?, make),
      model = COALESCE(?, model),
      year = COALESCE(?, year),
      color = COALESCE(?, color),
      odometer = COALESCE(?, odometer),
      vin = COALESCE(?, vin),
      registration_expiry = COALESCE(?, registration_expiry),
      wof_expiry = COALESCE(?, wof_expiry),
      purchase_date = COALESCE(?, purchase_date),
      purchase_price = COALESCE(?, purchase_price),
      notes = COALESCE(?, notes),
      photos = COALESCE(?, photos),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      registration_plate,
      make,
      model,
      year,
      color,
      odometer,
      vin,
      registration_expiry,
      wof_expiry,
      purchase_date,
      purchase_price,
      notes,
      photos ? JSON.stringify(photos) : undefined,
      status,
      id
    ]
  );

  return await getCarById(id);
};

export const deleteCar = async (id) => {
  // Check if car is sold
  const car = await getCarById(id);
  if (!car) {
    return false;
  }

  if (car.status === 'sold') {
    throw new Error('Cannot delete a sold car. Delete the sale record first.');
  }

  const result = await dbRun('DELETE FROM cars WHERE id = ?', [id]);
  return result.changes > 0;
};

export const getTotalCosts = async (carId) => {
  // Get purchase price
  const car = await getCarById(carId);
  if (!car) {
    return null;
  }

  // Get total service costs
  const result = await dbGet(
    'SELECT COALESCE(SUM(cost), 0) as total_service_cost FROM service_records WHERE car_id = ?',
    [carId]
  );

  return {
    purchase_price: parseFloat(car.purchase_price),
    total_service_cost: parseFloat(result.total_service_cost),
    total_cost: parseFloat(car.purchase_price) + parseFloat(result.total_service_cost)
  };
};

export default {
  createCar,
  getAllCars,
  getCarById,
  getCarWithServices,
  updateCar,
  deleteCar,
  getTotalCosts
};
