# SOS - Note Taking App (Frontend)

This is the Next.js frontend for SOS, a feature-rich note-taking application featuring a modern block-based editor, calendar integration, PDF utilities, and Firebase authentication.

## Features

*   **User Authentication:** Secure login and registration using Firebase Authentication (Email/Password, Google).
*   **Rich Text Editor:** Create and edit notes with a modern block-based editor (@blocknote/react).
*   **Note Management:**
    *   Create, Read, Update, Delete (CRUD) notes.
    *   Categorize notes.
    *   Mark notes as important (Starring).
    *   Archive notes.
    *   Search notes by title or content preview.
*   **Calendar Integration:**
    *   View events on a calendar (@fullcalendar/react).
    *   Add, view, and delete calendar events associated with the user.
    *   Import/Export calendar events using ICS files.
*   **AI Features (via Backend):**
    *   Summarize notes.
    *   Generate quiz questions from notes.
*   **Utilities:**
    *   Export notes as PDF.
    *   Upload PDF files to automatically create notes.
*   **User Profile:** View and manage user account details.
*   **Dark Mode:** Theme switching support (`next-themes`).
*   **Styling:** UI built with Tailwind CSS and shadcn/ui components.

## Tech Stack

*   **Framework:** Next.js 13
*   **Language:** JavaScript
*   **Styling:** Tailwind CSS, shadcn/ui
*   **State Management:** Zustand
*   **Authentication:** Firebase
*   **Editor:** BlockNote.js (@blocknote/react)
*   **Calendar:** FullCalendar
*   **HTTP Client:** Axios
*   **Notifications:** react-hot-toast
*   **Icons:** react-icons, lucide-react
*   **PDF Generation:** jspdf, html2canvas, marked
*   **(Infrastructure Present):** PartyKit, Yjs, y-partykit (for potential future collaboration)

## Prerequisites

*   Node.js (v16 or later recommended)
*   npm or yarn
*   A running instance of the [SOS Backend](<link-to-your-backend-repo>) (required for most features).
*   A Firebase project set up for Authentication.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://your-repo-url/sos-frontend.git
    cd sos-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Firebase:**
    *   Update `utils/firebase.js` with your Firebase project credentials (using environment variables is recommended for security).

4.  **Configure Backend URL:**
    *   Ensure `utils/publicUrl.js` points to your running backend API (default: `http://localhost:5000/api`).

5.  **Ensure Backend is Running:**
    *   Start the SOS backend server.

6.  **(Optional) Run PartyKit Development Server:**
    *   While not used by the editor currently, the PartyKit server setup exists. If needed:
    ```bash
    npx partykit dev
    ```

7.  **Run the Frontend Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    *   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

*   `npm run dev`: Start development server.
*   `npm run build`: Build for production.
*   `npm run start`: Start production server.
*   `npm run lint`: Run ESLint checks.
*   `npx partykit dev`: Start PartyKit dev server.
