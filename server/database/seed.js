const bcrypt = require('bcryptjs');

/**
 * Seeds the database with an initial admin user if no users exist.
 * @param {sqlite3.Database} db - The database instance.
 * @returns {Promise<void>}
 */
function seedDatabaseIfNeeded(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        console.error('Error checking users table for seeding:', err);
        return reject(err);
      }

      // If the table is empty, seed the admin user
      if (row.count === 0) {
        console.log('No users found, seeding initial admin user...');
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        const sql = 'INSERT INTO users (username, email, password, name) VALUES (?, ?, ?, ?)';
        db.run(sql, ['admin', 'admin@example.com', hashedPassword, 'Admin User'], (err) => {
          if (err) {
            console.error('Failed to seed admin user:', err);
            return reject(err);
          }
          console.log('Admin user created successfully.');
          resolve();
        });
      } else {
        console.log('Database already contains users, skipping seed.');
        resolve();
      }
    });
  });
}

module.exports = { seedDatabaseIfNeeded };