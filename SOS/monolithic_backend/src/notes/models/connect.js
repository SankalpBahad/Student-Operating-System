/**
 * Modified Singleton adapter for monolithic backend
 * Redirects to the shared database connection
 */
const { mongoose } = require('../../config/db');

class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    
    this.isConnected = mongoose.connection.readyState === 1;
    DatabaseConnection.instance = this;
  }

  async connect(uri) {
    // Connection is now managed by the main app
    // This is just an adapter to maintain compatibility
    this.isConnected = mongoose.connection.readyState === 1;
    return mongoose.connection;
  }

  async disconnect() {
    // Do nothing - connection is managed by main app
    console.log('Disconnect called in microservice adapter - no action taken');
    return;
  }

  // Check connection status
  getConnectionStatus() {
    return {
      isConnected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState
    };
  }
}

// Create and export singleton instance
const dbConnection = new DatabaseConnection();

// Helper function to connect to MongoDB
const connectDB = async (uri) => {
  // Ignore the URI parameter - connection is managed by main app
  return dbConnection;
};

module.exports = connectDB;