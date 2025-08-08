const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const fs = require('fs');
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'crm.db');
const db = new sqlite3.Database(dbPath);

const run = (sql) => {
  return new Promise((resolve, reject) => {
    db.run(sql, function (err) {
      if (err) {
        return reject(err);
      }
      resolve(this);
    });
  });
};

async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    await run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('Users table checked/created.');

    await run(`
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
    `);
    console.log('Customers table checked/created.');

    await run(`
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
    `);
    console.log('Deals table checked/created.');

    await run(`
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
    `);
    console.log('Car repairs table checked/created.');

    await run(`
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
    `);
    console.log('Repair items table checked/created.');

    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Error during database initialization:', err);
    throw err; // Re-throw to be caught by the caller in index.js
  }
}

module.exports = {
  db,
  initializeDatabase
}; 