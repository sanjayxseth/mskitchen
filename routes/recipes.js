const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET all recipes
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM recipes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// GET single recipe by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM recipes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// POST create new recipe
router.post('/', async (req, res) => {
  try {
    const { title, description, ingredients, instructions, prep_time, cook_time, servings } = req.body;
    
    const result = await query(
      `INSERT INTO recipes (title, description, ingredients, instructions, prep_time, cook_time, servings)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, ingredients, instructions, prep_time, cook_time, servings]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// PUT update recipe
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, ingredients, instructions, prep_time, cook_time, servings } = req.body;
    
    const result = await query(
      `UPDATE recipes 
       SET title = $1, description = $2, ingredients = $3, instructions = $4, 
           prep_time = $5, cook_time = $6, servings = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, description, ingredients, instructions, prep_time, cook_time, servings, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// DELETE recipe
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM recipes WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    res.json({ message: 'Recipe deleted successfully', recipe: result.rows[0] });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

module.exports = router;

