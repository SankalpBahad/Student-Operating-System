require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const mongoose = require('mongoose'); // Will uncomment when DB connection is added
const connectDB = require('./models/connect'); // Add DB connection import

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// TODO: Add Database Connection
/*
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('User Service DB Connected'))
    .catch(err => console.error('User Service DB Connection Error:', err));
*/
connectDB(process.env.MONGO_URI); // Use the connectDB function

// TODO: Add Routes
// const userRoutes = require('./routes/userRoutes');
// app.use('/', userRoutes);
const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes); // Use the routes (Note: Gateway removes /api/users prefix)

app.get('/ping', (req, res) => {
    res.send('pong from user-service');
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
}); 