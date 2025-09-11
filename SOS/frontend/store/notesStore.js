import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    fetchCategoriesAPI,
    createCategoryAPI,
    updateCategoryAPI,
    deleteCategoryAPI
} from "../utils/api"; // Import API utils

// Define initial state including categories
const initialState = {
    notes: [],
    categories: [], // Add categories array
    category: null, // Still used for filtering maybe?
    isLoadingCategories: false,
    categoryError: null,
};

const useNotesStoreBase = create(persist((set, get) => ({
        ...initialState,

        // Existing actions
        setNotes: (notes) => set({ notes }),
        setCategory: (category) => set({ category }),

        // --- Category Actions ---
        fetchCategories: async () => {
            set({ isLoadingCategories: true, categoryError: null });
            const categories = await fetchCategoriesAPI();
            set({ categories: categories || [], isLoadingCategories: false });
        },

        addCategory: async (name) => {
            const newCategory = await createCategoryAPI(name);
            if (newCategory) {
                set((state) => ({
                    categories: [...state.categories, newCategory].sort((a, b) => a.name.localeCompare(b.name))
                }));
                return true; // Indicate success
            }
            return false; // Indicate failure
        },

        updateCategory: async (id, name) => {
            const updatedCategory = await updateCategoryAPI(id, name);
            if (updatedCategory) {
                set((state) => ({
                    categories: state.categories.map((cat) =>
                        cat._id === id ? updatedCategory : cat
                    ).sort((a, b) => a.name.localeCompare(b.name))
                }));
                // Also update category filter if it was the one being edited?
                if (get().category?._id === id) {
                    set({ category: updatedCategory });
                }
                // TODO: Optionally update notes in the store if they used the old category name
                return true;
            }
            return false;
        },

        deleteCategory: async (id) => {
            const success = await deleteCategoryAPI(id);
            if (success) {
                set((state) => ({
                    categories: state.categories.filter((cat) => cat._id !== id)
                }));
                 // Reset category filter if it was the one deleted
                if (get().category?._id === id) {
                    set({ category: null });
                }
                // TODO: Optionally update notes in the store (e.g., set category to null or 'Uncategorized')
                return true;
            }
            return false;
        },

        // Reset function (optional but good practice)
        resetCategories: () => set({ categories: [], isLoadingCategories: false, categoryError: null }),

    }), {
        name: "notes-store",
        // Decide what to persist. Maybe not categories if they are always fetched?
        // Or persist them for offline access but re-fetch on load?
        // For now, let's persist everything.
        getStorage: () => localStorage,
    }
));

const NotesStoreProvider = ({ children }) => {
    // Force client-side rendering
    if (typeof window === 'undefined') {
        return null;
    }
    return children;
};

const useNotesStore = () => useNotesStoreBase();

export { NotesStoreProvider };
export default useNotesStore;