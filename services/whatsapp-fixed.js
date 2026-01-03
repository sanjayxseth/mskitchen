// WhatsApp service using Twilio API
// Note: You'll need to set up Twilio account and get credentials
const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g., 'whatsapp:+14155238886'

let client = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/**
 * Send WhatsApp message
 * @param {string} to - WhatsApp number (e.g., 'whatsapp:+919876543210')
 * @param {string} message - Message body
 * @returns {Promise}
 */
const sendMessage = async (to, message) => {
  if (!client) {
    console.warn('Twilio client not configured. Message would be:', { to, message });
    return { success: false, error: 'WhatsApp service not configured' };
  }

  try {
    // Ensure 'whatsapp:' prefix
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const fromNumber = whatsappFrom || 'whatsapp:+14155238886'; // Twilio sandbox number

    const result = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    });

    console.log('WhatsApp message sent:', result.sid);
    return { success: true, messageSid: result.sid };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Format menu message for WhatsApp
 * @param {Object} menu - Menu object with items
 * @param {string} upiPhone - UPI phone number
 * @returns {string} - Formatted message
 */
const formatMenuMessage = (menu, upiPhone) => {
  const items = menu.items || [];
  const deliveryWindow = `${menu.delivery_window_start} - ${menu.delivery_window_end}`;
  
  let message = `🍳 *Ms Kitchen - Daily Menu*\n`;
  message += `📅 Date: ${menu.date}\n`;
  message += `🚚 Delivery: ${deliveryWindow}\n\n`;
  message += `*Menu Items:*\n\n`;
  
  items.forEach((item, index) => {
    message += `${index + 1}. *${item.name}*\n`;
    message += `   💰 ₹${item.price}\n`;
    message += `   📦 Available: ${item.quantity_available} plates\n\n`;
  });
  
  message += `💳 *Payment:*\n`;
  message += `UPI: ${uphone}\n\n`;
  message += `📱 *Order Now:* ${process.env.APP_URL || 'https://ms-kitchen.fly.dev'}/order/${menu.id}\n`;
  
  return message;
};

/**
 * Send order confirmation to Ms Kitchen
 * @param {Object} order - Order object
 * @param {string} msKitchenWhatsApp - Ms Kitchen WhatsApp number
 * @returns {Promise}
 */
const sendOrderConfirmation = async (order, msKitchenWhatsApp) => {
  const message = `✅ *New Order Received*\n\n` +
    `Order ID: #${order.id}\n` +
    `Customer: ${order.customer_name || 'N/A'}\n` +
    `WhatsApp: ${order.customer_whatsapp}\n` +
    `Address: ${order.customer_address}\n` +
    `Order Value: ₹${order.order_value}\n` +
    `Items: ${order.items_summary || 'N/A'}\n` +
    `Time: ${new Date(order.created_at).toLocaleString('en-IN')}`;
  
  return sendMessage(msKitchenWhatsApp, message);
};

/**
 * Send payment confirmation request (with voting buttons)
 * @param {Array} orders - Array of orders
 * @param {string} msKitchenWhatsApp - Ms Kitchen WhatsApp number
 * @returns {Promise}
 */
const sendPaymentConfirmationRequest = async (orders, msKitchenWhatsApp) => {
  let message = `💳 *Payment Confirmation Required*\n\n`;
  message += `Please confirm payment for the following orders:\n\n`;
  
  orders.forEach((order, index) => {
    message += `${index + 1}. Order #${order.id}\n`;
    message += `   Customer: ${order.customer_whatsapp}\n`;
    message += `   Amount: ₹${order.order_value}\n`;
    message += `   [Confirm Payment: /pay_${order.id}]\n\n`;
  });
  
  // Note: Twilio voting buttons require specific format
  // For now, we'll use a simple message format
  return sendMessage(msKitchenWhatsApp, message);
};

/**
 * Send review request to customer
 * @param {Object} order - Order object
 * @param {string} customerWhatsApp - Customer WhatsApp number
 * @param {string} reviewLink - Link to review page
 * @returns {Promise}
 */
const sendReviewRequest = async (order, customerWhatsApp, reviewLink) => {
  const message = `⭐ *Thank you for your order!*\n\n` +
    `We hope you enjoyed your meal from Ms Kitchen.\n\n` +
    `Please share your feedback:\n` +
    `${reviewLink}\n\n` +
    `Your feedback helps us serve you better! 🙏`;
  
  return sendMessage(customerWhatsApp, message);
};

/**
 * Send pending payments report
 * @param {Array} pendingPayments - Array of pending payment objects
 * @param {string} msKitchenWhatsApp - Ms Kitchen WhatsApp number
 * @returns {Promise}
 */
const sendPendingPaymentsReport = async (pendingPayments, msKitchenWhatsApp) => {
  if (pendingPayments.length === 0) {
    const message = `✅ *Payment Report*\n\nAll payments received for today! 🎉`;
    return sendMessage(msKitchenWhatsApp, message);
  }
  
  // Send summary first
  let summaryMessage = `⚠️ *Pending Payments Report*\n\n`;
  summaryMessage += `Date: ${new Date().toLocaleDateString('en-IN')}\n`;
  summaryMessage += `Total Pending: ${pendingPayments.length} orders\n`;
  summaryMessage += `Total Amount: ₹${pendingPayments.reduce((sum, p) => sum + parseFloat(p.order_value), 0).toFixed(2)}\n\n`;
  summaryMessage += `Details will be sent separately.`;
  
  await sendMessage(msKitchenWhatsApp, summaryMessage);
  
  // Send individual messages for each pending payment
  const promises = pendingPayments.map(payment => {
    const message = `💳 *Pending Payment*\n\n` +
      `Date: ${payment.date}\n` +
      `Order ID: #${payment.order_id}\n` +
      `Customer: ${payment.customer_whatsapp}\n` +
      `Address: ${payment.customer_address}\n` +
      `Items: ${payment.order_items}\n` +
      `Amount: ₹${payment.order_value}\n\n` +
      `Please forward this message to the customer.`;
    
    return sendMessage(msKitchenWhatsApp, message);
  });
  
  return Promise.all(promises);
};

module.exports = {
  sendMessage,
  formatMenuMessage,
  sendOrderConfirmation,
  sendPaymentConfirmationRequest,
  sendReviewRequest,
  sendPendingPaymentsReport
};

