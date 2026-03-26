const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const resultsCache = new Map(); // L1 In-Memory Cache

const app = express();
app.use(compression());
app.use(express.json());
app.use(cors());

// Custom Powered By
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'Dev Saurabh Ultimate Scaler (V10.0)');
    next();
});

// Rate Limiting (Prevent Spam)
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // Increased for 200+ student school fetches
    message: { status: 'error', message: 'Too many requests, chill out!' }
});
app.use('/result', limiter);

// Serve Static Files (Unified App)
app.use(express.static(path.join(__dirname, './')));

// =========================
// 🔥 FETCH RESULT
// =========================
async function fetchResult(roll, cls = '10', year = '2026', stream = 'arts') {
    let url;
    if (cls === '10') {
        url = `https://rajasthan-10th-result.indiaresults.com/rj/bser/class-10-result-${year}/result.asp`;
    } else {
        url = `https://rajasthan-12th-result-${stream}.indiaresults.com/rj/bser/class-12-${stream}-result-${year}/result.asp`;
    }

    const res = await axios.post(
        url,
        qs.stringify({
            rollno: roll,
            submit: 'Find Results'
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 5000 // 5s timeout for Sonic Speed
        }
    );

    return res.data;
}

// =========================
// 🔥 PARSER (FINAL CLEAN)
// =========================
function parseResult(html) {
    const $ = cheerio.load(html);
    const data = { marks: [] };

    $('tr').each((i, row) => {
        const tds = $(row).find('td');
        if (tds.length === 2) {
            const label = $(tds[0]).text().trim().toLowerCase();
            const value = $(tds[1]).text().trim();
            if (label === 'name') data.name = value;
            if (label.includes('roll')) {
                const match = value.match(/\d+/);
                if (match) data.roll = match[0];
            }
            if (label.includes('father')) data.father = value;
            if (label.includes('mother')) data.mother = value;
            if (label.includes('school')) data.school = value;
            if (label.includes('percentage') || label.includes('per')) data.per = value.replace('%', '').trim();
            if (label === 'result') data.result = value;
        }
    });

    $('table tr').each((i, row) => {
        const tds = $(row).find('td');
        if (tds.length < 3) return;

        let subject = $(tds[0]).text()
            .replace(/^\d+\.\s*/, '')
            .replace(/\(.*?\)/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();

        let theory = $(tds[1]).text().trim();
        let sessional = $(tds[2]).text().trim();
        let total = $(tds[3])?.text().trim() || '';

        if (!total || total === '-') total = theory;
        total = total.replace(/[^\dA-Z]/g, '');

        const banned = ['ROLL', 'SCHOOL', 'CENTER', 'TOTAL', 'PERCENTAGE', 'RESULT', 'NAME'];
        if (!subject || subject.length > 30 || banned.some(b => subject.includes(b))) return;
        if (!/\d/.test(total)) return;

        data.marks.push({ subject, theory, sessional, total });
    });

    function isMain(subject) {
        const s = subject.toUpperCase();
        return (
            s.startsWith('HINDI') || s.startsWith('ENGLISH') || s.startsWith('MATHE') ||
            s.startsWith('MATH') || s.startsWith('SCIENCE') || s.startsWith('SOC') ||
            s.startsWith('SANSKRIT') || s.startsWith('URDU') || s.startsWith('PUNJABI') ||
            s.startsWith('PHYSICS') || s.startsWith('CHEMISTRY') || s.startsWith('BIOLOGY') ||
            s.startsWith('POL') || s.startsWith('GEOGRAPHY') || s.startsWith('HISTORY') ||
            s.startsWith('ECONOMICS') || s.startsWith('SANSKRIT LIT') || s.startsWith('DRAWING') ||
            s.startsWith('HOME SCIENCE') || s.startsWith('ACCOUNTANCY') || s.startsWith('BUSINESS')
        );
    }

    let total = 0;
    data.marks.forEach(m => {
        const val = parseInt(m.total);
        if (isMain(m.subject) && !isNaN(val)) total += val;
    });

    if (total > 0) data.total = total;
    if (total > 0 && !data.per) data.per = ((total / 600) * 100).toFixed(2);

    if (!data.name && !data.roll) return { status: 'not_found' };
    return { status: 'success', data };
}

// =========================
// 🔥 API
// =========================
app.post('/result', async (req, res) => {
    const { roll, class: cls = '10', year = '2026', stream = 'arts' } = req.body;
    if (!roll) return res.json({ status: 'error', message: 'Roll required' });

    const cacheKey = `${roll}_${cls}_${year}_${stream}`;
    if (resultsCache.has(cacheKey)) {
        console.log(`[CACHE HIT] ⚡ Roll ${roll}`);
        return res.json({ status: 'success', data: resultsCache.get(cacheKey) });
    }

    const startTime = new Date().toLocaleTimeString();
    try {
        const html = await fetchResult(roll, cls, year, stream);
        const result = parseResult(html);

        if (result.status === 'not_found' || html.includes('No Records Found') || html.includes('Please Enter Valid Roll No')) {
            console.log(`[${startTime}] ❌ Roll ${roll} | Not Found`);
            return res.json({ status: 'not_found' });
        }

        const data = result.data;
        resultsCache.set(cacheKey, data); // Save to L1 Cache
        
        console.log(`[${startTime}] ✅ Roll ${roll} | ${data.name || 'Unknown'} | ${data.per}%`);
        res.json({ status: 'success', data });

    } catch (err) {
        console.error(`[${startTime}] ⚠️ Error ${roll}:`, err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Catch-all route to serve the frontend (Unified App)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// START SERVER
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Elite Server running on port ${PORT}`);
});