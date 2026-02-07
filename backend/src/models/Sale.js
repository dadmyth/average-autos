import { dbRun, dbGet, dbAll } from '../config/database.js';
import { updateCar } from './Car.js';

export const createSale = async (saleData) => {
  const {
    car_id,
    sale_date,
    sale_price,
    customer_name,
    customer_email,
    customer_phone,
    customer_license_number,
    customer_license_version,
    payment_method,
    payment_status,
    payment_notes,
    notes
  } = saleData;

  // Check if car exists and is not already sold
  const car = await dbGet('SELECT * FROM cars WHERE id = ?', [car_id]);
  if (!car) {
    throw new Error('Car not found');
  }
  if (car.status === 'sold') {
    throw new Error('Car is already sold');
  }

  // Create sale record
  const result = await dbRun(
    `INSERT INTO sales (
      car_id, sale_date, sale_price, customer_name, customer_email, customer_phone,
      customer_license_number, customer_license_version, payment_method,
      payment_status, payment_notes, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      car_id,
      sale_date,
      sale_price,
      customer_name,
      customer_email || null,
      customer_phone,
      customer_license_number,
      customer_license_version || null,
      payment_method,
      payment_status || 'completed',
      payment_notes || null,
      notes || null
    ]
  );

  // Update car status to sold
  await updateCar(car_id, { status: 'sold' });

  return await getSaleById(result.id);
};

export const getSaleById = async (id) => {
  return await dbGet('SELECT * FROM sales WHERE id = ?', [id]);
};

export const getSaleByCarId = async (carId) => {
  return await dbGet('SELECT * FROM sales WHERE car_id = ?', [carId]);
};

export const getAllSales = async () => {
  const sales = await dbAll(
    `SELECT s.*, c.registration_plate, c.make, c.model, c.year, c.purchase_price
     FROM sales s
     JOIN cars c ON s.car_id = c.id
     ORDER BY s.sale_date DESC`
  );

  return sales;
};

export const updateSale = async (id, saleData) => {
  const {
    sale_date,
    sale_price,
    customer_name,
    customer_email,
    customer_phone,
    customer_license_number,
    customer_license_version,
    payment_method,
    payment_status,
    payment_notes,
    notes
  } = saleData;

  await dbRun(
    `UPDATE sales SET
      sale_date = COALESCE(?, sale_date),
      sale_price = COALESCE(?, sale_price),
      customer_name = COALESCE(?, customer_name),
      customer_email = COALESCE(?, customer_email),
      customer_phone = COALESCE(?, customer_phone),
      customer_license_number = COALESCE(?, customer_license_number),
      customer_license_version = COALESCE(?, customer_license_version),
      payment_method = COALESCE(?, payment_method),
      payment_status = COALESCE(?, payment_status),
      payment_notes = COALESCE(?, payment_notes),
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      sale_date,
      sale_price,
      customer_name,
      customer_email,
      customer_phone,
      customer_license_number,
      customer_license_version,
      payment_method,
      payment_status,
      payment_notes,
      notes,
      id
    ]
  );

  return await getSaleById(id);
};

export default {
  createSale,
  getSaleById,
  getSaleByCarId,
  getAllSales,
  updateSale
};
