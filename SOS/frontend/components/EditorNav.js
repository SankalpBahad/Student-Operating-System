import React from 'react'
import { MdSave } from 'react-icons/md'
import Link from 'next/link'

const EditorNav = ({ handleSave }) => {
    return (
        <div className="fixed w-full px-16 shadow bg-white z-50">

            <div className="flex z-50 mx-auto  max-w-screen-xl  justify-between items-center  header fle">
                <Link href='/dashboard'>
                    <div className="logo    px-4 py-3 flex items-center">
                        <img src='/applogo-tp.png' className='w-10 h-10' />
                        <div className="text-slate-900 font-bold text-2xl -ml-2">oteSync</div>
                    </div>
                </Link>
                <div onClick={handleSave} className=" h-10 rounded-full flex items-center justify-center gap-3 border-2 border-blue-500 active:bg-blue-200 px-2 py-1 cursor-pointer">
                    <MdSave className='text-xl text-gray-700' />
                    <span>Save</span>
                </div>
            </div>
        </div>
    )
}

export default EditorNav