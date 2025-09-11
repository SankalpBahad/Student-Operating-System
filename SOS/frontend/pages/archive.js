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

const ArchivePage = () => {
    const { user } = UserAuth();
    const [archivedNotes, setArchivedNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchArchivedNotes = useCallback(async () => {
        if (!user || !user.uid) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${publicUrl()}/notes/archived-notes/${user.uid}`);
            setArchivedNotes(response.data);
        } catch (err) {
            console.error("Error fetching archived notes:", err);
            setError("Failed to load archived notes. Please try again later.");
            setArchivedNotes([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchArchivedNotes();
    }, [fetchArchivedNotes]);

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
            setArchivedNotes(prev => prev.filter(note => note._id !== noteId));
        } catch (error) {
            console.error("Error deleting note:", error);
            toast.error(`Failed to delete note: ${error.response?.data?.message || error.message}`, { id: toastId });
        }
    };

    const handleArchiveToggle = async (noteId, newArchivedState) => {
        // Note: newArchivedState is the state *after* toggling. Should be false when unarchiving from this page.
        const toastId = toast.loading("Unarchiving note..."); // Static message as only unarchive happens here
        try {
            await axios.patch(`${publicUrl()}/notes/note/${noteId}/toggle-archive`);
            
            // On success, show confirmation and refetch the list
            toast.success('Note unarchived successfully', { id: toastId }); // Static message
            fetchArchivedNotes(); // Refetch the list to remove the note

        } catch (error) {
            console.error('Error toggling archive status:', error);
            toast.error('Failed to update archive status', { id: toastId });
        }
    };

    const handleStarToggle = async (noteId, newStarredState) => {
        // Note: newStarredState is the state *after* toggling
        const toastId = toast.loading(newStarredState ? "Marking as important..." : "Removing from important...");
        try {
            await axios.patch(`${publicUrl()}/notes/note/${noteId}/toggle-star`);
            
            toast.success(newStarredState ? 'Marked as important' : 'Removed from important', { id: toastId });
            
            // Update local state for immediate visual feedback
            setArchivedNotes(prev => 
                prev.map(note => note._id === noteId ? { ...note, isStarred: newStarredState } : note)
            );

        } catch (error) {
            console.error('Error toggling star status:', error);
            toast.error('Failed to update important status', { id: toastId });
        }
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    const filteredNotes = searchQuery
        ? archivedNotes.filter(note => 
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (note.preview && note.preview.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : archivedNotes;

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
                    <h1 className="text-2xl font-bold dark:text-white mb-2">Archive</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {searchQuery 
                            ? `${filteredNotes.length} result${filteredNotes.length !== 1 ? 's' : ''} for "${searchQuery}"`
                            : `${archivedNotes.length} archived note${archivedNotes.length !== 1 ? 's' : ''}`}
                    </p>

                    {isLoading && <div className="text-center py-10 dark:text-gray-300">Loading archived notes...</div>}
                    {error && <div className="text-center py-10 text-red-500">{error}</div>}

                    {!isLoading && !error && archivedNotes.length === 0 && (
                        <div className="text-center py-10 dark:text-gray-300">
                            <p>You don't have any archived notes yet.</p>
                            <p className="mt-2 text-sm">Archived notes will appear here.</p>
                        </div>
                    )}

                    {!isLoading && !error && archivedNotes.length > 0 && filteredNotes.length === 0 && searchQuery && (
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
                                    isArchived={true}
                                    isStarred={note.isStarred || false}
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

export default ArchivePage; 