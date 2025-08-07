# Sanayi CRM

A comprehensive Customer Relationship Management (CRM) system built with React, Express.js, and SQLite.

## Features

### Customer Management
- **Add Customers**: Create new customer records with name, email, phone, company, status, and notes
- **View Customers**: Browse all customers with search and filtering capabilities
- **Edit Customers**: Update existing customer information
- **Delete Customers**: Remove customers with confirmation dialog
- **Search Customers**: Search by name, email, phone, or company
- **Filter by Status**: Filter customers by active, inactive, or lead status

### Car Repair Management
- **Add Car Repairs**: Create repair records with customer selection, car details, and line items
- **View Car Repairs**: Browse all repairs with search and filtering capabilities
- **Edit Car Repairs**: Update existing repair information and line items
- **Delete Car Repairs**: Remove repairs with confirmation dialog
- **Line Items**: Add multiple repair items with quantity, unit price, and automatic total calculation
- **Billing**: Automatic calculation of subtotal, tax, and grand total
- **Search Repairs**: Search by customer name, car model, license plate, or description
- **Filter by Status**: Filter repairs by pending, in progress, completed, or cancelled status

### User Authentication
- Secure login/logout functionality
- Session-based authentication
- Protected routes

### Dashboard
- Overview statistics (total customers, deals, revenue)
- Quick action buttons
- Customer distribution chart

## Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database
- **bcryptjs** for password hashing
- **express-session** for session management
- **CORS** for cross-origin requests
- **Helmet** for security headers
- **Rate limiting** for API protection

### Frontend
- **React** with hooks
- **React Router** for navigation
- **PrimeReact** UI components
- **Chart.js** for data visualization
- **CSS** with utility classes

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sanayicrm
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   SESSION_SECRET=your-secret-key
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 3001) and frontend client (port 3000).

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/logout` - User logout
- `GET /api/auth/status` - Check authentication status
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - Get all customers for authenticated user
- `GET /api/customers/:id` - Get specific customer
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/search/:query` - Search customers

### Car Repairs
- `GET /api/car-repairs` - Get all car repairs for authenticated user
- `GET /api/car-repairs/:id` - Get specific car repair with items
- `POST /api/car-repairs` - Create new car repair
- `PUT /api/car-repairs/:id` - Update car repair
- `DELETE /api/car-repairs/:id` - Delete car repair
- `GET /api/car-repairs/search/:query` - Search car repairs

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats/overview` - Get user statistics

## Database Schema

### Customers Table
```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users (id)
);
```

### Car Repairs Table
```sql
CREATE TABLE car_repairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  car_model TEXT,
  car_year TEXT,
  license_plate TEXT,
  repair_date DATE NOT NULL,
  description TEXT,
  subtotal REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  grand_total REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers (id),
  FOREIGN KEY (created_by) REFERENCES users (id)
);
```

### Repair Items Table
```sql
CREATE TABLE repair_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repair_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity REAL DEFAULT 1,
  unit_price REAL DEFAULT 0,
  total_price REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repair_id) REFERENCES car_repairs (id) ON DELETE CASCADE
);
```

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Usage

### Adding a Customer
1. Navigate to Customers page
2. Click "Add Customer" button
3. Fill in the customer information:
   - **Name** (required)
   - **Email** (optional)
   - **Phone** (optional)
   - **Company** (optional)
   - **Status** (active/inactive/lead)
   - **Notes** (optional)
4. Click "Create Customer"

### Editing a Customer
1. Navigate to Customers page
2. Click the edit icon (pencil) next to the customer
3. Modify the information
4. Click "Update Customer"

### Deleting a Customer
1. Navigate to Customers page
2. Click the delete icon (trash) next to the customer
3. Confirm the deletion in the dialog

### Searching Customers
1. Use the search bar on the Customers page
2. Type any part of the customer's name, email, phone, or company
3. Press Enter or click the search icon

### Filtering Customers
1. Use the status dropdown on the Customers page
2. Select "Active", "Inactive", "Lead", or "All"

### Adding a Car Repair
1. Navigate to Car Repairs page
2. Click "Add Car Repair" button
3. Select a customer from the dropdown
4. Fill in car information (model, year, license plate)
5. Set the repair date
6. Add repair items:
   - Enter description, quantity, and unit price
   - Click "Add Item" to add to the list
   - Repeat for all items
7. Set tax rate (optional)
8. Review the calculated totals
9. Click "Create Repair"

### Editing a Car Repair
1. Navigate to Car Repairs page
2. Click the edit icon (pencil) next to the repair
3. Modify the information and items
4. Click "Update Repair"

### Deleting a Car Repair
1. Navigate to Car Repairs page
2. Click the delete icon (trash) next to the repair
3. Confirm the deletion in the dialog

### Searching Car Repairs
1. Use the search bar on the Car Repairs page
2. Type any part of the customer name, car model, license plate, or description
3. Press Enter or click the search icon

### Filtering Car Repairs
1. Use the status dropdown on the Car Repairs page
2. Select "Pending", "In Progress", "Completed", "Cancelled", or "All"

## Security Features

- **Authentication**: Session-based authentication
- **Authorization**: Route protection for authenticated users
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **CORS**: Configured for secure cross-origin requests
- **Rate Limiting**: API rate limiting to prevent abuse
- **Security Headers**: Helmet.js for security headers

## Development

### Project Structure
```
sanayicrm/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── index.js       # App entry point
│   └── package.json
├── server/                 # Express backend
│   ├── routes/            # API routes
│   ├── database/          # Database setup
│   ├── config/            # Configuration files
│   └── index.js           # Server entry point
├── package.json           # Root package.json
└── README.md
```

### Running in Development
```bash
npm run dev
```

### Running Production Build
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 