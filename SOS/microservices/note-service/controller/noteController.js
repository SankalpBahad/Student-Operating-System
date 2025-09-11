const Note = require('../models/note');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const Category = require('../models/category'); // Import Category model
require('dotenv').config(); // Load .env variables

// Import our new design pattern implementations
const NoteFactory = require('../factories/noteFactory');
const noteRepository = require('../repositories/noteRepository');
const { noteEventBus } = require('../observers/noteObserver');
const { SummarizationContext, GeminiSummarizationStrategy, BasicSummarizationStrategy } = require('../strategies/summarizationStrategy');

// --- Gemini Setup ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Use the appropriate model
});
const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 8192, // Adjust as needed
};
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];
// --- End Gemini Setup ---


// Helper function to convert text to BlockNote structure
const textToBlockNoteContent = (text) => {
    const paragraphs = text.split('\n').filter(p => p.trim() !== ''); // Split by newline and remove empty lines
    const content = paragraphs.map((paragraph, index) => ({
        id: `paragraph-${index + 1}`, // Simple ID generation
        type: 'paragraph',
        props: { "textColor": "default", "backgroundColor": "default", "textAlignment": "left" }, // Add default props
        content: [{ type: 'text', text: paragraph.trim(), styles: {} }],
        children: []
    }));

    // Add a heading at the beginning
    return [
        {
            id: "heading-1",
            type: "heading",
            props: { level: "1", "textColor": "default", "backgroundColor": "default", "textAlignment": "left" },
            content: [{ type: 'text', text: 'Note from PDF', styles: {} }],
            children: [],
        },
        ...content
    ];
};


const createNote = async (req, res) => {
    console.log("--- ENTERED createNote --- TOP OF FUNCTION ---"); // ADDED LOG
    try {
        console.log("createNote called with body:", JSON.stringify(req.body));
        console.log("Request headers:", JSON.stringify(req.headers));
        
        // Destructure including preview (if sent directly, otherwise generate it)
        const { docId, title, content, uid, category, tags, preview } = req.body;
        if (!docId || !title || !content || !uid) { // docId is crucial now
            console.error("Validation failed: Missing required fields");
            console.error("docId:", docId, "title:", title, "content:", content ? "exists" : "missing", "uid:", uid);
            return res.status(400).json({ message: 'docId, Title, content, and owner uid are required' });
        }

        // Optionally generate preview if not provided
        // let notePreview = preview;
        // if (!notePreview && Array.isArray(content) && content.length > 1 && content[1]?.content?.[0]?.text) {
        //   notePreview = content[1].content[0].text.substring(0, 100) + '...'; // Simple preview generation
        // } else if (!notePreview) {
        //     notePreview = "No preview available."
        // }

        const newNote = new Note({
            docId,
            uid,
            title,
            content,
            category,
            tags: tags || [],
            timestamp: Date.now(),
            preview: preview || "No preview available." // Use generated or default preview
        });

        console.log("Attempting to save new note with docId:", docId);
        const savedNote = await newNote.save();
        console.log(`Note created successfully with docId: ${savedNote.docId}`);
        res.status(201).json(savedNote);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message }); // Send error message
    }
};

// --- NEW Controller function for PDF processing ---
const createNoteFromPdf = async (req, res) => {
    console.log("createNoteFromPdf called..."); // Add log

    if (!req.file) {
        console.error("No PDF file uploaded.");
        return res.status(400).json({ message: 'No PDF file uploaded.' });
    }
    if (!req.body.uid) {
         console.error("No user ID (uid) provided in the request body.");
        return res.status(400).json({ message: 'User ID (uid) is required.' });
    }

    const pdfFile = req.file;
    const uid = req.body.uid;
    const originalFilename = pdfFile.originalname || 'document.pdf';

    console.log(`Processing PDF: ${originalFilename} for user: ${uid}`); // Add log

    try {
        // Check if GEMINI_API_KEY is valid
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
            console.warn("Missing or invalid Gemini API key. Creating a placeholder note instead.");
            
            // Create a placeholder note without using Gemini
            const placeholderContent = textToBlockNoteContent(
                "PDF Processing is currently unavailable. Please check the server configuration.\n\n" +
                "The administrator needs to add a valid Gemini API key to enable PDF processing.\n\n" +
                `The file '${originalFilename}' was uploaded but could not be processed.`
            );
            
            // Generate a unique docId for the new note
            const docId = Date.now().toString() + Math.random().toString(36).substring(2, 8);
            
            // Create the new note with placeholder content
            const newNote = new Note({
                docId,
                uid,
                title: `PDF Upload: ${originalFilename.replace(/\.pdf$/i, '')}`,
                content: placeholderContent,
                category: 'Generated',
                tags: ['pdf-upload', 'error'],
                timestamp: Date.now(),
                preview: "PDF processing unavailable. Please check server configuration."
            });
            
            const savedNote = await newNote.save();
            console.log(`Created placeholder note with docId: ${savedNote.docId}`);
            
            return res.status(201).json({
                message: 'Note created with placeholder content. PDF processing unavailable.',
                docId: savedNote.docId
            });
        }

        // Convert PDF buffer to base64
        const base64Pdf = pdfFile.buffer.toString('base64');

        // Prepare parts for Gemini API
        const parts = [
            { text: "Extract all text content from the following PDF document. Present the extracted text clearly. If the PDF contains images or diagrams, describe them briefly if possible, otherwise state that non-text content was present but could not be fully extracted." },
            {
                inlineData: {
                    mimeType: pdfFile.mimetype, // Use mimetype from multer
                    data: base64Pdf,
                },
            },
        ];

        console.log("Sending request to Gemini..."); // Add log

        // Call Gemini API
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
        });

        console.log("Received response from Gemini."); // Add log

        if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
             console.error("Gemini response was empty or invalid.");
             throw new Error('Gemini did not return valid content.');
        }

        // Extract text from the Gemini response
        // Accessing the text might vary slightly based on Gemini's response structure
        let extractedText = "";
        if (result.response.candidates[0].content?.parts?.[0]?.text) {
            extractedText = result.response.candidates[0].content.parts[0].text;
        } else {
             console.warn("Could not find text part in Gemini response, using empty string.");
             // Consider logging the full response here for debugging
             // console.log("Full Gemini Response:", JSON.stringify(result.response, null, 2));
             extractedText = "Could not extract text from the PDF.";
        }

        console.log("Extracted text (first 100 chars):", extractedText.substring(0, 100)); // Add log

        // Format the text into BlockNote content
        const noteContent = textToBlockNoteContent(extractedText);

        // Generate a unique docId for the new note
        const docId = Date.now().toString() + Math.random().toString(36).substring(2, 8); // More robust ID

        // Ensure the category exists before creating the note
        const generatedCategoryName = 'Generated';
        await Category.findOneAndUpdate(
            { uid, name: generatedCategoryName }, // Find by uid and name
            { $setOnInsert: { uid, name: generatedCategoryName } }, // Set fields only on insert
            { upsert: true, new: true, setDefaultsOnInsert: true } // Options: upsert, return new doc, set defaults
        );
        console.log(`Ensured category "${generatedCategoryName}" exists for user ${uid}`);

        // Create the new note in the database
        const newNote = new Note({
            docId,
            uid,
            title: `Note from PDF: ${originalFilename.replace(/\.pdf$/i, '')}`, // Use PDF filename in title
            content: noteContent,
            category: generatedCategoryName, // Assign the category name
            tags: ['pdf-import', 'gemini'], // Add relevant tags
            timestamp: Date.now(),
            preview: extractedText.substring(0, 150) + (extractedText.length > 150 ? '...' : '') // Generate preview
        });

        const savedNote = await newNote.save();
        console.log(`New note created from PDF with docId: ${savedNote.docId}`); // Add log

        res.status(201).json({
            message: 'Note created successfully from PDF',
            docId: savedNote.docId // Send back the docId
        });

    } catch (error) {
        console.error('Error processing PDF or creating note:', error);
        // Check for specific Gemini errors if needed
        if (error.message.includes("SAFETY")) {
            return res.status(400).json({ message: 'Content blocked due to safety settings.', error: error.message });
        }
        if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
            return res.status(500).json({ 
                message: 'PDF processing unavailable due to API configuration issue.', 
                error: 'Invalid API key' 
            });
        }
        res.status(500).json({ message: 'Failed to create note from PDF.', error: error.message });
    }
};


// --- Other existing functions (getNoteDetails, deleteNote, updateNote, etc.) ---
// ... (keep existing functions as they are, ensure exports are correct)
const getNoteDetails = async (req, res) =>
{
  try
  {
    const { id: noteId } = req.params;
    const note = await Note.find({ "docId": `${noteId}` });

    if (!note || note.length === 0) // Check if array is empty
    {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json(note); // Send the array
  } catch (error)
  {
    console.error('Error fetching note details:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const deleteNote = async (req, res) =>
{
  try
  {
    const noteId = req.params.id; // This is the MongoDB _id

    const deletedNote = await Note.findByIdAndDelete(noteId);

    if (!deletedNote)
    {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error)
  {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateNote = async (req, res) =>
{
    try
    {
    const noteId = req.params.id; // This is the docId from the route /note/:id
    console.log(`updateNote called for noteId: ${noteId} with body:`, JSON.stringify(req.body));
    
    const { title, content, category, tags, preview } = req.body; // Removed uid, it shouldn't change on update

    // Validate required fields if necessary (title, content might still be required)
    if (!title || !content) {
        console.error("Validation failed: Missing title or content");
        return res.status(400).json({ message: 'Title and content are required for update' });
    }


    const updatedNote = await Note.findOneAndUpdate(
        { "docId": noteId }, // Find by docId
        {
        // uid: uid, // Generally, don't update the owner on a note update
        title: title,
        content: content,
        category: category,
        tags: tags || [], // Ensure tags is an array
        preview: preview, // Make sure preview is saved
        timestamp: Date.now() // Update the timestamp
        },
        { new: true } // Option to return the updated document
    );

    if (!updatedNote)
    {
        console.error(`Note with docId ${noteId} not found for update.`);
        return res.status(404).json({ message: 'Note not found' });
    }

    console.log(`Note with docId ${noteId} updated successfully.`);
    res.status(200).json(updatedNote); // Use 200 OK for successful update
    } catch (error)
    {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message }); // Send error message
    }
};

const getNotesByOwner = async (req, res) =>
{
  try
  {
    const id = req.params.id;
    console.log(`getNotesByOwner called for user ID: ${id}`);
    
    const notes = await Note.find({ "uid": id.toString() });
    console.log(`Found ${notes.length} notes for user ${id}`);
    
    res.status(200).json(notes);
  } catch (error)
  {
    console.error('Error fetching notes by owner:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const addNoteFromPageTalk = async (req, res) =>
{
  try
  {
    const { content, user_id } = req.body;
    if (!user_id || !content)
    {
      return res.status(400).json({ message: 'Title, user_id, and owner are required' });
    }

    const docId = Math.floor(Math.random() * 10000000);
    const newNote = new Note({
      docId: docId.toString(),
      uid: user_id,
      title: 'New Note',
      content: content,
      category: 'frontend',
      tags: ['tag'],
      timestamp: Date.now()
    });

    const savedNote = await newNote.save();

    res.status(201).json({
      message: 'created a new note',
      url: `https://impetus-notes-sync.vercel.app/pagetalk/${docId}` // Update with your deployment URL if needed

    });
  } catch (error)
  {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error });
  }
};


const addNoteFromVoiceSync = async (req, res) =>
{
  try
  {
    const { content, user_id } = req.body;
    if (!user_id || !content)
    {
      return res.status(400).json({ message: 'Title, user_id, and owner are required' });
    }

    const docId = Math.floor(Math.random() * 10000000);
    const newNote = new Note({
      docId: docId.toString(),
      uid: user_id,
      title: 'New Note',
      content: content,
      category: 'frontend',
      tags: ['tag'],
      timestamp: Date.now()
    });

    const savedNote = await newNote.save();

    res.status(201).json({
      message: 'created a new note',
      url: `https://impetus-notes-sync.vercel.app/voicesync/${docId}` // Update with your deployment URL if needed

    });
  } catch (error)
  {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error });
  }
}
// --- End existing functions ---

const summarizeNote = async (req, res) => {
  try {
      const { noteId } = req.params;
      // Find the note to summarize
      const originalNote = await Note.findOne({ docId: noteId });
      if (!originalNote) {
          return res.status(404).json({ message: 'Original note not found' });
      }

      // Prepare the prompt. You can adjust the prompt as needed.
      const instruction = "Please summarize the following note content in a concise and clear manner:";

      // Prepare the Gemini API parts. Here we combine the instruction with the note content.
      const parts = [
          { text: instruction },
          { text: originalNote.content.map(block => {
              // Extract text from each block assuming each block has a content array with text objects.
              if (Array.isArray(block.content)) {
                  return block.content.map(item => item.text).join(" ");
              }
              return block.content;
          }).join("\n") }
      ];

      // Call Gemini API for summarization
      const result = await model.generateContent({
          contents: [{ role: "user", parts }],
          generationConfig,
          safetySettings,
      });

      if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
          throw new Error('Gemini did not return valid content for summary.');
      }

      // Extract the summary text from Gemini response.
      let summaryText = "";
      if (result.response.candidates[0].content?.parts?.[0]?.text) {
          summaryText = result.response.candidates[0].content.parts[0].text;
      } else {
          summaryText = "Summary generation failed.";
      }

      // Convert summary text into BlockNote content.
      const noteContent = textToBlockNoteContent(summaryText);

      // Ensure the "Generated Summary" category exists
      const summaryCategoryName = 'Generated Summary';
      await Category.findOneAndUpdate(
          { uid: originalNote.uid, name: summaryCategoryName },
          { $setOnInsert: { uid: originalNote.uid, name: summaryCategoryName } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Ensured category "${summaryCategoryName}" exists for user ${originalNote.uid}`);

      // Create new note document for summary
      const summaryNote = new Note({
          docId: Date.now().toString() + Math.random().toString(36).substring(2, 8), 
          uid: originalNote.uid,
          title: `Summary of ${originalNote.title}`,
          content: noteContent,
          category: summaryCategoryName,
          tags: ['llm', 'summary'],
          timestamp: Date.now(),
          preview: summaryText.substring(0, 150) + (summaryText.length > 150 ? '...' : '')
      });

      const savedSummaryNote = await summaryNote.save();

      res.status(201).json({
          message: 'Summary note created successfully',
          docId: savedSummaryNote.docId,
          note: savedSummaryNote
      });
  } catch (error) {
      console.error('Error generating summary note:', error);
      res.status(500).json({ message: 'Failed to create summary note.', error: error.message });
  }
};

// --- NEW: Generate Quiz Questions function ---
const generateQuizQuestions = async (req, res) => {
  try {
      const { noteId } = req.params;
      // Find the note for which we want to generate quiz questions
      const originalNote = await Note.findOne({ docId: noteId });
      if (!originalNote) {
          return res.status(404).json({ message: 'Original note not found' });
      }

      // Prepare the prompt for quiz generation.
      const instruction = "Based on the following note content, generate five challenging quiz questions. Provide only the questions.";
      
      // Combine the instruction with the note's content.
      const parts = [
          { text: instruction },
          { text: originalNote.content.map(block => {
              if (Array.isArray(block.content)) {
                  return block.content.map(item => item.text).join(" ");
              }
              return block.content;
          }).join("\n") }
      ];

      // Call Gemini API for quiz question generation.
      const result = await model.generateContent({
          contents: [{ role: "user", parts }],
          generationConfig,
          safetySettings,
      });

      if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
          throw new Error('Gemini did not return valid content for quiz questions.');
      }

      // Extract the quiz questions text from Gemini response.
      let quizText = "";
      if (result.response.candidates[0].content?.parts?.[0]?.text) {
          quizText = result.response.candidates[0].content.parts[0].text;
      } else {
          quizText = "Quiz generation failed.";
      }

      // Convert quiz questions text into BlockNote content.
      const noteContent = textToBlockNoteContent(quizText);

      // Ensure the "Generated Quiz" category exists
      const quizCategoryName = 'Generated Quiz';
      await Category.findOneAndUpdate(
          { uid: originalNote.uid, name: quizCategoryName },
          { $setOnInsert: { uid: originalNote.uid, name: quizCategoryName } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Ensured category "${quizCategoryName}" exists for user ${originalNote.uid}`);

      // Create new note document for quiz questions
      const quizNote = new Note({
          docId: Date.now().toString() + Math.random().toString(36).substring(2, 8), 
          uid: originalNote.uid,
          title: `Quiz Questions of ${originalNote.title}`,
          content: noteContent,
          category: quizCategoryName,
          tags: ['llm', 'quiz'],
          timestamp: Date.now(),
          preview: quizText.substring(0, 150) + (quizText.length > 150 ? '...' : '')
      });

      const savedQuizNote = await quizNote.save();

      res.status(201).json({
          message: 'Quiz Questions note created successfully',
          docId: savedQuizNote.docId,
          note: savedQuizNote
      });
  } catch (error) {
      console.error('Error generating quiz note:', error);
      res.status(500).json({ message: 'Failed to create quiz questions note.', error: error.message });
  }
};

// Controller function to update only the category of a note
const updateNoteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category: newCategoryName } = req.body; // Expecting { "category": "New Category Name" } or { "category": null }
        const uid = req.headers['x-user-id'];

        if (!uid) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Find the note
        const note = await Note.findOne({ _id: id, uid });

        if (!note) {
            return res.status(404).json({ message: 'Note not found or user unauthorized' });
        }

        // Validate the new category if it's not null
        if (newCategoryName) {
            const categoryExists = await Category.findOne({ uid, name: newCategoryName });
            if (!categoryExists) {
                // Optionally, create the category if it doesn't exist?
                // For now, let's return an error if the target category doesn't exist.
                return res.status(400).json({ message: `Category "${newCategoryName}" not found for this user.` });
            }
        }
        
        // Update the category (allow setting to null or an existing category name)
        note.category = newCategoryName ? newCategoryName.trim() : null;
        
        const updatedNote = await note.save();

        console.log(`Updated category for note ${id} to "${updatedNote.category}"`);
        res.status(200).json(updatedNote);

    } catch (error) {
        console.error("Error updating note category:", error);
        res.status(500).json({ message: 'Error updating note category', error: error.message });
    }
};

// Toggle archive status of a note
const toggleArchiveNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        
        if (!noteId) {
            return res.status(400).json({ message: 'Note ID is required' });
        }
        
        // Find the note and get its current archive status
        const note = await Note.findById(noteId);
        
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        
        // Toggle the isArchived status
        note.isArchived = !note.isArchived;
        
        // Save the updated note
        const updatedNote = await note.save();
        
        res.status(200).json({
            message: note.isArchived ? 'Note archived successfully' : 'Note unarchived successfully',
            note: updatedNote
        });
    } catch (error) {
        console.error('Error toggling archive status:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// Toggle star/important status of a note
const toggleStarNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        
        if (!noteId) {
            return res.status(400).json({ message: 'Note ID is required' });
        }
        
        // Find the note and get its current star status
        const note = await Note.findById(noteId);
        
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        
        // Toggle the isStarred status
        note.isStarred = !note.isStarred;
        
        // Save the updated note
        const updatedNote = await note.save();
        
        res.status(200).json({
            message: note.isStarred ? 'Note marked as important' : 'Note unmarked as important',
            note: updatedNote
        });
    } catch (error) {
        console.error('Error toggling star status:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// Get archived notes for a user
const getArchivedNotes = async (req, res) => {
    try {
        const { uid } = req.params;
        
        if (!uid) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        // Find all archived notes for the user
        const archivedNotes = await Note.find({ uid, isArchived: true });
        
        res.status(200).json(archivedNotes);
    } catch (error) {
        console.error('Error fetching archived notes:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// Get starred/important notes for a user
const getStarredNotes = async (req, res) => {
    try {
        const { uid } = req.params;
        
        if (!uid) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        // Find all starred notes for the user
        const starredNotes = await Note.find({ uid, isStarred: true });
        
        res.status(200).json(starredNotes);
    } catch (error) {
        console.error('Error fetching starred notes:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

module.exports = {
  createNote,
  createNoteFromPdf,
  getNoteDetails,
  deleteNote,
  updateNote,
  getNotesByOwner,
  addNoteFromPageTalk,
  addNoteFromVoiceSync,
  summarizeNote,
  generateQuizQuestions,
  updateNoteCategory,
  toggleArchiveNote,
  toggleStarNote,
  getArchivedNotes,
  getStarredNotes
};