import React from 'react'
import useNotesStore from '@/store/notesStore'

const Header = ({ count }) => {
    const { categories, category, setCategory } = useNotesStore();
    return (
        <div className="flex mt-3 px-4">
            <div className="title-sc flex-shrink-0 mr-12">
                <span className='text-xs uppercase text-gray-600 dark:text-gray-100'>Overview</span>
                <h2 className='text-2xl font-semibold'>Notes <span className="text-gray-600 dark:text-gray-100 text-lg">({count})</span></h2>
            </div>
            <div className="flex items-end gap-2 overflow-x-auto hide-scrollbar pb-1">
                <button
                    onClick={() => setCategory(null)}
                    className={`cursor-pointer flex items-center px-3 py-1 justify-start flex-shrink-0 rounded-lg font-medium text-sm transition-colors
                        ${
                            category === null
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                >
                    All
                </button>
                {categories.map((cat) => (
                    <button
                        onClick={() => setCategory(cat)}
                        key={cat._id}
                        className={`cursor-pointer flex items-center px-3 py-1 justify-start flex-shrink-0 rounded-lg font-medium text-sm capitalize transition-colors
                            ${
                                category?._id === cat._id
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default Header