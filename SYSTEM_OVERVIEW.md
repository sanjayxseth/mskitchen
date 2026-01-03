# Ms Kitchen Ordering System - Complete Overview

This is a comprehensive food ordering system for Ms Kitchen that handles menu creation, customer orders, payments, reviews, and analytics.

## System Architecture

### Database Schema

1. **customers** - Stores customer information (WhatsApp number, address, name)
2. **menus** - Daily menu with delivery window and UPI phone number
3. **menu_items** - Individual items in each menu (name, price, quantity)
4. **orders** - Customer orders linked to menus and customers
5. **order_items** - Items in each order with quantities
6. **reviews** - Customer reviews with ratings (1-5 stars) and comments

### Key Features

#### 1. Menu Management
- Create daily menus with items, prices, and quantities
- Set delivery windows (start/end time)
- Configure UPI payment phone number
- Send formatted WhatsApp messages to customers

#### 2. Customer Management
- Store customer WhatsApp numbers and addresses
- Auto-fill customer info for existing customers
- Bulk import customers
- Track customer order history

#### 3. Order Processing
- Customers place orders via web link from WhatsApp
- Automatic order value calculation
- Real-time inventory management
- Order confirmation via WhatsApp to Ms Kitchen

#### 4. Payment Management
- Track payment status (pending/confirmed/paid)
- Payment confirmation requests via WhatsApp
- End-of-day pending payments report
- Individual WhatsApp messages for each pending payment

#### 5. Review System
- Request reviews from customers after delivery
- 1-5 star rating system
- Optional comments
- Store reviews in database

#### 6. Analytics & Reports
- Customer order values (by date range, PDF export)
- Item order counts (by date range, PDF export)
- Item average ratings (by date range, PDF export)

## API Endpoints

### Menus
- `GET /api/menus` - Get all menus
- `GET /api/menus/:id` - Get menu by ID with items
- `GET /api/menus/date/:date` - Get menu by date
- `POST /api/menus` - Create new menu
- `POST /api/menus/:id/send-whatsapp` - Send menu via WhatsApp
- `PUT /api/menus/:id` - Update menu
- `DELETE /api/menus/:id` - Delete menu

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/whatsapp/:number` - Get customer by WhatsApp number
- `POST /api/customers` - Create customer
- `POST /api/customers/bulk` - Bulk create customers
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Orders
- `GET /api/orders` - Get all orders (with filters: start_date, end_date, status, payment_status)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/payment` - Update payment status
- `GET /api/orders/pending-payments/:date` - Get pending payments for a date

### Reviews
- `GET /api/reviews` - Get all reviews (with filters)
- `GET /api/reviews/:id` - Get review by ID
- `POST /api/reviews` - Create review
- `GET /api/reviews/analytics/item-ratings` - Get item average ratings

### Reports
- `GET /api/reports/customer-order-values?start_date=&end_date=&format=pdf` - Customer order values report
- `GET /api/reports/item-order-counts?start_date=&end_date=&format=pdf` - Item order counts report
- `GET /api/reports/item-ratings?start_date=&end_date=&format=pdf` - Item ratings report

## Setup Instructions

### 1. Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Server
PORT=3000
NODE_ENV=production
APP_URL=https://ms-kitchen.fly.dev

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Ms Kitchen WhatsApp number
MS_KITCHEN_WHATSAPP=whatsapp:+919876543210
```

### 2. Database Migration

Run the full migration to create all tables:

```bash
npm run db:migrate-full
```

### 3. WhatsApp Setup (Twilio)

1. Sign up for Twilio account: https://www.twilio.com
2. Get your Account SID and Auth Token
3. Enable WhatsApp Sandbox or get WhatsApp Business API access
4. Add your WhatsApp number to the sandbox
5. Configure environment variables

## Workflow

### Daily Workflow

1. **Create Menu** (Morning)
   - Use mobile app/web interface to create menu
   - Add items with prices and quantities
   - Set delivery window
   - Add UPI phone number

2. **Send Menu to Customers**
   - Use `/api/menus/:id/send-whatsapp` endpoint
   - Menu is sent to all customer WhatsApp numbers
   - Message includes order link

3. **Customer Places Order**
   - Customer clicks link in WhatsApp message
   - If existing customer: info auto-filled
   - If new customer: enters WhatsApp number and address
   - Selects items and quantities
   - Sees order total and UPI payment info
   - Places order

4. **Order Confirmation**
   - Ms Kitchen receives WhatsApp notification
   - Notification includes customer details and order info

5. **Payment Confirmation** (End of Day)
   - System sends WhatsApp message with all orders
   - Ms Kitchen confirms payments using voting buttons
   - Or manually updates via API

6. **Request Reviews** (After Delivery)
   - System sends WhatsApp message to each customer
   - Customer clicks link and rates (1-5 stars)
   - Optional comments

7. **Pending Payments Report** (End of Day)
   - System checks for pending payments
   - Sends WhatsApp message with summary
   - Sends individual messages for each pending payment

## Web Interfaces Needed

### 1. Menu Creation Interface (Mobile-Friendly)
- Date picker
- Add/remove items
- Set prices and quantities
- Set delivery window
- Configure UPI number
- Send to WhatsApp button

### 2. Order Page (Public)
- Display menu items
- Quantity selector
- Customer info form (auto-fill if existing)
- Order total display
- UPI payment info
- Place order button

### 3. Review Page (Public)
- Order details
- Star rating (1-5)
- Comments textarea
- Submit review button

### 4. Admin Dashboard
- View orders
- Update payment status
- View reports
- Customer management
- Menu management

## Next Steps

1. Create web interfaces (HTML/CSS/JS or React)
2. Set up Twilio WhatsApp integration
3. Test end-to-end workflow
4. Add authentication for admin features
5. Add more analytics features
6. Mobile app development (optional)

## Notes

- The system is designed to work with WhatsApp for messaging
- Twilio is used for WhatsApp API (requires setup)
- All reports can be exported as PDF
- Database uses PostgreSQL
- API is RESTful and can be consumed by any frontend

