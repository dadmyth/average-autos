// NZ Registration Plate Validation
// Standard format: ABC123 (3 letters, 3 numbers)
// Personalized: 2-6 characters (letters and/or numbers)
export const validateNZPlate = (plate) => {
  const standardFormat = /^[A-Z]{2,3}[0-9]{1,4}$/;
  const personalizedFormat = /^[A-Z0-9]{2,6}$/;

  const upperPlate = plate.toUpperCase();
  return standardFormat.test(upperPlate) || personalizedFormat.test(upperPlate);
};

// NZ Driver License Validation
// Format: 2 letters + 6 digits (e.g., AA123456)
export const validateNZLicense = (license) => {
  const licenseFormat = /^[A-Z]{2}[0-9]{6}$/;
  return licenseFormat.test(license.toUpperCase());
};

// NZ Phone Number Validation (basic)
// Accepts: +64 format, 02x, 03, 04, 06, 07, 09
export const validateNZPhone = (phone) => {
  const phoneFormat = /^(\+64|0)[2-9][0-9]{7,9}$/;
  return phoneFormat.test(phone.replace(/[\s-]/g, ''));
};

// Validate date is not in the past (for expiry dates)
export const validateFutureDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

// Middleware to validate car data
export const validateCarData = (req, res, next) => {
  const { registration_plate, make, model, year, registration_expiry, wof_expiry, purchase_date, purchase_price } = req.body;

  const errors = [];

  // Required fields
  if (!registration_plate) errors.push('Registration plate is required');
  if (!make) errors.push('Make is required');
  if (!model) errors.push('Model is required');
  if (!year) errors.push('Year is required');
  if (!registration_expiry) errors.push('Registration expiry date is required');
  if (!wof_expiry) errors.push('WOF expiry date is required');
  if (!purchase_date) errors.push('Purchase date is required');
  if (purchase_price === undefined || purchase_price === null) errors.push('Purchase price is required');

  // Validate registration plate format
  if (registration_plate && !validateNZPlate(registration_plate)) {
    errors.push('Invalid NZ registration plate format');
  }

  // Validate year
  const currentYear = new Date().getFullYear();
  if (year && (year < 1900 || year > currentYear + 1)) {
    errors.push(`Year must be between 1900 and ${currentYear + 1}`);
  }

  // Validate purchase price
  if (purchase_price !== undefined && (isNaN(purchase_price) || purchase_price < 0)) {
    errors.push('Purchase price must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  // Normalize registration plate to uppercase
  if (registration_plate) {
    req.body.registration_plate = registration_plate.toUpperCase();
  }

  next();
};

// Middleware to validate service record data
export const validateServiceData = (req, res, next) => {
  const { service_date, service_type, description, cost } = req.body;

  const errors = [];

  if (!service_date) errors.push('Service date is required');
  if (!service_type) errors.push('Service type is required');
  if (!description) errors.push('Description is required');
  if (cost === undefined || cost === null) errors.push('Cost is required');

  // Validate cost
  if (cost !== undefined && (isNaN(cost) || cost < 0)) {
    errors.push('Cost must be a positive number');
  }

  // Validate service type
  const validTypes = ['repair', 'maintenance', 'wof', 'registration', 'other'];
  if (service_type && !validTypes.includes(service_type)) {
    errors.push(`Service type must be one of: ${validTypes.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Middleware to validate sale data
export const validateSaleData = (req, res, next) => {
  const {
    car_id,
    sale_date,
    sale_price,
    customer_name,
    customer_phone,
    customer_license_number,
    payment_method
  } = req.body;

  const errors = [];

  if (!car_id) errors.push('Car ID is required');
  if (!sale_date) errors.push('Sale date is required');
  if (sale_price === undefined || sale_price === null) errors.push('Sale price is required');
  if (!customer_name) errors.push('Customer name is required');
  if (!customer_phone) errors.push('Customer phone number is required');
  if (!customer_license_number) errors.push('Customer license number is required');
  if (!payment_method) errors.push('Payment method is required');

  // Validate sale price
  if (sale_price !== undefined && (isNaN(sale_price) || sale_price < 0)) {
    errors.push('Sale price must be a positive number');
  }

  // Validate NZ license number
  if (customer_license_number && !validateNZLicense(customer_license_number)) {
    errors.push('Invalid NZ driver license format (should be 2 letters + 6 digits, e.g., AA123456)');
  }

  // Validate phone number
  if (customer_phone && !validateNZPhone(customer_phone)) {
    errors.push('Invalid NZ phone number format');
  }

  // Validate payment method
  const validMethods = ['cash', 'bank_transfer', 'finance', 'trade_in', 'other'];
  if (payment_method && !validMethods.includes(payment_method)) {
    errors.push(`Payment method must be one of: ${validMethods.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  // Normalize license to uppercase
  if (customer_license_number) {
    req.body.customer_license_number = customer_license_number.toUpperCase();
  }

  next();
};

export default {
  validateNZPlate,
  validateNZLicense,
  validateNZPhone,
  validateFutureDate,
  validateCarData,
  validateServiceData,
  validateSaleData
};
