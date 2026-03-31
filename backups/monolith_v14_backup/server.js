const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
app.use(compression());
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3001;
const RESULTS_CACHE = new Map();

// --- ⚡ MONITORING & PERFORMANCE ---
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use((req, res, next) => {
    const time = new Date().toLocaleTimeString();
    if (req.url === '/result') {
        console.log(`[${time}] ⚡ GLOBAL LOG: ${req.method} ${req.url}`);
    }
    res.setHeader('X-Powered-By', 'Elite Scraper V13.5 (Saurabh Sonic)');
    next();
});

// Serve Frontend Files
app.use(express.static(path.join(__dirname, './')));

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
    
    console.log(`[SCANNER] Target URL: ${url}`);
    
    try {
        const response = await axios.post(
            url,
            qs.stringify({ 
                rollno: roll, 
                submit: 'Find Results' 
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
                    'Referer': referer
                },
                timeout: 15000 
            }
        );

        console.log(`[SCANNER] Response Received. Size: ${response.data.length} bytes`);
        return { html: response.data, cls };
    } catch (err) {
        console.error(`[SCANNER] Fetch failed: ${err.message}`);
        throw err;
    }
}

// --- CORE: PARSER (LIBERAL EDITION V13.5) ---
function parseResultHTML(html, requestedRoll, cls) {
    const $ = cheerio.load(html);
    
    try {
        let studentData = {
            status: 'success',
            roll: requestedRoll,
            name: '',
            father: '',
            mother: '',
            school: 'RBSE Board School',
            total: 0,
            per: 0,
            result: 'N/A',
            marks: []
        };

        // 1. Basic Info Extraction (V11.3 hybrid logic)
        $('tr').each((i, el) => {
            const rowText = $(el).text().replace(/\s+/g, ' ').trim();
            const tds = $(el).find('td');
            
            if (rowText.includes('Name') && !rowText.includes('Father') && !rowText.includes('Mother') && !rowText.includes('School')) {
                let extractedName = tds.eq(1).text().trim();
                if (extractedName && !extractedName.toUpperCase().includes('MARKS OBTAINED')) {
                    studentData.name = extractedName;
                }
            }
            if (rowText.includes("Father's Name") || rowText.includes("Father Name")) {
                studentData.father = tds.eq(1).text().trim() || studentData.father;
            }
            if (rowText.includes("Mother's Name") || rowText.includes("Mother Name")) {
                studentData.mother = tds.eq(1).text().trim() || studentData.mother;
            }
            if (rowText.includes('Result') || rowText.includes('Division')) {
                studentData.result = tds.last().text().trim();
            }
            if (rowText.includes('Grand Total') || rowText.includes('Total Marks')) {
                studentData.total = parseInt(tds.last().text().trim()) || 0;
            }
            if (rowText.includes('School')) {
                studentData.school = tds.eq(1).text().trim() || studentData.school;
            }
            if (rowText.includes('Roll No')) {
                const match = rowText.match(/\d+/);
                if (match) studentData.roll = match[0];
            }
        });

        // 2. Dynamic Percentage Calculation
        if (studentData.total > 0) {
            const base = (cls === '12' || cls === '12th') ? 500 : 600;
            studentData.per = ((studentData.total / base) * 100).toFixed(2);
        }

        // 3. Subject Marks (Liberal Parsing - Updated for 6 columns)
        $('table').find('tr').each((i, el) => {
            const cols = $(el).find('td');
            if (cols.length >= 4) {
                const subject = $(cols[0]).text().replace(/^\d+\.\s*/, '').trim();
                
                // Avoid headers and metadata
                const banned = ['SUBJECT', 'ROLL', 'NAME', 'MOTHER', 'FATHER', 'SCHOOL', 'RESULT', 'TOTAL', 'PERCENT'];
                if (subject && !banned.some(b => subject.toUpperCase().includes(b))) {
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
                    }
                }
            }
        });

        if (!studentData.name && !studentData.roll) return { status: 'not_found' };
        return { status: 'success', data: studentData };

    } catch (e) {
        console.error("Scraping Error:", e);
        return { status: 'error', message: 'Parser Error' };
    }
}

// --- API ENDPOINT ---
app.post('/result', async (req, res) => {
    const { roll, class: cls, year = '2026', stream = 'arts' } = req.body;
    const startTime = new Date().toLocaleTimeString();

    if (!roll || !cls) {
        return res.status(400).json({ status: 'error', message: 'Roll & Class required' });
    }

    // 🔍 Terminal Monitoring
    console.log(`[${startTime}] 📥 INCOMING: Roll=${roll} | Class=${cls} | Stream=${stream}`);

    const cacheKey = `${roll}_${cls}_${stream}`;
    if (RESULTS_CACHE.has(cacheKey)) {
        console.log(`[${startTime}] ⚡ CACHE HIT: Roll ${roll}`);
        return res.json({ status: 'success', data: RESULTS_CACHE.get(cacheKey) });
    }

    try {
        const fetchRes = await fetchResultData(roll, cls, year, stream);
        const html = fetchRes.html;

        // ❌ Check if result doesn't exist (Snippet Logic)
        if (html.includes("No Records Found") || html.includes("Invalid Roll") || html.includes("Roll No. does not exist")) {
            console.log(`[${startTime}] ⚠️ RESULT NOT FOUND (Board Message) for Roll ${roll}`);
            return res.json({ status: 'not_found' });
        }

        const parseRes = parseResultHTML(html, roll, cls);
        
        if (parseRes.status === 'success') {
            console.log(`[${startTime}] ✅ PARSE SUCCESS: ${parseRes.data.name}`);
            RESULTS_CACHE.set(cacheKey, parseRes.data);
            res.json({ status: 'success', data: parseRes.data });
        } else {
            console.warn(`[${startTime}] 🔎 PARSE FAILED: Data structure mismatch or empty response`);
            res.json({ status: 'not_found' });
        }
        
    } catch (err) {
        console.error(`Error: ${err.message}`);
        res.status(500).json({ status: 'error', message: 'Server error or Timeout' });
    }
});

app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`🚀 DEV SAURABH V13.5 (HYBRID) RUNNING`);
    console.log(`📡 PORT: ${PORT}`);
    console.log(`🔥 Supports: 10th & 12th (Arts, Sci, Com)`);
    console.log(`==========================================`);
});