const express = require('express');
const router = express.Router();
const { query } = require('../db');
const whatsapp = require('../services/whatsapp');

// GET all menus
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT m.*, 
             COUNT(DISTINCT o.id) as total_orders,
             COALESCE(SUM(o.order_value), 0) as total_revenue
      FROM menus m
      LEFT JOIN orders o ON o.menu_id = m.id
      GROUP BY m.id
      ORDER BY m.date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menus:', error);
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

// GET menu by ID with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get menu
    const menuResult = await query('SELECT * FROM menus WHERE id = $1', [id]);
    if (menuResult.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    
    const menu = menuResult.rows[0];
    
    // Get menu items
    const itemsResult = await query(
      'SELECT * FROM menu_items WHERE menu_id = $1 ORDER BY id',
      [id]
    );
    
    menu.items = itemsResult.rows;
    res.json(menu);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// GET menu by date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const result = await query('SELECT * FROM menus WHERE date = $1', [date]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found for this date' });
    }
    
    const menu = result.rows[0];
    
    // Get menu items
    const itemsResult = await query(
      'SELECT * FROM menu_items WHERE menu_id = $1 ORDER BY id',
      [menu.id]
    );
    
    menu.items = itemsResult.rows;
    res.json(menu);
  } catch (error) {
    console.error('Error fetching menu by date:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// POST create menu
router.post('/', async (req, res) => {
  const client = await require('../db').pool.connect();
  
  try {
    const { date, delivery_window_start, delivery_window_end, upi_phone_number, items } = req.body;
    
    await client.query('BEGIN');
    
    // Check if menu already exists for this date
    const existingMenu = await client.query('SELECT id FROM menus WHERE date = $1', [date]);
    if (existingMenu.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Menu already exists for this date' });
    }
    
    // Create menu
    const menuResult = await client.query(
      `INSERT INTO menus (date, delivery_window_start, delivery_window_end, upi_phone_number)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [date, delivery_window_start, delivery_window_end, upi_phone_number]
    );
    
    const menu = menuResult.rows[0];
    
    // Create menu items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          `INSERT INTO menu_items (menu_id, name, price, quantity_available)
           VALUES ($1, $2, $3, $4)`,
          [menu.id, item.name, item.price, item.quantity_available]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Fetch complete menu with items
    const itemsResult = await query(
      'SELECT * FROM menu_items WHERE menu_id = $1',
      [menu.id]
    );
    menu.items = itemsResult.rows;
    
    res.status(201).json(menu);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating menu:', error);
    res.status(500).json({ error: 'Failed to create menu' });
  } finally {
    client.release();
  }
});

// POST send menu via WhatsApp
router.post('/:id/send-whatsapp', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_numbers } = req.body; // Array of WhatsApp numbers
    
    // Get menu with items
    const menuResult = await query('SELECT * FROM menus WHERE id = $1', [id]);
    if (menuResult.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    
    const menu = menuResult.rows[0];
    const itemsResult = await query(
      'SELECT * FROM menu_items WHERE menu_id = $1',
      [id]
    );
    menu.items = itemsResult.rows;
    
    // Format and send messages
    const message = whatsapp.formatMenuMessage(menu, menu.upi_phone_number);
    const results = [];
    
    if (customer_numbers && Array.isArray(customer_numbers)) {
      for (const number of customer_numbers) {
        const result = await whatsapp.sendMessage(number, message);
        results.push({ number, ...result });
      }
    }
    
    res.json({
      success: true,
      menu_id: id,
      messages_sent: results.length,
      results
    });
  } catch (error) {
    console.error('Error sending menu via WhatsApp:', error);
    res.status(500).json({ error: 'Failed to send menu' });
  }
});

// PUT update menu
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, delivery_window_start, delivery_window_end, upi_phone_number } = req.body;
    
    const result = await query(
      `UPDATE menus 
       SET date = $1, delivery_window_start = $2, delivery_window_end = $3, 
           upi_phone_number = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [date, delivery_window_start, delivery_window_end, upi_phone_number, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(500).json({ error: 'Failed to update menu' });
  }
});

// DELETE menu
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM menus WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    
    res.json({ message: 'Menu deleted successfully', menu: result.rows[0] });
  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(500).json({ error: 'Failed to delete menu' });
  }
});

module.exports = router;

