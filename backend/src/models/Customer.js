import { dbAll, dbRun, dbGet } from '../config/database.js';

export const getAllCustomers = async () => {
  return await dbAll('SELECT * FROM customers ORDER BY created_at DESC');
};

export const getCustomerById = async (id) => {
  return await dbGet('SELECT * FROM customers WHERE id = ?', [id]);
};

export const searchCustomers = async (searchTerm) => {
  const search = `%${searchTerm}%`;
  return await dbAll(`
    SELECT * FROM customers
    WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
    ORDER BY created_at DESC
  `, [search, search, search]);
};

export const getCustomerPurchases = async (customerId) => {
  // First get the customer to find their phone
  const customer = await getCustomerById(customerId);
  if (!customer) return [];

  // Match sales by customer phone (since sales may not have customer_id yet for existing data)
  return await dbAll(`
    SELECT s.*, c.make, c.model, c.year, c.registration_plate, c.purchase_price
    FROM sales s
    JOIN cars c ON s.car_id = c.id
    WHERE s.customer_phone = ?
    ORDER BY s.sale_date DESC
  `, [customer.phone]);
};

export const createCustomer = async (customer) => {
  const result = await dbRun(
    `INSERT INTO customers (name, email, phone, address, license_number, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      customer.name,
      customer.email || null,
      customer.phone,
      customer.address || null,
      customer.license_number || null,
      customer.notes || null
    ]
  );
  return getCustomerById(result.lastID);
};

export const updateCustomer = async (id, customer) => {
  await dbRun(
    `UPDATE customers
     SET name = ?, email = ?, phone = ?, address = ?, license_number = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      customer.name,
      customer.email || null,
      customer.phone,
      customer.address || null,
      customer.license_number || null,
      customer.notes || null,
      id
    ]
  );
  return getCustomerById(id);
};

export const deleteCustomer = async (id) => {
  return await dbRun('DELETE FROM customers WHERE id = ?', [id]);
};
