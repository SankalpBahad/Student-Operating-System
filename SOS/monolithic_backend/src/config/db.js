const mongoose = require('mongoose');

// Set mongoose options
mongoose.set('strictQuery', false);

// Cache the database connection
let dbConnection = null;

// MongoDB connection with error handling
const connectDB = async () => {
    try {
        // If already connected, return the existing connection
        if (dbConnection) {
            console.log('Using existing database connection');
            return dbConnection;
        }

        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/monolith_db';
        console.log(`Attempting to connect to MongoDB: ${MONGO_URI}`);
        
        // Mongoose connection options
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // Increase timeout for Atlas connections
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            // dbName: 'CollabNotes' // Removed explicit database name to use default from connection string
        };
        
        dbConnection = await mongoose.connect(MONGO_URI, options);
        
        // Handle connection events
        mongoose.connection.on('connected', () => {
            console.log(`Mongoose connected to ${mongoose.connection.host}`);
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('Mongoose connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
            dbConnection = null;
        });
        
        // If Node process ends, close the connection
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('Mongoose connection closed through app termination');
            process.exit(0);
        });
        
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
        return dbConnection;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        console.error('Connection details:', error);
        // Don't exit process here, allow app to handle reconnection
        return null;
    }
};

// Export the connection and mongoose instance
module.exports = { 
    connectDB,
    mongoose
}; 