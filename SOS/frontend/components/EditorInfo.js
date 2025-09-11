import React from 'react'

const EditorInfo = ({ tags, category }) => {
    return (
        <div className="hidden w-2/12 lg:block lg:w-2/12  pt-20 p-4">
            <h2 className="font-medium"><span className="text-gray-400">●</span> Category - <span className="capitalize">{category}</span></h2>
            <div className="flex flex-col gap-2 p-2">
                <p className="text-sm"></p>
            </div>

            <h2 className="font-medium"><span className="text-gray-400">#</span> Tags</h2>
            <div className="flex gap-2 py-2">
                {
                    tags.map((tag, index) => {
                        return (
                            <div key={index} className="bg-gray-200 px-2 py-1 rounded-full text-xs font-medium">{tag}</div>
                        )
                    })
                }
            </div>
            <div className="addTag flex items-center gap-2">
                <input type="text" className="px-3 py-1 rounded-full border-gray-200 border focus:outline-none focus:border-blue-400 text-xs my-2 " placeholder="Add Tag" />
                <button className="py-1 px-3 bg-blue-400 text-xs  text-white font-medium rounded-full">Add </button>
            </div>
        </div>
    )
}

export default EditorInfo