const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    index: true, // Indexing uid for faster lookups per user
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: 'User ID cannot be empty'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: 'Category name cannot be empty'
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Drop existing indexes to avoid conflicts (only needed when fixing index issues)
// Will run on schema compilation
// categorySchema.pre('compile', function(next) {
//   try {
//     // Don't run in production
//     if (process.env.NODE_ENV !== 'production') {
//       console.log('Attempting to drop indexes for Category collection...');
      
//       this.collection.dropIndexes()
//         .then(() => console.log('Successfully dropped indexes for Category collection'))
//         .catch(err => {
//           // It's okay if it fails (e.g., collection doesn't exist yet)
//           console.log('Error or no indexes to drop:', err.message);
//         });
//     }
//     next();
//   } catch(error) {
//     console.error('Error in pre-compile hook:', error);
//     next();
//   }
// });

// Re-create the compound index with case-insensitive collation
categorySchema.index(
  { uid: 1, name: 1 }, 
  { 
    unique: true, 
    collation: { locale: 'en', strength: 2 }, // strength 2 = case insensitive
    background: true, // Create index in the background
    // Add sparse option to ignore documents with null values in indexed fields
    sparse: true
  }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 