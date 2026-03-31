    <!-- DRAWER OVERLAY -->
    <div class="drawer-overlay" id="drawerOverlay" onclick="toggleDrawer()"></div>

    <!-- SETTINGS DRAWER -->
    <div class="drawer shadow-lg" id="settingsDrawer">
        <div class="drawer-header">
            <h5><i class="fas fa-cog me-2"></i>Portal Settings</h5>
            <button class="btn-close btn-close-white" onclick="toggleDrawer()"></button>
        </div>
        <div class="drawer-body">
            <!-- DISPLAY MODE -->
            <div class="mb-4">
                <label class="drawer-label"><i class="fas fa-desktop me-2"></i>Display Mode</label>
                <div class="d-flex gap-2 mt-2">
                    <button class="btn-toggle active" id="mode-classic" onclick="setMode('classic')">Standard</button>
                    <button class="btn-toggle" id="mode-compact" onclick="setMode('compact')">Compact</button>
                </div>
            </div>

            <!-- RESULT SETTINGS -->
            <div class="mb-4">
                <label class="drawer-label"><i class="fas fa-sliders-h me-2"></i>Table Columns</label>
                <div class="form-check form-switch mt-2">
                    <input class="form-check-input" type="checkbox" id="cfg-personal" checked onchange="renderTable()">
                    <label class="form-check-label text-white-50" for="cfg-personal">Personal Details</label>
                </div>
                <div class="form-check form-switch mt-2">
                    <input class="form-check-input" type="checkbox" id="cfg-mother" checked onchange="renderTable()">
                    <label class="form-check-label text-white-50" for="cfg-mother">Mother's Name</label>
                </div>
            </div>

            <hr class="border-secondary opacity-25">

            <!-- LOCAL STORAGE -->
            <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <label class="drawer-label mb-0"><i class="fas fa-history me-2"></i>Recent Searches</label>
                    <button class="btn btn-sm btn-outline-danger py-0" id="clearHistoryBtn" onclick="clearLocalHistory()">Clear All</button>
                </div>
                <div id="historyList" class="history-list mt-2">
                    <!-- History items will be injected here -->
                </div>
            </div>
            
            <!-- HELP & SUPPORT -->
            <div class="drawer-help text-center mt-auto">
                <p class="text-white-50 mb-2 small">Need help with high-concurrency caching?</p>
                <a href="https://t.me/+VLaG_7R6BZI3ODI1" target="_blank" class="btn btn-primary btn-sm w-100">
                    <i class="fab fa-telegram me-2"></i>Support Official
                </a>
            </div>
        </div>
    </div>
