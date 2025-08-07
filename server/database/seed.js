const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// This script assumes it's located in the `database` directory,
// and the database file is in `../data/crm.db` relative to this script.
const dbPath = path.resolve(__dirname, '../data/crm.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error('Error opening database', err.message);
  }
  console.log('Connected to the SQLite database for seeding.');
});

const runSeed = () => {
  db.serialize(() => {
    console.log('--- Veritabanı Sıfırlama Başladı ---');
    console.log('Adım 1: Mevcut tablolar siliniyor...');
    // Drop in reverse order of creation to respect foreign keys
    db.run('DROP TABLE IF EXISTS repair_items');
    db.run('DROP TABLE IF EXISTS deals');
    db.run('DROP TABLE IF EXISTS car_repairs');
    db.run('DROP TABLE IF EXISTS customers');
    db.run('DROP TABLE IF EXISTS users', (err) => {
        if (err) return console.error(err.message);
        console.log('Tablolar başarıyla silindi.');
        createTables();
    });
  });
};

const createTables = () => {
    console.log('Adım 2: Tablolar oluşturuluyor...');
    const createUsers = `
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    const createCustomers = `
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
    `;
    const createDeals = `
      CREATE TABLE deals (
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
      );
    `;
    const createCarRepairs = `
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
    `;
    const createRepairItems = `
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
    `;

    db.run(createUsers);
    db.run(createCustomers);
    db.run(createDeals);
    db.run(createCarRepairs);
    db.run(createRepairItems, (err) => {
        if (err) return console.error('Tablo oluşturma hatası:', err.message);
        console.log('Tablolar başarıyla oluşturuldu.');
        seedData();
    });
};

const seedData = async () => {
    console.log('Adım 3: Örnek veriler ekleniyor...');
    try {
        // 1. Create a user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const userSql = 'INSERT INTO users (username, email, password, name) VALUES (?, ?, ?, ?)';
        db.run(userSql, ['admin', 'admin@example.com', hashedPassword, 'Admin Kullanıcı'], function(err) {
            if (err) return console.error('Kullanıcı eklenemedi:', err.message);
            const userId = this.lastID;
            console.log(`'admin' kullanıcısı (ID: ${userId}) eklendi.`);

            // 2. Create customers
            const customers = [
                { name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@example.com', phone: '0532 123 4567', company: 'Yılmaz Otomotiv', status: 'active', created_by: userId },
                { name: 'Ayşe Kaya', email: 'ayse.kaya@example.com', phone: '0542 987 6543', company: 'Kaya Ltd. Şti.', status: 'active', created_by: userId },
                { name: 'Mehmet Demir', email: 'mehmet.demir@example.com', phone: '0555 555 5555', company: 'Demir Ticaret', status: 'lead', created_by: userId }
            ];
            const customerStmt = db.prepare('INSERT INTO customers (name, email, phone, company, status, created_by) VALUES (?, ?, ?, ?, ?, ?)');
            customers.forEach(c => customerStmt.run(c.name, c.email, c.phone, c.company, c.status, c.created_by));
            customerStmt.finalize((err) => {
                if (err) return console.error('Müşteriler eklenemedi:', err.message);
                console.log(`${customers.length} müşteri eklendi.`);
                
                // 3. Create car repairs and items
                seedRepairs(userId);
            });
        });
    } catch (error) {
        console.error('Veri ekleme sırasında hata:', error);
    }
};

const seedRepairs = (userId) => {
    const today = new Date();
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const repairs = [
        // This month
        { customer_id: 1, car_model: 'Ford Focus', car_year: '2018', license_plate: '34 ABC 123', repair_date: formatDate(new Date()), description: 'Periyodik bakım', status: 'completed', items: [{ desc: 'Yağ Değişimi', qty: 1, price: 850 }, { desc: 'Filtre Seti', qty: 1, price: 650 }] },
        
        // Last week
        { customer_id: 2, car_model: 'Renault Clio', car_year: '2020', license_plate: '34 DEF 456', repair_date: formatDate(new Date(new Date().setDate(today.getDate() - 7))), description: 'Fren balatası değişimi', status: 'in_progress', items: [{ desc: 'Ön Fren Balatası', qty: 2, price: 700 }] },
        
        // Last month
        { customer_id: 1, car_model: 'Ford Focus', car_year: '2018', license_plate: '34 ABC 123', repair_date: formatDate(new Date(new Date().setMonth(today.getMonth() - 1))), description: 'Lastik değişimi ve rot balans ayarı', status: 'pending', items: [{ desc: 'Lastik Değişimi (4 adet)', qty: 4, price: 1200 }, { desc: 'Rot Balans Ayarı', qty: 1, price: 400 }] },
        
        // 2 months ago
        { customer_id: 3, car_model: 'Volkswagen Passat', car_year: '2021', license_plate: '34 GHI 789', repair_date: formatDate(new Date(new Date().setMonth(today.getMonth() - 2))), description: 'Motor arıza tespiti', status: 'completed', items: [{ desc: 'Diagnostik Test', qty: 1, price: 500 }] },

        // 3 months ago
        { customer_id: 2, car_model: 'Renault Clio', car_year: '2020', license_plate: '34 DEF 456', repair_date: formatDate(new Date(new Date().setMonth(today.getMonth() - 3))), description: 'Akü değişimi', status: 'completed', items: [{ desc: 'Varta Akü 60Ah', qty: 1, price: 1500 }] },

        // 4 months ago
        { customer_id: 1, car_model: 'Ford Focus', car_year: '2018', license_plate: '34 ABC 123', repair_date: formatDate(new Date(new Date().setMonth(today.getMonth() - 4))), description: 'Klima gazı dolumu', status: 'completed', items: [{ desc: 'Klima Gazı', qty: 1, price: 900 }] },
        
        // 5 months ago
        { customer_id: 3, car_model: 'Volkswagen Passat', car_year: '2021', license_plate: '34 GHI 789', repair_date: formatDate(new Date(new Date().setMonth(today.getMonth() - 5))), description: 'Triger seti değişimi', status: 'completed', items: [{ desc: 'Triger Seti', qty: 1, price: 4500 }, { desc: 'İşçilik', qty: 1, price: 1500 }] }
    ];

    const repairStmt = db.prepare('INSERT INTO car_repairs (customer_id, car_model, car_year, license_plate, repair_date, description, status, subtotal, tax_rate, tax_amount, grand_total, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const itemStmt = db.prepare('INSERT INTO repair_items (repair_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)');

    let repairsCompleted = 0;
    repairs.forEach(r => {
        const subtotal = r.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
        const tax_rate = 18;
        const tax_amount = subtotal * (tax_rate / 100);
        const grand_total = subtotal + tax_amount;

        repairStmt.run(r.customer_id, r.car_model, r.car_year, r.license_plate, r.repair_date, r.description, r.status, subtotal, tax_rate, tax_amount, grand_total, userId, function(err) {
            if (err) return console.error('Araç tamiri eklenemedi:', err.message);
            const repairId = this.lastID;
            r.items.forEach(item => {
                itemStmt.run(repairId, item.desc, item.qty, item.price, item.qty * item.price);
            });

            repairsCompleted++;
            if (repairsCompleted === repairs.length) {
                repairStmt.finalize();
                itemStmt.finalize();
                console.log(`${repairs.length} araç tamiri ve kalemleri eklendi.`);
                console.log('--- Veritabanı Hazır ---');
                db.close((err) => {
                    if (err) return console.error(err.message);
                    console.log('Database connection closed.');
                });
            }
        });
    });
};

// Run the seed
runSeed();