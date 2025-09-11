import React, { useState } from 'react';
import { Outfit } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { UserAuth } from '@/utils/auth';
import Loading from '@/components/Loading';
import { toast, Toaster } from 'react-hot-toast';
import { HiUserCircle } from 'react-icons/hi';
import Link from 'next/link';

const outfit = Outfit({ subsets: ['latin'] });

const ProfilePage = () => {
    const { user, loading } = UserAuth();
    const [searchQuery, setSearchQuery] = useState("");
    
    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return (
            <main className={`${outfit.className} w-full flex items-center justify-center bg-gray-100 h-screen dark:bg-gray-800`}>
                <div className="text-center">
                    <p className="dark:text-white mb-4">Please log in to view your profile.</p>
                    <Link href="/login">
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                            Go to Login
                        </span>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className={`${outfit.className} w-full flex bg-gray-100 h-screen dark:bg-gray-800`}>
            <Toaster position="top-center" reverseOrder={false} />
            <Sidebar />
            <div className="w-full overflow-y-scroll">
                <Navbar searchQuery={searchQuery} onSearchChange={handleSearchChange} />

                <div className="py-8 px-6 md:px-10 lg:px-16">
                    <h1 className="text-3xl font-bold dark:text-white mb-8">Your Profile</h1>

                    <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6 md:p-8 max-w-2xl mx-auto">
                        <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
                            {/* Profile Picture */}
                            <div className="flex-shrink-0">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt="Profile"
                                        className="h-24 w-24 rounded-full object-cover shadow-md"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <HiUserCircle className="h-24 w-24 text-gray-400 dark:text-gray-500" />
                                )}
                            </div>

                            {/* Profile Details */}
                            <div className="flex-grow text-center md:text-left">
                                <h2 className="text-2xl font-semibold dark:text-white mb-2">{user.displayName || 'No display name set'}</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">{user.email}</p>
                            </div>
                        </div>

                        {/* More Account Info */}
                        <div className="mt-8 border-t dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-medium dark:text-gray-200 mb-4">Account Information</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium text-gray-700 dark:text-gray-300">User ID:</span> {user.uid}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Email Verified:</span> {user.emailVerified ? 'Yes' : 'No'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Account Created:</span> {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                            </p>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </main>
    );
};

export default ProfilePage;
