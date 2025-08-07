const express = require('express');
const { db } = require('../database/init');

const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get all car repairs for the authenticated user
router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  
  db.all(`
    SELECT 
      cr.id, cr.customer_id, cr.car_model, cr.car_year, cr.license_plate,
      cr.repair_date, cr.description, cr.subtotal, cr.tax_rate, cr.tax_amount,
      cr.grand_total, cr.status, cr.notes, cr.created_at, cr.updated_at,
      c.name as customer_name, c.phone as customer_phone
    FROM car_repairs cr
    LEFT JOIN customers c ON cr.customer_id = c.id
    WHERE cr.created_by = ? 
    ORDER BY cr.created_at DESC
  `, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get car repair by ID with items
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  
  // Get repair details
  db.get(`
    SELECT 
      cr.id, cr.customer_id, cr.car_model, cr.car_year, cr.license_plate,
      cr.repair_date, cr.description, cr.subtotal, cr.tax_rate, cr.tax_amount,
      cr.grand_total, cr.status, cr.notes, cr.created_at, cr.updated_at,
      c.name as customer_name, c.phone as customer_phone
    FROM car_repairs cr
    LEFT JOIN customers c ON cr.customer_id = c.id
    WHERE cr.id = ? AND cr.created_by = ?
  `, [id, userId], (err, repair) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!repair) {
      return res.status(404).json({ error: 'Car repair not found' });
    }
    
    // Get repair items
    db.all(`
      SELECT id, description, quantity, unit_price, total_price
      FROM repair_items 
      WHERE repair_id = ?
      ORDER BY created_at
    `, [id], (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      repair.items = items;
      res.json(repair);
    });
  });
});

// Create new car repair
router.post('/', requireAuth, (req, res) => {
  const {
    customer_id, car_model, car_year, license_plate, repair_date,
    description, subtotal, tax_rate, tax_amount, grand_total, notes, items
  } = req.body;
  const userId = req.session.userId;

  if (!customer_id || !repair_date) {
    return res.status(400).json({ error: 'Customer and repair date are required' });
  }

  db.run(`
    INSERT INTO car_repairs (
      customer_id, car_model, car_year, license_plate, repair_date,
      description, subtotal, tax_rate, tax_amount, grand_total, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [customer_id, car_model, car_year, license_plate, repair_date,
      description, subtotal || 0, tax_rate || 0, tax_amount || 0, grand_total || 0, notes, userId], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      const repairId = this.lastID;
      
      // Insert repair items if provided
      if (items && items.length > 0) {
        const insertItem = (index) => {
          if (index >= items.length) {
            // All items inserted, return the complete repair
            db.get(`
              SELECT 
                cr.id, cr.customer_id, cr.car_model, cr.car_year, cr.license_plate,
                cr.repair_date, cr.description, cr.subtotal, cr.tax_rate, cr.tax_amount,
                cr.grand_total, cr.status, cr.notes, cr.created_at, cr.updated_at,
                c.name as customer_name, c.phone as customer_phone
              FROM car_repairs cr
              LEFT JOIN customers c ON cr.customer_id = c.id
              WHERE cr.id = ?
            `, [repairId], (err, repair) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              
              db.all(`
                SELECT id, description, quantity, unit_price, total_price
                FROM repair_items 
                WHERE repair_id = ?
                ORDER BY created_at
              `, [repairId], (err, items) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }
                
                repair.items = items;
                res.status(201).json(repair);
              });
            });
            return;
          }
          
          const item = items[index];
          db.run(`
            INSERT INTO repair_items (repair_id, description, quantity, unit_price, total_price)
            VALUES (?, ?, ?, ?, ?)
          `, [repairId, item.description, item.quantity || 1, item.unit_price || 0, item.total_price || 0], 
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              insertItem(index + 1);
            });
        };
        
        insertItem(0);
      } else {
        // No items, return the repair without items
        db.get(`
          SELECT 
            cr.id, cr.customer_id, cr.car_model, cr.car_year, cr.license_plate,
            cr.repair_date, cr.description, cr.subtotal, cr.tax_rate, cr.tax_amount,
            cr.grand_total, cr.status, cr.notes, cr.created_at, cr.updated_at,
            c.name as customer_name, c.phone as customer_phone
          FROM car_repairs cr
          LEFT JOIN customers c ON cr.customer_id = c.id
          WHERE cr.id = ?
        `, [repairId], (err, repair) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          repair.items = [];
          res.status(201).json(repair);
        });
      }
    });
});

// This is the corrected PUT route. It is flexible and handles both
// partial updates (like status) and full updates from the form.
router.put('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const userId = req.session.userId;

  // Whitelist of fields that are allowed to be updated.
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

  // Dynamically build the SET clause for the SQL query.
  const setClauses = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
  const params = [...Object.values(fieldsToUpdate), id, userId];

  const sql = `
    UPDATE car_repairs 
    SET ${setClauses}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND created_by = ?
  `;

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error updating car_repairs:', err.message);
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

// Delete car repair
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  db.run(`
    DELETE FROM car_repairs 
    WHERE id = ? AND created_by = ?
  `, [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Car repair not found' });
    }
    res.json({ message: 'Car repair deleted successfully' });
  });
});

// Search car repairs
router.get('/search/:query', requireAuth, (req, res) => {
  const { query } = req.params;
  const userId = req.session.userId;
  
  db.all(`
    SELECT 
      cr.id, cr.customer_id, cr.car_model, cr.car_year, cr.license_plate,
      cr.repair_date, cr.description, cr.subtotal, cr.tax_rate, cr.tax_amount,
      cr.grand_total, cr.status, cr.notes, cr.created_at, cr.updated_at,
      c.name as customer_name, c.phone as customer_phone
    FROM car_repairs cr
    LEFT JOIN customers c ON cr.customer_id = c.id
    WHERE cr.created_by = ? AND (
      c.name LIKE ? OR 
      cr.car_model LIKE ? OR 
      cr.license_plate LIKE ? OR 
      cr.description LIKE ?
    )
    ORDER BY cr.created_at DESC
  `, [userId, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

module.exports = router;