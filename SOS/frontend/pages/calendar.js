// frontend/pages/calendar.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outfit } from 'next/font/google';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

// --- FullCalendar Imports ---
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // For month view
import timeGridPlugin from '@fullcalendar/timegrid'; // For week/day views
import interactionPlugin from '@fullcalendar/interaction'; // Needed for dateClick

// --- Your Component Imports ---
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import Footer from '@/components/Footer';
import { UserAuth } from '@/utils/auth';
import publicUrl from '@/utils/publicUrl';
import { MdClose, MdDownload, MdFileUpload } from 'react-icons/md';

const outfit = Outfit({ subsets: ['latin'] });

// Helper to format Date to HH:MM for input[type=time]
const formatTimeForInput = (date) => {
   if (!date) return '12:00'; // Default if no date provided
   const d = new Date(date);
   let hours = '' + d.getHours();
   let minutes = '' + d.getMinutes();
   if (hours.length < 2) hours = '0' + hours;
   if (minutes.length < 2) minutes = '0' + minutes;
   return [hours, minutes].join(':');
};

const CalendarPage = () => {
    const { user, loadingAuth } = UserAuth();
    const [events, setEvents] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [error, setError] = useState(null);
    const calendarRef = useRef(null); // Ref to access FullCalendar API
    const [searchQuery, setSearchQuery] = useState(""); // Add search state
    
    // Calendar import/export state
    const [showImportModal, setShowImportModal] = useState(false);
    const [icsFile, setIcsFile] = useState(null);
    const [importInProgress, setImportInProgress] = useState(false);
    const [exportInProgress, setExportInProgress] = useState(false);

    // --- Modal State ---
    const [showModal, setShowModal] = useState(false);
    const [modalDate, setModalDate] = useState(new Date()); // Date clicked/selected for the modal
    const [eventTitle, setEventTitle] = useState('');
    const [eventTime, setEventTime] = useState('12:00');
    const [eventDescription, setEventDescription] = useState('');
    // Optional: state for editing existing event ID
    // const [editingEventId, setEditingEventId] = useState(null);

    // --- Fetch Events ---
    const fetchEvents = useCallback(async () => {
        if (!user || !user.uid) return;
        setIsLoadingEvents(true);
        setError(null);
        try {
            const res = await axios.get(`${publicUrl()}/events/user/${user.uid}`);
            // --- Map events to FullCalendar format ---
            const formattedEvents = res.data.map(event => ({
                id: event._id, // Use MongoDB _id as FullCalendar event ID
                title: event.title,
                start: event.eventDateTime, // ISODate string from backend works directly
                // end: // Optional: calculate or store end time if needed
                description: event.description, // Store extra data if needed
                // color: // Optional: set event color based on category etc.
                allDay: false // Assuming events have specific times
            }));
            setEvents(formattedEvents);
        } catch (err) {
            console.error("Error fetching events:", err);
            setError("Failed to load events.");
            toast.error("Could not load events.");
        } finally {
            setIsLoadingEvents(false);
        }
    }, [user]);

    useEffect(() => {
        if (!loadingAuth && user) {
            fetchEvents();
        }
         if (!loadingAuth && !user) {
             setEvents([]);
         }
    }, [user, loadingAuth, fetchEvents]);

    // --- FullCalendar Event Handlers ---

    // Handle clicking on a date cell
    const handleDateClick = (clickInfo) => {
        // clickInfo.dateStr is the date string (e.g., "2024-05-16")
        // clickInfo.date is the Date object
        setShowModal(true);
        setModalDate(clickInfo.date);
        setEventTitle('');
        setEventDescription('');
        setEventTime(formatTimeForInput(clickInfo.date)); // Default time or time clicked if in timeGrid view
        // setEditingEventId(null); // Reset editing state
    };

    // Handle clicking on an existing event
    const handleEventClick = (clickInfo) => {
        // clickInfo.event is the FullCalendar event object
        // You can open the modal pre-filled for editing, or show a popup/details view
        if (!window.confirm(`Delete event '${clickInfo.event.title}'?`)) {
            return;
        }
        handleDeleteEvent(clickInfo.event.id); // Use the event's ID (MongoDB _id)

        // --- OR --- Open modal for editing:
        /*
        setShowModal(true);
        setModalDate(clickInfo.event.start); // Use event's start date
        setEventTitle(clickInfo.event.title);
        setEventDescription(clickInfo.event.extendedProps.description || ''); // Access custom props
        setEventTime(formatTimeForInput(clickInfo.event.start));
        setEditingEventId(clickInfo.event.id);
        */
    };


    // --- Handle Event Submission (Modal) ---
    const handleEventSubmit = async (e) => {
        e.preventDefault();
        if (!user || !user.uid || !eventTitle || !eventTime) {
            toast.error("Title and time are required.");
            return;
        }

        const [hours, minutes] = eventTime.split(':');
        const combinedDateTime = new Date(modalDate); // Start with the date clicked
        combinedDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const eventData = {
            uid: user.uid,
            title: eventTitle,
            description: eventDescription,
            eventDateTime: combinedDateTime.toISOString(),
        };

        // TODO: Add logic here if (editingEventId) then PUT else POST

        const toastId = toast.loading("Adding event...");
        try {
            console.log(`Creating event via: ${publicUrl()}/events with data:`, eventData);
            await axios.post(`${publicUrl()}/events`, eventData);
            toast.success("Event added!", { id: toastId });
            setShowModal(false);
            fetchEvents(); // Refetch events
        } catch (err) {
            console.error("Error adding event:", err);
             // If the error is still 404, log the URL again
             if (err.response?.status === 404) {
                console.error("404 Error POSTing to:", `${publicUrl()}/events`);
             }
            toast.error(`Failed to add event: ${err.response?.data?.message || err.message}`, { id: toastId });
        }
    };

     // --- Handle Event Deletion ---
    const handleDeleteEvent = async (eventId) => {
        // Confirmation is handled in handleEventClick for this example
        const toastId = toast.loading("Deleting event...");
        try {
            console.log(`Deleting event via: ${publicUrl()}/events/${eventId}`);
            await axios.delete(`${publicUrl()}/events/${eventId}`);
            toast.success("Event deleted!", { id: toastId });
            fetchEvents(); // Refresh list
        } catch (err) {
             console.error("Error deleting event:", err);
             toast.error(`Failed to delete event: ${err.response?.data?.message || err.message}`, { id: toastId });
        }
    }

    // --- Calendar Import/Export Functions ---
    
    // Show the import modal
    const handleShowImportModal = () => {
        setShowImportModal(true);
        setIcsFile(null);
    };
    
    // Import events from ICS file
    const handleImportIcsFile = async (e) => {
        e.preventDefault();
        
        if (!user || !user.uid) {
            toast.error('You must be logged in to import events');
            return;
        }
        
        if (!icsFile) {
            toast.error('Please select an ICS file');
            return;
        }
        
        setImportInProgress(true);
        const toastId = toast.loading('Importing events from ICS file...');
        
        try {
            // Create form data to send the file
            const formData = new FormData();
            formData.append('uid', user.uid);
            formData.append('icsFile', icsFile);
            
            const response = await axios.post(
                `${publicUrl()}/events/import-ics`, 
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            toast.success(`Imported ${response.data.events.length} events from ICS file!`, { id: toastId });
            fetchEvents(); // Refresh the calendar
            setShowImportModal(false);
        } catch (err) {
            console.error('Error importing from ICS file:', err);
            toast.error(`Failed to import: ${err.response?.data?.message || err.message}`, { id: toastId });
        } finally {
            setImportInProgress(false);
        }
    };
    
    // Export events to ICS file
    const handleExportEvents = async () => {
        if (!user || !user.uid) {
            toast.error('You must be logged in to export events');
            return;
        }
        
        setExportInProgress(true);
        const toastId = toast.loading('Exporting events to ICS file...');
        
        try {
            const response = await axios.post(`${publicUrl()}/events/export-ics`, {
                uid: user.uid
            });
            
            toast.success(`Exported ${response.data.events.length} events to ${response.data.filePath}`, { id: toastId });
        } catch (err) {
            console.error('Error exporting to ICS file:', err);
            toast.error(`Failed to export: ${err.response?.data?.message || err.message}`, { id: toastId });
        } finally {
            setExportInProgress(false);
        }
    };

    // Add search handler function
    const handleSearchChange = (query) => {
        setSearchQuery(query);
        
        // If calendar reference exists, apply search filter to events
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            
            if (query.trim() === '') {
                // If search is empty, show all events
                calendarApi.unselect(); // Clear any event selections
                // This refreshes the calendar view with all events
                calendarApi.refetchEvents();
            } else {
                // Otherwise, filter visible events by title or description
                const filteredEvents = events.filter(event => 
                    event.title.toLowerCase().includes(query.toLowerCase()) ||
                    (event.description && event.description.toLowerCase().includes(query.toLowerCase()))
                );
                
                // Clear current events and add filtered ones
                calendarApi.removeAllEvents();
                calendarApi.addEventSource(filteredEvents);
            }
        }
    };

    // --- Render Logic ---
    if (loadingAuth) return <Loading />;
    if (!user) return <div className="flex items-center justify-center h-screen">Please log in to view the calendar.</div>;

    return (
         <main className={`${outfit.className} conatiner flex bg-gray-100 dark:bg-gray-800 h-screen`}>
             <Toaster position="top-center" reverseOrder={false} />
            <Sidebar />
            <div className="w-full overflow-y-auto flex flex-col">
                <Navbar searchQuery={searchQuery} onSearchChange={handleSearchChange} />
                <div className="flex-grow p-4 md:p-6 lg:p-8 dark:bg-gray-900">
                    {/* Calendar Import/Export Buttons */}
                    <div className="mb-4 flex flex-wrap gap-2 justify-end">
                        <button 
                            onClick={handleShowImportModal}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            <MdFileUpload className="text-lg" />
                            <span className="hidden sm:inline">Import ICS File</span>
                        </button>
                        <button 
                            onClick={handleExportEvents}
                            disabled={exportInProgress}
                            className={`flex items-center gap-1 px-3 py-2 ${
                                exportInProgress ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                            } text-white rounded transition-colors`}
                        >
                            <MdDownload className="text-lg" />
                            <span className="hidden sm:inline">{exportInProgress ? 'Exporting...' : 'Export to ICS'}</span>
                        </button>
                    </div>
                
                    {/* Add loading indicator for events */}
                    {isLoadingEvents && <div className="text-center py-4 dark:text-gray-400">Loading events...</div>}
                    {error && <div className="text-center py-4 text-red-500">{error}</div>}

                    {/* FullCalendar Component */}
                    <div className='calendar-container bg-white dark:bg-gray-800 p-4 rounded-lg shadow'>
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth" // Start with month view
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay' // View switchers
                            }}
                            events={events} // Pass fetched & formatted events
                            editable={true} // Allows dragging/resizing (needs backend update logic)
                            selectable={true} // Allows clicking/selecting dates/times
                            selectMirror={true}
                            dayMaxEvents={true} // Shows "+X more" if too many events in a day cell
                            dateClick={handleDateClick} // Handle clicking on a date/time slot
                            eventClick={handleEventClick} // Handle clicking on an event
                            // eventDrop={handleEventDrop} // Optional: Handle dragging events
                            // eventResize={handleEventResize} // Optional: Handle resizing events
                            height="auto" // Adjust height dynamically or set fixed
                            // More options: https://fullcalendar.io/docs
                            // Theme system: https://fullcalendar.io/docs/theme-system (for Tailwind/custom)
                        />
                    </div>
                </div>
                <Footer />
            </div>

             {/* Add/Edit Event Modal */}
            {showModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                     <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md z-50">
                         <div className="flex justify-between items-center mb-4">
                             {/* Update title based on modalDate */}
                             <h2 className="text-xl font-semibold dark:text-white">Add Event for {modalDate.toLocaleDateString()}</h2>
                             <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                                 <MdClose size={24} />
                             </button>
                         </div>
                         <form onSubmit={handleEventSubmit}>
                             {/* Title */}
                             <div className="mb-4">
                                 <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title <span className='text-red-500'>*</span></label>
                                 <input type="text" id="eventTitle" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                             </div>
                             {/* Time */}
                              <div className="mb-4">
                                 <label htmlFor="eventTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time <span className='text-red-500'>*</span></label>
                                 <input type="time" id="eventTime" value={eventTime} onChange={(e) => setEventTime(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                              </div>
                              {/* Description */}
                             <div className="mb-6">
                                 <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                 <textarea id="eventDescription" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"></textarea>
                             </div>
                             {/* Buttons */}
                             <div className="flex justify-end">
                                 <button type="button" onClick={() => setShowModal(false)} className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Cancel</button>
                                 <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Save Event</button>
                             </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* ICS File Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md z-50">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold dark:text-white">Import ICS Calendar File</h2>
                            <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                                <MdClose size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleImportIcsFile}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select your ICS file:
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <MdFileUpload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label htmlFor="icsFileUpload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 dark:bg-gray-800 dark:text-blue-400 dark:hover:text-blue-300">
                                                <span>Upload a file</span>
                                                <input 
                                                    id="icsFileUpload" 
                                                    type="file" 
                                                    accept=".ics"
                                                    className="sr-only" 
                                                    onChange={(e) => setIcsFile(e.target.files[0])}
                                                />
                                            </label>
                                            <p className="pl-1 dark:text-gray-400">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            ICS calendar files only
                                        </p>
                                        {icsFile && (
                                            <p className="text-sm text-green-600 dark:text-green-400">
                                                {icsFile.name} selected
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Tip: You can export your calendar from Google Calendar as an ICS file.
                                </p>
                            </div>
                            
                            <div className="flex justify-end">
                                <button 
                                    type="button" 
                                    onClick={() => setShowImportModal(false)} 
                                    className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={importInProgress || !icsFile}
                                    className={`px-4 py-2 ${
                                        importInProgress || !icsFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                >
                                    {importInProgress ? 'Importing...' : 'Import'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default CalendarPage;