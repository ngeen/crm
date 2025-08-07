const express = require('express');
const router = express.Router();
const { db } = require('../database/init');
const moment = require('moment');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get revenue report
router.get('/revenue', requireAuth, (req, res) => {
  const { period, customerId } = req.query;
  const userId = req.session.userId;

  let query = 'SELECT SUM(grand_total) AS total_revenue FROM car_repairs';
  const params = [userId];

  let whereClause = " WHERE created_by = ? AND status = 'completed'";

  if (customerId && customerId !== 'all') {
    whereClause += ' AND customer_id = ?';
    params.push(customerId);
  }

  const now = moment();
  if (period === 'daily') {
    whereClause += ' AND DATE(repair_date) = DATE(?)';
    params.push(now.format('YYYY-MM-DD'));
  } else if (period === 'weekly') {
    whereClause += ' AND repair_date >= ? AND repair_date <= ?';
    params.push(now.startOf('week').format('YYYY-MM-DD'));
    params.push(now.endOf('week').format('YYYY-MM-DD'));
  } else if (period === 'yearly') {
    whereClause += " AND STRFTIME('%Y', repair_date) = STRFTIME('%Y', ?)";
    params.push(now.format('YYYY-MM-DD'));
  }

  query += whereClause;

  db.get(query, params, (err, row) => {
    if (err) {
      console.error('Error fetching revenue report:', err);
      return res.status(500).json({ error: 'Failed to fetch revenue report' });
    }
    res.json(row);
  });
});

// Get today's revenue
router.get('/today-revenue', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const today = moment().format('YYYY-MM-DD');
  const query = "SELECT SUM(grand_total) AS total_revenue FROM car_repairs WHERE created_by = ? AND status = 'completed' AND DATE(repair_date) = DATE(?)";

  db.get(query, [userId, today], (err, row) => {
    if (err) {
      console.error('Error fetching today\'s revenue:', err);
      return res.status(500).json({ error: 'Failed to fetch today\'s revenue' });
    }
    res.json({ todaysRevenue: row.total_revenue || 0 });
  });
});

module.exports = router;
