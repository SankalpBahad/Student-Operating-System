require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./models/connect'); // Add DB connection import

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // RESTORED - Event service needs to parse its own body

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`[Event Service] Incoming request: ${req.method} ${req.url}`);
    next();
});

// Database Connection
connectDB(process.env.MONGO_URI); // Use the connectDB function

// Routes
const eventRoutes = require('./routes/eventRoutes');
app.use('/', eventRoutes); // Use the routes (Note: Gateway removes /api/events prefix)

app.get('/ping', (req, res) => {
    res.send('pong from event-service');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[Event Service] Error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start Server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Event Service running on port ${PORT}`);
    console.log(`Expecting requests at paths like /events/user/:uid from the API Gateway`);
}); 