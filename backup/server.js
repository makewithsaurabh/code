const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());


// =========================
// 🔥 FETCH RESULT
// =========================
async function fetchResult(roll) {

    const url = 'https://rajasthan-10th-result.indiaresults.com/rj/bser/class-10-result-2026/result.asp';

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
            }
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

    // =========================
    // ✅ BASIC DETAILS (FIXED)
    // =========================
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
            if (label.includes('percentage')) data.percentage = value;
            if (label === 'result') data.result = value;
        }
    });

    // =========================
    // 🔥 SUBJECTS (STRICT FILTER)
    // =========================
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

        // extra subjects fix
        if (!total || total === '-') total = theory;

        total = total.replace(/[^\dA-Z]/g, '');

        // ❌ REMOVE FAKE ROWS
        const banned = [
            'ROLL',
            'SCHOOL',
            'CENTER',
            'TOTAL',
            'PERCENTAGE',
            'RESULT',
            'NAME'
        ];

        if (
            !subject ||
            subject.length > 30 ||
            banned.some(b => subject.includes(b))
        ) return;

        // must contain marks
        if (!/\d/.test(total)) return;

        data.marks.push({
            subject,
            theory,
            sessional,
            total
        });
    });

    // =========================
    // 🔥 TOTAL (RBSE CORRECT)
    // =========================
    function isMain(subject) {
        return (
            subject.startsWith('HINDI') ||
            subject.startsWith('ENGLISH') ||
            subject.startsWith('MATHE') ||
            subject.startsWith('MATH') ||
            subject.startsWith('SCIENCE') ||
            subject.startsWith('SOC') ||
            subject.startsWith('SANSKRIT') ||
            subject.startsWith('URDU') ||
            subject.startsWith('PUNJABI')
        );
    }

    let total = 0;

    data.marks.forEach(m => {
        const val = parseInt(m.total);
        if (isMain(m.subject) && !isNaN(val)) {
            total += val;
        }
    });

    if (total > 0) data.total = total;

    return data;
}


// =========================
// 🔥 API
// =========================
app.post('/result', async (req, res) => {

    const { roll } = req.body;

    if (!roll) {
        return res.json({ status: 'error', message: 'Roll required' });
    }

    try {
        const html = await fetchResult(roll);

        if (html.includes('No Records Found')) {
            return res.json({ status: 'not_found' });
        }

        const data = parseResult(html);

        res.json({ status: 'success', data });

    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});


// =========================
// 🚀 START SERVER
// =========================
app.listen(3001, () => {
    console.log('🚀 Server running on http://localhost:3001');
});