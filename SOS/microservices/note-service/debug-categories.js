require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/category');

async function debugCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all categories
    const categories = await Category.find({}).lean();
    console.log(`Found ${categories.length} categories in total`);
    
    // Group by user ID
    const userCategories = {};
    categories.forEach(cat => {
      if (!userCategories[cat.uid]) {
        userCategories[cat.uid] = [];
      }
      userCategories[cat.uid].push({
        id: cat._id.toString(),
        name: cat.name
      });
    });
    
    // Print user summaries
    console.log('\nCategories by User:');
    for (const [uid, cats] of Object.entries(userCategories)) {
      console.log(`\nUser ID: ${uid}`);
      console.log(`Total categories: ${cats.length}`);
      console.log('Category names:');
      cats.forEach(cat => {
        console.log(`- ${cat.name} (${cat.id})`);
      });
      
      // Check for case sensitivity issues
      const lowerNames = new Map();
      cats.forEach(cat => {
        const lowerName = cat.name.toLowerCase();
        if (lowerNames.has(lowerName)) {
          console.log(`⚠️ DUPLICATE: '${cat.name}' conflicts with '${lowerNames.get(lowerName)}' when case is ignored`);
        } else {
          lowerNames.set(lowerName, cat.name);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the function
debugCategories(); 