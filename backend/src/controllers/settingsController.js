import bcrypt from 'bcryptjs';
import { dbGet, dbRun } from '../config/database.js';
import { getSettings, updateSettings } from '../models/Settings.js';

export const getBusinessSettings = async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateBusinessSettings = async (req, res, next) => {
  try {
    const { business_name, business_phone, business_email, business_address } = req.body;

    if (!business_name || !business_phone || !business_email) {
      return res.status(400).json({
        success: false,
        error: 'Business name, phone, and email are required'
      });
    }

    const updated = await updateSettings({ business_name, business_phone, business_email, business_address });
    res.json({ success: true, data: updated, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await dbRun('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
