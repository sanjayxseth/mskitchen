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
app.get('/', async (req, res) => {
  try {
    const { query } = require('./db');
    const result = await query('SELECT * FROM recipes ORDER BY created_at DESC');
    const recipes = result.rows;
    
    // Generate HTML page
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ms Kitchen - Recipe Collection</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        header {
          text-align: center;
          color: white;
          margin-bottom: 40px;
        }
        h1 {
          font-size: 3rem;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
        }
        .recipes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 25px;
          margin-top: 30px;
        }
        .recipe-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .recipe-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.2);
        }
        .recipe-title {
          font-size: 1.5rem;
          color: #333;
          margin-bottom: 10px;
          border-bottom: 2px solid #667eea;
          padding-bottom: 8px;
        }
        .recipe-description {
          color: #666;
          margin-bottom: 15px;
          line-height: 1.6;
        }
        .recipe-meta {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #555;
          font-size: 0.9rem;
        }
        .meta-item strong {
          color: #667eea;
        }
        .ingredients-section, .instructions-section {
          margin-top: 15px;
        }
        .section-title {
          font-size: 1rem;
          color: #333;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .ingredients-list, .instructions-list {
          list-style: none;
          padding-left: 0;
        }
        .ingredients-list li, .instructions-list li {
          padding: 5px 0;
          padding-left: 20px;
          position: relative;
          color: #555;
          line-height: 1.5;
        }
        .ingredients-list li:before {
          content: "🥄";
          position: absolute;
          left: 0;
        }
        .instructions-list li:before {
          content: "👨‍🍳";
          position: absolute;
          left: 0;
        }
        .instructions-list li {
          counter-increment: step;
        }
        .no-recipes {
          text-align: center;
          color: white;
          font-size: 1.5rem;
          margin-top: 50px;
          padding: 40px;
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
        }
        .api-link {
          text-align: center;
          margin-top: 30px;
        }
        .api-link a {
          color: white;
          text-decoration: none;
          background: rgba(255,255,255,0.2);
          padding: 10px 20px;
          border-radius: 6px;
          display: inline-block;
          transition: background 0.2s;
        }
        .api-link a:hover {
          background: rgba(255,255,255,0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>🍳 Ms Kitchen</h1>
          <p class="subtitle">Your Recipe Collection</p>
        </header>
        
        ${recipes.length === 0 ? `
          <div class="no-recipes">
            <p>No recipes found in the database.</p>
            <p style="margin-top: 20px; font-size: 1rem;">
              <a href="/api/seed" style="color: white; text-decoration: underline;">Seed the database</a> to get started!
            </p>
          </div>
        ` : `
          <div class="recipes-grid">
            ${recipes.map(recipe => `
              <div class="recipe-card">
                <h2 class="recipe-title">${escapeHtml(recipe.title)}</h2>
                <p class="recipe-description">${escapeHtml(recipe.description || '')}</p>
                <div class="recipe-meta">
                  ${recipe.prep_time ? `<div class="meta-item"><strong>Prep:</strong> ${recipe.prep_time} min</div>` : ''}
                  ${recipe.cook_time ? `<div class="meta-item"><strong>Cook:</strong> ${recipe.cook_time} min</div>` : ''}
                  ${recipe.servings ? `<div class="meta-item"><strong>Serves:</strong> ${recipe.servings}</div>` : ''}
                </div>
                ${recipe.ingredients ? `
                  <div class="ingredients-section">
                    <div class="section-title">Ingredients:</div>
                    <ul class="ingredients-list">
                      ${JSON.parse(recipe.ingredients).map(ing => `<li>${escapeHtml(ing)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${recipe.instructions ? `
                  <div class="instructions-section">
                    <div class="section-title">Instructions:</div>
                    <ol class="instructions-list">
                      ${JSON.parse(recipe.instructions).map(inst => `<li>${escapeHtml(inst)}</li>`).join('')}
                    </ol>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `}
        
        <div class="api-link">
          <a href="/api/recipes">View API Endpoints</a>
        </div>
      </div>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1>Error loading recipes</h1>
        <p>${escapeHtml(error.message)}</p>
      </body>
      </html>
    `);
  }
});

// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

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

