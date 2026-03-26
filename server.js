const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const cors = require('cors');
const path = require('path');
const compression = require('compression');

const app = express();
app.use(compression());
app.use(express.json());
app.use(cors());

// Custom Powered By
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'Dev Saurabh Result Portal (V9.6)');
    next();
});

// Serve Static Files (Unified App)
app.use(express.static(path.join(__dirname, './')));

// Catch-all route to serve the frontend for any non-API request
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
 http://192.168.1.36:3001/');
});