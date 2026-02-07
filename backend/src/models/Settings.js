import { dbGet, dbRun } from '../config/database.js';

export const getSettings = async () => {
  return await dbGet('SELECT * FROM settings WHERE id = 1');
};

export const updateSettings = async ({ business_name, business_phone, business_email, business_address }) => {
  await dbRun(
    `UPDATE settings SET
      business_name = COALESCE(?, business_name),
      business_phone = COALESCE(?, business_phone),
      business_email = COALESCE(?, business_email),
      business_address = COALESCE(?, business_address),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1`,
    [business_name, business_phone, business_email, business_address]
  );
  return await getSettings();
};

export default { getSettings, updateSettings };
