-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cars Table
CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_plate TEXT NOT NULL UNIQUE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT,
    odometer INTEGER,
    vin TEXT,
    registration_expiry DATE NOT NULL,
    wof_expiry DATE NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'sold'
    notes TEXT,
    photos TEXT, -- JSON array of file paths
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Service Records Table
CREATE TABLE IF NOT EXISTS service_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    service_date DATE NOT NULL,
    service_type TEXT NOT NULL, -- 'repair', 'maintenance', 'wof', 'registration'
    description TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    provider TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL UNIQUE,
    sale_date DATE NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    customer_license_number TEXT NOT NULL,
    customer_license_version TEXT,
    payment_method TEXT NOT NULL, -- 'cash', 'bank_transfer', 'finance', 'trade_in', 'other'
    payment_status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'partial'
    payment_notes TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT
);

-- Documents Table (for licenses, payment confirmations, etc.)
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    document_type TEXT NOT NULL, -- 'license', 'payment_confirmation', 'other'
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_reg_expiry ON cars(registration_expiry);
CREATE INDEX IF NOT EXISTS idx_cars_wof_expiry ON cars(wof_expiry);
CREATE INDEX IF NOT EXISTS idx_service_records_car_id ON service_records(car_id);
CREATE INDEX IF NOT EXISTS idx_sales_car_id ON sales(car_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_documents_car_id ON documents(car_id);
