import { UserAuth } from '@/utils/auth';
import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { MdKeyboardArrowDown, MdOutlineNotifications } from 'react-icons/md';
import Link from 'next/link';

const Navbar = ({ 
    searchQuery = "", 
    onSearchChange = () => {}
}) => {
    const { user, signOut } = UserAuth();
    const [display, setDisplay] = useState(false);

    console.log(user);

    return (
        <header className='p-3  flex justify-between bg-gray-50 dark:bg-gray-800'>
            <div className="relative flex items-center lg:w-1/4 h-10 rounded-full focus-within:ring-1 border border-gray-400 focus:ring-blue-500 bg-white  dark:bg-gray-900 overflow-hidden">
                <div className="grid place-items-center h-full w-12 text-gray-300 dark:bg-gray-900" >
                    <FaSearch />
                </div>

                <input
                    className="peer h-full w-full outline-none text-sm text-gray-700 pr-2 dark:bg-gray-900"
                    type="text"
                    id="search"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex gap-3 items-center relative ">
                <div className="w-10 h-10 rounded-full flex items-center justify-center active:bg-blue-200 px-2 py-1 cursor-pointer">

                    <MdOutlineNotifications className='text-2xl text-gray-800' />
                </div>
                <button onClick={() => setDisplay(!display)} className="rounded-full flex items-center justify-center  h-10 bg-blue-200 px-2 py-1 ">
                    <img src="/user.png" alt="user.png" className='h-8 w-8 rounded-full' />
                    <span className='w-20 text-ellipsis font-medium text-gray-800 mb-0'>{user ? user.displayName?.split(" ")[0] : "User"}</span>
                    <MdKeyboardArrowDown />
                </button>
                <div className={`${display ? "block" : "hidden"} dropdown w-36 px-3 py-3 absolute right-0 top-12 bg-white dark:bg-gray-700 shadow-lg rounded-md z-50`}>
                    <Link href="/profile">
                        <span className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md cursor-pointer mb-1">
                            Profile
                        </span>
                    </Link>
                    <button 
                        onClick={() => { 
                            signOut(); 
                            setDisplay(false);
                        }} 
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                    >
                        Logout
                    </button>
                </div>
            </div>

        </header>
    );
};

export default Navbar;