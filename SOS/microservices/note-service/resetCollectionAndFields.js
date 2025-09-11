/**
 * Reset script to completely drop and recreate the categories collection
 * Fixes field naming mismatch between code (uid/name) and DB (userId/title)
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function resetCategoriesCollection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    
    // Check if categories collection exists
    const collections = await db.listCollections({ name: 'categories' }).toArray();
    
    if (collections.length > 0) {
      console.log('Found categories collection, dropping it...');
      // Drop the collection entirely
      await db.dropCollection('categories');
      console.log('Successfully dropped categories collection');
    } else {
      console.log('Categories collection does not exist yet, nothing to drop');
    }

    // Create a fresh Category model with correct field names
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

    // Create the case-insensitive unique compound index on uid and name
    categorySchema.index(
      { uid: 1, name: 1 }, 
      { 
        unique: true, 
        collation: { locale: 'en', strength: 2 },
        background: true
      }
    );

    // Create the model to register the schema
    const Category = mongoose.model('Category', categorySchema, 'categories', true); // Force model recreation
    
    // Force the creation of indexes
    console.log('Creating indexes...');
    await Category.createIndexes();
    console.log('Indexes created successfully');

    // Verify the indexes
    const indexes = await db.collection('categories').indexes();
    console.log('Created indexes:', JSON.stringify(indexes, null, 2));

    console.log('Reset completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

resetCategoriesCollection()
  .then(() => console.log('Script finished'))
  .catch(err => console.error('Script failed:', err)); 