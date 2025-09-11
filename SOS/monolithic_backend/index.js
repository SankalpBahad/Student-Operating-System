require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/db');
const path = require('path');

// Import routers from the different modules
const userRoutes = require('./src/user/routes/userRoutes');
const noteRoutes = require('./src/notes/routes/noteRoutes');
const categoryRoutes = require('./src/notes/routes/categoryRoutes'); // Note: Categories are part of notes service
const eventRoutes = require('./src/events/routes/eventRoutes');

const app = express();

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (adjust as needed for production)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Create uploads directory for file storage (used by event service)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
// Mount routers with the same prefixes as the original API Gateway
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);       // Handles /api/notes/*
app.use('/api/categories', categoryRoutes); // Handles /api/categories/*
app.use('/api/events', eventRoutes);

// --- Simple Health Check Route ---
app.get('/ping', (req, res) => {
    res.send('pong from monolithic backend');
});

// --- Global Error Handler (Basic Example) ---
app.use((err, req, res, next) => {
    console.error("[Global Error Handler]:", err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected error occurred.',
        // Optionally include stack trace in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;

// Connect to database and start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Start the server only after successful DB connection
        app.listen(PORT, () => {
            console.log(`Monolithic Backend running on port ${PORT}`);
            console.log('Mounted routes:');
            console.log('  /api/users');
            console.log('  /api/notes');
            console.log('  /api/categories');
            console.log('  /api/events');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer(); 