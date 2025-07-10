# Pinterest Chrome Extension

A Chrome extension that allows you to save images from any webpage to your Pinterest boards.

## Features

- 🖼️ **Extract Images**: Automatically finds and extracts all images from any webpage
- 📌 **Save to Pinterest**: Save selected images directly to your Pinterest boards
- 🎯 **Smart Filtering**: Filters out small images (< 100px) automatically
- 🔍 **Image Selection**: Click to select/deselect individual images
- 📱 **Responsive Design**: Works on all screen sizes
- ⚡ **Quick Access**: Right-click context menu for quick saves
- 🔐 **Secure**: Uses Pinterest's official API

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked" and select the `chrome-extension` folder
5. The Pinterest Extension icon should appear in your browser toolbar

## Usage

### Method 1: Using the Extension Popup
1. Click the Pinterest Extension icon in your browser toolbar
2. Login to Pinterest (or use demo mode)
3. Click "Extract Images from Page" to scan the current page
4. Select the images you want to save
5. Choose a Pinterest board to save to

### Method 2: Using Context Menu
1. Right-click on any image on a webpage
2. Select "Save to Pinterest" from the context menu
3. The extension popup will open with the image pre-selected

### Method 3: Using Keyboard Shortcut
1. Press `Alt + P` to activate the extension overlay
2. Click on images to select them
3. Use the overlay controls to save selected images

## Pinterest API Setup

To use this extension with your actual Pinterest account:

1. Go to [Pinterest Developer Console](https://developers.pinterest.com/)
2. Create a new app
3. Get your access token
4. Enter the token when prompted in the extension

For testing, you can use the demo mode which provides mock functionality.

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js             # Popup functionality
├── content.js           # Content script for page interaction
├── content.css          # Styling for content script
├── background.js        # Background service worker
├── images/              # Extension icons
└── README.md           # This file
```

## Technical Details

- **Manifest Version**: 3 (latest Chrome Extension format)
- **Permissions**: 
  - `activeTab`: Access to current tab
  - `storage`: Store user preferences and selected images
  - `scripting`: Inject content scripts
- **Host Permissions**: 
  - Local backend API (`http://localhost:8001/*`)
  - Pinterest API (`https://api.pinterest.com/*`)

## Backend API

The extension communicates with a FastAPI backend that handles:
- Image filtering and processing
- Pinterest API integration
- Board management
- Image saving operations

Backend runs on `http://localhost:8001` and provides the following endpoints:
- `POST /api/images/filter` - Filter images by size
- `GET /api/boards` - Get user's Pinterest boards
- `POST /api/boards` - Create new board
- `POST /api/boards/{board_id}/save-images` - Save images to board

## Development

To modify the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Pinterest Extension card
4. Test your changes

## Troubleshooting

**Extension not working?**
- Check that the backend server is running on `http://localhost:8001`
- Ensure all required permissions are granted
- Try reloading the extension

**Images not extracting?**
- Make sure the page has finished loading
- Check that the images are larger than 100x100 pixels
- Verify the images have valid HTTP/HTTPS URLs

**Can't save to Pinterest?**
- Verify your Pinterest access token is valid
- Check your internet connection
- Try using demo mode first

## Privacy

This extension:
- Only accesses the current tab when activated
- Stores data locally in your browser
- Communicates only with Pinterest's official API
- Does not track or collect personal data

## License

This project is for educational and personal use. Pinterest is a trademark of Pinterest, Inc.