// backend/models/event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  uid: { // Firebase User ID
    type: String,
    required: true,
    index: true, // Index for faster lookups by user
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // Store the combined date and time as a single ISODate
  // This makes sorting and querying by time easier
  eventDateTime: {
    type: Date,
    required: true,
  },
  // Keep timestamp for creation/update tracking if needed
  timestamp: {
    type: Date,
    default: Date.now,
  },
  // Store ICS UID for syncing
  icsUid: {
    type: String,
    sparse: true, // Only index documents that have this field
  }
});

// Optional: Add an index on eventDateTime if you frequently query date ranges
eventSchema.index({ uid: 1, eventDateTime: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;