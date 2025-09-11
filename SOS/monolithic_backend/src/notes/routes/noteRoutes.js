const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer
const {
    createNote,
    getNoteDetails,
    deleteNote,
    updateNote,
    getNotesByOwner,
    addNoteFromPageTalk,
    addNoteFromVoiceSync,
    createNoteFromPdf,
    summarizeNote,
    generateQuizQuestions,
    updateNoteCategory,
    toggleArchiveNote,
    toggleStarNote,
    getArchivedNotes,
    getStarredNotes
} = require("../controller/noteController");

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Example: 10MB limit
});

// --- Fixed Routes - removed redundant /notes prefix ---
router.post('/note', createNote);
router.get('/note/:id', getNoteDetails);
router.delete('/note/:id', deleteNote);
router.put('/note/:id', updateNote);
router.get('/get-notes/:id', getNotesByOwner);
router.post('/page-talk/add-note', addNoteFromPageTalk);
router.post('/voice-sync/add-note', addNoteFromVoiceSync);
router.post('/summarize/:noteId', summarizeNote);
router.post('/quiz/:noteId', generateQuizQuestions);

// --- NEW Route for PDF upload ---
// The 'pdfFile' string MUST match the key used in FormData on the frontend
router.post('/create-from-pdf', upload.single('pdfFile'), createNoteFromPdf);
console.log("Registered POST /create-from-pdf in noteRouter"); // Updated log

// New route to update only the category of a note
router.patch('/note/:id/category', updateNoteCategory);

// Routes for archive functionality
router.patch('/note/:noteId/toggle-archive', toggleArchiveNote);
router.get('/archived-notes/:uid', getArchivedNotes);

// Routes for star/important functionality
router.patch('/note/:noteId/toggle-star', toggleStarNote);
router.get('/starred-notes/:uid', getStarredNotes);

module.exports = router;