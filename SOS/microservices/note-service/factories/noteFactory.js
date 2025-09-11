const Note = require('../models/note');

/**
 * Factory pattern implementation for creating different types of notes
 */
class NoteFactory {
  /**
   * Creates a standard text note
   */
  static createTextNote(docId, uid, title, content, category, tags = [], preview = "No preview available.") {
    return new Note({
      docId,
      uid,
      title,
      content,
      category,
      tags,
      timestamp: Date.now(),
      preview,
      type: 'text'
    });
  }

  /**
   * Creates a note from PDF content
   */
  static createPdfNote(docId, uid, title, content, originalFilename, category = 'Generated', tags = ['pdf-import'], preview = "No preview available.") {
    return new Note({
      docId,
      uid,
      title: `Note from PDF: ${originalFilename.replace(/\.pdf$/i, '')}`,
      content,
      category,
      tags: [...tags, 'pdf-import'],
      timestamp: Date.now(),
      preview,
      type: 'pdf',
      metadata: {
        originalFilename
      }
    });
  }

  /**
   * Creates a note from voice input
   */
  static createVoiceNote(docId, uid, title, content, category, tags = [], preview = "No preview available.") {
    return new Note({
      docId,
      uid,
      title,
      content,
      category,
      tags: [...tags, 'voice-input'],
      timestamp: Date.now(),
      preview,
      type: 'voice',
    });
  }
  
  /**
   * Creates a summarized note from an existing note
   */
  static createSummarizedNote(docId, uid, originalNoteId, title, content, category = 'Generated', tags = [], preview = "No preview available.") {
    return new Note({
      docId,
      uid,
      title: `Summary: ${title}`,
      content,
      category,
      tags: [...tags, 'summary'],
      timestamp: Date.now(),
      preview,
      type: 'summary',
      metadata: {
        originalNoteId
      }
    });
  }
}

module.exports = NoteFactory; 