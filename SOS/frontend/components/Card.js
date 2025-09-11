import React from 'react';
import Link from 'next/link';
import { MdDeleteForever, MdArchive, MdUnarchive, MdStar, MdStarOutline } from 'react-icons/md';
import axios from 'axios';
import publicUrl from '@/utils/publicUrl';
import { toast } from 'react-hot-toast';

const Card = ({ id, _id, category, title, preview, timestamp, displayName, onDelete, isArchived, isStarred, onArchiveToggle, onStarToggle }) => {
    const date = timestamp ? new Date(timestamp).toLocaleDateString() : new Date().toLocaleDateString();

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete the note "${title}"?`)) {
            onDelete(_id);
        }
    };

    const handleArchiveClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (onArchiveToggle) {
            onArchiveToggle(_id, !isArchived);
        } else {
            console.warn("Card: onArchiveToggle prop not provided!");
            toast.error("Action not configured properly.");
        }
    };

    const handleStarClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (onStarToggle) {
            onStarToggle(_id, !isStarred);
        } else {
            console.warn("Card: onStarToggle prop not provided!");
            toast.error("Action not configured properly.");
        }
    };

    return (
        <div className="relative group">
            <Link href={{
                pathname: `/edit/[id]`,
                query: { id: id },
            }}>
                <div className="note-card bg-white dark:bg-gray-900 flex-1 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200 h-full flex flex-col justify-between">
                    <div>
                        <div className="category flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-400 rounded-full capitalize"></span>
                            <span>{category || "Frontend"}</span>
                            {isStarred && (
                                <span className="ml-auto text-yellow-500">
                                    <MdStar />
                                </span>
                            )}
                        </div>
                        <div className="note-title mt-2">
                            <h2 className='text-lg font-semibold'>{title || "Untitled Note"}</h2>
                        </div>
                        <div className="note-body mt-2">
                            <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-3'>{preview || "No preview available"}</p>
                        </div>
                    </div>
                    <div>
                        <hr className='my-3 dark:border-gray-700' />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img src="/user.png" alt="user.png" className='h-8 w-8 rounded-full' />
                                <span className='text-gray-600 dark:text-gray-400 text-sm'>{displayName || "Unknown User"}</span>
                            </div>
                            <div className="flex items-center gap-2 py-2">
                                <span className='text-gray-600 dark:text-gray-400 text-sm'>{date}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
            
            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* Star Button */}
                <button
                    onClick={handleStarClick}
                    className={`p-1.5 rounded-full transition-colors duration-200 focus:opacity-100
                        ${isStarred 
                            ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-800/70' 
                            : 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/70'
                        }`}
                    aria-label={isStarred ? "Remove from important" : "Mark as important"}
                >
                    {isStarred ? <MdStar size={18} /> : <MdStarOutline size={18} />}
                </button>
                
                {/* Archive Button */}
                <button
                    onClick={handleArchiveClick}
                    className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-500 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/70"
                    aria-label={isArchived ? "Unarchive note" : "Archive note"}
                >
                    {isArchived ? <MdUnarchive size={18} /> : <MdArchive size={18} />}
                </button>
                
                {/* Delete Button */}
                <button
                    onClick={handleDeleteClick}
                    className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-full text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/70"
                    aria-label="Delete note"
                >
                    <MdDeleteForever size={18} />
                </button>
            </div>
        </div>
    );
};

export default Card;