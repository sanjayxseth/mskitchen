const express = require('express');
const router = express.Router();
const { query } = require('../db');
const whatsapp = require('../services/whatsapp');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, status, payment_status } = req.query;
    
    let sql = `
      SELECT o.*, 
             c.whatsapp_number as customer_whatsapp,
             c.address as customer_address,
             c.name as customer_name,
             m.date as menu_date
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN menus m ON m.id = o.menu_id
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
    
    if (status) {
      sql += ` AND o.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (payment_status) {
      sql += ` AND o.payment_status = $${paramCount}`;
      params.push(payment_status);
      paramCount++;
    }
    
    sql += ` ORDER BY o.created_at DESC`;
    
    const result = await query(sql, params);
    
    // Get order items for each order
    for (const order of result.rows) {
      const itemsResult = await query(
        `SELECT oi.*, mi.name as item_name
         FROM order_items oi
         JOIN menu_items mi ON mi.id = oi.menu_item_id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderResult = await query(`
      SELECT o.*, 
             c.whatsapp_number as customer_whatsapp,
             c.address as customer_address,
             c.name as customer_name,
             m.date as menu_date,
             m.delivery_window_start,
             m.delivery_window_end
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN menus m ON m.id = o.menu_id
      WHERE o.id = $1
    `, [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Get order items
    const itemsResult = await query(
      `SELECT oi.*, mi.name as item_name
       FROM order_items oi
       JOIN menu_items mi ON mi.id = oi.menu_item_id
       WHERE oi.order_id = $1`,
      [id]
    );
    
    order.items = itemsResult.rows;
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST create order
router.post('/', async (req, res) => {
  const client = await require('../db').pool.connect();
  
  try {
    const { menu_id, customer_id, whatsapp_number, address, name, items } = req.body;
    
    if (!menu_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'menu_id and items are required' });
    }
    
    await client.query('BEGIN');
    
    // Get or create customer
    let customerId = customer_id;
    
    if (!customerId && whatsapp_number) {
      // Check if customer exists
      const customerResult = await client.query(
        'SELECT id FROM customers WHERE whatsapp_number = $1',
        [whatsapp_number]
      );
      
      if (customerResult.rows.length > 0) {
        customerId = customerResult.rows[0].id;
      } else {
        // Create new customer
        const newCustomerResult = await client.query(
          `INSERT INTO customers (whatsapp_number, address, name)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [whatsapp_number, address, name]
        );
        customerId = newCustomerResult.rows[0].id;
      }
    }
    
    if (!customerId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Customer information is required' });
    }
    
    // Calculate order value
    let orderValue = 0;
    const orderItems = [];
    
    for (const item of items) {
      const { menu_item_id, quantity } = item;
      
      // Get menu item details
      const menuItemResult = await client.query(
        'SELECT price, quantity_available FROM menu_items WHERE id = $1 AND menu_id = $2',
        [menu_item_id, menu_id]
      );
      
      if (menuItemResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Menu item ${menu_item_id} not found` });
      }
      
      const menuItem = menuItemResult.rows[0];
      
      // Check availability
      if (quantity > menuItem.quantity_available) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Insufficient quantity available for menu item ${menu_item_id}` 
        });
      }
      
      const subtotal = parseFloat(menuItem.price) * quantity;
      orderValue += subtotal;
      
      orderItems.push({
        menu_item_id,
        quantity,
        price: menuItem.price,
        subtotal
      });
    }
    
    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (menu_id, customer_id, order_value, status, payment_status)
       VALUES ($1, $2, $3, 'confirmed', 'pending')
       RETURNING *`,
      [menu_id, customerId, orderValue]
    );
    
    const order = orderResult.rows[0];
    
    // Create order items and update menu item quantities
    let itemsSummary = [];
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.menu_item_id, item.quantity, item.price, item.subtotal]
      );
      
      // Update menu item quantity
      await client.query(
        `UPDATE menu_items 
         SET quantity_sold = quantity_sold + $1,
             quantity_available = quantity_available - $1
         WHERE id = $2`,
        [item.quantity, item.menu_item_id]
      );
      
      // Get item name for summary
      const itemNameResult = await client.query(
        'SELECT name FROM menu_items WHERE id = $1',
        [item.menu_item_id]
      );
      itemsSummary.push(`${itemNameResult.rows[0].name} x${item.quantity}`);
    }
    
    await client.query('COMMIT');
    
    // Get customer details for notification
    const customerResult = await client.query(
      'SELECT whatsapp_number, address, name FROM customers WHERE id = $1',
      [customerId]
    );
    const customer = customerResult.rows[0];
    
    // Send order confirmation to Ms Kitchen
    const msKitchenWhatsApp = process.env.MS_KITCHEN_WHATSAPP;
    if (msKitchenWhatsApp) {
      await whatsapp.sendOrderConfirmation({
        ...order,
        customer_whatsapp: customer.whatsapp_number,
        customer_address: customer.address,
        customer_name: customer.name,
        items_summary: itemsSummary.join(', ')
      }, msKitchenWhatsApp);
    }
    
    // Get complete order with items
    const itemsResult = await query(
      `SELECT oi.*, mi.name as item_name
       FROM order_items oi
       JOIN menu_items mi ON mi.id = oi.menu_item_id
       WHERE oi.order_id = $1`,
      [order.id]
    );
    order.items = itemsResult.rows;
    
    res.status(201).json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// PUT update order payment status
router.put('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;
    
    if (!['pending', 'confirmed', 'paid'].includes(payment_status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }
    
    const result = await query(
      `UPDATE orders 
       SET payment_status = $1, 
           payment_confirmed_at = ${payment_status === 'confirmed' || payment_status === 'paid' ? 'NOW()' : 'NULL'},
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [payment_status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// GET pending payments for a date
router.get('/pending-payments/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const result = await query(`
      SELECT o.id as order_id,
             o.order_value,
             o.created_at,
             m.date as menu_date,
             c.whatsapp_number as customer_whatsapp,
             c.address as customer_address,
             c.name as customer_name,
             STRING_AGG(mi.name || ' x' || oi.quantity, ', ') as order_items
      FROM orders o
      JOIN menus m ON m.id = o.menu_id
      JOIN customers c ON c.id = o.customer_id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE m.date = $1 
        AND o.payment_status = 'pending'
      GROUP BY o.id, o.order_value, o.created_at, m.date, c.whatsapp_number, c.address, c.name
      ORDER BY o.created_at
    `, [date]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

module.exports = router;

