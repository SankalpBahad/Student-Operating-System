const Category = require('../models/category');
const Note = require('../models/note');

// Get all categories for a user
exports.getCategories = async (req, res) => {
  try {
    // Assuming uid is passed in headers or middleware sets req.user.uid
    const uid = req.headers['x-user-id']; // Or req.user.uid if auth middleware is used
    if (!uid) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    const categories = await Category.find({ uid }).sort('name');
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const uid = req.headers['x-user-id']; // Or req.user.uid
    const { name } = req.body;

    if (!uid || !name) {
      return res.status(400).json({ message: 'User ID and category name are required' });
    }

    // Enhanced debugging
    console.log('------------------------');
    console.log('CREATE CATEGORY REQUEST:');
    console.log(`User ID: "${uid}"`);
    console.log(`Category Name: "${name}"`);
    
    // Check what categories the user already has
    const existingCategories = await Category.find({ uid });
    console.log('Existing categories for this user:');
    console.log(JSON.stringify(existingCategories.map(c => c.name), null, 2));
    console.log('------------------------');

    // If no duplicate, create the new category
    const newCategory = new Category({ uid, name: name.trim() });
    const savedCategory = await newCategory.save();
    
    console.log(`Category created: ${savedCategory._id}`);
    res.status(201).json(savedCategory);
  } catch (error) {
    // Enhanced error logging
    console.log('------------------------');
    console.log('ERROR CREATING CATEGORY:');
    if (error.code === 11000) {
      console.error("Duplicate key error details:", JSON.stringify(error, null, 2));
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Duplicate key pattern:", error.keyPattern); 
      console.error("Duplicate key value:", error.keyValue);
      console.log('------------------------');
      return res.status(409).json({ message: 'Category already exists', error: 'Duplicate key' });
    }
    console.error("Error creating category:", error);
    console.log('------------------------');
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const uid = req.headers['x-user-id']; // Or req.user.uid
    const { id } = req.params;
    const { name } = req.body;

    if (!uid || !name) {
      return res.status(400).json({ message: 'User ID and category name are required' });
    }

    // Optional: Check if the new name already exists for this user (excluding the current category being updated)
    const existingCategory = await Category.findOne({
        uid,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id } // Exclude the category being updated
    });
    if (existingCategory) {
        return res.status(409).json({ message: 'Another category with this name already exists' });
    }

    // Find the category to get the old name before updating
    const categoryToUpdate = await Category.findOne({ _id: id, uid });
    if (!categoryToUpdate) {
      return res.status(404).json({ message: 'Category not found or user unauthorized' });
    }
    
    const oldName = categoryToUpdate.name;
    
    // Update the category
    const updatedCategory = await Category.findOneAndUpdate(
      { _id: id, uid }, 
      { name },
      { new: true, runValidators: true }
    );

    // Update all notes that use this category
    const updateResult = await Note.updateMany(
      { uid, category: oldName }, 
      { category: name }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} notes with the new category name`);

    res.status(200).json({
      ...updatedCategory.toObject(),
      notesUpdated: updateResult.modifiedCount
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const uid = req.headers['x-user-id']; // Or req.user.uid
    const { id } = req.params;

    if (!uid) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const categoryToDelete = await Category.findOne({ _id: id, uid });

    if (!categoryToDelete) {
      return res.status(404).json({ message: 'Category not found or user unauthorized' });
    }

    // Delete all notes that belong to this category
    const deleteResult = await Note.deleteMany({ uid, category: categoryToDelete.name });
    console.log(`Deleted ${deleteResult.deletedCount} notes from category ${categoryToDelete.name}`);

    // Delete the category
    await Category.deleteOne({ _id: id, uid });

    res.status(200).json({ 
      message: 'Category deleted successfully', 
      notesDeleted: deleteResult.deletedCount 
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
}; 