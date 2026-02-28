<div align="center">
  <img src="icons/icon-192x192.png" alt="QuickSave Logo" width="120" height="120">
  <h1>⚡ QuickSave PWA</h1>
  <p><strong>Capture what inspires you — instantly from your phone.</strong></p>
</div>

<br>

**QuickSave** is a lighting-fast Progressive Web App (PWA) built specifically for saving interesting links directly from your mobile device. Whether it's a GitHub repository, an arXiv paper, or a thought-provoking Twitter/X thread, QuickSave gives you a single, beautiful place to store them offline.

---

## ✨ Features

- **📱 True PWA Experience:** Install it on your iOS or Android home screen just like a native app. No app store required.
- **🚀 Web Share Target API:** (Android only) QuickSave integrates directly into your phone’s native Share menu. Tap "Share" on any link in your browser or Twitter app, and send it straight to QuickSave!
- **💾 100% Offline & Private:** All your saved links, notes, and tags are stored locally on your device using IndexedDB. No servers, no tracking, complete privacy.
- **🎨 Dark Vibrant Glassmorphism:** A stunning, animated dark theme with neon gradients and frosted glass effects.
- **🔍 Smart Auto-Detection:** Paste a URL, and QuickSave automatically detects if it's a GitHub repo, Tweet, or Paper.
- **📊 Real-time Dashboard:** Track your saving habits with beautiful stat cards and weekly streak counters.

## 🛠️ Tech Stack

- **Frontend Core:** Pure HTML5, CSS3 (No heavy frameworks!)
- **Logic:** Vanilla JavaScript (ES6+)
- **Storage:** IndexedDB (via an easy-to-use promise wrapper)
- **PWA Capabilities:** Custom Service Worker (`sw.js`) and Web App Manifest
- **Hosting:** Easily deployable to any static host like GitHub Pages, Vercel, or Netlify.

## 🚀 How to Use It

### 1. Install on your Phone
1. Open the live URL on your mobile browser (Safari for iOS, Chrome for Android).
2. Tap the browser's Share/Menu icon.
3. Select **"Add to Home Screen"**.
4. Open the new `QuickSave` app from your home screen!

### 2. Save a Link (Android Native Share)
1. Find something interesting in Chrome, Twitter, YouTube, etc.
2. Tap the system **Share** button.
3. Select **QuickSave** from the list of apps.
4. The app will open instantly with the URL pre-filled. Add your notes and tap Save!

*(Note: iOS does not currently support the Web Share Target API for PWAs. iPhone users must copy the link and manually paste it into the app).*

## 💻 Local Development

Want to run it on your own machine? It requires zero build steps!

1. Clone the repository:
   ```bash
   git clone https://github.com/Ridhima212215/quicksave.git
   cd quicksave
   ```
2. Serve the directory using any local web server. For example, using Python:
   ```bash
   python -m http.server 3000
   ```
   Or using Node.js `serve` package:
   ```bash
   npx serve .
   ```
3. Open `http://localhost:3000` in your browser.

## 🎨 Design

The UI is built with a custom **Dark Vibrant Glassmorphism** design system.
- Font: [Outfit](https://fonts.google.com/specimen/Outfit)
- Theme: Deep dark backgrounds (`#0b0f19`) with high-contrast glowing neon accents (`#ff0f7b` and `#f89b29`).
- Features responsive grid layouts, animated gradient meshes, and buttery-smooth CSS transitions.

---
*Built with ❤️ for rapid knowledge capture.*
