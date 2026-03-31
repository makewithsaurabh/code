    <!-- STUDENT MODAL (MARK SHEET) -->
    <div class="marksheet-overlay" id="msOverlay" onclick="closeMS(event)">
        <div class="marksheet-card" id="msCard" onclick="event.stopPropagation()">
            <div class="ms-watermark">Tg:-@Saurabhdev_Official</div>
            <div class="marksheet-header text-center">
                <div class="ms-board">RAJASTHAN BOARD OF SECONDARY EDUCATION — 2026</div>
                <div class="ms-school" id="ms-school-name">(SCHOOL NAME)</div>
                <div class="ms-class-year" id="ms-class-label">Class: 10th</div>
            </div>

            <div class="marksheet-body">
                <div class="ms-student-info">
                    <div class="ms-info-row">
                        <div class="ms-info-label">Name</div>
                        <div class="ms-info-value" id="ms-st-name">NAME</div>
                    </div>
                    <div class="ms-info-row">
                        <div class="ms-info-label">Roll No.</div>
                        <div class="ms-info-value" id="ms-st-roll">112233</div>
                    </div>
                    <div class="ms-info-row">
                        <div class="ms-info-label">Father's Name</div>
                        <div class="ms-info-value" id="ms-st-father">FATHER</div>
                    </div>
                    <div class="ms-info-row">
                        <div class="ms-info-label">Mother's Name</div>
                        <div class="ms-info-value" id="ms-st-mother">MOTHER</div>
                    </div>
                </div>

                <table class="ms-table">
                    <thead id="ms-table-head">
                        <tr>
                            <th>Subject</th>
                            <th>TH</th>
                            <th>SS</th>
                            <th>TH+SS</th>
                            <th>PR</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody id="ms-marks-body"></tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5">Total Marks</td>
                            <td id="ms-total">0</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="ms-result-bar">
                    <div class="ms-stat">
                        <div class="ms-stat-val" id="ms-stat-total">0</div>
                        <div class="ms-stat-label">Total</div>
                    </div>
                    <div class="ms-divider"></div>
                    <div class="ms-stat">
                        <div class="ms-stat-val" id="ms-stat-per">0%</div>
                        <div class="ms-stat-label">Percentage</div>
                    </div>
                    <div class="ms-divider"></div>
                    <div class="ms-stat">
                        <div class="ms-stat-val ms-res-text" id="ms-res">Result</div>
                        <div class="ms-stat-label">Result</div>
                    </div>
                </div>
            </div> <!-- marksheet-body End -->
            
            <div class="ms-footer">
                Developed by <strong>Saurabh</strong> — Join: <a href="https://t.me/+VLaG_7R6BZI3ODI1" target="_blank"
                    class="ms-footer-link"><strong>Telegram</strong></a> | Professional Result Solutions
            </div>
        </div> <!-- msCard End (Captured Area) -->

        <div data-html2canvas-ignore class="d-flex gap-2 justify-content-center mt-3 w-100" style="max-width: 420px; z-index: 2100;">
            <button class="ms-download-btn btn-lg w-50" onclick="downloadMSImage()">
                <i class="fas fa-download me-2"></i>Download
            </button>
            <button class="ms-close-overlay-btn btn-lg w-50" onclick="closeMS()">
                <i class="fas fa-times me-2"></i>Close
            </button>
        </div>
    </div>
