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

// Seed database endpoint
app.post('/api/seed', async (req, res) => {
  const { pool } = require('./db');
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding via API...');
    
    // Ensure tables exist
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
    
    // Seed data
    const seedData = [
      {
        title: 'Classic Chocolate Chip Cookies',
        description: 'Soft and chewy chocolate chip cookies that are perfect for any occasion.',
        ingredients: JSON.stringify([
          '2 1/4 cups all-purpose flour',
          '1 tsp baking soda',
          '1 cup butter, softened',
          '3/4 cup granulated sugar',
          '3/4 cup packed brown sugar',
          '2 large eggs',
          '2 tsp vanilla extract',
          '2 cups chocolate chips'
        ]),
        instructions: JSON.stringify([
          'Preheat oven to 375°F (190°C)',
          'Mix flour and baking soda in a bowl',
          'Beat butter, granulated sugar, and brown sugar until creamy',
          'Add eggs and vanilla, beat well',
          'Gradually blend in flour mixture',
          'Stir in chocolate chips',
          'Drop rounded tablespoons onto ungreased baking sheets',
          'Bake 9-11 minutes or until golden brown'
        ]),
        prep_time: 15,
        cook_time: 11,
        servings: 48
      },
      {
        title: 'Spaghetti Carbonara',
        description: 'A classic Italian pasta dish with eggs, cheese, pancetta, and black pepper.',
        ingredients: JSON.stringify([
          '1 lb spaghetti',
          '8 oz pancetta or bacon, diced',
          '4 large eggs',
          '1 cup grated Parmesan cheese',
          '1/2 cup grated Pecorino Romano cheese',
          '4 cloves garlic, minced',
          'Black pepper to taste',
          'Salt to taste'
        ]),
        instructions: JSON.stringify([
          'Cook spaghetti according to package directions',
          'While pasta cooks, heat a large skillet over medium heat',
          'Add pancetta and cook until crispy',
          'In a bowl, whisk eggs and both cheeses together',
          'Drain pasta, reserving 1 cup of pasta water',
          'Add hot pasta to the skillet with pancetta',
          'Remove from heat and quickly toss with egg mixture',
          'Add pasta water gradually to create creamy sauce',
          'Season with black pepper and serve immediately'
        ]),
        prep_time: 10,
        cook_time: 20,
        servings: 4
      },
      {
        title: 'Chicken Tikka Masala',
        description: 'Creamy and flavorful Indian curry dish with tender chicken pieces.',
        ingredients: JSON.stringify([
          '2 lbs chicken breast, cut into chunks',
          '1 cup plain yogurt',
          '2 tbsp lemon juice',
          '2 tsp ground cumin',
          '2 tsp ground coriander',
          '1 tsp cayenne pepper',
          '1 can (14 oz) tomato sauce',
          '1 cup heavy cream',
          '1 large onion, diced',
          '3 cloves garlic, minced',
          '1 tbsp fresh ginger, grated',
          '2 tsp garam masala',
          'Salt to taste'
        ]),
        instructions: JSON.stringify([
          'Marinate chicken in yogurt, lemon juice, and spices for at least 1 hour',
          'Heat oil in a large pan over medium-high heat',
          'Cook chicken until browned, about 5-7 minutes',
          'Remove chicken and set aside',
          'In the same pan, sauté onion until soft',
          'Add garlic and ginger, cook for 1 minute',
          'Add tomato sauce and simmer for 10 minutes',
          'Stir in cream and garam masala',
          'Return chicken to pan and simmer for 10 minutes',
          'Serve over basmati rice'
        ]),
        prep_time: 20,
        cook_time: 30,
        servings: 6
      },
      {
        title: 'Caesar Salad',
        description: 'Fresh and crisp romaine lettuce with homemade Caesar dressing.',
        ingredients: JSON.stringify([
          '2 heads romaine lettuce, chopped',
          '1/2 cup grated Parmesan cheese',
          '1/2 cup croutons',
          '1/4 cup Caesar dressing',
          '2 anchovy fillets (optional)',
          'Black pepper to taste'
        ]),
        instructions: JSON.stringify([
          'Wash and dry romaine lettuce thoroughly',
          'Chop lettuce into bite-sized pieces',
          'Place in a large salad bowl',
          'Add Caesar dressing and toss to coat',
          'Sprinkle with Parmesan cheese',
          'Add croutons on top',
          'Season with black pepper',
          'Serve immediately'
        ]),
        prep_time: 10,
        cook_time: 0,
        servings: 4
      },
      {
        title: 'Beef Stir Fry',
        description: 'Quick and easy stir fry with tender beef and fresh vegetables.',
        ingredients: JSON.stringify([
          '1 lb beef sirloin, sliced thin',
          '2 bell peppers, sliced',
          '1 onion, sliced',
          '2 cups broccoli florets',
          '3 tbsp soy sauce',
          '2 tbsp oyster sauce',
          '1 tbsp cornstarch',
          '2 cloves garlic, minced',
          '1 tbsp fresh ginger, grated',
          '2 tbsp vegetable oil'
        ]),
        instructions: JSON.stringify([
          'Slice beef into thin strips',
          'Mix soy sauce, oyster sauce, and cornstarch in a bowl',
          'Heat oil in a wok or large skillet over high heat',
          'Add beef and cook until browned, about 3-4 minutes',
          'Remove beef and set aside',
          'Add vegetables to the pan and stir fry for 3-4 minutes',
          'Add garlic and ginger, cook for 30 seconds',
          'Return beef to pan',
          'Pour sauce over everything and stir until thickened',
          'Serve over rice or noodles'
        ]),
        prep_time: 15,
        cook_time: 10,
        servings: 4
      }
    ];
    
    // Clear existing data (optional - remove if you want to keep existing)
    const clearExisting = req.body.clear === true || req.query.clear === 'true';
    if (clearExisting) {
      await client.query('DELETE FROM recipes');
      console.log('🗑️  Cleared existing recipes');
    } else {
      // Check if recipes already exist
      const checkResult = await client.query('SELECT COUNT(*) FROM recipes');
      const count = parseInt(checkResult.rows[0].count);
      if (count > 0) {
        return res.status(400).json({
          success: false,
          message: `Database already contains ${count} recipes. Add ?clear=true to replace them.`
        });
      }
    }
    
    // Insert seed data
    const inserted = [];
    for (const recipe of seedData) {
      const result = await client.query(
        `INSERT INTO recipes (title, description, ingredients, instructions, prep_time, cook_time, servings)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title`,
        [
          recipe.title,
          recipe.description,
          recipe.ingredients,
          recipe.instructions,
          recipe.prep_time,
          recipe.cook_time,
          recipe.servings
        ]
      );
      inserted.push(result.rows[0]);
      console.log(`✅ Added recipe: ${recipe.title}`);
    }
    
    res.json({
      success: true,
      message: `Successfully seeded ${inserted.length} recipes`,
      recipes: inserted
    });
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

app.use('/api/recipes', recipesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

