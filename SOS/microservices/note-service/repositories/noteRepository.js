/**
 * Repository Pattern: Encapsulates the data access logic 
 * for working with notes in the database
 */
const Note = require('../models/note');

class NoteRepository {
  /**
   * Find a note by its document ID
   */
  async findByDocId(docId) {
    try {
      return await Note.findOne({ docId });
    } catch (error) {
      console.error('Error in findByDocId:', error);
      throw error;
    }
  }

  /**
   * Find a note by its MongoDB ID
   */
  async findById(id) {
    try {
      return await Note.findById(id);
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  /**
   * Find all notes belonging to a specific user
   */
  async findByOwner(uid, filter = {}) {
    try {
      const query = { uid, ...filter };
      return await Note.find(query).sort({ timestamp: -1 });
    } catch (error) {
      console.error('Error in findByOwner:', error);
      throw error;
    }
  }

  /**
   * Find all archived notes belonging to a user
   */
  async findArchivedByOwner(uid) {
    try {
      return await Note.find({ uid, archived: true }).sort({ timestamp: -1 });
    } catch (error) {
      console.error('Error in findArchivedByOwner:', error);
      throw error;
    }
  }

  /**
   * Find all starred/important notes belonging to a user
   */
  async findStarredByOwner(uid) {
    try {
      return await Note.find({ uid, starred: true }).sort({ timestamp: -1 });
    } catch (error) {
      console.error('Error in findStarredByOwner:', error);
      throw error;
    }
  }

  /**
   * Create a new note
   */
  async create(noteData) {
    try {
      const note = new Note(noteData);
      return await note.save();
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Update an existing note
   */
  async update(docId, updateData) {
    try {
      return await Note.findOneAndUpdate(
        { docId },
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * Delete a note
   */
  async delete(docId) {
    try {
      return await Note.findOneAndDelete({ docId });
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * Toggle archive status
   */
  async toggleArchive(docId, archived) {
    try {
      return await Note.findOneAndUpdate(
        { docId },
        { archived },
        { new: true }
      );
    } catch (error) {
      console.error('Error in toggleArchive:', error);
      throw error;
    }
  }

  /**
   * Toggle star/important status
   */
  async toggleStar(docId, starred) {
    try {
      return await Note.findOneAndUpdate(
        { docId },
        { starred },
        { new: true }
      );
    } catch (error) {
      console.error('Error in toggleStar:', error);
      throw error;
    }
  }

  /**
   * Update note category
   */
  async updateCategory(docId, category) {
    try {
      return await Note.findOneAndUpdate(
        { docId },
        { category },
        { new: true }
      );
    } catch (error) {
      console.error('Error in updateCategory:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new NoteRepository(); 