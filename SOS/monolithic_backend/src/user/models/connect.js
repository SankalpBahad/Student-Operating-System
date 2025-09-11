// Adapter for user service to use shared database connection
const { mongoose } = require('../../config/db');

// This function is just a stub that returns the existing connection
const connectDB = async () => {
    try {
        // Just return the existing connection - it's managed by the main app
        // Log only if connection isn't established
        if (mongoose.connection.readyState !== 1) {
            console.log('User service using shared MongoDB connection');
        }
        
        return mongoose.connection;
    } catch (error) {
        console.log(`MongoDB connection adapter error: ${error.message}`);
    }
}

module.exports = connectDB;