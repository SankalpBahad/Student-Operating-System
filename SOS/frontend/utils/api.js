import axios from 'axios';
import publicUrl from './publicUrl';
import { toast } from 'react-hot-toast';

// Helper to get user ID from local storage or auth context
// Adjust this based on how you store/retrieve the user ID
const getUserId = () => {
    // Example: Assuming you store user info in localStorage
    const userStr = localStorage.getItem('user'); // Adjust key if needed
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const uid = user?.uid;
            
            // Add debug logging
            console.log(`Retrieved user ID from localStorage: ${uid}`);
            
            return uid;
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
            return null;
        }
    }
    
    // Try to get from session storage as fallback
    const sessionUserStr = sessionStorage.getItem('user');
    if (sessionUserStr) {
        try {
            const user = JSON.parse(sessionUserStr);
            const uid = user?.uid;
            console.log(`Retrieved user ID from sessionStorage: ${uid}`);
            return uid;
        } catch (e) {
            console.error("Error parsing user from sessionStorage", e);
        }
    }
    
    console.error("Could not find user ID in storage");
    return null;
};

const getAuthHeaders = () => {
    const uid = getUserId();
    if (!uid) {
        console.error("User ID not found for API request");
        toast.error("Authentication error. Please log in again.");
        // Optional: Redirect to login
        // window.location.href = '/';
        return null; // Indicate error or missing auth
    }
    
    // Log headers for debugging
    console.log(`Creating API request with headers: x-user-id: ${uid}`);
    
    return {
        'Content-Type': 'application/json',
        'x-user-id': uid,
    };
};

const API_BASE_URL = publicUrl();

// --- Category API Functions ---

export const fetchCategoriesAPI = async () => {
    const headers = getAuthHeaders();
    if (!headers) return []; // Return empty array or throw error if auth fails
    try {
        const response = await axios.get(`${API_BASE_URL}/categories/categories`, { headers });
        return response.data;
    } catch (error) {
        console.error("API Error fetching categories:", error);
        toast.error(`Failed to load categories: ${error.response?.data?.message || error.message}`);
        return []; // Return empty array on error
    }
};

export const createCategoryAPI = async (name) => {
    const headers = getAuthHeaders();
    if (!headers) return null;
    try {
        const response = await axios.post(`${API_BASE_URL}/categories/categories`, { name }, { headers });
        toast.success('Category created!');
        return response.data; // Return the newly created category
    } catch (error) {
        console.error("API Error creating category:", error);
        toast.error(`Failed to create category: ${error.response?.data?.message || error.message}`);
        return null; // Indicate failure
    }
};

export const updateCategoryAPI = async (id, name) => {
    const headers = getAuthHeaders();
    if (!headers) return null;
    try {
        const response = await axios.put(`${API_BASE_URL}/categories/categories/${id}`, { name }, { headers });
        toast.success('Category updated!');
        return response.data; // Return the updated category
    } catch (error) {
        console.error("API Error updating category:", error);
        toast.error(`Failed to update category: ${error.response?.data?.message || error.message}`);
        return null; // Indicate failure
    }
};

export const deleteCategoryAPI = async (id) => {
    const headers = getAuthHeaders();
    if (!headers) return false; // Indicate failure
    try {
        await axios.delete(`${API_BASE_URL}/categories/categories/${id}`, { headers });
        toast.success('Category deleted!');
        return true; // Indicate success
    } catch (error) {
        console.error("API Error deleting category:", error);
        toast.error(`Failed to delete category: ${error.response?.data?.message || error.message}`);
        return false; // Indicate failure
    }
};

// --- Add other API functions (notes, etc.) if needed ---
// Example:
// export const fetchNotesAPI = async () => { ... } 