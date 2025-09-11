import React, { useEffect, useState, useCallback } from 'react';
import { Outfit } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import { UserAuth } from '@/utils/auth';
import Loading from '@/components/Loading';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';
import publicUrl from '@/utils/publicUrl';

const outfit = Outfit({ subsets: ['latin'] });

const ImportantPage = () => {
    const { user } = UserAuth();
    const [starredNotes, setStarredNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchStarredNotes = useCallback(async () => {
        if (!user || !user.uid) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${publicUrl()}/notes/starred-notes/${user.uid}`);
            setStarredNotes(response.data);
        } catch (err) {
            console.error("Error fetching important notes:", err);
            setError("Failed to load important notes. Please try again later.");
            setStarredNotes([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchStarredNotes();
    }, [fetchStarredNotes]);

    const handleDeleteNote = async (noteId) => {
        if (!noteId) {
            toast.error("Could not delete note: Invalid ID.");
            return;
        }

        const toastId = toast.loading("Deleting note...");

        try {
            await axios.delete(`${publicUrl()}/notes/note/${noteId}`);
            toast.success("Note deleted successfully!", { id: toastId });
            
            // Remove the deleted note from the state
            setStarredNotes(prev => prev.filter(note => note._id !== noteId));
        } catch (error) {
            console.error("Error deleting note:", error);
            toast.error(`Failed to delete note: ${error.response?.data?.message || error.message}`, { id: toastId });
        }
    };

    const handleArchiveToggle = async (noteId, newArchivedState) => {
         // Note: newArchivedState is the state *after* toggling
        const toastId = toast.loading(newArchivedState ? "Archiving note..." : "Unarchiving note...");
        try {
            await axios.patch(`${publicUrl()}/notes/note/${noteId}/toggle-archive`);

            // On success, show confirmation and update local state
            toast.success(newArchivedState ? 'Note archived successfully' : 'Note unarchived successfully', { id: toastId });

            // Update local state for immediate visual feedback
            setStarredNotes(prev => 
                prev.map(note => note._id === noteId ? { ...note, isArchived: newArchivedState } : note)
            );

        } catch (error) {
            console.error('Error toggling archive status:', error);
            toast.error('Failed to update archive status', { id: toastId });
        }
    };

    const handleStarToggle = async (noteId, newStarredState) => {
        // Note: newStarredState is the state *after* toggling. Should be false when unstarring from this page.
        const toastId = toast.loading("Removing from important..."); // Static message
        try {
            await axios.patch(`${publicUrl()}/notes/note/${noteId}/toggle-star`);

            // On success, show confirmation and refetch the list
            toast.success('Note removed from important', { id: toastId }); // Static message
            fetchStarredNotes(); // Refetch the list to remove the note

        } catch (error) {
            console.error('Error toggling star status:', error);
            toast.error('Failed to update important status', { id: toastId });
        }
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    const filteredNotes = searchQuery
        ? starredNotes.filter(note => 
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (note.preview && note.preview.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : starredNotes;

    if (!user) {
        return <Loading />;
    }

    return (
        <main className={`${outfit.className} w-full flex bg-gray-100 h-screen dark:bg-gray-800`}>
            <Toaster position="top-center" reverseOrder={false} />
            <Sidebar />
            <div className="w-full overflow-y-scroll">
                <Navbar searchQuery={searchQuery} onSearchChange={handleSearchChange} />
                
                <div className="py-6 px-8">
                    <h1 className="text-2xl font-bold dark:text-white mb-2">Important Notes</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {searchQuery 
                            ? `${filteredNotes.length} result${filteredNotes.length !== 1 ? 's' : ''} for "${searchQuery}"`
                            : `${starredNotes.length} important note${starredNotes.length !== 1 ? 's' : ''}`}
                    </p>

                    {isLoading && <div className="text-center py-10 dark:text-gray-300">Loading important notes...</div>}
                    {error && <div className="text-center py-10 text-red-500">{error}</div>}

                    {!isLoading && !error && starredNotes.length === 0 && (
                        <div className="text-center py-10 dark:text-gray-300">
                            <p>You don't have any important notes yet.</p>
                            <p className="mt-2 text-sm">Star your notes to mark them as important.</p>
                        </div>
                    )}

                    {!isLoading && !error && starredNotes.length > 0 && filteredNotes.length === 0 && searchQuery && (
                        <div className="text-center py-10 dark:text-gray-300">
                            <p>No notes found matching "{searchQuery}".</p>
                        </div>
                    )}

                    {!isLoading && !error && filteredNotes.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredNotes.map((note) => (
                                <Card
                                    key={note._id}
                                    _id={note._id}
                                    id={note.docId}
                                    category={note.category || "Uncategorized"}
                                    title={note.title || "Untitled Note"}
                                    preview={note.preview || "No preview available"}
                                    timestamp={note.timestamp}
                                    displayName={user.displayName || "Unknown User"}
                                    onDelete={handleDeleteNote}
                                    isArchived={note.isArchived || false}
                                    isStarred={true}
                                    onArchiveToggle={handleArchiveToggle}
                                    onStarToggle={handleStarToggle}
                                />
                            ))}
                        </div>
                    )}
                </div>
                
                <Footer />
            </div>
        </main>
    );
};

export default ImportantPage; 