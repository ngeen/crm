const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database/init');

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  const { username, password, email, name } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }
  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (user) return res.status(409).json({ error: 'Username or email already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, email, password, name) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, name || ''], function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      req.session.userId = this.lastID;
      res.json({ id: this.lastID, username, email, name: name || '' });
    });
  });
});

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });
    req.session.userId = user.id;
    res.json({ id: user.id, username: user.username, email: user.email, name: user.name });
  });
});

// Logout endpoint
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  db.get('SELECT id, username, email, name FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// Auth status endpoint
router.get('/status', (req, res) => {
  if (!req.session.userId) return res.json({ authenticated: false, user: null });
  db.get('SELECT id, username, email, name FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user) return res.json({ authenticated: false, user: null });
    res.json({ authenticated: true, user });
  });
});

module.exports = router; 