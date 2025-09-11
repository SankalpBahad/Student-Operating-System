/**
 * One-time script to reset the categories collection and indexes
 * Run this with: node resetCategoryCollection.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;

async function resetCategoryCollection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the Category collection
    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: 'categories' }).toArray();
    
    if (collections.length > 0) {
      console.log('Found categories collection, dropping it...');
      // Drop the collection entirely
      await db.dropCollection('categories');
      console.log('Successfully dropped categories collection');
    } else {
      console.log('Categories collection does not exist yet, nothing to drop');
    }

    // Create a new Category model with the correct schema and indexes
    const categorySchema = new mongoose.Schema({
      uid: {
        type: String,
        required: true,
        index: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      }
    }, {
      timestamps: true
    });

    // Create fresh index
    categorySchema.index(
      { uid: 1, name: 1 }, 
      { 
        unique: true, 
        collation: { locale: 'en', strength: 2 }
      }
    );

    const Category = mongoose.model('Category', categorySchema);
    
    // Force the creation of indexes
    console.log('Creating indexes...');
    await Category.createIndexes();
    console.log('Indexes created successfully');

    console.log('Successfully reset the categories collection and indexes');
  } catch (error) {
    console.error('Error resetting categories collection:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the function
resetCategoryCollection(); 