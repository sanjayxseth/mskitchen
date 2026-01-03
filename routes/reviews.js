const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all reviews
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, menu_item_id, min_rating } = req.query;
    
    let sql = `
      SELECT r.*,
             c.whatsapp_number as customer_whatsapp,
             c.name as customer_name,
             mi.name as menu_item_name,
             o.order_value
      FROM reviews r
      JOIN customers c ON c.id = r.customer_id
      JOIN orders o ON o.id = r.order_id
      LEFT JOIN menu_items mi ON mi.id = r.menu_item_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (start_date) {
      sql += ` AND r.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      sql += ` AND r.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    if (menu_item_id) {
      sql += ` AND r.menu_item_id = $${paramCount}`;
      params.push(menu_item_id);
      paramCount++;
    }
    
    if (min_rating) {
      sql += ` AND r.rating >= $${paramCount}`;
      params.push(min_rating);
      paramCount++;
    }
    
    sql += ` ORDER BY r.created_at DESC`;
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET review by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT r.*,
             c.whatsapp_number as customer_whatsapp,
             c.name as customer_name,
             mi.name as menu_item_name
      FROM reviews r
      JOIN customers c ON c.id = r.customer_id
      LEFT JOIN menu_items mi ON mi.id = r.menu_item_id
      WHERE r.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// POST create review
router.post('/', async (req, res) => {
  try {
    const { order_id, customer_id, menu_item_id, rating, comments } = req.body;
    
    if (!order_id || !customer_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'order_id, customer_id, and rating (1-5) are required' 
      });
    }
    
    // Check if review already exists for this order
    const existing = await query(
      'SELECT id FROM reviews WHERE order_id = $1 AND customer_id = $2',
      [order_id, customer_id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Review already exists for this order' });
    }
    
    const result = await query(
      `INSERT INTO reviews (order_id, customer_id, menu_item_id, rating, comments)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [order_id, customer_id, menu_item_id || null, rating, comments || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// GET average ratings by menu item
router.get('/analytics/item-ratings', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let sql = `
      SELECT mi.id as menu_item_id,
             mi.name as menu_item_name,
             COUNT(r.id) as review_count,
             ROUND(AVG(r.rating)::numeric, 2) as average_rating
      FROM menu_items mi
      LEFT JOIN reviews r ON r.menu_item_id = mi.id
      LEFT JOIN orders o ON o.id = r.order_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (start_date) {
      sql += ` AND o.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      sql += ` AND o.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    sql += `
      GROUP BY mi.id, mi.name
      HAVING COUNT(r.id) > 0
      ORDER BY average_rating DESC, review_count DESC
    `;
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching item ratings:', error);
    res.status(500).json({ error: 'Failed to fetch item ratings' });
  }
});

module.exports = router;

