const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/crm.db');

// Create database directory if it doesn't exist
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
        console.log('Users table created successfully');
      });

      // Create customers table
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
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
        )
      `, (err) => {
        if (err) {
          console.error('Error creating customers table:', err);
          reject(err);
          return;
        }
        console.log('Customers table created successfully');
      });

      // Create deals table
      db.run(`
        CREATE TABLE IF NOT EXISTS deals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          amount REAL,
          status TEXT DEFAULT 'open',
          customer_id INTEGER,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating deals table:', err);
          reject(err);
          return;
        }
        console.log('Deals table created successfully');
      });

      // Create car_repairs table
      db.run(`
        CREATE TABLE IF NOT EXISTS car_repairs (
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
        )
      `, (err) => {
        if (err) {
          console.error('Error creating car_repairs table:', err);
          reject(err);
          return;
        }
        console.log('Car repairs table created successfully');
      });

      // Create repair_items table
      db.run(`
        CREATE TABLE IF NOT EXISTS repair_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          repair_id INTEGER NOT NULL,
          description TEXT NOT NULL,
          quantity REAL DEFAULT 1,
          unit_price REAL DEFAULT 0,
          total_price REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (repair_id) REFERENCES car_repairs (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating repair_items table:', err);
          reject(err);
          return;
        }
        console.log('Repair items table created successfully');
        resolve();
      });
    });
  });
}

module.exports = {
  db,
  initializeDatabase
}; 