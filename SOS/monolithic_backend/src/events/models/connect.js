// Adapter for event service to use a specific database connection for events
const mongoose = require('mongoose');
const { mongoose: sharedMongoose } = require('../../config/db');

// Create a separate mongoose connection for events specifically
let eventDbConnection = null;

// This function creates a separate connection to the 'CollabNotes' database specifically for events
const connectDB = async () => {
    try {
        // If already connected, return the existing connection
        if (eventDbConnection) {
            return eventDbConnection;
        }

        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/monolith_db';
        console.log(`Events module: Creating separate connection to 'CollabNotes' database`);
        
        // Create a separate mongoose connection for events
        eventDbConnection = await mongoose.createConnection(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'CollabNotes' // Explicitly set to CollabNotes for events only
        });
        
        console.log('Events module: Connected to CollabNotes database');
        return eventDbConnection;
    } catch (error) {
        console.log(`Events module MongoDB connection error: ${error.message}`);
        return sharedMongoose.connection; // Fallback to shared connection if separate one fails
    }
}

module.exports = connectDB;