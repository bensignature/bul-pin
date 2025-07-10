// Background script for Pinterest Extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Pinterest Extension installed');
    
    // Create context menu
    chrome.contextMenus.create({
        id: 'pinterest-save-image',
        title: 'Save to Pinterest',
        contexts: ['image']
    });
    
    chrome.contextMenus.create({
        id: 'pinterest-extract-images',
        title: 'Extract all images',
        contexts: ['page']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'pinterest-save-image') {
        handleSaveImage(info.srcUrl, tab);
    } else if (info.menuItemId === 'pinterest-extract-images') {
        handleExtractImages(tab);
    }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openPopup') {
        chrome.action.openPopup();
        sendResponse({ success: true });
    } else if (request.action === 'getSelectedImages') {
        chrome.storage.local.get(['pinterest_selected_images'], (result) => {
            sendResponse(result.pinterest_selected_images || []);
        });
        return true;
    } else if (request.action === 'saveComplete') {
        chrome.storage.local.remove(['pinterest_selected_images']);
        sendResponse({ success: true });
    }
});

async function handleSaveImage(imageUrl, tab) {
    try {
        await chrome.storage.local.set({
            pinterest_selected_images: [{
                url: imageUrl,
                width: 0,
                height: 0,
                title: "Image from " + tab.url,
                description: "Saved from " + tab.title
            }]
        });
        chrome.action.openPopup();
    } catch (error) {
        console.error('Error saving image:', error);
    }
}

async function handleExtractImages(tab) {
    try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractImages' });
        
        if (response && response.length > 0) {
            const filteredImages = response.filter(img => img.width > 100 && img.height > 100);
            
            await chrome.storage.local.set({
                pinterest_extracted_images: filteredImages
            });
            
            chrome.action.openPopup();
        } else {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon48.png',
                title: 'Pinterest Extension',
                message: 'No images found on this page'
            });
        }
    } catch (error) {
        console.error('Error extracting images:', error);
    }
}

// Badge management
function updateBadge(count) {
    chrome.action.setBadgeText({
        text: count > 0 ? count.toString() : ''
    });
    chrome.action.setBadgeBackgroundColor({
        color: '#e60023'
    });
}

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.pinterest_selected_images) {
        const newValue = changes.pinterest_selected_images.newValue;
        if (newValue && Array.isArray(newValue)) {
            updateBadge(newValue.length);
        } else {
            updateBadge(0);
        }
    }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        updateBadge(0);
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked');
});

// Cleanup
chrome.alarms.create('cleanup', { delayInMinutes: 60, periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        chrome.storage.local.get(null, (items) => {
            const keysToRemove = [];
            const now = Date.now();
            
            for (const key in items) {
                if (key.startsWith('pinterest_') && items[key].timestamp) {
                    if (now - items[key].timestamp > 3600000) {
                        keysToRemove.push(key);
                    }
                }
            }
            
            if (keysToRemove.length > 0) {
                chrome.storage.local.remove(keysToRemove);
            }
        });
    }
});

chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.action.openPopup();
});

chrome.runtime.onSuspend.addListener(() => {
    console.log('Pinterest Extension suspended');
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Pinterest Extension started');
});
