// backend/controller/eventController.js
const getEventModel = require('../models/event');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const ICAL = require('ical.js');

// --- Create a new event ---
const createEvent = async (req, res) => {
    console.log("--- ENTERED createEvent --- TOP OF FUNCTION ---"); // ADDED LOG
  try {
    console.log(`createEvent called with body:`, JSON.stringify(req.body));
    
    const { uid, title, description, eventDateTime } = req.body;

    // Basic validation
    if (!uid || !title || !eventDateTime) {
      console.error("Validation failed: Missing uid, title, or eventDateTime"); // Add server log
      return res.status(400).json({ message: 'User ID (uid), title, and eventDateTime are required.' });
    }

    // Validate date format (optional, but good practice)
    const parsedDate = new Date(eventDateTime);
    if (isNaN(parsedDate)) {
        console.error("Validation failed: Invalid date format for", eventDateTime); // Add server log
         return res.status(400).json({ message: 'Invalid eventDateTime format. Please use ISO 8601 format.' });
    }

    console.log(`Received event creation request for UID: ${uid}, Title: ${title}`); // Add server log

    // Get the Event model from the async function
    const Event = await getEventModel();

    const newEvent = new Event({
      uid,
      title,
      description: description || '',
      eventDateTime: parsedDate,
      timestamp: Date.now(),
    });

    const savedEvent = await newEvent.save();
    console.log(`Event saved successfully with ID: ${savedEvent._id}`); // Add server log
    res.status(201).json(savedEvent);

  } catch (error) {
    console.error('Error creating event:', error); // Ensure errors are logged server-side
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Get all events for a specific user ---
const getEventsByUser = async (req, res) => {
    try {
        const { uid } = req.params;
        
        if (!uid) {
            console.error('Missing UID in request params');
            return res.status(400).json({ message: 'User ID (uid) is required in the URL path.' });
        }
        
        console.log(`Fetching events for UID: ${uid}`); // Add server log
        
        // Get the Event model from the async function
        const Event = await getEventModel();
        const events = await Event.find({ uid: uid }).sort({ eventDateTime: 1 });
        
        console.log(`Found ${events.length} events for user ${uid}`);
        
        // Log the first event for debugging if available
        if (events.length > 0) {
            console.log(`Sample event: ${JSON.stringify(events[0])}`);
        }
        
        return res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events by user:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// --- Get a single event by its ID (Optional) ---
const getEventById = async (req, res) => {
    // ... (previous code for getEventById)
     try {
        const { eventId } = req.params;
        console.log(`Fetching event by ID: ${eventId}`); // Add server log
        
        // Get the Event model from the async function
        const Event = await getEventModel();
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error('Error fetching event by ID:', error);
         if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid event ID format.' });
        }
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// --- Delete an event (Optional) ---
const deleteEvent = async (req, res) => {
    // ... (previous code for deleteEvent)
    try {
        const { eventId } = req.params;
        console.log(`Deleting event by ID: ${eventId}`); // Add server log
        
        // Get the Event model from the async function
        const Event = await getEventModel();
        const deletedEvent = await Event.findByIdAndDelete(eventId);
        
        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        console.log(`Event deleted successfully: ${eventId}`); // Add server log
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid event ID format.' });
        }
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// --- Import events from ICS file ---
const importFromIcsFile = async (req, res) => {
  try {
    const { uid } = req.body;
    
    if (!uid) {
      return res.status(400).json({ message: 'User ID (uid) is required.' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No ICS file uploaded.' });
    }
    
    // Read ICS file from the uploaded file
    const icsData = fs.readFileSync(req.file.path, 'utf8');
    
    // Delete the temporary file
    fs.unlinkSync(req.file.path);
    
    // Parse ICS file with ical.js
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    const importedEvents = [];
    
    // Get the Event model from the async function
    const Event = await getEventModel();
    
    // Process each event in the ICS file
    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      
      // Skip events without a summary/title
      if (!event.summary) continue;
      
      // Create new event in our system
      const newEvent = new Event({
        uid,
        title: event.summary,
        description: event.description || '',
        eventDateTime: event.startDate.toJSDate(),
        timestamp: Date.now(),
        icsUid: event.uid // Store original ICS UID for reference
      });
      
      const savedEvent = await newEvent.save();
      importedEvents.push(savedEvent);
    }
    
    res.status(200).json({ 
      message: `Successfully imported ${importedEvents.length} events from ICS file`,
      events: importedEvents 
    });
    
  } catch (error) {
    console.error('Error importing from ICS file:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Export events to ICS file ---
const exportToIcsFile = async (req, res) => {
  try {
    const { uid } = req.body;
    
    if (!uid) {
      return res.status(400).json({ message: 'User ID (uid) is required.' });
    }
    
    // Get the Event model from the async function
    const Event = await getEventModel();
    
    // Get events to export
    const events = await Event.find({ uid });
    
    if (events.length === 0) {
      return res.status(404).json({ message: 'No events found for this user' });
    }
    
    // Create new calendar component
    const calendar = new ICAL.Component(['vcalendar', [], []]);
    
    // Set calendar properties
    calendar.updatePropertyWithValue('prodid', '-//SOS Calendar//EN');
    calendar.updatePropertyWithValue('version', '2.0');
    
    // Add each event to the calendar
    for (const event of events) {
      const vevent = new ICAL.Component(['vevent', [], []]);
      
      // Create a unique ID if needed
      const eventUid = event.icsUid || `sos-${event._id}@sos-calendar`;
      
      vevent.updatePropertyWithValue('uid', eventUid);
      vevent.updatePropertyWithValue('summary', event.title);
      
      if (event.description) {
        vevent.updatePropertyWithValue('description', event.description);
      }
      
      // Create ICAL time objects
      const startDate = new ICAL.Time();
      startDate.fromJSDate(new Date(event.eventDateTime));
      
      const endDate = new ICAL.Time();
      endDate.fromJSDate(new Date(new Date(event.eventDateTime).getTime() + 60 * 60 * 1000)); // 1 hour duration
      
      vevent.updatePropertyWithValue('dtstart', startDate);
      vevent.updatePropertyWithValue('dtend', endDate);
      
      // Add creation timestamp
      const dtstamp = new ICAL.Time();
      dtstamp.fromJSDate(new Date(event.timestamp));
      vevent.updatePropertyWithValue('dtstamp', dtstamp);
      
      // Add the event to the calendar
      calendar.addSubcomponent(vevent);
    }
    
    // Generate ICS string
    const icsData = calendar.toString();
    
    // Set output path - in a real app, this might go to a downloads folder or be sent as an attachment
    const outputDir = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads');
    fs.mkdirSync(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `sos-calendar-${uid}-${Date.now()}.ics`);
    
    // Write to file
    fs.writeFileSync(outputPath, icsData);
    
    res.status(200).json({ 
      message: `Successfully exported ${events.length} events to ICS file`,
      events: events,
      filePath: outputPath
    });
    
  } catch (error) {
    console.error('Error exporting to ICS file:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- CRITICAL: Ensure all functions are exported ---
module.exports = {
  createEvent,
  getEventsByUser,
  getEventById,
  deleteEvent,
  importFromIcsFile,
  exportToIcsFile
};