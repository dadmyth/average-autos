import { format, parseISO } from 'date-fns';

// Format currency to NZD
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD'
  }).format(amount);
};

// Format date to NZ format (DD/MM/YYYY)
export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    return dateString;
  }
};

// Format date for input field (YYYY-MM-DD)
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    return dateString;
  }
};

// Validate NZ registration plate
export const validateNZPlate = (plate) => {
  const standardFormat = /^[A-Z]{2,3}[0-9]{1,4}$/;
  const personalizedFormat = /^[A-Z0-9]{2,6}$/;
  const upperPlate = plate.toUpperCase();
  return standardFormat.test(upperPlate) || personalizedFormat.test(upperPlate);
};

// Validate NZ license number
export const validateNZLicense = (license) => {
  const licenseFormat = /^[A-Z]{2}[0-9]{6}$/;
  return licenseFormat.test(license.toUpperCase());
};

// Calculate days until expiry
export const daysUntilExpiry = (expiryDate) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get expiry status
export const getExpiryStatus = (expiryDate) => {
  const days = daysUntilExpiry(expiryDate);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'valid';
};

// Calculate days in stock (days since purchase)
export const daysInStock = (purchaseDate) => {
  if (!purchaseDate) return 0;
  const today = new Date();
  const purchase = new Date(purchaseDate);
  const diffTime = today - purchase;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default {
  formatCurrency,
  formatDate,
  formatDateForInput,
  validateNZPlate,
  validateNZLicense,
  daysUntilExpiry,
  getExpiryStatus,
  daysInStock
};
