    <!-- GLOBAL FOOTER -->
    <footer class="mt-auto py-3 border-top border-secondary border-opacity-10 text-center">
        <div class="container-fluid">
            <p class="mb-1 text-white-50 small">
                &copy; 2026 Rajasthan Board Result Portal (V14.6.0 Stable). 
                All rights reserved.
            </p>
            <p class="mb-0 text-white-50 extra-small opacity-50">
                Official Marks Scraping Engine Powered by Node.js Worker-10
            </p>
        </div>
    </footer>

    <!-- RE-USABLE ERROR POPUP -->
    <div class="error-overlay" id="errorOverlay" onclick="closeErrorPopup()">
        <div class="error-card" onclick="event.stopPropagation()">
            <div class="error-header">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Action Required</span>
            </div>
            <div class="error-body" id="errorPopupMsg">
                Check roll number and try again.
            </div>
            <div class="error-footer">
                <button class="btn-error-close" onclick="closeErrorPopup()">Okay, Got it</button>
            </div>
        </div>
    </div>
