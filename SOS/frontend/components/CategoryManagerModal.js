import React, { useState, useEffect } from 'react';
import { MdClose, MdEdit, MdDelete, MdSave, MdCancel } from 'react-icons/md';
import useNotesStore from '@/store/notesStore';
import { toast } from 'react-hot-toast';

const CategoryManagerModal = ({ isOpen, onClose }) => {
    const {
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        isLoadingCategories,
        fetchCategories // Fetch if categories aren't loaded yet
    } = useNotesStore();

    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null); // Store ID being deleted

    // Fetch categories if modal opens and they aren't loaded
    useEffect(() => {
        if (isOpen && categories.length === 0 && !isLoadingCategories) {
            fetchCategories();
        }
    }, [isOpen, categories.length, isLoadingCategories, fetchCategories]);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.error('Category name cannot be empty.');
            return;
        }
        setIsAdding(true);
        const success = await addCategory(newCategoryName.trim());
        if (success) {
            setNewCategoryName(''); // Clear input on success
        } // Error toast is handled in store/API util
        setIsAdding(false);
    };

    const startEditing = (category) => {
        setEditingCategoryId(category._id);
        setEditingCategoryName(category.name);
    };

    const cancelEditing = () => {
        setEditingCategoryId(null);
        setEditingCategoryName('');
    };

    const handleUpdateCategory = async () => {
        if (!editingCategoryName.trim() || !editingCategoryId) return;
        if (categories.find(cat => cat._id === editingCategoryId)?.name === editingCategoryName.trim()) {
            // No changes made
            cancelEditing();
            return;
        }

        setIsUpdating(true);
        const success = await updateCategory(editingCategoryId, editingCategoryName.trim());
        if (success) {
            cancelEditing(); // Exit editing mode on success
        } // Error toast handled in store
        setIsUpdating(false);
    };

    const handleDeleteCategory = async (id) => {
        // Optional: Add confirmation dialog here
        // if (!window.confirm('Are you sure you want to delete this category? This might affect existing notes.')) {
        //     return;
        // }
        setIsDeleting(id);
        await deleteCategory(id); // Error toast handled in store
        // Check if the deleted category was being edited
        if (editingCategoryId === id) {
             cancelEditing();
        }
        setIsDeleting(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg z-50 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 border-b dark:border-gray-600 pb-3">
                    <h2 className="text-xl font-semibold dark:text-white">Manage Categories</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                    >
                        <MdClose size={24} />
                    </button>
                </div>

                {/* Add New Category Form */}
                <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name..."
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isAdding}
                    />
                    <button
                        type="submit"
                        disabled={isAdding || !newCategoryName.trim()}
                        className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                    >
                        {isAdding ? (
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                        ) : (
                            'Add'
                        )}
                    </button>
                </form>

                {/* Category List */}
                <div className="flex-grow overflow-y-auto pr-2 -mr-2"> {/* Added padding/margin for scrollbar */}
                    {isLoadingCategories && <p className="text-center dark:text-gray-400">Loading...</p>}
                    {!isLoadingCategories && categories.length === 0 && (
                        <p className="text-center dark:text-gray-400">No categories yet. Add one above!</p>
                    )}
                    <ul className="space-y-2">
                        {categories.map((cat) => (
                            <li
                                key={cat._id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                            >
                                {editingCategoryId === cat._id ? (
                                    // Editing View
                                    <>
                                        <input
                                            type="text"
                                            value={editingCategoryName}
                                            onChange={(e) => setEditingCategoryName(e.target.value)}
                                            className="flex-grow px-2 py-1 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mr-2"
                                            autoFocus
                                            disabled={isUpdating}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateCategory(); if (e.key === 'Escape') cancelEditing(); }}
                                        />
                                        <div className="flex gap-2 flex-shrink-0">
                                             <button
                                                 onClick={handleUpdateCategory}
                                                 disabled={isUpdating || !editingCategoryName.trim() || categories.find(c => c._id === editingCategoryId)?.name === editingCategoryName.trim()}
                                                 className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                 title="Save Changes"
                                             >
                                                 {isUpdating ? (
                                                     <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                 ) : <MdSave size={20} />}
                                             </button>
                                             <button
                                                 onClick={cancelEditing}
                                                 disabled={isUpdating}
                                                 className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                                                 title="Cancel Edit"
                                             >
                                                 <MdCancel size={20} />
                                             </button>
                                         </div>
                                    </>
                                ) : (
                                    // Default View
                                    <>
                                        <span className="dark:text-gray-200 capitalize truncate mr-2" title={cat.name}>{cat.name}</span>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => startEditing(cat)}
                                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                title="Edit Category"
                                                disabled={isDeleting === cat._id}
                                            >
                                                <MdEdit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat._id)}
                                                disabled={isDeleting === cat._id}
                                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Delete Category"
                                            >
                                                 {isDeleting === cat._id ? (
                                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                 ) : <MdDelete size={18} />}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                 {/* Footer (Optional Close Button) */}
                 {/* <div className="mt-4 pt-3 border-t dark:border-gray-600 flex justify-end">
                     <button
                         onClick={onClose}
                         className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                     >
                         Close
                     </button>
                 </div> */}
            </div>
        </div>
    );
};

export default CategoryManagerModal; 