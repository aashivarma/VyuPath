require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001; // Middleware port

// Basic Auth Credentials from .env
const USERNAME = process.env.API_USER || 'user';
const PASSWORD = process.env.API_PASSWORD || 'password';
const API_URL = process.env.API_URL || 'http://127.0.0.1:8000';

const authHeader = 'Basic ' + Buffer.from(USERNAME + ':' + PASSWORD).toString('base64');

app.use(cors());

// Health check
app.get('/health', (req, res) => {
    res.send('Middleware is running');
});

// Proxy everything to FastAPI
app.use('/', createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        // Inject Basic Auth header
        proxyReq.setHeader('Authorization', authHeader);
        console.log(`Proxying ${req.method} ${req.url} to ${API_URL}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error');
    }
}));

app.listen(PORT, () => {
    console.log(`Middleware server running on http://localhost:${PORT}`);
    console.log(`Proxying to ${API_URL}`);
});
