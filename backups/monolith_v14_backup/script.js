let allStudents = [];
let schoolName = "";
// 🔥 SMART API ROUTING: Pointing to new Render Backend
const API_URL = "https://code-pu9c.onrender.com/result";

// ── UTILITIES ──
function showErrorPopup(msg) {
    const overlay = document.getElementById('errorOverlay');
    const msgEl = document.getElementById('errorPopupMsg');
    if (overlay && msgEl) {
        msgEl.innerText = msg;
        overlay.classList.add('open');
    }
}

function closeErrorPopup() {
    const overlay = document.getElementById('errorOverlay');
    if (overlay) overlay.classList.remove('open');
}

function updateLoaderText(roll) {
    const el = document.getElementById('loaderSubText');
    if (el) {
        if (roll) {
            el.innerText = `Checking Result Roll No. ${roll}...`;
        } else {
            el.innerText = "Processing your request...";
        }
    }
}

// ── SEARCH HISTORY LOGIC ──
function saveSearchToHistory(type, data) {
    let history = JSON.parse(localStorage.getItem('search_history') || '[]');
    // Keep internal consistency with the "elite" keys
    const entry = { type, ...data, timestamp: Date.now() };
    
    // De-duplicate: If same roll exists, remove it first
    history = history.filter(h => h.roll !== data.roll);
    history.unshift(entry);
    
    // Limit to 10 entries
    if (history.length > 10) history.pop();
    localStorage.setItem('search_history', JSON.stringify(history));
}

function renderHistoryBubble() {
    const bubble = document.getElementById('inputHistoryBubble');
    const list = document.getElementById('historyList');
    if (!bubble || !list) return;

    const history = JSON.parse(localStorage.getItem('search_history') || '[]');
    const studentHistory = history.filter(h => h.type === 'student');

    if (studentHistory.length === 0) {
        bubble.classList.add('hidden');
        return;
    }

    list.innerHTML = studentHistory.map(h => `
        <div class="history-item" onclick="applyHistoryEntry('${h.roll}', '${h.class}', '${h.stream}')">
            <span class="roll">${h.roll}</span>
            <span class="meta">${h.label || 'Student'} | ${h.class}TH</span>
        </div>
    `).join('');
    
    bubble.classList.remove('hidden');
}

function applyHistoryEntry(roll, cls, stream) {
    document.getElementById('rollInput').value = roll;
    selectCustomOption('class', cls + 'th', cls + 'th');
    if (cls === '12') {
        document.getElementById('streamContainer').style.display = 'block';
        selectCustomOption('stream', stream, stream.charAt(0).toUpperCase() + stream.slice(1));
    }
    document.getElementById('inputHistoryBubble').classList.add('hidden');
}

// UI Helpers
function toggleDrawer() {
    const btn = document.getElementById('menuToggle');
    const drawer = document.getElementById('appDrawer');
    const overlay = document.getElementById('drawerOverlay');

    // Contextual Action: If in submenu, act as "Back"
    if (btn.classList.contains('showing-submenu')) {
        toggleDrawerSubmenu();
        return;
    }

    btn.classList.toggle('open');
    drawer.classList.toggle('open');
    overlay.classList.toggle('open');
}

function toggleDrawerSubmenu() {
    const mainMenu = document.getElementById('drawerMainMenu');
    const settingsMenu = document.getElementById('drawerSettingsMenu');
    const menuToggle = document.getElementById('menuToggle');

    const enteringSubmenu = mainMenu.style.display !== 'none';

    if (enteringSubmenu) {
        mainMenu.style.display = 'none';
        settingsMenu.style.display = 'block';
        menuToggle.classList.add('showing-submenu');
    } else {
        mainMenu.style.display = 'block';
        settingsMenu.style.display = 'none';
        menuToggle.classList.remove('showing-submenu');
    }
}

function closeDrawer() {
    document.getElementById('menuToggle').classList.remove('open');
    document.getElementById('appDrawer').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('open');
}
function closeMS(e) {
    document.getElementById('msOverlay').classList.remove('open');
}

// Form Helpers
function getSelectedValues() {
    return {
        roll: document.getElementById('rollInput').value,
        class: document.getElementById('classSelect').value.replace('th', ''),
        year: document.getElementById('yearSelect').value,
        stream: document.getElementById('streamSelect').value
    };
}

function toggleCustomSelect(type) {
    const wrapper = document.getElementById(type + 'SelectWrapper');
    const wasOpen = wrapper.classList.contains('open');
    closeAllCustomSelects();
    if (!wasOpen) wrapper.classList.add('open');
}

function selectCustomOption(type, value, label) {
    document.getElementById(type + 'Select').value = value;
    document.getElementById(type + 'SelectLabel').innerText = label;

    // Select visual sync
    const opts = document.querySelectorAll(`#${type}Options .custom-option`);
    opts.forEach(o => o.classList.toggle('selected', o.innerText === label));

    closeAllCustomSelects();
    if (type === 'class') toggleStreamView();
}

function closeAllCustomSelects() {
    document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
}

// ── TOAST ENGINE (PRO) ──
function showToast(message, type = 'error') {
    console.log(`[TOAST] ${type.toUpperCase()}: ${message}`);

    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' : (type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle');

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove after 4.5 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 4500);
}

// Click outside handler
document.addEventListener('click', function (e) {
    if (!e.target.closest('.custom-select-wrapper')) {
        closeAllCustomSelects();
    }
});
function toggleStreamView() {
    const cls = document.getElementById('classSelect').value;
    const streamContainer = document.getElementById('streamContainer');

    if (cls === '12th' || cls === '12') {
        streamContainer.classList.remove('hidden');
        streamContainer.style.display = 'block';
    } else {
        streamContainer.classList.add('hidden');
        streamContainer.style.display = 'none';
        // Hide initial results area when switching back to 10th
        document.getElementById('resultsArea')?.classList.add('hidden');
    }
}

function getResultClass(res) {
    if (!res) return '';
    const r = res.toLowerCase();
    if (r.includes('first')) return 'res-1st';
    if (r.includes('second')) return 'res-2nd';
    if (r.includes('third')) return 'res-3rd';
    if (r.includes('fail')) return 'res-fail';
    if (r.includes('pass')) return 'res-pass';
    return '';
}

// Settings Listeners
document.getElementById('cfg-personal')?.addEventListener('change', renderTable);
document.getElementById('cfg-mother')?.addEventListener('change', renderTable);

// Fetching
async function fetchSingleStudent() {
    console.log("🚀 [SEARCH] Single Student Result Clicked!");
    const { roll: rollVal, class: clsVal, year: yearVal, stream: streamVal } = getSelectedValues();
    console.log(`🔍 [DETAILS] Roll=${rollVal}, Class=${clsVal}, Stream=${streamVal}`);

    if (!rollVal) return showToast('Please enter a Roll Number', 'warning');

    updateLoaderText(rollVal);
    document.getElementById('globalLoader').classList.remove('hidden');
    document.getElementById('btnSchool').disabled = true;
    document.getElementById('btnStudent').disabled = true;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roll: rollVal, class: clsVal, year: yearVal, stream: streamVal })
        });
        const resp = await res.json();

        if (resp.status === 'success') {
            const student = resp.data;
            student.percentage = student.per; // Sync
            
            // 🔥 SAVE TO HISTORY
            saveSearchToHistory('student', { 
                roll: rollVal, 
                label: student.name, 
                class: clsVal, 
                stream: streamVal 
            });
            
            showMarksheet(student);
        } else {
            allStudents = [];
            updateEmptyStateFor12th();
            document.getElementById('resultsArea').classList.remove('hidden');
            renderTable();
            showErrorPopup('Result not found for this roll number. Check roll number and try again.');
        }
    } catch (e) {
        console.error(e);
        showToast('Server connection failed. Please try again.', 'error');
    } finally {
        document.getElementById('globalLoader').classList.add('hidden');
        document.getElementById('btnSchool').disabled = false;
        document.getElementById('btnStudent').disabled = false;
    }
}

async function startSchoolFetch() {
    const { roll: baseRollStr, class: clsVal, year: yearVal, stream: streamVal } = getSelectedValues();
    const baseRoll = parseInt(baseRollStr);

    if (isNaN(baseRoll)) return showToast('Please enter a valid numeric Roll Number', 'warning');

    const loader = document.getElementById('globalLoader');
    const resultsArea = document.getElementById('resultsArea');

    updateLoaderText(baseRollStr);
    loader.classList.remove('hidden');
    resultsArea.classList.add('hidden');
    document.getElementById('btnSchool').disabled = true;
    document.getElementById('btnStudent').disabled = true;

    allStudents = [];
    const fetchedRolls = new Set(); // Track unique roll numbers
    schoolName = "";
    document.getElementById('tableBody').innerHTML = '';
    document.getElementById('ds-school-name').innerText = "Searching School...";


    try {
        let discoveredStudent = null;
        let discoveredRoll = null;

        // 1. Smart Discovery Logic (+/- 10 Probes)
        const probeOffsets = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10];

        for (const offset of probeOffsets) {
            const currentRoll = baseRoll + offset;

            try {
                updateLoaderText(currentRoll);
                const res = await fetch(API_URL, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roll: currentRoll, class: clsVal, year: yearVal, stream: streamVal })
                });
                const data = await res.json();

                if (data.status === 'success') {
                    discoveredStudent = data.data;
                    discoveredRoll = currentRoll;
                    if (offset !== 0) {
                        showToast(`Discovered school via nearby Roll: ${currentRoll}`, 'success');
                    }
                    break;
                }
            } catch (e) {
                console.warn(`Probe failed at ${currentRoll}`, e);
            }
        }

        if (!discoveredStudent) {
            updateEmptyStateFor12th();
            showToast('No Result found. Check roll number and try again.', 'error');
            document.getElementById('resultsArea').classList.remove('hidden');
            renderTable();
            return;
        }

        // 2. Base student identified, setup school context
        discoveredStudent.percentage = discoveredStudent.per;
        allStudents.push(discoveredStudent);
        fetchedRolls.add(discoveredRoll || baseRoll); // Mark as fetched
        schoolName = discoveredStudent.school || "Specified School";
        document.getElementById('ds-school-name').innerText = schoolName;
        updateDashboard();

        // Show results area while keeping loader active for the rest of the batch
        resultsArea.classList.remove('hidden');

        // 3. Loop through nearby roll numbers (Optimized Batch)
        const baseSchool = (schoolName || "").trim().toUpperCase();

        const fetchDirection = async (direction) => {
            let consecutiveMisses = 0;
            for (let i = 1; i <= 100; i++) {
                const r = baseRoll + (i * direction);

                // Skip if already found during probe
                if (fetchedRolls.has(r)) continue;

                try {
                    updateLoaderText(r);
                    const res = await fetch(API_URL, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ roll: r, class: clsVal, year: yearVal, stream: streamVal })
                    });
                    const resp = await res.json();

                    if (resp.status === 'success') {
                        consecutiveMisses = 0;
                        const s = resp.data;
                        s.percentage = s.per;
                        if ((s.school || "").trim().toUpperCase() === baseSchool) {
                            if (!fetchedRolls.has(r)) {
                                allStudents.push(s);
                                fetchedRolls.add(r);
                                updateDashboard();
                            }
                        }
                    } else {
                        consecutiveMisses++;
                    }
                } catch (e) {
                    consecutiveMisses++;
                }

                if (consecutiveMisses >= 15) {
                    console.log(`[ABORT] Direction ${direction} quiet at ${r}`);
                    break; // Dead zone detected
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        };

        loader.classList.remove('hidden'); // Show for batch progress

        // V11.0.0 Sonic Speed: Parallel Directional Sweeps
        await Promise.all([
            fetchDirection(1),  // Sweep UP
            fetchDirection(-1)  // Sweep DOWN
        ]);

    } catch (e) {
        console.error(e);
        showToast('Error during school fetch.', 'error');
    } finally {
        loader.classList.add('hidden');
        document.getElementById('btnSchool').disabled = false;
        document.getElementById('btnStudent').disabled = false;
    }
}

function updateDashboard() {
    const { class: clsVal } = getSelectedValues();
    const totalMarks = clsVal === '12' ? 500 : 600;

    // Global Data Sync & Cleanup
    allStudents.forEach(s => {
        // Sync percentage fields
        if (!s.percentage) s.percentage = s.per;
        if (!s.per) s.per = s.percentage;
        
        // Fix missing percentages
        if (s.total && !s.per) {
            s.per = ((parseInt(s.total) / totalMarks) * 100).toFixed(2);
            s.percentage = s.per;
        }

        // Create numeric per_val for robust sorting/rankings
        s.per_val = parseFloat(s.per) || 0;
    });

    allStudents.sort((a, b) => parseInt(a.roll) - parseInt(b.roll));
    renderTable();
    updateMetaPills();
    renderSummary();
}

function getResultClass(res) {
    if (!res) return '';
    const r = res.toLowerCase();
    
    // Check Divisions First
    if (r.includes('first')) return 'badge-1st';
    if (r.includes('second')) return 'badge-2nd';
    if (r.includes('third')) return 'badge-3rd';
    
    // Check status
    if (r.includes('pass')) return 'badge-1st'; // Fallback to green for general "Pass"
    if (r.includes('fail')) return 'badge-fail';
    if (r.includes('abs')) return 'badge-absent';
    if (r.includes('supp') || r.includes('comp')) return 'badge-supp';
    
    return '';
}

function getRowClass(res) {
    if (!res) return '';
    // Absent students are now normalized as requested
    return '';
}

function shortenResult(res) {
    if (!res) return '';
    const r = res.toLowerCase();
    if (r.includes('first')) return '1ST Div.';
    if (r.includes('second')) return '2ND Div.';
    if (r.includes('third')) return '3RD Div.';
    if (r.includes('pass')) return 'PASS';
    if (r.includes('fail')) return 'FAIL';
    if (r.includes('abs')) return 'ABSENT';
    if (r.includes('supp') || r.includes('comp')) return 'SUPP.';
    return res;
}

function renderTable() {
    const head = document.getElementById('tableHead');
    const body = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const schoolBanner = document.getElementById('schoolBanner');
    const actionBtns = document.getElementById('actionButtons');
    const showPersonal = document.getElementById('cfg-personal').checked;
    const showMother = document.getElementById('cfg-mother').checked;

    if (allStudents.length === 0) {
        emptyState.classList.remove('hidden');
        if (schoolBanner) schoolBanner.classList.add('hidden');
        if (actionBtns) actionBtns.classList.add('hidden'); // Hide buttons
        body.innerHTML = '';
        return;
    } else {
        emptyState.classList.add('hidden');
        if (schoolBanner) schoolBanner.classList.remove('hidden');
        if (actionBtns) actionBtns.classList.remove('hidden'); // Show buttons
    }

    // Prepare headers
    let htmlHead = `<tr><th>S.No</th><th>Roll No</th>`;
    if (showPersonal) { htmlHead += `<th>Name</th><th>Father</th>`; if (showMother) htmlHead += `<th>Mother</th>`; }
    htmlHead += `<th>Total</th><th>%</th><th>Result</th></tr>`;
    head.innerHTML = htmlHead;

    // Prepare Rows
    body.innerHTML = allStudents.map((s, idx) => `
        <tr class="${getRowClass(s.result)}">
            <td>${idx + 1}</td>
            <td class="roll-link" onclick="showMarksheetByIndex(${allStudents.indexOf(s)})">${s.roll}</td>
            ${showPersonal ? `<td>${s.name}</td><td>${s.father}</td>` : ''}
            ${showPersonal && showMother ? `<td>${s.mother || '-'}</td>` : ''}
            <td>${s.total}</td>
            <td>${s.percentage}</td>
            <td><span class="result-badge ${getResultClass(s.result)}">${shortenResult(s.result)}</span></td>
        </tr>
    `).join('');
}

function updateMetaPills() {
    const total = allStudents.length;
    const passed = allStudents.filter(s => {
        const r = (s.result || "").toLowerCase();
        return (r.includes('first') || r.includes('second') || r.includes('third') || r.includes('pass')) && 
               !r.includes('fail') && !r.includes('abs');
    }).length;
    const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    document.getElementById('ds-meta-pills').innerHTML = `
        <span class="meta-pill"><i class="fas fa-users me-1"></i>${total} Students</span>
        <span class="meta-pill"><i class="fas fa-check-circle me-1"></i>${passed} Passed</span>
        <span class="meta-pill"><i class="fas fa-percentage me-1"></i>${rate}% Pass Rate</span>
    `;
}

function showMarksheetByIndex(idx) { showMarksheet(allStudents[idx]); }

function showMarksheet(s) {
    document.getElementById('ms-st-name').innerText = s.name;
    document.getElementById('ms-st-roll').innerText = s.roll;
    document.getElementById('ms-st-father').innerText = s.father;
    document.getElementById('ms-st-mother').innerText = s.mother || '-';
    document.getElementById('ms-school-name').innerText = s.school || schoolName || '(SCHOOL NAME)';
    document.getElementById('ms-total').innerText = s.total;
    document.getElementById('ms-stat-total').innerText = s.total;
    document.getElementById('ms-stat-per').innerText = s.percentage + '%';
    const resEl = document.getElementById('ms-res');
    resEl.innerText = (s.result || "").toUpperCase();
    resEl.className = 'ms-stat-val ' + getResultClass(s.result);

    const cls = document.getElementById('classSelect').value;
    document.getElementById('ms-class-label').innerText = 'Class: ' + cls;

    const is12th = cls === '12th' || cls === '12';
    const headEl = document.getElementById('ms-table-head');
    const footerLabel = document.querySelector('.ms-table tfoot td:first-child');

    if (is12th) {
        headEl.innerHTML = `<tr><th>Subject</th><th>TH</th><th>SS</th><th>TH+SS</th><th>PR</th><th>Total</th></tr>`;
        footerLabel.colSpan = 5;
        document.getElementById('ms-marks-body').innerHTML = (s.marks || []).map((m, idx) => `
            <tr>
                <td class="text-start">${idx + 1}. ${m.subject}</td>
                <td>${m.th || '—'}</td>
                <td>${m.ss || '—'}</td>
                <td>${m.thss || '—'}</td>
                <td>${m.pr || '—'}</td>
                <td class="fw-bold">${m.total || '—'}</td>
            </tr>
        `).join('');
    } else {
        headEl.innerHTML = `<tr><th>Subject</th><th>TH</th><th>SS</th><th>Total</th></tr>`;
        footerLabel.colSpan = 3;
        document.getElementById('ms-marks-body').innerHTML = (s.marks || []).map((m, idx) => `
            <tr>
                <td class="text-start">${idx + 1}. ${m.subject}</td>
                <td>${m.th || '—'}</td>
                <td>${m.ss || '—'}</td>
                <td class="fw-bold">${m.total || '—'}</td>
            </tr>
        `).join('');
    }
    document.getElementById('msOverlay').classList.add('open');
}

// Exports
function exportToExcel() {
    if (!allStudents.length) return showToast('No data to export', 'warning');
    const data = allStudents.map(s => ({
        "Roll No": s.roll,
        "Name": s.name,
        "Father Name": s.father,
        "Mother Name": s.mother || '',
        "Total Marks": s.total,
        "Percentage": s.percentage,
        "Division/Result": s.result
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `${schoolName}_Results.xlsx`);
}

function generatePDF() {
    if (!allStudents.length) return showToast('No data to export', 'warning');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');

    doc.setFontSize(16);
    doc.setTextColor(204, 0, 0);
    doc.text(schoolName, 40, 40);
    doc.setFontSize(10);
    doc.setTextColor(13, 27, 62);
    doc.text("Class 10th/12th Result | DevSaurabh.com", 40, 55);

    const tableData = allStudents.map(s => [s.roll, s.name, s.father, s.total, s.percentage, s.result]);
    doc.autoTable({
        startY: 70,
        head: [['Roll No', 'Name', 'Father', 'Total', '%', 'Result']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [13, 27, 62] },
        styles: { fontSize: 8 }
    });
    doc.save(`${schoolName}_Official_Report.pdf`);
}

async function downloadMSImage() {
    const el = document.getElementById('msCard');
    if (!el) return;
    
    const studentName = document.getElementById('ms-st-name').innerText.trim().replace(/\s+/g, '_');
    const rollNumber = document.getElementById('ms-st-roll').innerText.trim();
    const siteDomain = "bser-result.page.gd";

    // 🚀 NEW: Robust Capture - ensure full height is captured even if scrollable
    const canvas = await html2canvas(el, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        height: el.scrollHeight,
        windowHeight: el.scrollHeight
    });

    const link = document.createElement('a');
    link.download = `${studentName}_${rollNumber}_Official_Marksheet.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function clearLocalHistory() {
    if (confirm('Are you sure you want to clear all cached results?')) {
        allStudents = [];
        document.getElementById('resultsArea').classList.add('hidden');
        showToast('History Cleared successfully', 'success');
    }
}

// --- ADVANCED ANALYTICS ---
function renderSummary() {
    if (!allStudents.length) {
        document.getElementById('analyticsSection').classList.add('hidden');
        return;
    }
    document.getElementById('analyticsSection').classList.remove('hidden');

    // 1. Division Summary
    let total = allStudents.length;
    let div1 = 0, div2 = 0, div3 = 0, supp = 0, fail = 0, abs = 0;

    // 2. Subject Summary Map
    const subStats = {};

    allStudents.forEach(s => {
        if (!s || !s.result) return;

        // Division count (Only if passed/not failed)
        const res = (s.result || "").toLowerCase();

        // 🔥 Ensure per is calculated if missing (Dynamic Base Marks)
        const { class: clsVal } = getSelectedValues();
        const totalMarks = (clsVal === '12' || clsVal === '12th') ? 500 : 600;
        
        if (!s.per && s.total) {
            s.per = ((parseInt(s.total) / totalMarks) * 100).toFixed(2);
        }
        const per = parseFloat(s.per) || 0;

        const { class: clsValCurrent } = getSelectedValues();
        const totalMarksCurrent = (clsValCurrent === '12' || clsValCurrent === '12th') ? 500 : 600;

        if (!res.includes('fail') && !res.includes('abs')) {
            const perNum = s.per_val || (s.total ? (parseInt(s.total) / totalMarksCurrent) * 100 : 0);
            if (perNum >= 60) div1++;
            else if (perNum >= 45) div2++;
            else if (perNum >= 33) div3++;
            
            if (res.includes('supp') || res.includes('comp')) supp++;
        } else {
            if (res.includes('abs')) abs++;
            if (res.includes('fail')) fail++;
        }

        // Subject aggregation
        if (s.marks && Array.isArray(s.marks)) {
            s.marks.forEach(m => {
                const sub = m.subject.trim();
                if (!subStats[sub]) {
                    subStats[sub] = { total: 0, first: 0, second: 0, third: 0, less40: 0, dist: 0, supp: 0, fail: 0, abs: 0, passed: 0 };
                }
                const st = subStats[sub];
                st.total++;

                const mTotal = parseInt(m.total) || 0;
                const mTheory = parseInt(m.theory) || 0;
                const mRes = (m.result || "").toLowerCase();

                if (mRes.includes('abs')) st.abs++;
                else if (mRes.includes('fail')) st.fail++;
                else {
                    st.passed++;
                    if (mTotal >= 60) st.first++;
                    else if (mTotal >= 45) st.second++;
                    else if (mTotal >= 33) st.third++;

                    if (mTotal >= 75) st.dist++;
                }

                // Theory < 40% (Assuming 80 marks max, < 32)
                if (!isNaN(mTheory) && mTheory < 32 && !mRes.includes('abs')) st.less40++;

                if (mRes.includes('supp')) st.supp++;
            });
        }
    });

    // Render Division Summary
    document.getElementById('divSummaryBody').innerHTML = `
        <tr>
            <td>${total}</td>
            <td style="color: #000; font-weight: 800;">${div1}</td>
            <td style="color: #000; font-weight: 800;">${div2}</td>
            <td style="color: #000; font-weight: 800;">${div3}</td>
            <td style="color: #c00; font-weight: 800;">${supp}</td>
            <td style="color: #c00; font-weight: 800;">${fail}</td>
            <td style="color: #c00; font-weight: 800;">${abs}</td>
        </tr>
    `;

    // Render Subject Summary
    let subHtml = "";
    Object.keys(subStats).sort().forEach(sub => {
        const s = subStats[sub];
        const passPer = s.total > 0 ? ((s.passed / s.total) * 100).toFixed(2) : '0.00';
        subHtml += `
            <tr>
                <td class="text-start">${sub}</td>
                <td>${s.total}</td>
                <td>${s.first}</td>
                <td>${s.second}</td>
                <td>${s.third}</td>
                <td>${s.less40}</td>
                <td>${s.dist}</td>
                <td class="${s.supp > 0 ? 'text-danger fw-bold' : ''}">${s.supp}</td>
                <td class="${s.fail > 0 ? 'text-danger fw-bold' : ''}">${s.fail}</td>
                <td>${s.abs}</td>
                <td class="fw-bold">${passPer}%</td>
            </tr>
        `;
    });
    document.getElementById('subjectSummaryBody').innerHTML = subHtml;

    // 3. Class Toppers (Strict Pass-Only Filtering)
    const toppers = [...allStudents]
        .filter(s => {
            const res = (s.result || "").toLowerCase();
            return !res.includes('fail') && !res.includes('abs') && s.per_val > 0;
        })
        .sort((a, b) => b.per_val - a.per_val || parseInt(b.total) - parseInt(a.total))
        .slice(0, 3);

    let topperHtml = "";
    toppers.forEach((s, i) => {
        const medalClass = `rank-${i + 1}-icon`;
        topperHtml += `
            <tr>
                <td>
                    <div class="topper-rank-cell">
                        <i class="fas fa-medal rank-icon ${medalClass}"></i> ${i + 1}
                    </div>
                </td>
                <td class="roll-link" onclick="showMarksheetByIndex(${allStudents.indexOf(s)})">${s.roll}</td>
                <td class="text-start" style="font-weight: 700;">${(s.name || "").toUpperCase()}</td>
                <td class="text-start">${(s.father || "").toUpperCase()}</td>
                <td style="font-weight: 700;">${s.total || 0}</td>
                <td style="color: #1A2B4C; font-weight: 800; font-size: 1rem;">${s.per_val.toFixed(2)}%</td>
                <td><span class="result-badge ${getResultClass(s.result)}">${shortenResult(s.result)}</span></td>
            </tr>
        `;
    });
    document.getElementById('topperList').innerHTML = topperHtml || '<tr><td colspan="6" class="text-muted p-4">No eligible toppers found.</td></tr>';
}

// 🔥 INITIALIZATION: Set UI state on load
window.addEventListener('DOMContentLoaded', async () => {
    toggleStreamView(); 
    
    // 🔥 HISTORY LISTENERS
    const rollInput = document.getElementById('rollInput');
    if (rollInput) {
        rollInput.addEventListener('focus', () => {
            renderHistoryBubble();
        });
        // Close bubble when clicking outside
        document.addEventListener('click', (e) => {
            const bubble = document.getElementById('inputHistoryBubble');
            if (bubble && !bubble.contains(e.target) && e.target !== rollInput) {
                bubble.classList.add('hidden');
            }
        });
    }
    
    // Heartbeat check
    console.log("📡 Testing Backend Connection...");
    try {
        const ping = await fetch(API_URL, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ping: true }) 
        });
        if(ping.ok) console.log("✅ Backend Connected!");
    } catch (e) {
        console.error("❌ Backend Connection Failed!");
        showToast("Backend not reachable. Open http://localhost:3001", "error");
    }
});
