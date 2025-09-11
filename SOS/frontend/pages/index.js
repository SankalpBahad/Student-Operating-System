// frontend/pages/index.js
'use client';
import { useState, useEffect } from 'react';
import { Outfit } from 'next/font/google';
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaMoon, FaSun } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { UserAuth } from '@/utils/auth'; // Correct import
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import Head from 'next/head';
import Loading from '@/components/Loading';

const outfit = Outfit({ subsets: ['latin'] });

export default function Home() {
    const { theme, setTheme } = useTheme();
    // Destructure the new emailRegister function
    const { user, loadingAuth, googleSignIn, emailSignIn, emailRegister } = UserAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!loadingAuth && user) {
            console.log("User already logged in on index page, redirecting to dashboard.");
            router.push('/dashboard');
        }
    }, [user, loadingAuth, router]);

    if (loadingAuth) {
        return <Loading />;
    }

    if (user) {
        // Should be redirected by the useEffect above, but as a fallback
        return <Loading />;
    }

    // --- Handlers with basic validation ---
    const handleLogin = () => {
        if (!email || !password) {
            toast.error("Please enter email and password.");
            return;
        }
        emailSignIn(email, password);
    };

    const handleRegister = () => {
        if (!email || !password) {
            toast.error("Please enter email and password.");
            return;
        }
        emailRegister(email, password); // Call the new register function
    };
    // --- End Handlers ---

    return (
        <main className={`w-screen flex ${outfit.className}`}>
            <Head>
                <title>Login / Register - SOS</title> {/* Updated Title */}
            </Head>

            <Toaster position="top-center" reverseOrder={false} />

            {/* Section 1: Vector and Text */}
            <div className="hidden lg:flex px-16 py-10 flex-col lg:w-1/2 bg-blue-50 dark:bg-slate-900 h-screen">
                <div className="header flex">
                    <img src="/applogo.jpeg" alt="Logo" className='h-16 w-16 rounded-md shadow-md' />
                </div>
                <img src="/login-vector.svg" alt="LoginVector" className='mx-16' />
            </div>

            {/* Section 2: Login and Register */}
            <div className="w-full relative lg:w-1/2 py-8 px-6 lg:py-24 lg:px-0 h-screen flex items-center justify-center dark:bg-slate-950">
                <div className="inner-box w-full lg:w-6/12 h-full">
                    <h3 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>Welcome to SOS</h3> {/* Updated Heading */}
                    <p className='text-xs mt-2 font-medium dark:text-gray-400'>Login or Register to continue.</p>
                    <div className="form mt-8">
                        <div className="mb-4"> {/* Reduced margin */}
                            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-300">Email</label>
                            <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" id="email" className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-2 focus:border-blue-500 block w-full p-2.5 outline-none" placeholder="john.doe@company.com" required />
                        </div>
                        <div className="mb-4"> {/* Reduced margin */}
                            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-300">Password</label>
                            <input onChange={(e) => setPassword(e.target.value)} value={password} type="password" id="password" className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-2 focus:border-blue-500 block w-full p-2.5 outline-none" placeholder="******" required />
                        </div>
                        {/* Removed Remember Me / Forgot Password for simplicity, add back if needed */}
                        {/* <div className="mb-6 flex justify-between mt-6"> ... </div> */}

                        {/* --- Action Buttons --- */}
                        <div className="mt-6 grid grid-cols-2 gap-3 mb-4">
                            <button onClick={handleLogin} type="button" className="px-3 py-2 w-full text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-offset-1 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                Login
                            </button>
                            <button onClick={handleRegister} type="button" className="px-3 py-2 w-full text-sm font-medium text-center text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 focus:ring-2 focus:ring-offset-1 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800">
                                Register
                            </button>
                        </div>
                         {/* --- End Action Buttons --- */}

                        <hr className="my-4 dark:border-gray-700"/> {/* Adjusted margin */}

                        {/* --- Social Logins --- */}
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-3">Or continue with</p>
                        <button onClick={googleSignIn} type="button" className="text-black bg-gray-200 dark:bg-gray-300 hover:bg-gray-300 dark:hover:bg-gray-400 items-center justify-center gap-2 w-full focus:ring-2 focus:ring-offset-1 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex mb-2">
                            <FcGoogle className='text-xl' />
                            Sign in with Google
                        </button>
                         {/* --- End Social Logins --- */}

                        {isMounted && (
                            <motion.div whileTap={{ scale: 0.9 }} className="mt-6 text-center absolute bottom-8 right-6 cursor-pointer border border-gray-500 rounded-full p-2" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                                {theme === 'dark' ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.4 }}><FaSun className='text-2xl dark:text-yellow-400' /></motion.div> : <motion.div animate={{ rotate: 0 }} transition={{ duration: 0.3 }}> <FaMoon className='text-2xl text-gray-700' /></motion.div>}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </main >
    );
}