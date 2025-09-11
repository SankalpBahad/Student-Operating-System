"use client";
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { UserAuth } from '@/utils/auth';
import React, { useEffect, useState, useCallback } from 'react';
import Card from '@/components/Card';
import { MdAdd, MdClose } from 'react-icons/md';
import Loading from '@/components/Loading';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import axios from 'axios';
import publicUrl from '@/utils/publicUrl';
import { initialData } from '@/constants/data';
import { useRouter } from 'next/router';
import useNotesStore from '@/store/notesStore';
import { Outfit } from 'next/font/google';
import { toast, Toaster } from 'react-hot-toast';

const outfit = Outfit({ subsets: ['latin'] });

const Dashboard = () => {
    const router = useRouter();
    const { user } = UserAuth();
    const {
        notes,
        categories,
        fetchCategories,
        isLoadingCategories,
        setNotes,
        setCategory,
        category
    } = useNotesStore();
    const [notesData, setNotesData] = useState([]);
    const [isLoadingNotes, setIsLoadingNotes] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isCreatingNote, setIsCreatingNote] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchNotesData = useCallback(async () => {
        if (user && user.uid) {
            setIsLoadingNotes(true);
            setFetchError(null);
            const notesUrl = `${publicUrl()}/notes/get-notes/${user.uid}`;
            console.log("Fetching notes from:", notesUrl);
            try {
                const res = await axios.get(notesUrl);
                const nonArchivedNotes = res.data.filter(note => !note.isArchived);
                setNotes(nonArchivedNotes);
                setNotesData(nonArchivedNotes);
            } catch (error) {
                console.error("Dashboard: Error fetching notes:", error);
                setFetchError("Failed to load notes. Please try again later.");
                setNotes([]);
                setNotesData([]);
            } finally {
                setIsLoadingNotes(false);
            }
        } else {
            setNotes([]);
            setNotesData([]);
            setIsLoadingNotes(false);
        }
    }, [user, setNotes]);

    const fetchUserCategories = useCallback(async () => {
        if (user) {
            console.log("Fetching categories for user...");
            await fetchCategories();
        }
    }, [user, fetchCategories]);

    useEffect(() => {
        if (user) {
            fetchNotesData();
            fetchUserCategories();
        }
    }, [user, fetchNotesData, fetchUserCategories]);

    const handleNewNoteClick = () => {
        if (!user) return;
        setSelectedCategory(null);
        setShowCategoryModal(true);
    };

    const confirmCreateNote = async () => {
        if (!user) return;
        if (!selectedCategory) {
            toast.error("Please select a category.");
            return;
        }

        setIsCreatingNote(true);
        const toastId = toast.loading("Creating note...");

        const docId = Math.floor(Math.random() * 10000000);

        try {
            console.log("Creating note via:", `${publicUrl()}/notes/note`);
            const res = await axios.post(`${publicUrl()}/notes/note`, {
                docId: docId.toString(),
                title: "New Note",
                content: initialData,
                uid: user.uid,
                category: selectedCategory.name,
                tags: [],
                preview: "Type here..",
            });
            console.log("New note created:", res);
            toast.success("Note created!", { id: toastId });
            setShowCategoryModal(false);
            await fetchNotesData();
            router.push(`/edit/${docId}`);

        } catch (error) {
            console.error("Error creating new note:", error);
            toast.error(`Error creating note: ${error.response?.data?.message || error.message}`, { id: toastId });
        } finally {
            setIsCreatingNote(false);
        }
    };

    const handleDeleteNote = async (noteIdToDelete) => {
        if (!noteIdToDelete) {
            console.error("Delete aborted: No note ID provided.");
            toast.error("Could not delete note: Invalid ID.");
            return;
        }

        const toastId = toast.loading("Deleting note...");

        try {
            console.log("Deleting note via:", `${publicUrl()}/notes/note/${noteIdToDelete}`);
            await axios.delete(`${publicUrl()}/notes/note/${noteIdToDelete}`);
            toast.success("Note deleted successfully!", { id: toastId });

            const updatedNotes = notes.filter(note => note._id !== noteIdToDelete);
            setNotes(updatedNotes);
            setNotesData(updatedNotes);

        } catch (error) {
            console.error("Error deleting note:", error);
            toast.error(`Failed to delete note: ${error.response?.data?.message || error.message}`, { id: toastId });
        }
    };

    const handleArchiveToggle = async (noteId, newArchivedState) => {
        const toastId = toast.loading(newArchivedState ? "Archiving note..." : "Unarchiving note...");
        try {
            await axios.patch(`${publicUrl()}/notes/note/${noteId}/toggle-archive`);
            toast.success(newArchivedState ? 'Note archived successfully' : 'Note unarchived successfully', { id: toastId });

            if (newArchivedState) {
                setNotes(prev => prev.filter(note => note._id !== noteId));
                setNotesData(prev => prev.filter(note => note._id !== noteId));
            } else {
                fetchNotesData();
            }

        } catch (error) {
            console.error('Error toggling archive status:', error);
            toast.error('Failed to update archive status', { id: toastId });
        }
    };

    const handleStarToggle = async (noteId, newStarredState) => {
        const toastId = toast.loading(newStarredState ? "Marking as important..." : "Removing from important...");
        try {
            await axios.patch(`${publicUrl()}/notes/note/${noteId}/toggle-star`);
            toast.success(newStarredState ? 'Marked as important' : 'Removed from important', { id: toastId });

            const updatedNotes = notes.map(note => 
                note._id === noteId ? { ...note, isStarred: newStarredState } : note
            );
            setNotes(updatedNotes);
            if (!category) {
                setNotesData(updatedNotes); 
            } else {
                setNotesData(updatedNotes.filter(note => note.category === category.name));
            }

        } catch (error) {
            console.error('Error toggling star status:', error);
            toast.error('Failed to update important status', { id: toastId });
        }
    };

    useEffect(() => {
        if (!category) {
            setNotesData(notes);
        } else {
            const filteredNotes = notes.filter((note) => note.category === category.name);
            setNotesData(filteredNotes);
        }
    }, [category, notes]);

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    const filteredNotes = searchQuery
        ? notesData.filter(note => 
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (note.preview && note.preview.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : notesData;

    if (!user && typeof window !== 'undefined') {
        return <Loading />;
    }

    if (!user) {
        return <Loading />;
    }

    return (
        <main className={`${outfit.className} w-full flex bg-gray-100 h-screen dark:bg-gray-800`}>
            <Toaster position="top-center" reverseOrder={false} />
            <Sidebar />
            <div className="w-full overflow-y-scroll ">
                <Navbar searchQuery={searchQuery} onSearchChange={handleSearchChange} />
                <Header count={filteredNotes.length} />

                {(isLoadingNotes || isLoadingCategories) && <div className="text-center p-10 dark:text-gray-300">Loading...</div>}
                {fetchError && <div className="text-center p-10 text-red-500">{fetchError}</div>}

                {!(isLoadingNotes || isLoadingCategories) && !fetchError && (
                    <div className="notes px-6 py-4 min-h-[70vh] items-start mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <button onClick={handleNewNoteClick} className="h-full">
                            <div className="h-full cursor-pointer note-card flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg shadow-md flex-col p-4 hover:shadow-lg transition-shadow duration-200">
                                <div className="border-2 flex items-center justify-center border-dashed border-blue-400 rounded-full h-28 w-28 mb-4">
                                    <MdAdd className='text-3xl text-blue-400' />
                                </div>
                                <p className='text-blue-400 font-medium'>Add Note</p>
                            </div>
                        </button>
                        {
                            filteredNotes.map((note) => {
                                const noteContent = note.content && note.content[1] && note.content[1].content && note.content[1].content.text
                                    ? note.content[1].content.text
                                    : (note.preview || '');
                                return <Card
                                    key={note._id}
                                    _id={note._id}
                                    id={note.docId}
                                    category={note.category || "Uncategorized"}
                                    title={note.title || "Untitled Note"}
                                    preview={note.preview || noteContent || "No preview available"}
                                    timestamp={note.timestamp}
                                    displayName={user.displayName || "Unknown User"}
                                    onDelete={handleDeleteNote}
                                    isArchived={note.isArchived || false}
                                    isStarred={note.isStarred || false}
                                    onArchiveToggle={handleArchiveToggle}
                                    onStarToggle={handleStarToggle}
                                />;
                            })
                        }
                        {!isLoadingNotes && searchQuery && filteredNotes.length === 0 && (
                            <div className="col-span-full text-center p-10 text-gray-500 dark:text-gray-400">
                                No notes found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}
                <Footer />
            </div>

            {showCategoryModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md z-50">
                         <div className="flex justify-between items-center mb-6">
                             <h2 className="text-xl font-semibold dark:text-white">Select a Category</h2>
                             <button
                                 onClick={() => setShowCategoryModal(false)}
                                 className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white disabled:opacity-50"
                                 disabled={isCreatingNote}
                             >
                                 <MdClose size={24} />
                             </button>
                         </div>

                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                             {isLoadingCategories ? (
                                <p className="dark:text-gray-400 col-span-full text-center">Loading categories...</p>
                             ) : categories.length === 0 ? (
                                <p className="dark:text-gray-400 col-span-full text-center">No categories found. Create one!</p>
                             ) : (
                                 categories.map((cat) => (
                                     <button
                                         key={cat._id}
                                         onClick={() => setSelectedCategory(cat)}
                                         disabled={isCreatingNote}
                                         className={`flex items-center justify-center gap-2 p-3 rounded-md border-2 transition-all text-sm font-medium capitalize
                                             ${
                                                 selectedCategory?._id === cat._id
                                                     ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 ring-2 ring-blue-300 dark:ring-blue-600'
                                                     : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:text-gray-200'
                                             }
                                             disabled:opacity-60 disabled:cursor-not-allowed
                                         `}
                                     >
                                         {cat.name}
                                     </button>
                                 ))
                             )}
                         </div>

                         <div className="flex justify-end gap-3">
                             <button
                                 type="button"
                                 onClick={() => setShowCategoryModal(false)}
                                 disabled={isCreatingNote}
                                 className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                             >
                                 Cancel
                             </button>
                             <button
                                 type="button"
                                 onClick={confirmCreateNote}
                                 disabled={!selectedCategory || isCreatingNote}
                                 className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 {isCreatingNote ? 'Creating...' : 'Create Note'}
                             </button>
                         </div>
                     </div>
                 </div>
            )}
        </main>
    );
};

export default Dashboard;