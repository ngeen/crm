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

    // 3. Create Sample Car Repairs with Items
    const today = new Date();
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const repairsData = [
      { 
        customer_id: customerIds[0], car_model: 'Ford Focus', car_year: '2018', license_plate: '34 ABC 123', 
        repair_date: formatDate(today), // Today's example
        description: 'Periyodik bakım ve yağ değişimi', status: 'in_progress', created_by: adminId,
        items: [
            { description: 'Motor Yağı Değişimi (5L)', quantity: 1, unit_price: 850 },
            { description: 'Yağ Filtresi', quantity: 1, unit_price: 150 },
            { description: 'Hava Filtresi', quantity: 1, unit_price: 200 }
        ]
      },
      { 
        customer_id: customerIds[1], car_model: 'Renault Clio', car_year: '2020', license_plate: '34 DEF 456', 
        repair_date: formatDate(new Date(new Date().setDate(today.getDate() - 7))), // Last week
        description: 'Fren balatası ve disk değişimi', status: 'completed', created_by: adminId,
        items: [
            { description: 'Ön Fren Balatası Seti', quantity: 1, unit_price: 750 },
            { description: 'Ön Fren Diski (Adet)', quantity: 2, unit_price: 900 }
        ]
      },
      { 
        customer_id: customerIds[2], car_model: 'Volkswagen Passat', car_year: '2021', license_plate: '34 GHI 789', 
        repair_date: formatDate(new Date(new Date().setMonth(today.getMonth() - 1))), // Last month
        description: 'Lastik değişimi ve rot balans', status: 'pending', created_by: adminId,
        items: [
            { description: 'Yaz Lastiği (Adet)', quantity: 4, unit_price: 1500 },
            { description: 'Rot Balans Ayarı', quantity: 1, unit_price: 450 }
        ]
      }
    ];

    for (const repairData of repairsData) {
      // Calculate totals
      const subtotal = repairData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const tax_rate = 18; // Assuming 18% tax
      const tax_amount = subtotal * (tax_rate / 100);
      const grand_total = subtotal + tax_amount;

      // Insert the car_repair record
      const repairResult = await run(db, 
        'INSERT INTO car_repairs (customer_id, car_model, car_year, license_plate, repair_date, description, status, subtotal, tax_rate, tax_amount, grand_total, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [repairData.customer_id, repairData.car_model, repairData.car_year, repairData.license_plate, repairData.repair_date, repairData.description, repairData.status, subtotal, tax_rate, tax_amount, grand_total, repairData.created_by]
      );
      const repairId = repairResult.lastID;

      // Insert the associated repair_items
      for (const item of repairData.items) {
        const total_price = item.quantity * item.unit_price;
        await run(db, 
          'INSERT INTO repair_items (repair_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
          [repairId, item.description, item.quantity, item.unit_price, total_price]
        );
      }
    }
    console.log(`${repairsData.length} sample car repairs with items created.`);
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