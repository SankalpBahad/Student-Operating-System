// pages/edit/[id].js
'use client';
import axios from "axios";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import publicUrl from "@/utils/publicUrl";
import Loading from "@/components/Loading";
import { UserAuth } from '@/utils/auth'; // Import the authentication context

// Dynamically import Editor, ensuring it's only loaded client-side
const Editor = dynamic(() => import("@/components/Editor"), {
    ssr: false,
    loading: () => <Loading message="Loading editor..." /> // Optional: Custom loading for editor itself
});

function Edit() {
    const [noteData, setNoteData] = useState(null);
    const [loadingData, setLoadingData] = useState(true); // Renamed for clarity
    const [error, setError] = useState(null);
    const router = useRouter();
    const { id } = router.query;
    const { user, loadingAuth } = UserAuth(); // Get user and auth loading state

    useEffect(() => {
        // Wait until authentication state is resolved
        if (loadingAuth) {
            console.log("Edit page: Auth loading, waiting...");
            return; // Do nothing until auth state is known
        }

        // If auth resolved and no user, redirect to login
        if (!user) {
            console.log("Edit page: No user found after auth check, redirecting to login.");
            router.push('/'); // Or your login route
            return; // Exit effect
        }

        // If user exists and ID is present, fetch data
        const fetchData = async () => {
            if (!id) {
                console.log("Edit page: No ID provided.");
                setError("No note ID specified.");
                setLoadingData(false);
                return; // No ID, nothing to fetch
            }

            console.log("Edit page: Fetching note with ID:", id);
            setLoadingData(true); // Start data loading
            setError(null); // Clear previous errors

            try {
                const url = `${publicUrl()}/notes/note/${id}`; // Use /notes prefix
                console.log("Fetching note from:", url);
                const res = await axios.get(url);
                console.log("Edit page: API Response:", res);

                if (Array.isArray(res.data) && res.data.length > 0) {
                    const data = res.data[0];
                     // --- Basic validation: Check if note belongs to the current user ---
                     if (data.uid !== user.uid) {
                        console.error("Access Denied: Note does not belong to the current user.");
                        setError("You do not have permission to view this note.");
                        setNoteData(null); // Clear note data
                     } else {
                        console.log("Edit page: Extracted Note Data:", data);
                        setNoteData(data);
                     }
                     // --- End validation ---
                } else if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
                    // Handle case where API might return a single object instead of array
                     const data = res.data;
                      if (data.uid !== user.uid) {
                         console.error("Access Denied: Note does not belong to the current user.");
                         setError("You do not have permission to view this note.");
                         setNoteData(null);
                      } else {
                         console.log("Edit page: Extracted Note Data (single object):", data);
                         setNoteData(data);
                      }
                }
                else {
                    setError("Note not found or invalid data format.");
                    console.log("Edit page: Note not found or invalid data format.");
                    setNoteData(null); // Clear note data if not found
                }
            } catch (err) {
                setError("Error fetching note: " + (err.response?.data?.message || err.message));
                console.error("Edit page: Error fetching note:", err);
                setNoteData(null); // Clear note data on error
            } finally {
                setLoadingData(false); // Stop data loading
            }
        };

        // Only fetch if ID exists (user check is done above)
        if (id) {
          fetchData();
        } else {
             // Handle case where ID might become null/undefined after initial load
             setLoadingData(false);
        }

    // Dependencies: auth loading state, user object, router (for redirect), and id
    }, [loadingAuth, user, id, router]);

    // --- Render Logic ---

    // Show loading while auth is checked or data is fetched
    if (loadingAuth || loadingData) {
        return <Loading />; // Use a single loading indicator
    }

    // If auth resolved, no user (should have been redirected, but as fallback)
    if (!user) {
         return <div>Please log in to view this page.</div>; // Or redirect again
    }

    // If error occurred during fetch
    if (error) {
        return <div className="p-4 text-red-500">Error: {error} <button onClick={() => router.push('/dashboard')} className="ml-2 underline">Go to Dashboard</button></div>;
    }

    // If data loaded but note wasn't found or permission denied
    if (!noteData) {
      return <div className="p-4">Note not found or access denied. <button onClick={() => router.push('/dashboard')} className="ml-2 underline">Go to Dashboard</button></div>;
    }

    // If user, no error, and noteData exists, render the Editor
    return <Editor data={noteData} id={id} />;
}

export default Edit;