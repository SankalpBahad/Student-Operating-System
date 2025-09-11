const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();


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