const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const recipesRouter = require('./routes/recipes');

const app = express();
const PORT = process.env.PORT || 3000;

// Auto-run migrations on startup (only in production, first time)
if (process.env.NODE_ENV === 'production' && process.env.AUTO_MIGRATE === 'true') {
  const { pool } = require('./db');
  const createTables = async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        CREATE TABLE IF NOT EXISTS recipes (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          ingredients TEXT NOT NULL,
          instructions TEXT NOT NULL,
          prep_time INTEGER,
          cook_time INTEGER,
          servings INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title)
      `);
      await client.query('COMMIT');
      console.log('✅ Database tables created/verified');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error creating tables:', error);
    } finally {
      client.release();
    }
  };
  createTables();
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Ms Kitchen API',
    version: '1.0.0',
    endpoints: {
      recipes: '/api/recipes'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/recipes', recipesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

