const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all customers
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, 
             COUNT(DISTINCT o.id) as total_orders,
             COALESCE(SUM(o.order_value), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// GET customer by WhatsApp number
router.get('/whatsapp/:number', async (req, res) => {
  try {
    const { number } = req.params;
    const result = await query('SELECT * FROM customers WHERE whatsapp_number = $1', [number]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  try {
    const { whatsapp_number, address, name } = req.body;
    
    // Check if customer already exists
    const existing = await query(
      'SELECT * FROM customers WHERE whatsapp_number = $1',
      [whatsapp_number]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Customer with this WhatsApp number already exists',
        customer: existing.rows[0]
      });
    }
    
    const result = await query(
      `INSERT INTO customers (whatsapp_number, address, name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [whatsapp_number, address, name]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// POST bulk create customers
router.post('/bulk', async (req, res) => {
  const client = await require('../db').pool.connect();
  
  try {
    const { customers } = req.body; // Array of {whatsapp_number, address, name}
    
    if (!Array.isArray(customers)) {
      return res.status(400).json({ error: 'customers must be an array' });
    }
    
    await client.query('BEGIN');
    const created = [];
    const skipped = [];
    
    for (const customer of customers) {
      const { whatsapp_number, address, name } = customer;
      
      // Check if exists
      const existing = await client.query(
        'SELECT id FROM customers WHERE whatsapp_number = $1',
        [whatsapp_number]
      );
      
      if (existing.rows.length > 0) {
        skipped.push({ whatsapp_number, reason: 'Already exists' });
        continue;
      }
      
      const result = await client.query(
        `INSERT INTO customers (whatsapp_number, address, name)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [whatsapp_number, address, name]
      );
      
      created.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      created: created.length,
      skipped: skipped.length,
      customers: created,
      skipped
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error bulk creating customers:', error);
    res.status(500).json({ error: 'Failed to create customers' });
  } finally {
    client.release();
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { whatsapp_number, address, name } = req.body;
    
    const result = await query(
      `UPDATE customers 
       SET whatsapp_number = $1, address = $2, name = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [whatsapp_number, address, name, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully', customer: result.rows[0] });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;

