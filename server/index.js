const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const carRepairRoutes = require('./routes/car-repairs');
const reportRoutes = require('./routes/reports');
const { initializeDatabase, db } = require('./database/init'); // db is exported from init.js
const { seedDatabaseIfNeeded } = require('./database/seed');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting
app.set('trust proxy', 1); // Recommended for rate-limiting behind a proxy

// Security middleware
app.use(helmet());

const isProduction = process.env.NODE_ENV === 'production';

// In production, use the strict CLIENT_URL. In development, be more flexible.
const corsOrigin = isProduction
  ? process.env.CLIENT_URL
  : [
      'http://localhost:3000',
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/, // Allow local network access
    ];

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  store: new SQLiteStore({
    db: 'crm.db',
    dir: path.join(__dirname, 'data'), // The directory where the db is stored
    table: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // Prevents client-side JS from accessing the cookie.
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    // For cross-domain cookies, SameSite=None and Secure=true are required.
    // Since the API is now proxied under the same domain, 'lax' is the correct and secure default for both dev and prod.
    sameSite: 'lax'
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/car-repairs', carRepairRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    // After tables are created, seed the admin user if necessary
    return seedDatabaseIfNeeded(db);
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }); 