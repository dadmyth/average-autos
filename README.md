# Car Sales Dashboard - NZ Private Car Sales Management

A full-stack web application for tracking private car sales in New Zealand, with features for inventory management, service tracking, sales records, and business analytics.

## Features

- **Secure Authentication** - JWT-based login system
- **Inventory Management** - Track all cars with NZ-specific fields (rego, WOF, etc.)
- **Service History** - Record all maintenance and service costs
- **Sales Tracking** - Mark cars as sold with customer information
- **Dashboard Analytics** - View profit/loss, statistics, and expiry alerts
- **Photo Upload** - Store multiple photos per car
- **NZ Compliance** - WOF and Registration expiry tracking with alerts

## Tech Stack

**Backend:**
- Node.js + Express
- SQLite database
- JWT authentication
- Multer for file uploads

**Frontend:**
- React + Vite
- Tailwind CSS
- React Router
- Axios
- Recharts (for charts)
- date-fns (for date formatting)

## Project Structure

```
car-sales-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and JWT configuration
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth and validation
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   └── db/              # Database schema and seeds
│   ├── data/                # SQLite database file
│   └── uploads/             # Uploaded car photos
├── frontend/
│   ├── src/
│   │   ├── api/             # API service layer
│   │   ├── components/      # React components
│   │   ├── context/         # Auth context
│   │   ├── pages/           # Page components
│   │   └── utils/           # Utility functions
│   └── public/
└── README.md
```

## Getting Started

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   Already installed, but if needed:
   ```bash
   npm install
   ```

3. **Initialize database:**
   The database has been seeded with default credentials.
   Default login:
   - Username: `admin`
   - Password: `admin123`

4. **Start the backend server:**
   ```bash
   npm start
   ```
   Server will run on http://localhost:3001

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   Already installed, but if needed:
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

4. **Login with default credentials:**
   - Username: admin
   - Password: admin123

   **IMPORTANT**: Change the password after first login!

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Cars
- `GET /api/cars` - Get all cars (with filters)
- `GET /api/cars/:id` - Get single car with details
- `POST /api/cars` - Create new car
- `PUT /api/cars/:id` - Update car
- `DELETE /api/cars/:id` - Delete car
- `POST /api/cars/:id/photos` - Upload photos
- `DELETE /api/cars/:id/photos/:filename` - Delete photo

### Service Records
- `GET /api/cars/:id/services` - Get car services
- `POST /api/cars/:id/services` - Add service record
- `PUT /api/cars/services/:id` - Update service
- `DELETE /api/cars/services/:id` - Delete service

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get single sale
- `POST /api/sales` - Create sale (mark car as sold)
- `PUT /api/sales/:id` - Update sale

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/profit-loss` - Get profit/loss data
- `GET /api/dashboard/expiry-alerts` - Get expiry alerts
- `GET /api/dashboard/monthly-sales` - Get monthly sales

## Current Status

### ✅ Completed (Backend - 100%)

- Database schema with all tables
- Authentication system (JWT)
- Car management API (CRUD + photo upload)
- Service records API
- Sales API
- Dashboard analytics API
- NZ-specific validations (rego plates, license numbers)
- Error handling and validation middleware

### ✅ Partially Completed (Frontend - 40%)

- Project setup with Vite + React
- Tailwind CSS configured
- Authentication context
- API service layer
- Login page
- Basic layout with navigation
- Dashboard page (with stats and expiry alerts)
- Inventory page (list view with filters)
- Sales page (list view)
- NZ formatters (currency, dates)

### ❌ To Be Implemented (Frontend)

1. **Car Form Component** (Add/Edit car)
   - Create modal with form fields
   - Photo upload functionality
   - Validation

2. **Car Details Page**
   - Full car information display
   - Photo gallery
   - Service history section
   - Add/edit/delete service records
   - "Mark as Sold" button and form

3. **Sale Form Component**
   - Modal form for creating sales
   - Customer information fields
   - Payment details
   - Validation

4. **Reusable Components**
   - Button component
   - Input component
   - Modal component
   - Loading spinner
   - Error/success messages

5. **Charts**
   - Profit/loss bar chart on dashboard
   - Inventory pie chart
   - Monthly sales trend

6. **Additional Features**
   - Search functionality
   - Advanced filters
   - Export to CSV
   - Print receipts

## NZ-Specific Features

- **Registration Plates**: Validates NZ format (ABC123 or personalized)
- **WOF Tracking**: Alerts 30 days before expiry
- **Registration Expiry**: Annual renewal tracking
- **License Numbers**: XX123456 format validation
- **Currency**: NZD $ formatting
- **Dates**: DD/MM/YYYY format

## Development Notes

### Adding a New Car (via API)

```bash
curl -X POST http://localhost:3001/api/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registration_plate": "ABC123",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2015,
    "color": "Silver",
    "odometer": 85000,
    "registration_expiry": "2026-06-30",
    "wof_expiry": "2026-04-15",
    "purchase_date": "2026-01-15",
    "purchase_price": 12000,
    "notes": "Good condition"
  }'
```

### Testing the Backend

1. Start the backend server
2. Test health endpoint:
   ```bash
   curl http://localhost:3001/api/health
   ```

3. Login:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

4. Use the returned token for authenticated requests

## Environment Variables

### Backend (`.env`)
```
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
DATABASE_PATH=./data/carsales.db
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3001/api
```

## Deployment

### Option 1: Railway
1. Connect your GitHub repository
2. Create backend service with persistent volume
3. Create frontend static site
4. Configure environment variables
5. Deploy

### Option 2: Render
1. Create web service for backend with persistent disk
2. Create static site for frontend
3. Configure environment variables
4. Deploy

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 7-day expiry
- CORS configured for specific origin
- SQL injection prevention (parameterized queries)
- Input validation on all endpoints
- File upload restrictions (images only, 5MB max)

## Next Steps for Completion

1. **Implement Car Form Modal**
   - Create form component in `frontend/src/components/cars/CarForm.jsx`
   - Add photo upload handling
   - Integrate with Inventory page

2. **Build Car Details Page**
   - Fetch car data with useParams hook
   - Display all car information
   - Add service history table
   - Implement sale form

3. **Add Charts to Dashboard**
   - Install and configure Recharts
   - Create profit chart component
   - Create inventory donut chart

4. **Improve UX**
   - Add loading states
   - Add error handling and toast notifications
   - Add confirmation dialogs for delete actions
   - Make fully responsive

5. **Testing**
   - Test all CRUD operations
   - Test file uploads
   - Test on mobile devices
   - Cross-browser testing

## License

This project is for personal use.

## Support

For questions or issues, refer to the implementation plan at:
`.claude/plans/deep-squishing-eich.md`
