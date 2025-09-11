require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all origins
// app.use(express.json()); // REMOVED/COMMENTED - Let target services parse their own bodies

// --- Service URLs --- Get these from .env
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const NOTE_SERVICE_URL = process.env.NOTE_SERVICE_URL || 'http://localhost:3002';
const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL || 'http://localhost:3003';

// --- Proxy Routes ---

// User Service Proxy
app.use('/api/users', createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/users': '' }, // Keep original rewrite for users
    onProxyReq: (proxyReq, req, res) => {
        // console.log(`[Gateway] Proxying request to User Service: ${req.method} ${req.originalUrl} -> ${req.path}`);
        console.log("!!! HIT USER PROXY !!!"); // Simplified log
    },
    onError: (err, req, res) => {
        console.error('[Gateway] Proxy Error (User Service):', err);
        res.status(500).send('Proxy error');
    }
}));

// Note Service Proxy - Handles /api/notes and /api/categories
app.use(['/api/notes', '/api/categories'], createProxyMiddleware({
    target: NOTE_SERVICE_URL,
    changeOrigin: true,
    // Use object notation for path rewriting to strip prefixes correctly
    pathRewrite: {
        '^/api/notes': '', // Remove /api/notes prefix
        '^/api/categories': '', // Remove /api/categories prefix
    },
    onProxyReq: function(proxyReq, req, res) {
        // Pass the user ID from headers (assuming auth middleware adds it)
        if (req.headers['x-user-id']) {
            proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        }
        console.log(`[Gateway -> Note Service] Proxying ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
        // Removed redundant body detection log
    },
    onError: function(err, req, res) {
        console.error('[Gateway] Proxy Error (Note Service):', err);
        console.error('[Gateway] Proxy Error Details (Note Service):', err.message, err.code);
         if (!res.headersSent) {
              try {
                  res.status(502).send('Proxy error contacting Note Service');
              } catch (e) {
                  console.error("Error sending error response (Note Service):", e);
              }
         }
    },
    onProxyRes: function(proxyRes, req, res) {
        console.log(`[Gateway] Received response from Note Service: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    }
}));

// Event Service Proxy
app.use('/api/events', createProxyMiddleware({
    target: EVENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/events': '' }, // Rewrites /api/events to /
    onProxyReq: function(proxyReq, req, res) {
        // Minimal logging - Rely on express.json() and default proxy behavior for body
        console.log(`[Gateway -> Event Proxy] Proxying ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
        if (req.body) {
             console.log(`[Gateway -> Event Proxy] Request body detected (from express.json)`);
        }
    },
    onError: function(err, req, res) {
        console.error('[Gateway] Proxy Error (Event Service):', err);
        console.error('[Gateway] Proxy Error Details (Event Service):', err.message, err.code);
        if (!res.headersSent) {
             try {
                  res.status(502).send('Proxy error contacting Event Service');
             } catch (e) {
                  console.error("Error sending error response (Event Service):", e);
             }
        }
    },
    onProxyRes: function(proxyRes, req, res) {
        console.log(`[Gateway] Received response from Event Service: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    }
}));


// --- Gateway Specific Routes ---
app.get('/ping', (req, res) => {
    res.send('pong from gateway');
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`Proxying /api/users to ${USER_SERVICE_URL}`);
    console.log(`Proxying /api/notes to ${NOTE_SERVICE_URL}`);
    console.log(`Proxying /api/events to ${EVENT_SERVICE_URL}`);
}); 