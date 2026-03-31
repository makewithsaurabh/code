require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

// --- ⚡ PERFORMANCE & STATIC SERVING ---
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, './'))); // Serve frontend files

// --- 🏠 ROOT ROUTE (ELITE FRONTEND ENTRY) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 🛑 SECURITY: RATE LIMITER (100 Requests/Min for School Fetch) ---
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: { status: 'error', message: 'Too many requests from this IP, please try again after a minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- 🗄️ MONGODB CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rbse_portal";
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected Successfully');
        // 🧹 AUTO-CLEANUP: Wipe existing garbage data (Total=0 or Broken names)
        const deleted = await Student.deleteMany({ 
            $or: [
                { total: 0 }, 
                { name: /Marks Obtained/i },
                { name: /\d/ },       // Numbers in name = Garbage
                { name: /\(/ }        // Brackets in name = Garbage
            ] 
        });
        if (deleted.deletedCount > 0) console.log(`🧹 DATABASE CLEANED: Removed ${deleted.deletedCount} garbage records.`);
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- 📜 DATABASE SCHEMA (STUDENT MODEL) ---
const StudentSchema = new mongoose.Schema({
    roll: { type: String, required: true },
    class: { type: String, required: true },
    year: { type: String, required: true },
    stream: { type: String, required: true },
    name: String,
    father: String,
    mother: String,
    school: String,
    total: Number,
    per: String,
    result: String,
    marks: Array,
    lastUpdated: { type: Date, default: Date.now }
});

// Compound index for uniqueness (No clones)
StudentSchema.index({ roll: 1, class: 1, year: 1, stream: 1 }, { unique: true });
const Student = mongoose.model('Student', StudentSchema);

// --- 🧠 HYBRID CACHE (L1 MEMORY) ---
const RESULTS_CACHE = new Map();

// --- 🚦 CONCURRENCY QUEUE (L3 SCRAPER WORKERS) ---
let activeWorkers = 0;
const MAX_CONCURRENT_SCRAPES = 10;
const queue = [];

const processQueue = async () => {
    if (activeWorkers >= MAX_CONCURRENT_SCRAPES || queue.length === 0) return;
    
    activeWorkers++;
    const { task, resolve, reject } = queue.shift();
    
    try {
        const result = await task();
        resolve(result);
    } catch (e) {
        reject(e);
    } finally {
        activeWorkers--;
        processQueue();
    }
};

const enqueueScrape = (task) => {
    return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject });
        processQueue();
    });
};

// --- CORE ENGINE: URL BUILDER ---
function getTargetURL(roll, cls = '10', year = '2026', stream = 'science') {
    let url, referer;
    const s = stream.toLowerCase();

    if (cls === '10' || cls === '10th') {
        url = `https://rajasthan-10th-result.indiaresults.com/rj/bser/class-10-result-${year}/mrollresult.asp`;
    } else {
        url = `https://rj-12-${s}-result.indiaresults.com/rj/bser/class-12-${s}-result-${year}/mrollresult.asp`;
    }

    referer = url.replace('mrollresult.asp', 'query.htm');
    return { url, referer };
}

async function fetchResultData(roll, cls, year = '2026', stream = 'science') {
    const { url, referer } = getTargetURL(roll, cls, year, stream);
    
    try {
        const response = await axios.post(
            url,
            qs.stringify({ rollno: roll, submit: 'Find Results' }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Referer': referer
                },
                timeout: 30000 
            }
        );
        return { html: response.data, cls };
    } catch (err) {
        console.error(`[SCRAPER] Fetch failed for ${roll}: ${err.message}`);
        throw err;
    }
}

function parseResultHTML(html, requestedRoll, cls) {
    const $ = cheerio.load(html);
    try {
        let studentData = {
            roll: requestedRoll,
            name: '', father: '', mother: '', school: 'RBSE Board School',
            total: 0, per: 0, result: 'N/A', marks: []
        };

        $('tr').each((i, el) => {
            const rowText = $(el).text().replace(/\s+/g, ' ').trim();
            const tds = $(el).find('td');
            const rowUpper = rowText.toUpperCase();

            // 🏫 SMART SCHOOL DETECTION: Look for (ID) SCH pattern or explicit labels
            if (rowText.includes('(') && rowText.includes(')') && (rowUpper.includes('SCH') || rowUpper.includes('GOVT') || rowUpper.includes('PRIVATE'))) {
                studentData.school = rowText; // Its usually the whole row in headers
            } else if (rowText.includes('School')) {
                studentData.school = tds.eq(1).text().trim() || studentData.school;
            }

            // 👨‍🎓 SMART NAME DETECTION: Filter out school patterns and board labels
            if (rowText.includes('Name') && !rowText.toUpperCase().includes('FATHER') && !rowText.toUpperCase().includes('MOTHER')) {
                let candidateName = tds.eq(1).text().trim() || tds.last().text().trim();
                const schoolKeywords = ['SCH', 'GOVT', 'PRIVATE', 'PUBLIC', '(', ')', 'MARKS OBTAINED', 'NAME', 'RESULT', 'ROLL'];
                const hasNumbers = /\d/.test(candidateName); // School names usually have IDs/Brackets
                
                if (candidateName && !schoolKeywords.some(b => candidateName.toUpperCase().includes(b)) && !hasNumbers) {
                    studentData.name = candidateName;
                }
            }
            if (rowText.includes("Father's Name")) {
                let candidateFather = tds.eq(1).text().trim();
                if (candidateFather && !candidateFather.toUpperCase().includes('FATHER')) {
                    studentData.father = candidateFather;
                }
            }
            if (rowText.includes("Mother's Name")) studentData.mother = tds.eq(1).text().trim();
            if (rowText.includes('Result') || rowText.includes('Division')) studentData.result = tds.last().text().trim();
            if (rowText.includes('Grand Total') || rowText.includes('Total Marks')) {
                studentData.total = parseInt(tds.last().text().trim()) || 0;
            }
        });

        // 3. Subject Marks (Resilient Parsing)
        let calculatedTotal = 0;
        $('table').find('tr').each((i, el) => {
            const cols = $(el).find('td');
            if (cols.length >= 4) {
                const subject = $(cols[0]).text().replace(/^\d+\.\s*/, '').trim();
                
                // Better header filtering
                const banned = ['SUBJECT', 'ROLL', 'NAME', 'MOTHER', 'FATHER', 'SCHOOL', 'RESULT', 'TOTAL', 'PERCENT', 'TH', 'SS', 'PR'];
                if (subject && !banned.some(b => subject.toUpperCase() === b || subject.toUpperCase().includes(b))) {
                    const th = $(cols[1]).text().trim() || '—';
                    const ss = (cols.length >= 3) ? $(cols[2]).text().trim() : '—';
                    const thss = (cols.length >= 4) ? $(cols[3]).text().trim() : '—';
                    const pr = (cols.length >= 5) ? $(cols[4]).text().trim() : '—';
                    const total = $(cols.last()).text().trim() || th;

                    if (/[\dA-D]/.test(total.replace(/[^\dA-Z]/g, ''))) {
                        studentData.marks.push({
                            subject: subject,
                            th: th,
                            ss: ss,
                            thss: thss,
                            pr: pr,
                            total: total
                        });

                        // Add to calculated total if it's a number (ONLY CORE SUBJECTS)
                        const val = parseInt(total);
                        const maxCore = (cls === '12' || cls === '12th') ? 5 : 6;
                        if (!isNaN(val) && studentData.marks.length <= maxCore) {
                            calculatedTotal += val;
                        }
                    }
                }
            }
        });

        // 4. Force Correct Total & Percentage
        if (studentData.total <= 0 && calculatedTotal > 0) {
            studentData.total = calculatedTotal;
        }

        if (studentData.total > 0) {
            const base = (cls === '12' || cls === '12th') ? 500 : 600;
            studentData.per = ((studentData.total / base) * 100).toFixed(2);
        }
        if (!studentData.name && !studentData.roll) {
            console.warn(`[PARSER] No Name/Roll found for ${requestedRoll}`);
            return { status: 'not_found' };
        }
        return { status: 'success', data: studentData };
    } catch (e) {
        console.error(`[PARSER] Crash: ${e.message}`);
        return { status: 'error', message: e.message };
    }
}

// --- 🌐 API ENDPOINT (HYBRID CACHE + QUEUE) ---
app.post('/result', apiLimiter, async (req, res) => {
    const { roll, class: cls, year = '2026', stream = 'arts' } = req.body;
    if (!roll || !cls) return res.status(400).json({ status: 'error', message: 'Roll & Class required' });

    const cacheKey = `${roll}_${cls}_${year}_${stream}`;

    // LAYER 1: Memory Check
    if (RESULTS_CACHE.has(cacheKey)) {
        console.log(`[L1] Cache Hit: ${roll}`);
        return res.json({ status: 'success', data: RESULTS_CACHE.get(cacheKey) });
    }

    // LAYER 2: MongoDB Check
    try {
        const dbResult = await Student.findOne({ roll, class: cls, year, stream });
        if (dbResult) {
            console.log(`[L2] DB Hit: ${roll}`);
            RESULTS_CACHE.set(cacheKey, dbResult);
            return res.json({ status: 'success', data: dbResult });
        }
    } catch (e) {
        console.error("DB Query Error:", e);
    }

    // LAYER 3: Scraper Queue
    try {
        console.log(`[L3] Enqueuing Scrape: ${roll} (Queue Size: ${queue.length})`);
        const result = await enqueueScrape(async () => {
            console.log(`[WORKER] Starting Scrape for Roll: ${roll}`);
            
            try {
                const fetchRes = await fetchResultData(roll, cls, year, stream);
                
                if (fetchRes.html.includes("No Records Found") || fetchRes.html.includes("Invalid Roll")) {
                    console.log(`[WORKER] Not Found at Board: ${roll}`);
                    return { status: 'not_found' };
                }
                
                const parseRes = parseResultHTML(fetchRes.html, roll, cls);
                
                if (parseRes && parseRes.status === 'success') {
                    const finalData = { ...parseRes.data, class: cls, year, stream };
                    
                    // Strict Validation: Save ONLY if complete profile found (No garbage allowed)
                    const isGarbage = (finalData.name && finalData.name.toUpperCase().includes('MARKS OBTAINED')) || finalData.total <= 0;
                    
                    if (finalData.name && finalData.roll && !isGarbage) {
                        await Student.findOneAndUpdate(
                            { roll, class: cls, year, stream },
                            finalData,
                            { upsert: true, new: true }
                        );
                        RESULTS_CACHE.set(cacheKey, finalData);
                        console.log(`[SAVER] Correct Data Stored: ${finalData.name} (${roll})`);
                    } else {
                        console.warn(`[SAVER] Garbage Filtered Out for ${roll}`);
                    }
                    return { status: 'success', data: finalData };
                } else {
                    console.warn(`[WORKER] Parser failed for ${roll}`);
                    return { status: 'not_found' };
                }
            } catch (innerErr) {
                console.error(`[WORKER] Fatal Scrape Error for ${roll}: ${innerErr.message}`);
                throw innerErr;
            }
        });

        res.json(result);
    } catch (err) {
        console.error(`[SCRAPER] Queue processing error: ${err.message}`);
        res.status(500).json({ status: 'error', message: 'Backend queue timeout or board source error' });
    }
});

app.use(express.static(path.join(__dirname, './')));

app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`🚀 HIGH-PERFORMANCE BACKEND READY (V14)`);
    console.log(`📡 PORT: ${PORT}`);
    console.log(`🗄️ STORAGE: Hybrid (RAM + MongoDB)`);
    console.log(`🚦 QUEUE: Enabled (Concurrency: ${MAX_CONCURRENT_SCRAPES})`);
    console.log(`==========================================`);
});