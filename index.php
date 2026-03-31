<?php
// RBSE RESULT PORTAL V14.0.0 - PHP FRONTEND
include 'includes/header.php';
?>

<div class="main-wrapper">
    <?php include 'includes/drawer.php'; ?>

    <nav class="navbar navbar-expand-lg">
        <div class="container-fluid px-4 align-items-center">
            <button class="menu-trigger me-3" onclick="toggleDrawer()">
                <i class="fas fa-bars"></i>
            </button>
            <a class="navbar-brand d-flex align-items-center" href="#">
                <div class="logo-box me-2">R</div>
                <div class="brand-text">
                    <span class="d-block">RAJASTHAN</span>
                    <small>Result Portal 2026</small>
                </div>
            </a>
            <div class="ms-auto d-flex align-items-center gap-3">
                <div id="connectionStatus" class="status-indicator">
                    <span class="status-dot online"></span>
                    <span class="status-text text-white-50">NODE_ENGINE_V14.0.0</span>
                </div>
            </div>
        </div>
    </nav>

    <main class="container-fluid px-4 py-4">
        <!-- SEARCH SEARCH_CARD -->
        <div class="card search-card mb-4">
            <div class="card-body p-4">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label elite-label">Roll Number</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-id-card"></i></span>
                            <input type="number" id="rollNumber" class="form-control elite-input" placeholder="Enter Roll Number" autocomplete="off">
                            <div id="historyBubble" class="history-bubble"></div>
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-3">
                        <label class="form-label elite-label">Year</label>
                        <select id="examYear" class="form-select elite-select">
                            <option value="2026" selected>2026 (Live)</option>
                            <option value="2025">2025</option>
                        </select>
                    </div>
                    <div class="col-lg-2 col-md-3">
                        <label class="form-label elite-label">Class</label>
                        <select id="examClass" class="form-select elite-select" onchange="toggleStream()">
                            <option value="12">12th (Senior)</option>
                            <option value="10">10th (Secondary)</option>
                        </select>
                    </div>
                    <div class="col-lg-2 col-md-6" id="streamContainer">
                        <label class="form-label elite-label">Stream</label>
                        <select id="examStream" class="form-select elite-select">
                            <option value="science">Science</option>
                            <option value="commerce">Commerce</option>
                            <option value="arts">Arts</option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6 d-flex gap-2">
                        <button class="btn btn-primary elite-btn w-100" id="fetchSingle" onclick="fetchResult('single')">
                            <i class="fas fa-search me-2"></i>SINGLE
                        </button>
                        <button class="btn btn-secondary elite-btn w-100" id="fetchFull" onclick="fetchResult('full')">
                            <i class="fas fa-users me-2"></i>SCHOOL
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- RESULTS REGION -->
        <div id="resultsArea" style="display: none;">
            <div class="row mb-3 align-items-center">
                <div class="col">
                    <h5 class="section-title mb-0" id="resultTitle">School Result Report</h5>
                </div>
                <div class="col-auto d-flex gap-2">
                    <button class="btn btn-outline-light btn-sm" onclick="exportToExcel()">
                        <i class="fas fa-file-excel me-1"></i>Excel
                    </button>
                    <button class="btn btn-outline-light btn-sm" onclick="generatePDF()">
                        <i class="fas fa-file-pdf me-1"></i>PDF Report
                    </button>
                </div>
            </div>

            <div class="row g-4">
                <div class="col-lg-8">
                    <!-- MAIN TABLE CARD -->
                    <div class="card table-card">
                        <div class="student-table-container">
                            <table class="student-table" id="resultsTable">
                                <thead>
                                    <!-- Header injected via script -->
                                </thead>
                                <tbody>
                                    <!-- Data injected via script -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <!-- STATS / SUMMARY PANEL -->
                    <div class="card summary-panel mb-4">
                        <div class="summary-panel-header">
                            <h6><i class="fas fa-chart-pie me-2"></i>Performance Summary</h6>
                        </div>
                        <div id="schoolSummary">
                            <!-- Summary injected here -->
                        </div>
                    </div>

                    <!-- TOPPERS PANEL -->
                    <div class="card summary-panel">
                        <div class="summary-panel-header">
                            <h6><i class="fas fa-award me-2"></i>School Toppers</h6>
                        </div>
                        <div id="topperList">
                            <!-- Toppers injected here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</div>

<?php include 'includes/marksheet.php'; ?>
<?php include 'includes/footer.php'; ?>

<!-- TOAST CONTAINER -->
<div class="toast-container position-fixed bottom-0 start-0 p-3"></div>

<!-- SCRIPTS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="script.js"></script>

</body>
</html>
