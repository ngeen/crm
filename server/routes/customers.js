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

// Get all customers for the authenticated user
router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  
  db.all(`
    SELECT 
      id, name, email, phone, company, status, notes, 
      created_at, updated_at
    FROM customers 
    WHERE created_by = ? 
    ORDER BY created_at DESC
  `, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get customer by ID
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  
  db.get(`
    SELECT 
      id, name, email, phone, company, status, notes, 
      created_at, updated_at
    FROM customers 
    WHERE id = ? AND created_by = ?
  `, [id, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(row);
  });
});

// Create new customer
router.post('/', requireAuth, (req, res) => {
  const { name, email, phone, company, status, notes } = req.body;
  const userId = req.session.userId;

  if (!name) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  db.run(`
    INSERT INTO customers (name, email, phone, company, status, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [name, email, phone, company, status || 'active', notes, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get the created customer
    db.get(`
      SELECT 
        id, name, email, phone, company, status, notes, 
        created_at, updated_at
      FROM customers 
      WHERE id = ?
    `, [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json(row);
    });
  });
});

// Update customer
router.put('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { name, email, phone, company, status, notes } = req.body;
  const userId = req.session.userId;

  if (!name) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  db.run(`
    UPDATE customers 
    SET name = ?, email = ?, phone = ?, company = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND created_by = ?
  `, [name, email, phone, company, status, notes, id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get the updated customer
    db.get(`
      SELECT 
        id, name, email, phone, company, status, notes, 
        created_at, updated_at
      FROM customers 
      WHERE id = ?
    `, [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(row);
    });
  });
});

// Delete customer
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  db.run(`
    DELETE FROM customers 
    WHERE id = ? AND created_by = ?
  `, [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});

// Search customers
router.get('/search/:query', requireAuth, (req, res) => {
  const { query } = req.params;
  const userId = req.session.userId;
  
  db.all(`
    SELECT 
      id, name, email, phone, company, status, notes, 
      created_at, updated_at
    FROM customers 
    WHERE created_by = ? AND (
      name LIKE ? OR 
      email LIKE ? OR 
      phone LIKE ? OR 
      company LIKE ?
    )
    ORDER BY created_at DESC
  `, [userId, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

module.exports = router; 