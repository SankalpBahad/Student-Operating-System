require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const mongoose = require('mongoose'); // Will uncomment when DB connection is added
const connectDB = require('./models/connect'); // Add DB connection import

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // RESTORED - Note service needs to parse its own body

// TODO: Add Database Connection
/*
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Note Service DB Connected'))
    .catch(err => console.error('Note Service DB Connection Error:', err));
*/
connectDB(process.env.MONGO_URI); // Use the connectDB function

// TODO: Add Routes
// const noteRoutes = require('./routes/noteRoutes');
// app.use('/', noteRoutes);
const noteRoutes = require('./routes/noteRoutes');
const categoryRoutes = require('./routes/categoryRoutes'); // Add category routes

app.use('/', noteRoutes); // Use the routes (Note: Gateway removes /api/notes prefix)
app.use('/', categoryRoutes); // Use the category routes

app.get('/ping', (req, res) => {
    res.send('pong from note-service');
});


// Start Server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Note Service running on port ${PORT}`);
}); 