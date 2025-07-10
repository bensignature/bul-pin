#!/bin/bash

# Pinterest Chrome Extension Installation Script

echo "=== Pinterest Chrome Extension Setup ==="
echo ""

# Check if Chrome is installed
if ! command -v google-chrome &> /dev/null && ! command -v chromium &> /dev/null; then
    echo "⚠️  Chrome or Chromium not found. Please install Google Chrome or Chromium to use this extension."
    echo ""
fi

# Create extension directory if it doesn't exist
EXTENSION_DIR="/app/chrome-extension"
if [ ! -d "$EXTENSION_DIR" ]; then
    echo "❌ Extension directory not found at $EXTENSION_DIR"
    exit 1
fi

echo "✅ Extension files found in: $EXTENSION_DIR"
echo ""

# Check if backend is running
echo "🔍 Checking backend status..."
if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:8001"
else
    echo "⚠️  Backend is not running. Starting backend..."
    cd /app && sudo supervisorctl restart backend
    sleep 3
    if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "✅ Backend is now running"
    else
        echo "❌ Failed to start backend. Please check the logs."
    fi
fi

echo ""
echo "📦 Extension Package Contents:"
echo "   - manifest.json (Extension configuration)"
echo "   - popup.html & popup.js (Extension popup interface)"
echo "   - content.js & content.css (Page interaction scripts)"
echo "   - background.js (Background service worker)"
echo "   - README.md (Documentation)"
echo ""

echo "🚀 Installation Instructions:"
echo ""
echo "1. Open Google Chrome and go to: chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in the top right corner)"
echo "3. Click 'Load unpacked' button"
echo "4. Select this folder: $EXTENSION_DIR"
echo "5. The Pinterest Extension should now appear in your extensions list"
echo ""

echo "📱 Usage Instructions:"
echo ""
echo "Method 1 - Extension Popup:"
echo "   • Click the Pinterest Extension icon in your browser toolbar"
echo "   • Login to Pinterest (or use demo mode)"
echo "   • Click 'Extract Images from Page' to scan current page"
echo "   • Select images and choose a board to save to"
echo ""
echo "Method 2 - Context Menu:"
echo "   • Right-click on any image"
echo "   • Select 'Save to Pinterest' from context menu"
echo ""
echo "Method 3 - Keyboard Shortcut:"
echo "   • Press Alt+P to activate extension overlay"
echo "   • Click images to select them"
echo "   • Use overlay controls to save"
echo ""

echo "🔧 Troubleshooting:"
echo ""
echo "If extension doesn't work:"
echo "   • Make sure backend is running: sudo supervisorctl status backend"
echo "   • Reload extension: chrome://extensions/ > Pinterest Extension > Reload"
echo "   • Check browser console for errors (F12)"
echo ""

echo "📝 Notes:"
echo "   • For testing, use the demo mode (no Pinterest login required)"
echo "   • Real Pinterest integration requires API tokens"
echo "   • Extension filters images smaller than 100x100 pixels"
echo ""

echo "✨ Extension is ready to install!"
echo "Extension location: $EXTENSION_DIR"