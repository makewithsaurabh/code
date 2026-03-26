let allStudents = [];
let schoolName = "";

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

function getResultClass(res) {
    if(!res) return '';
    const r = res.toLowerCase();
    if(r.includes('first')) return 'res-1st';
    if(r.includes('second')) return 'res-2nd';
    if(r.includes('third')) return 'res-3rd';
    if(r.includes('fail')) return 'res-fail';
    if(r.includes('pass')) return 'res-pass';
    return '';
}

// Settings Listeners
document.getElementById('cfg-personal')?.addEventListener('change', renderTable);
document.getElementById('cfg-mother')?.addEventListener('change', renderTable);

// Fetching
async function fetchSingleStudent() {
    const rollVal = document.getElementById('rollInput').value;
    const clsVal = document.getElementById('classSelect').value.replace('th','');
    if(!rollVal) return alert('Enter Roll');
    try {
        const res = await fetch('http://localhost:3001/result', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ roll: rollVal, class: clsVal })
        });
        const resp = await res.json();
        if(resp.status === 'success') {
            showMarksheet(resp.data);
        } else {
            alert('Status: ' + resp.status + '\nMsg: ' + (resp.message || 'Result not found'));
        }
    } catch(e) { 
        console.error(e);
        alert('Error fetching result'); 
    }
}

async function startSchoolFetch() {
    const baseRoll = parseInt(document.getElementById('rollInput').value);
    if(isNaN(baseRoll)) return alert('Enter a valid Roll Number');

    allStudents = [];
    schoolName = "";
    document.getElementById('tableBody').innerHTML = '';
    document.getElementById('resultsArea').classList.remove('hidden');
    document.getElementById('ds-school-name').innerText = "Fetching Results...";

    // 1. Fetch the base student first to identify the school
    try {
        const firstRes = await fetch('http://localhost:3001/result', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ roll: baseRoll })
        });
        const firstData = await firstRes.json();
        
        if(firstData.status === 'success') {
            const student = firstData.data;
            allStudents.push(student);
            schoolName = student.school || "Specified School";
            document.getElementById('ds-school-name').innerText = schoolName;
            updateDashboard();
        } else {
            return alert('Base Roll No not found. Please check and try again.');
        }
    } catch(e) {
        console.error(e);
        return alert('Error connecting to server.');
    }

    // 2. Loop through nearby roll numbers (+/- 100)
    const startRange = baseRoll - 100;
    const endRange = baseRoll + 100;

    for(let r = startRange; r <= endRange; r++) {
        if(r === baseRoll) continue;

        // Fetch in background (one by one or small batches)
        // We'll do one by one to keep it "real-time" and respect rate limits
        try {
            const res = await fetch('http://localhost:3001/result', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ roll: r })
            });
            const resp = await res.json();
            
            if(resp.status === 'success') {
                const s = resp.data;
                // Only add if it belongs to the same school
                if(s.school === schoolName) {
                    allStudents.push(s);
                    updateDashboard(); // Updates UI immediately
                }
            }
        } catch(e) {
            console.warn(`Failed to fetch roll ${r}`, e);
        }
    }
}

function updateDashboard() {
    allStudents.sort((a,b) => parseInt(a.roll) - parseInt(b.roll));
    renderTable();
    updateMetaPills();
    updateGroupFilter();
}

function renderTable() {
    const head = document.getElementById('tableHead');
    const body = document.getElementById('tableBody');
    const showPersonal = document.getElementById('cfg-personal').checked;
    const showMother = document.getElementById('cfg-mother').checked;

    // Prepare headers
    let htmlHead = `<tr><th>S.No</th><th>Roll No</th>`;
    if(showPersonal) { htmlHead += `<th>Name</th><th>Father</th>`; if(showMother) htmlHead += `<th>Mother</th>`; }
    htmlHead += `<th>Total</th><th>%</th><th>Result</th></tr>`;
    head.innerHTML = htmlHead;

    // Prepare Rows
    const filter = document.getElementById('groupFilter').value;
    body.innerHTML = allStudents.filter(s => filter === 'All' || s.group === filter).map((s, idx) => `
        <tr>
            <td>${idx+1}</td>
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
    const rate = ((passed/total)*100).toFixed(1);
    document.getElementById('ds-meta-pills').innerHTML = `
        <span class="meta-pill"><i class="fas fa-users me-1"></i>${total} Students</span>
        <span class="meta-pill"><i class="fas fa-check-circle me-1"></i>${passed} Passed</span>
        <span class="meta-pill"><i class="fas fa-percentage me-1"></i>${rate}% Pass Rate</span>
    `;
}

function updateGroupFilter() {
    const groups = [...new Set(allStudents.map(s => s.group).filter(Boolean))];
    const sel = document.getElementById('groupFilter');
    const curr = sel.value;
    sel.innerHTML = '<option value="All">All Groups</option>' + groups.map(g => `<option value="${g}">${g}</option>`).join('');
    sel.value = curr;
}

function runFilter() { renderTable(); }

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
            <td>${idx+1}. ${m.subject}</td>
            <td>${m.theory}</td>
            <td>${m.sessional}</td>
            <td class="fw-bold">${m.total}</td>
        </tr>
    `).join('');
    document.getElementById('msOverlay').classList.add('open');
}

// Exports
function exportToExcel() {
    if(!allStudents.length) return alert('No data to export');
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
    if(!allStudents.length) return alert('No data to export');
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
    if(confirm('Clear all cached results?')) {
        allStudents = [];
        document.getElementById('resultsArea').classList.add('hidden');
        alert('History Cleared');
    }
}
