/**
 * Test script to manually create categories
 * Run this with: node testCategory.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/category');

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;

async function testCategoryCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Test user ID
    const testUserId = 'testuser123';

    // 1. List all categories for this user
    console.log(`\n1. Listing all categories for user ${testUserId}...`);
    const existingCategories = await Category.find({ uid: testUserId });
    console.log(`Found ${existingCategories.length} categories:`);
    existingCategories.forEach(cat => console.log(`- ${cat._id}: ${cat.name}`));

    // 2. Create test categories
    console.log(`\n2. Creating test categories...`);
    const testCategories = ['Work', 'Personal', 'Study', 'Projects'];
    
    for (const name of testCategories) {
      try {
        // Check if exists first
        const existing = await Category.findOne({ 
          uid: testUserId, 
          name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        
        if (existing) {
          console.log(`Category "${name}" already exists (${existing._id})`);
          continue;
        }
        
        // Create new category
        const newCategory = new Category({
          uid: testUserId,
          name
        });
        
        await newCategory.save();
        console.log(`Successfully created category "${name}" (${newCategory._id})`);
      } catch (error) {
        console.error(`Error creating category "${name}":`, error.message);
      }
    }

    // 3. List all categories again to verify
    console.log(`\n3. Verifying categories...`);
    const updatedCategories = await Category.find({ uid: testUserId });
    console.log(`Found ${updatedCategories.length} categories:`);
    updatedCategories.forEach(cat => console.log(`- ${cat._id}: ${cat.name}`));

    // 4. Test case sensitivity (try to create a duplicate with different case)
    console.log(`\n4. Testing case-insensitive uniqueness...`);
    try {
      const newCategory = new Category({
        uid: testUserId,
        name: 'work' // Lowercase version of 'Work'
      });
      await newCategory.save();
      console.log('ERROR: Successfully created duplicate case-insensitive category!');
    } catch (error) {
      if (error.code === 11000) {
        console.log('SUCCESS: Prevented creating duplicate case-insensitive category');
      } else {
        console.error('Error during case sensitivity test:', error.message);
      }
    }
  } catch (error) {
    console.error('Error during category testing:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  }
}

// Run the function
testCategoryCreation(); 