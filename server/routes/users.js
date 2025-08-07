const express = require('express');
const { db } = require('../database/init');
const moment = require('moment');

const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get all users (admin only)
router.get('/', requireAuth, (req, res) => {
  db.all('SELECT id, username, email, name, created_at FROM users', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get user by ID
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.get('SELECT id, username, email, name, created_at FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(row);
  });
});

// Update user profile
router.put('/profile', requireAuth, (req, res) => {
  const { name } = req.body;
  const userId = req.session.userId;

  db.run(
    'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});


// Get user statistics
router.get('/stats/overview', requireAuth, (req, res) => {
  const userId = req.session.userId;

  db.get(`
    SELECT 
      (SELECT COUNT(*) FROM customers WHERE created_by = ?) as total_customers,
      (SELECT COUNT(*) FROM car_repairs WHERE created_by = ?) as total_deals,
      (SELECT COUNT(*) FROM car_repairs WHERE created_by = ? AND status = 'completed') as closed_deals,
      (SELECT SUM(grand_total) FROM car_repairs WHERE created_by = ? AND status = 'completed') as total_revenue
  `, [userId, userId, userId, userId], (err, row) => {
    if (err) {
      console.error('Error fetching overview stats:', err);
      return res.status(500).json({ error: 'Database error fetching overview stats' });
    }
    res.json({
      totalCustomers: row.total_customers || 0,
      totalDeals: row.total_deals || 0,
      closedDeals: row.closed_deals || 0,
      totalRevenue: row.total_revenue || 0
    });
  });
});


// Get today's revenue
router.get('/stats/todays-revenue', requireAuth, (req, res) => {
  const userId = req.session.userId;

  db.get(`
    SELECT SUM(grand_total) as todays_revenue
    FROM car_repairs
    WHERE created_by = ? AND status = 'completed' AND DATE(repair_date) = CURRENT_DATE
  `, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({
      todaysRevenue: row.todays_revenue || 0
    });
  });
});

// Get reports
router.get('/reports', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { period, customerId } = req.query;
  
  let query = `
    SELECT 
      c.name as customer_name, 
      cr.grand_total as amount, 
      cr.repair_date as created_at
    FROM car_repairs cr
    JOIN customers c ON cr.customer_id = c.id
    WHERE cr.created_by = ? AND cr.status = 'completed'
  `;

  const params = [userId];

  if (customerId && customerId !== 'all') {
    query += ' AND cr.customer_id = ?';
    params.push(customerId);
  }

  const now = moment();
  if (period === 'daily') {
    query += ' AND DATE(cr.repair_date) = DATE(?)';
    params.push(now.format('YYYY-MM-DD'));
  } else if (period === 'weekly') {
    query += ' AND cr.repair_date >= ? AND cr.repair_date <= ?';
    params.push(now.startOf('week').format('YYYY-MM-DD'));
    params.push(now.endOf('week').format('YYYY-MM-DD'));
  } else if (period === 'yearly') {
    query += " AND STRFTIME('%Y', cr.repair_date) = STRFTIME('%Y', ?)";
    params.push(now.format('YYYY-MM-DD'));
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching detailed report:', err);
      return res.status(500).json({ error: 'Failed to fetch detailed report' });
    }
    res.json(rows);
  });
});



module.exports = router; 