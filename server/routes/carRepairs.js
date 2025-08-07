const express = require('express');
const router = express.Router();
const db = require('../database');

const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

router.use(isAuthenticated);

router.get('/', (req, res) => {
  const { startDate, endDate, customerId } = req.query;

  let sql = `
    SELECT cr.*, c.name as customer_name, c.phone as customer_phone
    FROM car_repairs cr
    JOIN customers c ON cr.customer_id = c.id
    WHERE cr.created_by = ?`;

  const params = [req.session.userId];

  if (startDate && endDate) {
    sql += ` AND cr.repair_date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  if (customerId) {
    sql += ` AND cr.customer_id = ?`;
    params.push(customerId);
  }

  sql += ` ORDER BY cr.repair_date DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

router.get('/search/:query', (req, res) => {
    const { query } = req.params;
    const sql = `
        SELECT cr.*, c.name as customer_name, c.phone as customer_phone
        FROM car_repairs cr
        JOIN customers c ON cr.customer_id = c.id
        WHERE cr.created_by = ? AND (
            c.name LIKE ? OR
            cr.car_model LIKE ? OR
            cr.license_plate LIKE ? OR
            cr.description LIKE ?
        )
        ORDER BY cr.repair_date DESC
    `;
    const searchTerm = `%${query}%`;
    const params = [req.session.userId, searchTerm, searchTerm, searchTerm, searchTerm];

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT cr.*, c.name as customer_name 
    FROM car_repairs cr
    JOIN customers c ON cr.customer_id = c.id
    WHERE cr.id = ? AND cr.created_by = ?
  `;
  db.get(sql, [id, req.session.userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Car repair not found' });
    }
    // Also fetch items
    db.all('SELECT * FROM repair_items WHERE repair_id = ?', [id], (itemErr, items) => {
      if (itemErr) {
        return res.status(500).json({ error: itemErr.message });
      }
      row.items = items;
      res.json(row);
    });
  });
});

// POST /api/car-repairs - Create a new car repair
router.post('/', (req, res) => {
  const {
    customer_id, car_model, car_year, license_plate, repair_date,
    description, subtotal, tax_rate, tax_amount, grand_total,
    status, notes, items
  } = req.body;
  const created_by = req.session.userId;

  if (!customer_id || !repair_date) {
    return res.status(400).json({ error: 'Customer and repair date are required.' });
  }

  const repairSql = `
    INSERT INTO car_repairs (
      customer_id, car_model, car_year, license_plate, repair_date,
      description, subtotal, tax_rate, tax_amount, grand_total,
      status, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const repairParams = [
    customer_id, car_model, car_year, license_plate, repair_date,
    description, subtotal, tax_rate, tax_amount, grand_total,
    status, notes, created_by
  ];

  db.run(repairSql, repairParams, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error during repair creation.' });
    }
    const repairId = this.lastID;

    if (items && items.length > 0) {
      const itemSql = `
        INSERT INTO repair_items (repair_id, description, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
      `;
      const stmt = db.prepare(itemSql);
      items.forEach(item => {
        stmt.run(repairId, item.description, item.quantity, item.unit_price, item.total_price);
      });
      stmt.finalize((err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error during item creation.' });
        }
        res.status(201).json({ id: repairId, message: 'Car repair created successfully.' });
      });
    } else {
      res.status(201).json({ id: repairId, message: 'Car repair created successfully.' });
    }
  });
});

// PUT /api/car-repairs/:id - Update a car repair
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const body = req.body;

  const allowedFields = [
    'customer_id', 'car_model', 'car_year', 'license_plate',
    'repair_date', 'description', 'subtotal', 'tax_rate',
    'tax_amount', 'grand_total', 'status', 'notes'
  ];

  const fieldsToUpdate = {};
  for (const field of allowedFields) {
    if (body.hasOwnProperty(field)) {
      fieldsToUpdate[field] = body[field];
    }
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update.' });
  }

  const setClauses = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
  const params = Object.values(fieldsToUpdate);
  params.push(id, req.session.userId);

  const sql = `
    UPDATE car_repairs 
    SET ${setClauses}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND created_by = ?
  `;

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error during update.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Car repair not found or you do not have permission to edit it.' });
    }

    // If the update was successful, fetch and return the updated record.
    db.get('SELECT cr.*, c.name as customer_name, c.phone as customer_phone FROM car_repairs cr JOIN customers c ON cr.customer_id = c.id WHERE cr.id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error fetching updated record.' });
      }
      res.json(row);
    });
  });
});

// DELETE /api/car-repairs/:id - Delete a car repair
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM car_repairs WHERE id = ? AND created_by = ?';
    db.run(sql, [id, req.session.userId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Car repair not found or you do not have permission to delete it.' });
        }
        res.status(200).json({ message: 'Car repair deleted successfully' });
    });
});

module.exports = router;