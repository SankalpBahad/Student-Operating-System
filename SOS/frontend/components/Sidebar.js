// frontend/components/Sidebar.js
import React, { useRef, useState } from 'react'; // Import useRef, useState
import { navList } from '@/constants/data';
import Link from 'next/link';
// Import new icons
import { HiMenuAlt3, HiMoon, HiSun, HiOutlineCalendar, HiOutlineHome, HiOutlineDocumentAdd, HiOutlineUpload, HiOutlineCog, HiOutlineArchive, HiOutlineStar } from 'react-icons/hi';
import { HiMiniMoon } from 'react-icons/hi2';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/router';
import axios from 'axios'; // Import axios
import publicUrl from '@/utils/publicUrl'; // Import publicUrl
import { UserAuth } from '@/utils/auth'; // Import UserAuth
import { toast } from 'react-hot-toast'; // Import toast
import CategoryManagerModal from './CategoryManagerModal'; // Import the modal

const Sidebar = () => {
    const [closed, setClosed] = React.useState(false);
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const { user } = UserAuth(); // Get user
    const fileInputRef = useRef(null); // Ref for file input
    const [isUploading, setIsUploading] = useState(false); // Loading state
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); // State for modal

    const changeTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const isActive = (path) => router.pathname === path;

    // --- Function to handle PDF upload trigger ---
    const handleUploadClick = () => {
        if (!user) {
            toast.error("Please log in to upload a PDF.");
            return;
        }
        fileInputRef.current?.click(); // Trigger file input click
    };

    // --- Function to handle file selection and upload ---
    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.type !== 'application/pdf') {
            toast.error('Please select a PDF file.');
            return;
        }
        // Optional: Add size validation
        if (file.size > 10 * 1024 * 1024) { // 10MB limit example
            toast.error('File size exceeds 10MB limit.');
            return;
        }

        if (!user?.uid) {
            toast.error("User authentication error.");
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading("Uploading PDF and creating note...");

        const formData = new FormData();
        formData.append('pdfFile', file); // Key must match backend ('pdfFile')
        formData.append('uid', user.uid); // Send user ID

        try {
            const response = await axios.post(`${publicUrl()}/notes/create-from-pdf`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Note created successfully from PDF!', { id: toastId });
            setIsUploading(false);

            // Navigate to the new note
            if (response.data && response.data.docId) {
                router.push(`/edit/${response.data.docId}`);
            } else {
                console.error("No docId received from backend.");
                // Optionally redirect to dashboard or show another message
                router.push('/dashboard');
            }

        } catch (error) {
            console.error('Error uploading PDF:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to create note from PDF.';
            toast.error(`Error: ${errorMsg}`, { id: toastId });
            setIsUploading(false);
        } finally {
             // Reset file input value so the same file can be selected again if needed
             if (fileInputRef.current) {
                 fileInputRef.current.value = '';
             }
        }
    };
    // --- End upload functions ---


    return (
        <>
            <div className='w-[260px] bg-white dark:bg-gray-900 h-screen rounded-md flex flex-col justify-between border-r dark:border-gray-700'>
                <div className="top">
                    {/* ... existing logo code ... */}
                     <Link href="/dashboard" className={` text-slate-900 dark:text-gray-200 font-mulish ml-6 font-semibold text-2xl`}>
                        SOS
                    </Link>
                    {/* ... existing menu toggle code ... */}

                    <div className="navlist flex flex-col py-4 px-3">
                        {/* Dashboard */}
                        <Link href="/dashboard" className={`nav-item flex items-center justify-start gap-3 w-full px-4 py-2 my-1 rounded-lg cursor-pointer font-medium dark:hover:bg-slate-600/30 hover:bg-blue-50 dark:text-gray-200 ${isActive('/dashboard') ? "bg-blue-400 text-white" : "dark:hover:bg-slate-700"}`}>
                            <HiOutlineHome className='text-xl' />
                            <span>Dashboard</span>
                        </Link>
                        
                        {/* Important Notes */}
                        <Link href="/important" className={`nav-item flex items-center justify-start gap-3 w-full px-4 py-2 my-1 rounded-lg cursor-pointer font-medium dark:hover:bg-slate-600/30 hover:bg-blue-50 dark:text-gray-200 ${isActive('/important') ? "bg-blue-400 text-white" : "dark:hover:bg-slate-700"}`}>
                            <HiOutlineStar className='text-xl' />
                            <span>Important</span>
                        </Link>
                        
                        {/* Archive */}
                        <Link href="/archive" className={`nav-item flex items-center justify-start gap-3 w-full px-4 py-2 my-1 rounded-lg cursor-pointer font-medium dark:hover:bg-slate-600/30 hover:bg-blue-50 dark:text-gray-200 ${isActive('/archive') ? "bg-blue-400 text-white" : "dark:hover:bg-slate-700"}`}>
                            <HiOutlineArchive className='text-xl' />
                            <span>Archive</span>
                        </Link>
                        
                        {/* Calendar */}
                         <Link href="/calendar" className={`nav-item flex items-center justify-start gap-3 w-full px-4 py-2 my-1 rounded-lg cursor-pointer font-medium dark:hover:bg-slate-600/30 hover:bg-blue-50 dark:text-gray-200 ${isActive('/calendar') ? "bg-blue-400 text-white" : "dark:hover:bg-slate-700"}`}>
                            <HiOutlineCalendar className='text-xl' />
                            <span>Calendar</span>
                        </Link>

                        {/* --- NEW: Upload PDF Button --- */}
                        <input
                            type="file"
                            accept=".pdf"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }} // Hide the default input
                            disabled={isUploading}
                        />
                         <button
                             onClick={handleUploadClick}
                             disabled={isUploading || !user} // Disable if not logged in
                             className={`nav-item flex items-center justify-start gap-3 w-full px-4 py-2 my-1 rounded-lg cursor-pointer font-medium dark:hover:bg-slate-600/30 hover:bg-blue-50 dark:text-gray-200 ${isUploading || !user ? 'opacity-50 cursor-not-allowed' : ''}`}
                         >
                             <HiOutlineUpload className='text-xl' />
                             <span>{isUploading ? 'Uploading...' : 'Note from PDF'}</span>
                         </button>
                         {/* --- End Upload PDF Button --- */}

                        {/* --- MANAGE CATEGORIES BUTTON --- */}
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            disabled={!user} // Disable if not logged in
                            className={`nav-item flex items-center justify-start gap-3 w-full px-4 py-2 my-1 rounded-lg cursor-pointer font-medium dark:hover:bg-slate-600/30 hover:bg-blue-50 dark:text-gray-200 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <HiOutlineCog className='text-xl' />
                            <span>Manage Categories</span>
                        </button>
                        {/* --- END MANAGE CATEGORIES BUTTON --- */}

                        {/* ... other nav items ... */}
                    </div>
                </div>

                {/* ... existing theme toggle ... */}
                <div className="py-4 px-3 border-t dark:border-gray-700"> {/* Optional: Add border */}
                    <div className="bottom-3 flex gap-4 justify-between">
                        <button onClick={changeTheme} className="flex items-center gap-2 flex-1 hover:bg-slate-200 dark:hover:bg-slate-700 w-full p-2 px-4 rounded-md cursor-pointer dark:text-gray-200">
                            {theme === 'light' ? <HiMiniMoon className={`text-xl`} /> : <HiSun className={`text-xl`} />}
                            <div className={` font-mulish text-md`}>
                                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                            </div>
                        </button>
                    </div>
                </div>
            </div >

            {/* Render Category Manager Modal */}
            <CategoryManagerModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
            />
        </>
    );
};

export default Sidebar;