// frontend/utils/auth.js
import { useEffect, useState, createContext, useContext } from "react";
import { auth } from './firebase';
import {
    GithubAuthProvider,
    GoogleAuthProvider,
    createUserWithEmailAndPassword, // Import for registration
    signInWithEmailAndPassword, // Import for login
    signInWithPopup,
    onAuthStateChanged,
    updateProfile // Import to set display name after registration
} from "firebase/auth";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const authValue = useAuth();
    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const UserAuth = () => {
    return useContext(AuthContext);
};

// --- Helper function to get a default display name from email ---
const getDefaultDisplayName = (email) => {
    if (!email) return "User";
    return email.split('@')[0] || "User";
};
// --- End Helper ---


const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log("Auth state changed:", currentUser);
            setUser(currentUser);
            setLoadingAuth(false);
            if (currentUser) {
                localStorage.setItem('user', JSON.stringify(currentUser));
            } else {
                localStorage.removeItem('user');
            }
        });

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('user');
            }
        }
        // Delay setting loading to false slightly in case onAuthStateChanged fires quickly
        // This prevents a potential flicker if storage is checked before Firebase confirms auth state
        setTimeout(() => setLoadingAuth(false), 50);


        return () => unsubscribe();
    }, []);

    const googleSignIn = async () => {
        setLoadingAuth(true);
        const googleProvider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log("User Signed In (Google)!!!", result.user);
            toast.success("Login Successful");
            router.push('/dashboard');
        } catch (error) {
            console.error("Google Sign-In Error:", error.code, error.message);
            toast.error(`Google Sign-In Failed: ${error.code}`); // More specific error
            setLoadingAuth(false);
        }
        // setLoadingAuth(false); // Should be set inside useEffect by onAuthStateChanged
    };

    // --- NEW: Dedicated Email/Password Sign In Function ---
    const emailSignIn = async (email, password) => {
        if (!email || !password) {
            toast.error("Please enter both email and password.");
            return;
        }
        setLoadingAuth(true);
        const toastId = toast.loading("Signing in...");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("User Signed In (Email)!!!", userCredential.user);
            toast.success("Login Successful", { id: toastId });
            router.push('/dashboard'); // Redirect after successful sign-in

        } catch (error) {
            console.error("Email Sign-In Error:", error.code, error.message);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                 toast.error("Incorrect email or password.", { id: toastId });
            } else {
                 toast.error(`Login Failed: ${error.code}`, { id: toastId });
            }
            setLoadingAuth(false); // Stop loading on error ONLY if not redirected
        }
        // setLoadingAuth(false); // Handled by onAuthStateChanged or error catch
    };
    // --- End New Sign In Function ---

    // --- NEW: Dedicated Email/Password Registration Function ---
    const emailRegister = async (email, password, /* Optional: displayName */) => {
         if (!email || !password) {
            toast.error("Please enter both email and password for registration.");
            return;
        }
        setLoadingAuth(true);
         const toastId = toast.loading("Registering...");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User Registered (Email)!!!", userCredential.user);

             // --- Set a default display name if not provided ---
             const nameToSet = /* displayName || */ getDefaultDisplayName(email);
             await updateProfile(userCredential.user, { displayName: nameToSet });
             console.log("Display name set to:", nameToSet);
             // Update local state immediately for smoother transition (optional)
             setUser({ ...userCredential.user, displayName: nameToSet });
             // --- End display name setting ---

            toast.success("Registration Successful!", { id: toastId });
            router.push('/dashboard'); // Redirect after successful registration

        } catch (error) {
            console.error("Email Registration Error:", error.code, error.message);
            if (error.code === 'auth/email-already-in-use') {
                toast.error("This email address is already registered.", { id: toastId });
            } else if (error.code === 'auth/weak-password') {
                toast.error("Password is too weak. Please choose a stronger one.", { id: toastId });
            } else {
                toast.error(`Registration Failed: ${error.code}`, { id: toastId });
            }
            setLoadingAuth(false); // Stop loading on error ONLY if not redirected
        }
         // setLoadingAuth(false); // Handled by onAuthStateChanged or error catch
    };
    // --- End New Register Function ---


    const signOut = () => {
        // setLoadingAuth(true); // Setting loading here can cause flicker if signout is fast
        const toastId = toast.loading("Signing out...");
        return auth.signOut().then(() => {
            console.log("User Signed Out!!!");
            toast.success("Logout Successful", { id: toastId });
            // setUser(null); // Let onAuthStateChanged handle this
            // localStorage.removeItem('user'); // Let onAuthStateChanged handle this
            router.push('/'); // Redirect to login page after sign out
        }).catch(error => {
            console.error("Sign out error", error);
            toast.error(`Sign out failed: ${error.message}`, { id: toastId });
            // setLoadingAuth(false); // Ensure loading stops on error if needed, though redirect usually happens
        });
    };

    // Return new function
    return { user, loadingAuth, googleSignIn, emailSignIn, emailRegister, signOut };
};