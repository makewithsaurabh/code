# 🚀 RBSE Result Portal - Dev Saurabh Elite Edition (V9.8.0)

A high-performance, minimalist, and "Smart" Rajasthan Board (RBSE) result fetching engine. Features real-time school discovery, batch fetching, and a premium YouTube-style UI.

## ✨ Features
- **Smart Discovery**: Automatically probes +/- 10 roll numbers to find a valid school context.
- **Elite UI**: High-fidelity glassmorphism with a premium YouTube-style animated loader.
- **Batch Optimization**: 15-miss auto-abort logic for lightning-fast school-wide fetching.
- **Minimalist Design**: Zero clutter, just the data you need in a professional dashboard.
- **Hardened Scraper**: Robust error handling to detect 'Not Found' results accurately.

---

## 🛠️ Local Development

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/makewithsaurabh/resultcheck.git
   cd resultcheck
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Server**:
   ```bash
   node server.js
   ```

4. **Open the App**:
   Open `index.html` in your browser (use Live Server for best results).

---

## 🚀 Deployment on Render (Unified Web Service)

This project is configured to run as a **single unified Web Service** (Backend + Frontend together) for the best performance and cost-efficiency.

### 1. Unified Code Adjustment (Done)
The server is configured to serve the frontend files automatically. The frontend fetches from its own origin (`/result`), making it production-ready out of the box.

### 2. Steps to Deploy on Render.com
1. **Login to Render**: Go to [dashboard.render.com](https://dashboard.render.com).
2. **New Web Service**: Click **New +** -> **Web Service**.
3. **Connect GitHub**: Select your repository: `makewithsaurabh/resultcheck`.
4. **Configure Settings**:
   - **Name**: `rbse-result-portal` (or anything you like).
   - **Region**: Choose the one closest to you (e.g., Singapore).
   - **Branch**: `main`.
   - **Runtime**: `Node`.
   - **Build Command**: `npm install`.
   - **Start Command**: `node server.js`.
   - **Instance Type**: `Free`.
5. **Advanced**: 
   - Add an Environment Variable (Optional): `PORT` = `10000` (Render's default).
6. **Deploy**: Click **Create Web Service**.

### 3. Verification
Once the build is finished, Render will provide a URL (e.g., `https://rbse-portal.onrender.com`). Open it, and your portal is live!

---

## 🛡️ License & Copyright
Developed with ❤️ by **Dev Saurabh**.
Join the community: [Telegram @devsaurabh_official](https://t.me/devsaurabh_official)

> [!IMPORTANT]
> This tool is for educational purposes. Ensure compliance with Rajasthan Board (RBSE) data policies.
