const express = require('express');
const router = express.Router();
const { query } = require('../db');
const PDFDocument = require('pdfkit');

// GET customer order values report
router.get('/customer-order-values', async (req, res) => {
  try {
    const { start_date, end_date, format } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }
    
    const result = await query(`
      SELECT c.id,
             c.whatsapp_number,
             c.name,
             c.address,
             COUNT(DISTINCT o.id) as total_orders,
             COALESCE(SUM(o.order_value), 0) as total_value
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE o.created_at >= $1 AND o.created_at <= $2
      GROUP BY c.id, c.whatsapp_number, c.name, c.address
      HAVING COUNT(DISTINCT o.id) > 0
      ORDER BY total_value DESC
    `, [start_date, end_date]);
    
    if (format === 'pdf') {
      return generateCustomerOrderValuesPDF(res, result.rows, start_date, end_date);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error generating customer order values report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET item order counts report
router.get('/item-order-counts', async (req, res) => {
  try {
    const { start_date, end_date, format } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }
    
    const result = await query(`
      SELECT mi.id,
             mi.name,
             COUNT(oi.id) as order_count,
             SUM(oi.quantity) as total_quantity,
             COALESCE(SUM(oi.subtotal), 0) as total_revenue
      FROM menu_items mi
      JOIN order_items oi ON oi.menu_item_id = mi.id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= $1 AND o.created_at <= $2
      GROUP BY mi.id, mi.name
      ORDER BY order_count DESC
    `, [start_date, end_date]);
    
    if (format === 'pdf') {
      return generateItemOrderCountsPDF(res, result.rows, start_date, end_date);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error generating item order counts report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET item average ratings report
router.get('/item-ratings', async (req, res) => {
  try {
    const { start_date, end_date, format } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }
    
    const result = await query(`
      SELECT mi.id,
             mi.name,
             COUNT(r.id) as review_count,
             ROUND(AVG(r.rating)::numeric, 2) as average_rating
      FROM menu_items mi
      JOIN reviews r ON r.menu_item_id = mi.id
      JOIN orders o ON o.id = r.order_id
      WHERE o.created_at >= $1 AND o.created_at <= $2
      GROUP BY mi.id, mi.name
      HAVING COUNT(r.id) > 0
      ORDER BY average_rating DESC, review_count DESC
    `, [start_date, end_date]);
    
    if (format === 'pdf') {
      return generateItemRatingsPDF(res, result.rows, start_date, end_date);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error generating item ratings report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Helper function to generate PDF for customer order values
function generateCustomerOrderValuesPDF(res, data, startDate, endDate) {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `customer-order-values-${Date.now()}.pdf`;
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  doc.pipe(res);
  
  // Header
  doc.fontSize(20).text('Customer Order Values Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Date Range: ${startDate} to ${endDate}`, { align: 'center' });
  doc.moveDown(2);
  
  // Table header
  doc.fontSize(10);
  let y = doc.y;
  doc.text('Rank', 50, y);
  doc.text('Customer', 100, y);
  doc.text('WhatsApp', 250, y);
  doc.text('Orders', 350, y, { width: 80, align: 'right' });
  doc.text('Total Value (₹)', 450, y, { width: 100, align: 'right' });
  
  y += 20;
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 10;
  
  // Table rows
  data.forEach((row, index) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    
    doc.text(`${index + 1}`, 50, y);
    doc.text(row.name || 'N/A', 100, y, { width: 140 });
    doc.text(row.whatsapp_number, 250, y, { width: 90 });
    doc.text(row.total_orders.toString(), 350, y, { width: 80, align: 'right' });
    doc.text(`₹${parseFloat(row.total_value).toFixed(2)}`, 450, y, { width: 100, align: 'right' });
    
    y += 20;
  });
  
  doc.end();
}

// Helper function to generate PDF for item order counts
function generateItemOrderCountsPDF(res, data, startDate, endDate) {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `item-order-counts-${Date.now()}.pdf`;
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  doc.pipe(res);
  
  // Header
  doc.fontSize(20).text('Item Order Counts Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Date Range: ${startDate} to ${endDate}`, { align: 'center' });
  doc.moveDown(2);
  
  // Table header
  doc.fontSize(10);
  let y = doc.y;
  doc.text('Rank', 50, y);
  doc.text('Item Name', 100, y);
  doc.text('Order Count', 350, y, { width: 100, align: 'right' });
  doc.text('Total Quantity', 450, y, { width: 100, align: 'right' });
  doc.text('Revenue (₹)', 550, y, { width: 100, align: 'right' });
  
  y += 20;
  doc.moveTo(50, y).lineTo(650, y).stroke();
  y += 10;
  
  // Table rows
  data.forEach((row, index) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    
    doc.text(`${index + 1}`, 50, y);
    doc.text(row.name, 100, y, { width: 240 });
    doc.text(row.order_count.toString(), 350, y, { width: 100, align: 'right' });
    doc.text(row.total_quantity.toString(), 450, y, { width: 100, align: 'right' });
    doc.text(`₹${parseFloat(row.total_revenue).toFixed(2)}`, 550, y, { width: 100, align: 'right' });
    
    y += 20;
  });
  
  doc.end();
}

// Helper function to generate PDF for item ratings
function generateItemRatingsPDF(res, data, startDate, endDate) {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `item-ratings-${Date.now()}.pdf`;
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  doc.pipe(res);
  
  // Header
  doc.fontSize(20).text('Item Average Ratings Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Date Range: ${startDate} to ${endDate}`, { align: 'center' });
  doc.moveDown(2);
  
  // Table header
  doc.fontSize(10);
  let y = doc.y;
  doc.text('Rank', 50, y);
  doc.text('Item Name', 100, y);
  doc.text('Review Count', 350, y, { width: 100, align: 'right' });
  doc.text('Average Rating', 450, y, { width: 100, align: 'right' });
  
  y += 20;
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 10;
  
  // Table rows
  data.forEach((row, index) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    
    doc.text(`${index + 1}`, 50, y);
    doc.text(row.name, 100, y, { width: 240 });
    doc.text(row.review_count.toString(), 350, y, { width: 100, align: 'right' });
    doc.text(row.average_rating.toString(), 450, y, { width: 100, align: 'right' });
    
    y += 20;
  });
  
  doc.end();
}

module.exports = router;

