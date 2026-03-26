let allStudents = [];
let schoolName = "";

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

// UI Helpers
function toggleDrawer() {
    document.getElementById('appDrawer').classList.toggle('open');
    document.getElementById('drawerOverlay').classList.toggle('open');
}
function toggleSettings() {
    document.getElementById('sideMenu').classList.toggle('open');
    closeDrawer();
}
function closeDrawer() {
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
    const container = document.getElementById('streamContainer');
    container.style.display = (cls === '12th') ? 'block' : 'none';
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
    const { roll: rollVal, class: clsVal, year: yearVal, stream: streamVal } = getSelectedValues();
    if (!rollVal) return showToast('Please enter a Roll Number', 'warning');
    
    try {
        const res = await fetch('http://192.168.1.36:3001/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roll: rollVal, class: clsVal, year: yearVal, stream: streamVal })
        });
        const resp = await res.json();
        
        if (resp.status === 'success') {
            const student = resp.data;
            student.percentage = student.per; // Sync
            showMarksheet(student);
        } else {
            showErrorPopup('Result not found for this roll number. Check roll number and try again.');
        }
    } catch (e) {
        console.error(e);
        showToast('Server connection failed. Please try again.', 'error');
    } finally {
        document.getElementById('globalLoader').classList.add('hidden');
    }
}

async function startSchoolFetch() {
    const { roll: baseRollStr, class: clsVal, year: yearVal, stream: streamVal } = getSelectedValues();
    const baseRoll = parseInt(baseRollStr);

    if (isNaN(baseRoll)) return showToast('Please enter a valid numeric Roll Number', 'warning');

    const loader = document.getElementById('globalLoader');
    const resultsArea = document.getElementById('resultsArea');
    
    loader.classList.remove('hidden');
    resultsArea.classList.add('hidden');

    allStudents = [];
    schoolName = "";
    document.getElementById('tableBody').innerHTML = '';
    document.getElementById('ds-school-name').innerText = "Searching School...";

    
    try {
        let discoveredStudent = null;

        // 1. Smart Discovery Logic (+/- 10 Probes)
        const probeOffsets = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10];
        
        for (const offset of probeOffsets) {
            const currentRoll = baseRoll + offset;
            
            try {
                const res = await fetch('http://192.168.1.36:3001/result', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roll: currentRoll, class: clsVal, year: yearVal, stream: streamVal })
                });
                const data = await res.json();

                if (data.status === 'success') {
                    discoveredStudent = data.data;
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
            showErrorPopup('School range not found. Check roll number and try again.');
            return;
        }

        // 2. Base student identified, setup school context
        discoveredStudent.percentage = discoveredStudent.per;
        allStudents.push(discoveredStudent);
        schoolName = discoveredStudent.school || "Specified School";
        document.getElementById('ds-school-name').innerText = schoolName;
        updateDashboard();
        
        // Hide loader briefly for UI snap
        
        loader.classList.add('hidden');
        resultsArea.classList.remove('hidden');

        // 3. Loop through nearby roll numbers (Optimized Batch)
        const baseSchool = (schoolName || "").trim().toUpperCase();
        
        const fetchDirection = async (direction) => {
            let consecutiveMisses = 0;
            for (let i = 1; i <= 100; i++) {
                const r = baseRoll + (i * direction);
                
                
                try {
                    const res = await fetch('http://192.168.1.36:3001/result', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ roll: r, class: clsVal, year: yearVal, stream: streamVal })
                    });
                    const resp = await res.json();

                    if (resp.status === 'success') {
                        consecutiveMisses = 0;
                        const s = resp.data;
                        s.percentage = s.per;
                        if ((s.school || "").trim().toUpperCase() === baseSchool) {
                            allStudents.push(s);
                            updateDashboard();
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
        await fetchDirection(1);  // Sweep up
        await fetchDirection(-1); // Sweep down

    } catch (e) {
        console.error(e);
        showToast('Error during school fetch.', 'error');
    } finally {
        loader.classList.add('hidden');
    }
}

function updateDashboard() {
    // Global Data Sync & Cleanup
    allStudents.forEach(s => {
        if (!s.percentage) s.percentage = s.per;
        if (!s.per) s.per = s.percentage;
        if (s.total && !s.per) s.per = ((parseInt(s.total) / 600) * 100).toFixed(2);
    });

    allStudents.sort((a, b) => parseInt(a.roll) - parseInt(b.roll));
    renderTable();
    updateMetaPills();
    renderSummary(); 
}

function renderTable() {
    const head = document.getElementById('tableHead');
    const body = document.getElementById('tableBody');
    const showPersonal = document.getElementById('cfg-personal').checked;
    const showMother = document.getElementById('cfg-mother').checked;

    // Prepare headers
    let htmlHead = `<tr><th>S.No</th><th>Roll No</th>`;
    if (showPersonal) { htmlHead += `<th>Name</th><th>Father</th>`; if (showMother) htmlHead += `<th>Mother</th>`; }
    htmlHead += `<th>Total</th><th>%</th><th>Result</th></tr>`;
    head.innerHTML = htmlHead;

    // Prepare Rows
    body.innerHTML = allStudents.map((s, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td class="roll-link" onclick="showMarksheetByIndex(${allStudents.indexOf(s)})">${s.roll}</td>
            ${showPersonal ? `<td>${s.name}</td><td>${s.father}</td>` : ''}
            ${showPersonal && showMother ? `<td>${s.mother || '-'}</td>` : ''}
            <td>${s.total}</td>
            <td>${s.percentage}</td>
            <td class="result-badge ${getResultClass(s.result)}">${s.result}</td>
        </tr>
    `).join('');
}

function updateMetaPills() {
    const total = allStudents.length;
    const passed = allStudents.filter(s => !s.result.includes('Fail')).length;
    const rate = ((passed / total) * 100).toFixed(1);
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
    resEl.innerText = s.result;
    resEl.className = 'ms-stat-val ' + getResultClass(s.result);

    const cls = document.getElementById('classSelect').value;
    document.getElementById('ms-class-label').innerText = 'Class: ' + cls;

    document.getElementById('ms-marks-body').innerHTML = (s.marks || []).map((m, idx) => `
        <tr>
            <td>${idx + 1}. ${m.subject}</td>
            <td>${m.theory}</td>
            <td>${m.sessional}</td>
            <td class="fw-bold">${m.total}</td>
        </tr>
    `).join('');
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
    const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#888' });
    const link = document.createElement('a');
    link.download = `Result_${document.getElementById('ms-st-roll').innerText}.png`;
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
    if(!allStudents.length) {
        document.getElementById('analyticsSection').classList.add('hidden');
        return;
    }
    document.getElementById('analyticsSection').classList.remove('hidden');

    // 1. Division Summary
    let total = allStudents.length;
    let div1 = 0, div2 = 0, div3 = 0;
    
    // 2. Subject Summary Map
    const subStats = {};

    allStudents.forEach(s => {
        if(!s || !s.result) return; 

        // Division count (Only if passed/not failed)
        const res = (s.result || "").toLowerCase();
        
        // Ensure per is calculated if missing (from total/600)
        if (!s.per && s.total) {
            s.per = ((parseInt(s.total) / 600) * 100).toFixed(2);
        }
        const per = parseFloat(s.per) || 0;
        
        if(!res.includes('fail') && !res.includes('abs')) {
            if(per >= 60) div1++;
            else if(per >= 45) div2++;
            else if(per >= 33) div3++;
        }

        // Subject aggregation
        if(s.marks && Array.isArray(s.marks)) {
            s.marks.forEach(m => {
                const sub = m.subject.trim();
                if(!subStats[sub]) {
                    subStats[sub] = { total: 0, first: 0, second: 0, third: 0, less40: 0, dist: 0, supp: 0, fail: 0, abs: 0, passed: 0 };
                }
                const st = subStats[sub];
                st.total++;
                
                const mTotal = parseInt(m.total) || 0;
                const mTheory = parseInt(m.theory) || 0;
                const mRes = (m.result || "").toLowerCase();

                if(mRes.includes('abs')) st.abs++;
                else if(mRes.includes('fail')) st.fail++;
                else {
                    st.passed++;
                    if(mTotal >= 60) st.first++;
                    else if(mTotal >= 45) st.second++;
                    else if(mTotal >= 33) st.third++;
                    
                    if(mTotal >= 75) st.dist++;
                }

                // Theory < 40% (Assuming 80 marks max, < 32)
                if(!isNaN(mTheory) && mTheory < 32 && !mRes.includes('abs')) st.less40++;
                
                if(mRes.includes('supp')) st.supp++;
            });
        }
    });

    // Render Division Summary (Strictly Black as requested)
    document.getElementById('divSummaryBody').innerHTML = `
        <tr>
            <td>${total}</td>
            <td style="color: #000; font-weight: 800;">${div1}</td>
            <td style="color: #000; font-weight: 800;">${div2}</td>
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

    // 3. Class Toppers (Table Format)
    const toppers = [...allStudents].sort((a,b) => parseFloat(b.per) - parseFloat(a.per)).slice(0, 3);
    let topperHtml = "";
    toppers.forEach((s, i) => {
        const medalClass = `rank-${i+1}-icon`;
        topperHtml += `
            <tr>
                <td>
                    <div class="topper-rank-cell">
                        <i class="fas fa-medal rank-icon ${medalClass}"></i> ${i+1}
                    </div>
                </td>
                <td>${s.roll}</td>
                <td class="text-start" style="font-weight: 700;">${(s.name || "").toUpperCase()}</td>
                <td class="text-start">${(s.father || "").toUpperCase()}</td>
                <td style="font-weight: 700;">${s.total}</td>
                <td style="color: #1A2B4C; font-weight: 800; font-size: 1rem;">${s.per}%</td>
            </tr>
        `;
    });
    document.getElementById('topperList').innerHTML = topperHtml || '<tr><td colspan="6" class="text-muted p-4">No toppers identified yet.</td></tr>';
}
