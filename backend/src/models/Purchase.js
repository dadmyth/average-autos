import { dbRun, dbGet, dbAll } from '../config/database.js';

export const createPurchase = async (purchaseData) => {
  const {
    car_id,
    purchase_date,
    purchase_price,
    seller_name,
    seller_email,
    seller_phone,
    seller_address,
    seller_license_number,
    seller_license_version,
    payment_method,
    notes
  } = purchaseData;

  const result = await dbRun(
    `INSERT INTO purchases (
      car_id, purchase_date, purchase_price, seller_name, seller_email, seller_phone,
      seller_address, seller_license_number, seller_license_version, payment_method, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      car_id,
      purchase_date,
      purchase_price,
      seller_name,
      seller_email || null,
      seller_phone,
      seller_address || null,
      seller_license_number,
      seller_license_version || null,
      payment_method,
      notes || null
    ]
  );

  return await getPurchaseById(result.id);
};

export const getPurchaseById = async (id) => {
  return await dbGet('SELECT * FROM purchases WHERE id = ?', [id]);
};

export const getPurchaseByCarId = async (carId) => {
  return await dbGet('SELECT * FROM purchases WHERE car_id = ?', [carId]);
};

export const deletePurchase = async (id) => {
  const purchase = await getPurchaseById(id);
  if (!purchase) {
    throw new Error('Purchase record not found');
  }

  await dbRun('DELETE FROM purchases WHERE id = ?', [id]);
  return purchase;
};

export default {
  createPurchase,
  getPurchaseById,
  getPurchaseByCarId,
  deletePurchase
};
