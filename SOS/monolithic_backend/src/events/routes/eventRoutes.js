// backend/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../../../../uploads');
        fs.mkdirSync(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        cb(null, 'ics-import-' + Date.now() + path.extname(file.originalname));
    }
});

// Filter for only .ics files
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/calendar' || path.extname(file.originalname).toLowerCase() === '.ics') {
        cb(null, true);
    } else {
        cb(new Error('Only ICS files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    }
});

// --- CRITICAL: Import the controller functions ---
// Double-check the relative path from 'routes' to 'controller'
const {
    createEvent, // Make sure createEvent is imported
    getEventsByUser,
    getEventById,
    deleteEvent,
    importFromIcsFile,
    exportToIcsFile
 } = require('../controller/eventController'); // Adjust path if needed ('../controller/...')

// Instead of logging once at startup, log each request for better debugging
router.use((req, res, next) => {
    console.log(`[Event Service] Received request: ${req.method} ${req.originalUrl}`);
    next();
});

// Error handling for multer
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred
        return res.status(400).json({ message: `File upload error: ${err.message}` });
    } else if (err) {
        // An unknown error occurred
        return res.status(500).json({ message: err.message });
    }
    next();
});

// Routes with the correct path structure for the API Gateway:
// The API Gateway rewrites '/api/events' to '/events'
// Fix the path - remove '/events' from the beginning since API gateway already rewrites it
router.post('/', createEvent);

// Route to get all events for a specific user (using UID)
router.get('/user/:uid', getEventsByUser);

// Optional: Route to get a single event by its MongoDB _id
router.get('/:eventId', getEventById);

// Optional: Route to delete an event by its MongoDB _id
router.delete('/:eventId', deleteEvent);

// ICS file import/export routes
router.post('/import-ics', upload.single('icsFile'), importFromIcsFile);
router.post('/export-ics', exportToIcsFile);

module.exports = router; // Export the configured router