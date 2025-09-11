const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path'); // Import path module

// Explicitly load .env from the service root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'CollabNotes'
        })
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        console.log('MongoDB connected')
    } catch (error) {
        console.log(`MongoDB connection error: ${error.message}`)
    }
}


module.exports = connectDB;