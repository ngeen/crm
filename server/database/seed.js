const bcrypt = require('bcryptjs');

/**
 * Seeds the database with initial data if it's empty.
 * @param {sqlite3.Database} db - The database instance.
 */
async function seedDatabaseIfNeeded(db) {
  const userCount = await getCount(db, 'users');

  if (userCount > 0) {
    console.log('Database already contains users. Skipping seed.');
    return;
  }

  console.log('Database is empty. Seeding initial data...');

  try {
    // 1. Create Admin User
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const admin = await run(db, 'INSERT INTO users (username, email, password, name) VALUES (?, ?, ?, ?)', ['admin', 'admin@example.com', hashedPassword, 'Admin User']);
    const adminId = admin.lastID;
    console.log(`Admin user created with ID: ${adminId}`);

    // 2. Create Sample Customers
    const customers = [
      { name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@example.com', phone: '0532 123 4567', company: 'Yılmaz Otomotiv', created_by: adminId },
      { name: 'Ayşe Kaya', email: 'ayse.kaya@example.com', phone: '0542 987 6543', company: 'Kaya Ltd. Şti.', created_by: adminId },
      { name: 'Mehmet Demir', email: 'mehmet.demir@example.com', phone: '0555 555 5555', company: 'Demir Ticaret', created_by: adminId }
    ];

    const customerIds = [];
    for (const customer of customers) {
      const result = await run(db, 'INSERT INTO customers (name, email, phone, company, created_by) VALUES (?, ?, ?, ?, ?)', [customer.name, customer.email, customer.phone, customer.company, customer.created_by]);
      customerIds.push(result.lastID);
    }
    console.log(`${customers.length} sample customers created.`);

    // 3. Create Sample Car Repairs
    const repairs = [
      { customer_id: customerIds[0], car_model: 'Ford Focus', car_year: '2018', license_plate: '34 ABC 123', repair_date: '2025-07-15', description: 'Periyodik bakım', status: 'completed', created_by: adminId },
      { customer_id: customerIds[1], car_model: 'Renault Clio', car_year: '2020', license_plate: '34 DEF 456', repair_date: '2025-08-01', description: 'Fren balatası değişimi', status: 'in_progress', created_by: adminId }
    ];

    for (const repair of repairs) {
      await run(db, 'INSERT INTO car_repairs (customer_id, car_model, car_year, license_plate, repair_date, description, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [repair.customer_id, repair.car_model, repair.car_year, repair.license_plate, repair.repair_date, repair.description, repair.status, repair.created_by]
      );
    }
    console.log(`${repairs.length} sample car repairs created.`);
    console.log('--- Database seeding complete ---');

  } catch (err) {
    console.error('An error occurred during database seeding:', err);
    throw err; // Propagate error to be caught by index.js
  }
}

// Helper to promisify db.get
function getCount(db, tableName) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.count : 0);
    });
  });
}

// Helper to promisify db.run
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

module.exports = { seedDatabaseIfNeeded };