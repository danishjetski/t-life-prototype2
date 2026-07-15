// Simple localStorage-based event database
// All events persist locally - fast, reliable, no external dependencies

const DB_KEY = "taylor_events_db_v2";
const DB_VERSION = "2.0";

// Notify all listeners when database is updated
const notifyUpdate = () => {
  try {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('taylor-events-updated', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    }
  } catch (e) {
    console.warn("Failed to dispatch event:", e);
  }
};

// Initialize database with empty events array
const initializeDB = () => {
  try {
    const existing = localStorage.getItem(DB_KEY);
    if (!existing) {
      localStorage.setItem(DB_KEY, JSON.stringify({ version: DB_VERSION, events: [] }));
    }
  } catch (e) {
    console.warn("localStorage unavailable, using in-memory fallback");
  }
};

// Get all events from database
const getAllEvents = () => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      initializeDB();
      return [];
    }
    const parsed = JSON.parse(data);
    return parsed.events || [];
  } catch (e) {
    console.error("Failed to read events from DB:", e);
    return [];
  }
};

// Add a new event to database
const addEvent = (event) => {
  try {
    const data = localStorage.getItem(DB_KEY);
    const parsed = data ? JSON.parse(data) : { version: DB_VERSION, events: [] };
    
    const newEvent = {
      ...event,
      id: event.id || `EVT-${Date.now()}`,
      createdAt: event.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    parsed.events = [newEvent, ...parsed.events]; // Newest first
    localStorage.setItem(DB_KEY, JSON.stringify(parsed));
    notifyUpdate(); // Notify all listeners
    return newEvent;
  } catch (e) {
    console.error("Failed to add event to DB:", e);
    return event;
  }
};

// Update an existing event
const updateEvent = (id, updates) => {
  try {
    const data = localStorage.getItem(DB_KEY);
    const parsed = data ? JSON.parse(data) : { version: DB_VERSION, events: [] };
    
    parsed.events = parsed.events.map((e) =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    
    localStorage.setItem(DB_KEY, JSON.stringify(parsed));
    notifyUpdate(); // Notify all listeners
    return parsed.events.find((e) => e.id === id);
  } catch (e) {
    console.error("Failed to update event in DB:", e);
    return null;
  }
};

// Delete an event
const deleteEvent = (id) => {
  try {
    const data = localStorage.getItem(DB_KEY);
    const parsed = data ? JSON.parse(data) : { version: DB_VERSION, events: [] };
    
    parsed.events = parsed.events.filter((e) => e.id !== id);
    localStorage.setItem(DB_KEY, JSON.stringify(parsed));
    notifyUpdate(); // Notify all listeners
    return true;
  } catch (e) {
    console.error("Failed to delete event from DB:", e);
    return false;
  }
};

// Get a single event by ID
const getEventById = (id) => {
  try {
    const events = getAllEvents();
    return events.find((e) => e.id === id) || null;
  } catch (e) {
    console.error("Failed to get event by ID:", e);
    return null;
  }
};

// Clear all events (for testing/reset)
const clearAllEvents = () => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify({ version: DB_VERSION, events: [] }));
    notifyUpdate(); // Notify all listeners
    return true;
  } catch (e) {
    console.error("Failed to clear DB:", e);
    return false;
  }
};

// Seed database with initial events (only if empty)
const seedEventsIfEmpty = (initialEvents) => {
  try {
    const existing = getAllEvents();
    if (existing.length === 0) {
      const data = localStorage.getItem(DB_KEY);
      const parsed = data ? JSON.parse(data) : { version: DB_VERSION, events: [] };
      parsed.events = initialEvents.map((e) => ({
        ...e,
        createdAt: e.createdAt || new Date().toISOString(),
        updatedAt: e.updatedAt || new Date().toISOString(),
      }));
      localStorage.setItem(DB_KEY, JSON.stringify(parsed));
      notifyUpdate(); // Notify all listeners
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to seed events:", e);
    return false;
  }
};

// Search events by title or tag
const searchEvents = (query) => {
  try {
    const events = getAllEvents();
    const q = query.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.tag.toLowerCase().includes(q) ||
        e.host.toLowerCase().includes(q)
    );
  } catch (e) {
    console.error("Failed to search events:", e);
    return [];
  }
};

// Filter events by category (focus/balance)
const getEventsByCategory = (category) => {
  try {
    const events = getAllEvents();
    return events.filter((e) => e.category === category);
  } catch (e) {
    console.error("Failed to filter events:", e);
    return [];
  }
};

// Get event statistics
const getEventStats = () => {
  try {
    const allEvents = getAllEvents();
    return {
      totalEvents: allEvents.length,
      focusEvents: allEvents.filter((e) => e.category === "focus").length,
      balanceEvents: allEvents.filter((e) => e.category === "balance").length,
      totalRSVPs: allEvents.reduce((sum, e) => sum + (e.registered || 0), 0),
      avgAttendance: allEvents.length
        ? Math.round(allEvents.reduce((sum, e) => sum + (e.registered || 0), 0) / allEvents.length)
        : 0,
    };
  } catch (e) {
    console.error("Failed to get stats:", e);
    return { totalEvents: 0, focusEvents: 0, balanceEvents: 0, totalRSVPs: 0, avgAttendance: 0 };
  }
};

export {
  initializeDB,
  getAllEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  clearAllEvents,
  seedEventsIfEmpty,
  searchEvents,
  getEventsByCategory,
  getEventStats,
};
