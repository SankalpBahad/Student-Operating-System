# Monolithic Backend for SOS

A consolidated Node.js/Express backend combining User, Notes, and Events services for the SOS application.

## Features

*   **User Management:** Basic user handling (uses Firebase UID).
*   **Notes:** CRUD, Categories, Tags, Archive/Star, PDF-to-Note (Gemini), Summarization (Gemini), Quiz Generation (Gemini).
*   **Events:** CRUD, ICS file import/export.
*   **RESTful API:** Endpoints under `/api/*`.

## Prerequisites

*   Node.js (v18+)
*   MongoDB
*   Google Gemini API Key (for AI features)

## Quick Start

1.  **Clone:** `git clone <your-repository-url> && cd monolithic_backend`
2.  **Install:** `npm install`
3.  **Configure:**
    *   Copy `.env.example` to `.env`.
    *   Edit `.env` and add your `MONGO_URI` and `GEMINI_API_KEY`.
4.  **Run (Development):** `npm run dev`
5.  **Run (Production):** `npm start`

The server defaults to port 4000.

## API Prefixes

*   `/api/users`
*   `/api/notes`
*   `/api/categories`
*   `/api/events`

## Key Dependencies

*   Express
*   Mongoose
*   dotenv
*   @google/generative-ai
*   multer
*   ical.js
*   jsonwebtoken
