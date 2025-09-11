const express = require('express');
const router = express.Router();
const categoryController = require('../controller/categoryController');

// GET all categories for the user
router.get('/categories', categoryController.getCategories);

// POST create a new category
router.post('/categories', categoryController.createCategory);

// PUT update a category
router.put('/categories/:id', categoryController.updateCategory);

// DELETE a category
router.delete('/categories/:id', categoryController.deleteCategory);

// Add debug route
router.get('/debug', async (req, res) => {
  try {
    const Category = require('../models/category');
    const allCategories = await Category.find({});
    const userIds = [...new Set(allCategories.map(c => c.uid))];
    
    // Get categories grouped by user
    const categoriesByUser = {};
    for (const uid of userIds) {
      categoriesByUser[uid] = await Category.find({ uid });
    }
    
    res.json({
      totalCategories: allCategories.length,
      userIds,
      categoriesByUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 