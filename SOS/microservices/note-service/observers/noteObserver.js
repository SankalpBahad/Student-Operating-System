/**
 * Observer Pattern Implementation for Note Events
 */

// Subject (Observable) - Maintains a list of observers and notifies them of changes
class NoteEventSubject {
  constructor() {
    this.observers = [];
  }

  // Add an observer to the list
  subscribe(observer) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  // Remove an observer from the list
  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  // Notify all observers of an event
  notify(event, data) {
    this.observers.forEach(observer => {
      observer.update(event, data);
    });
  }
}

// Observer interface - All concrete observers must implement this
class NoteEventObserver {
  update(event, data) {
    throw new Error('Observer must implement update method');
  }
}

// Concrete Observer: Console Logger
class NoteConsoleLogger extends NoteEventObserver {
  update(event, data) {
    console.log(`[LOG] Note event: ${event}`);
    console.log(`[LOG] Details:`, JSON.stringify(data, null, 2));
  }
}

// Concrete Observer: Activity Tracker (could log to database)
class NoteActivityTracker extends NoteEventObserver {
  constructor(db) {
    super();
    this.db = db; // Could be a database connection
  }

  update(event, data) {
    const activity = {
      event,
      noteId: data.docId || data._id,
      userId: data.uid,
      timestamp: new Date(),
      details: {}
    };

    // Add specific details based on event type
    switch (event) {
      case 'create':
        activity.details.title = data.title;
        activity.details.category = data.category;
        break;
      case 'update':
        activity.details.updatedFields = data.updatedFields;
        break;
      case 'delete':
        activity.details.reason = data.reason || 'User initiated';
        break;
      case 'archive':
        activity.details.archived = data.archived;
        break;
      case 'star':
        activity.details.starred = data.starred;
        break;
    }

    // Log activity to console for now, but could save to database
    console.log(`[ACTIVITY] New activity recorded: ${event} for note ${activity.noteId}`);
    // this.db.collection('activities').insertOne(activity); // Example of DB storage
  }
}

// Concrete Observer: External Service Notifier (e.g., for webhooks)
class ExternalServiceNotifier extends NoteEventObserver {
  constructor(webhookUrl = null) {
    super();
    this.webhookUrl = webhookUrl;
  }

  async update(event, data) {
    if (!this.webhookUrl) {
      console.log(`[WEBHOOK] No webhook URL configured, skipping notification for ${event}`);
      return;
    }

    // In a real implementation, this would send HTTP requests to external services
    console.log(`[WEBHOOK] Would send ${event} notification to ${this.webhookUrl}`);
    
    // Example of what the actual implementation would do:
    /*
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          noteId: data.docId || data._id,
          timestamp: new Date(),
          // Add other relevant data
        }),
      });
    } catch (error) {
      console.error(`[WEBHOOK] Failed to send notification: ${error.message}`);
    }
    */
  }
}

// Singleton instance of the Subject
const noteEventBus = new NoteEventSubject();

// Initialize with default observers
const consoleLogger = new NoteConsoleLogger();
noteEventBus.subscribe(consoleLogger);

module.exports = {
  NoteEventSubject,
  NoteEventObserver,
  NoteConsoleLogger,
  NoteActivityTracker,
  ExternalServiceNotifier,
  noteEventBus // Export the singleton instance
}; 