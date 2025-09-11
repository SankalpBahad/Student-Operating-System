/**
 * Script to diagnose and fix Category index issues
 * This script will:
 * 1. Connect to MongoDB
 * 2. Print out all existing categories
 * 3. Drop all indexes on the Category collection
 * 4. Drop all documents in the Category collection
 * 5. Recreate the compound index with case-insensitive collation
 * 6. Insert test categories to verify the fix
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/category');

async function fixCategoryIndex() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Print all existing categories
    console.log('\n--- EXISTING CATEGORIES ---');
    const existingCategories = await Category.find({});
    console.log(JSON.stringify(existingCategories, null, 2));
    console.log(`Total categories: ${existingCategories.length}`);

    // List existing indexes
    console.log('\n--- EXISTING INDEXES ---');
    const indexes = await Category.collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop all indexes (except _id)
    console.log('\n--- DROPPING INDEXES ---');
    await Category.collection.dropIndexes();
    console.log('All indexes dropped successfully');

    // Drop all documents
    console.log('\n--- DROPPING ALL CATEGORIES ---');
    const deleteResult = await Category.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} categories`);

    // Recreate the compound index with case-insensitive collation
    console.log('\n--- RECREATING INDEX ---');
    await Category.collection.createIndex(
      { uid: 1, name: 1 },
      {
        unique: true,
        collation: { locale: 'en', strength: 2 }, // strength 2 = case insensitive
        background: true
      }
    );
    console.log('Index recreated successfully');

    // Verify indexes are recreated
    const newIndexes = await Category.collection.indexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    // Insert test categories
    console.log('\n--- INSERTING TEST CATEGORIES ---');
    const testUid = 'testuser123';
    
    // Test categories with different cases
    const testCategories = [
      { uid: testUid, name: 'Work' },
      { uid: testUid, name: 'Personal' },
      { uid: testUid, name: 'Study' },
      { uid: testUid, name: 'Projects' }
    ];

    for (const cat of testCategories) {
      const newCat = new Category(cat);
      await newCat.save();
      console.log(`Created category: ${cat.name}`);
    }
    
    // Try to create duplicate with different case (should fail)
    try {
      const dupCat = new Category({ uid: testUid, name: 'work' }); // lowercase of 'Work'
      await dupCat.save();
      console.log('⚠️ WARNING: Case-insensitive unique index is NOT working!');
    } catch (err) {
      console.log('✅ Case-insensitive index is working correctly (duplicate rejected)');
      console.log(err.message);
    }

    // Show final categories
    console.log('\n--- FINAL CATEGORIES ---');
    const finalCategories = await Category.find({ uid: testUid });
    console.log(JSON.stringify(finalCategories, null, 2));
    console.log(`Total categories for test user: ${finalCategories.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the fix function
fixCategoryIndex()
  .then(() => console.log('Fix completed'))
  .catch(err => console.error('Fix failed:', err)); 