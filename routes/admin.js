const express = require('express');
const router = express.Router();
const path = require('path');

// Serve admin pages
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/dashboard.html'));
});

router.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/menu.html'));
});

router.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/orders.html'));
});

router.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/reports.html'));
});

module.exports = router;

