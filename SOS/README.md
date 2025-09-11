
## Frontend (`frontend/`)

The user-facing application built with Next.js.

### Frontend Features

*   User Login/Registration (Firebase Auth: Google, Email/Password).
*   Dashboard displaying notes.
*   Block-based note editor (@blocknote/react).
*   Note organization: Categories, Important (Starring), Archive.
*   Calendar view with event management (@fullcalendar/react).
*   ICS file import/export for calendar events.
*   PDF upload to create notes.
*   Export notes to PDF.
*   Trigger AI features (Summarize, Quiz) via backend calls.
*   User profile page.
*   Dark Mode support.

### Frontend Tech Stack

*   Framework: Next.js 13
*   Language: JavaScript
*   Styling: Tailwind CSS, shadcn/ui
*   State Management: Zustand
*   Authentication: Firebase Authentication
*   Editor: BlockNote.js (`@blocknote/react`)
*   Calendar: FullCalendar (`@fullcalendar/react`)
*   HTTP Client: Axios
*   Notifications: `react-hot-toast`
*   Icons: `react-icons`, `lucide-react`

### Frontend Setup & Running

1.  **Navigate to the directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```
3.  **Configure Firebase:**
    *   Update the Firebase configuration details in `frontend/utils/firebase.js`. **Important:** Use environment variables for sensitive keys in a real application.
4.  **Configure Backend URL:**
    *   Edit `frontend/utils/publicUrl.js`.
    *   Set the URL to point to your running backend:
        *   For Monolithic: `http://localhost:4000/api` (Default, adjust port if needed)
        *   For Microservices: `http://localhost:5000/api` (Default for API Gateway, adjust port if needed)
5.  **Run the development server:**
    ```bash
    npm run dev
    # or yarn dev
    ```
6.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Monolithic Backend (`monolithic_backend/`)

A single backend application housing all server-side logic.

### Monolithic Features

*   Handles all API requests for Users, Notes, and Events.
*   Direct database interaction (MongoDB via Mongoose).
*   Implements business logic for all features.
*   Integrates with Google Gemini for AI features.

### Monolithic Tech Stack

*   Runtime: Node.js
*   Framework: Express.js
*   Database: MongoDB with Mongoose ODM
*   AI: `@google/generative-ai`
*   File Handling: `multer`, `pdf-parse`, `ical.js`
*   Authentication Middleware: `jsonwebtoken` (potentially, depends on setup)
*   Environment Variables: `dotenv`

### Monolithic Setup & Running

1.  **Navigate to the directory:**
    ```bash
    cd monolithic_backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```
3.  **Configure Environment:**
    *   Create a `.env` file in the `monolithic_backend` directory (you can copy `.env.example` if provided).
    *   Add your `MONGO_URI` (MongoDB connection string).
    *   Add your `GEMINI_API_KEY` for AI features.
    *   Optionally set the `PORT` (defaults to 4000 if not set).
4.  **Run the server:**
    *   Development (with auto-restart): `npm run dev`
    *   Production: `npm start`
    *   Alternatively, use the script: `./start.sh` (ensure it's executable: `chmod +x start.sh`)

### Monolithic API Prefixes

All routes are served under the `/api` prefix relative to the base URL (e.g., `http://localhost:4000/api`). Specific routes:
*   `/api/users/*`
*   `/api/notes/*`
*   `/api/categories/*`
*   `/api/events/*`

---

## Microservices Backend (`microservices/`)

Backend logic decomposed into smaller, independent services orchestrated by an API Gateway.

### Microservices Components

*   **API Gateway (`api-gateway/`):**
    *   Acts as the single entry point.
    *   Routes incoming requests to the appropriate downstream service.
    *   Built with Express and `http-proxy-middleware`.
    *   Listens on port 5000 by default.
*   **User Service (`user-service/`):**
    *   Handles user creation based on Firebase UID.
    *   Listens on port 3001 by default.
*   **Note Service (`note-service/`):**
    *   Manages CRUD operations for notes and categories.
    *   Handles PDF uploads, AI summarization, and quiz generation.
    *   Implements various design patterns (see below).
    *   Listens on port 3002 by default.
*   **Event Service (`event-service/`):**
    *   Manages CRUD operations for calendar events.
    *   Handles ICS file import and export.
    *   Listens on port 3003 by default.

### Microservices Tech Stack

*   **Common:** Node.js, Express.js, MongoDB (Mongoose), dotenv
*   **API Gateway:** `http-proxy-middleware`
*   **Note Service:** `@google/generative-ai`, `multer`, `pdf-parse`
*   **Event Service:** `multer`, `ical.js`

### Microservices Design Patterns (Note Service)

The Note Service demonstrates several design patterns:
*   **Repository Pattern:** Encapsulates data access logic (`repositories/noteRepository.js`).
*   **Factory Pattern:** Creates different types of notes (`factories/noteFactory.js`).
*   **Observer Pattern:** Notifies observers about note events (`observers/noteObserver.js`).
*   **Strategy Pattern:** Handles different summarization methods (`strategies/summarizationStrategy.js`).
*   **Singleton Pattern:** Manages the database connection (`models/connect.js` - adapted from original).

### Microservices Setup & Running

**Important:** Each service (including the API Gateway) needs to be set up and run independently.

1.  **Install Dependencies for *each* service:**
    ```bash
    cd microservices/api-gateway && npm install && cd ..
    cd user-service && npm install && cd ..
    cd note-service && npm install && cd ..
    cd event-service && npm install && cd ..
    cd .. # Back to SOS root
    ```
2.  **Configure Environment for *each* service:**
    *   **API Gateway (`api-gateway/.env`):**
        *   Define `USER_SERVICE_URL`, `NOTE_SERVICE_URL`, `EVENT_SERVICE_URL` pointing to the respective service ports (e.g., `http://localhost:3001`).
        *   Set the `PORT` (defaults to 5000).
    *   **User, Note, Event Services (`.env` in each service directory):**
        *   Define `MONGO_URI` (can be the same or different databases).
        *   Define `PORT` (defaults are 3001, 3002, 3003 respectively).
        *   **Note Service Only:** Define `GEMINI_API_KEY`.
3.  **Run the Services:**
    *   Open **separate terminals** for each service and the gateway.
    *   Run each service (using `npm run dev` is recommended for development):
        ```bash
        cd microservices/user-service && npm run dev
        ```
        ```bash
        cd microservices/note-service && npm run dev
        ```
        ```bash
        cd microservices/event-service && npm run dev
        ```
        ```bash
        cd microservices/api-gateway && npm run dev
        ```
4.  **Access:** The frontend should point to the API Gateway URL (e.g., `http://localhost:5000/api`).

---

## Backend Monitoring (`backend-monitoring/`)

Tools for performance testing and comparing the two backend architectures.

### Monitoring Purpose

*   To quantitatively measure and compare the performance (throughput, latency, errors, cold start) of the Monolithic vs. Microservices backends under load.
*   To provide data for understanding the practical trade-offs between the two architectures.

### Monitoring How it Works

1.  **Load Testing (`load-test.js`):** Uses the `autocannon` library to send a configured number of concurrent requests over a specific duration to defined endpoints on both backends.
2.  **Metrics Collection:** Collects standard performance metrics like requests per second (throughput), latency percentiles, status code counts, and error counts. It also performs a simple "cold start" measurement by pinging each backend before the main tests.
3.  **Reporting:** Saves the raw results to `results/results.json` and generates a comparative HTML report (`results/report.html`).

### Monitoring Setup & Running

1.  **Prerequisites:** Ensure both the Monolithic backend (on port 4000) and the Microservices API Gateway (on port 5000) are running. Adjust URLs in `load-test.js` if using different ports.
2.  **Navigate to the directory:**
    ```bash
    cd backend-monitoring
    ```
3.  **Install dependencies:**
    *   Note: The `package.json` specifies `--legacy-peer-deps`. If you encounter issues, try:
        ```bash
        npm install --legacy-peer-deps
        ```
    *   Otherwise, a standard install should work:
        ```bash
        npm install
        ```
4.  **Run the performance tests:**
    ```bash
    npm test
    # or
    node load-test.js
    ```
    *   This will output results to the console and generate/update files in the `results/` directory.

### Monitoring Interpreting Results

*   **`results/results.json`:** Contains the raw detailed output from Autocannon for each endpoint and backend, plus boot times and summary averages.
*   **`results/report.html`:** Provides a user-friendly comparison of the key metrics (throughput, latency, cold start) and detailed tables for each endpoint. Includes a section discussing general architecture trade-offs.
*   **Console Output:** The `load-test.js` script prints summaries and an ASCII comparison chart to the console during execution.

---

## Key Technologies Summary

*   **Frontend:** Next.js, React, Tailwind CSS, Zustand, Firebase Auth, BlockNote, FullCalendar
*   **Backend (Both):** Node.js, Express.js, MongoDB, Mongoose, Dotenv
*   **AI:** Google Gemini API
*   **Microservices:** `http-proxy-middleware` (API Gateway)
*   **Monitoring:** Autocannon, Express.js

---

## Environment Variables

Ensure you configure the necessary environment variables for each component:

*   **Frontend:** Firebase configuration in `utils/firebase.js`. Backend URL in `utils/publicUrl.js`.
*   **Monolithic Backend (`.env`):** `MONGO_URI`, `GEMINI_API_KEY`, `PORT` (optional, defaults to 4000).
*   **API Gateway (`.env`):** `USER_SERVICE_URL`, `NOTE_SERVICE_URL`, `EVENT_SERVICE_URL`, `PORT` (optional, defaults to 5000).
*   **User Service (`.env`):** `MONGO_URI`, `PORT` (optional, defaults to 5001).
*   **Note Service (`.env`):** `MONGO_URI`, `GEMINI_API_KEY`, `PORT` (optional, defaults to 5002).
*   **Event Service (`.env`):** `MONGO_URI`, `PORT` (optional, defaults to 5003).

---
