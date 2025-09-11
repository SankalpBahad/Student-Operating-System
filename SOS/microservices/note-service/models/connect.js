/**
 * Singleton pattern implementation for database connection
 */
const mongoose = require('mongoose');

class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    
    this.isConnected = false;
    DatabaseConnection.instance = this;
  }

  async connect(uri) {
    if (this.isConnected) {
      console.log('Using existing database connection');
      return;
    }

    try {
      console.log('Creating new database connection');
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };
      
      await mongoose.connect(uri, options);
      
      this.isConnected = true;
      console.log('Database connection established');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        this.isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Will try to reconnect on next operation.');
        this.isConnected = false;
      });
      
    } catch (error) {
      console.error('Error connecting to database:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }
    
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Database disconnected');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  // Check connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState
    };
  }
}

// Create and export singleton instance
const dbConnection = new DatabaseConnection();

// Helper function to connect to MongoDB
const connectDB = async (uri) => {
  if (!uri) {
    throw new Error('MongoDB URI is required');
  }
  
  await dbConnection.connect(uri);
  return dbConnection;
};

module.exports = connectDB;