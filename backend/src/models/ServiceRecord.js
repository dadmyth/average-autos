import { dbRun, dbGet, dbAll } from '../config/database.js';

export const createServiceRecord = async (serviceData) => {
  const { car_id, service_date, service_type, description, cost, provider, notes } = serviceData;

  const result = await dbRun(
    `INSERT INTO service_records (car_id, service_date, service_type, description, cost, provider, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [car_id, service_date, service_type, description, cost, provider || null, notes || null]
  );

  return await getServiceRecordById(result.id);
};

export const getServiceRecordById = async (id) => {
  return await dbGet('SELECT * FROM service_records WHERE id = ?', [id]);
};

export const getServiceRecordsByCarId = async (carId) => {
  return await dbAll(
    'SELECT * FROM service_records WHERE car_id = ? ORDER BY service_date DESC',
    [carId]
  );
};

export const updateServiceRecord = async (id, serviceData) => {
  const { service_date, service_type, description, cost, provider, notes } = serviceData;

  await dbRun(
    `UPDATE service_records SET
      service_date = COALESCE(?, service_date),
      service_type = COALESCE(?, service_type),
      description = COALESCE(?, description),
      cost = COALESCE(?, cost),
      provider = COALESCE(?, provider),
      notes = COALESCE(?, notes)
    WHERE id = ?`,
    [service_date, service_type, description, cost, provider, notes, id]
  );

  return await getServiceRecordById(id);
};

export const deleteServiceRecord = async (id) => {
  const result = await dbRun('DELETE FROM service_records WHERE id = ?', [id]);
  return result.changes > 0;
};

export default {
  createServiceRecord,
  getServiceRecordById,
  getServiceRecordsByCarId,
  updateServiceRecord,
  deleteServiceRecord
};
