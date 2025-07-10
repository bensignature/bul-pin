// Content script for extracting images from web pages
(function() {
    'use strict';

    // Pinterest Extension Content Script
    let extensionOverlay = null;
    let isExtensionActive = false;
    let selectedImages = [];

    // Create overlay UI
    function createOverlay() {
        if (extensionOverlay) return;

        extensionOverlay = document.createElement('div');
        extensionOverlay.id = 'pinterest-extension-overlay';
        extensionOverlay.innerHTML = `
            <div class="pinterest-ext-header">
                <div class="pinterest-ext-logo">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 0C5.373 0 0 5.373 0 12C0 17.302 3.438 21.8 8.207 23.387C8.07 22.496 7.966 21.13 8.201 20.156C8.415 19.27 9.613 14.696 9.613 14.696C9.613 14.696 9.252 13.975 9.252 12.956C9.252 11.337 10.177 10.124 11.327 10.124C12.298 10.124 12.767 10.846 12.767 11.717C12.767 12.694 12.146 14.17 11.823 15.545C11.553 16.696 12.385 17.621 13.516 17.621C15.565 17.621 17.148 15.495 17.148 12.388C17.148 9.615 15.234 7.745 11.955 7.745C8.245 7.745 5.974 10.506 5.974 12.928C5.974 13.905 6.361 14.967 6.861 15.548C6.961 15.668 6.975 15.775 6.946 15.896C6.861 16.267 6.676 16.958 6.633 17.112C6.576 17.319 6.454 17.368 6.237 17.255C4.828 16.583 3.989 14.514 3.989 12.888C3.989 9.294 6.678 5.973 12.297 5.973C16.789 5.973 20.257 9.071 20.257 12.341C20.257 16.717 17.543 20.188 13.696 20.188C12.545 20.188 11.462 19.598 11.089 18.896C11.089 18.896 10.509 21.112 10.363 21.674C10.092 22.784 9.387 24.216 8.94 25.056C10.239 25.346 11.596 25.502 13 25.502C19.627 25.502 25 20.129 25 13.502C25 5.373 18.627 0 12 0Z" fill="#E60023"/>
                    </svg>
                    <span>Pinterest Extension</span>
                </div>
                <div class="pinterest-ext-stats">
                    <span id="pinterest-ext-found">0 found</span>
                    <span id="pinterest-ext-selected">0 selected</span>
                </div>
                <button id="pinterest-ext-close" class="pinterest-ext-close">×</button>
            </div>
            <div class="pinterest-ext-controls">
                <button id="pinterest-ext-select-all" class="pinterest-ext-btn">Select All</button>
                <button id="pinterest-ext-clear" class="pinterest-ext-btn">Clear</button>
                <button id="pinterest-ext-save" class="pinterest-ext-btn pinterest-ext-btn-primary">Save Selected</button>
            </div>
        `;

        document.body.appendChild(extensionOverlay);
        attachOverlayListeners();
    }

    function attachOverlayListeners() {
        document.getElementById('pinterest-ext-close').addEventListener('click', deactivateExtension);
        document.getElementById('pinterest-ext-select-all').addEventListener('click', selectAllImages);
        document.getElementById('pinterest-ext-clear').addEventListener('click', clearSelection);
        document.getElementById('pinterest-ext-save').addEventListener('click', openPopupToSave);
    }

    function removeOverlay() {
        if (extensionOverlay) {
            extensionOverlay.remove();
            extensionOverlay = null;
        }
    }

    // Image selection functions
    function highlightImages() {
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            if (img.src && img.src.startsWith('http') && img.naturalWidth > 100 && img.naturalHeight > 100) {
                img.classList.add('pinterest-ext-selectable');
                img.dataset.pinterestIndex = index;
                img.addEventListener('click', handleImageClick);
            }
        });
        updateStats();
    }

    function unhighlightImages() {
        const images = document.querySelectorAll('img.pinterest-ext-selectable');
        images.forEach(img => {
            img.classList.remove('pinterest-ext-selectable', 'pinterest-ext-selected');
            img.removeEventListener('click', handleImageClick);
            delete img.dataset.pinterestIndex;
        });
        selectedImages = [];
    }

    function handleImageClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const img = event.target;
        const index = parseInt(img.dataset.pinterestIndex);
        
        if (img.classList.contains('pinterest-ext-selected')) {
            img.classList.remove('pinterest-ext-selected');
            selectedImages = selectedImages.filter(item => item.index !== index);
        } else {
            img.classList.add('pinterest-ext-selected');
            selectedImages.push({
                index: index,
                url: img.src,
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height,
                title: img.alt || img.title || `Image ${index + 1}`,
                description: img.alt || img.title || ''
            });
        }
        
        updateStats();
    }

    function selectAllImages() {
        const images = document.querySelectorAll('img.pinterest-ext-selectable');
        selectedImages = [];
        
        images.forEach((img, index) => {
            img.classList.add('pinterest-ext-selected');
            selectedImages.push({
                index: parseInt(img.dataset.pinterestIndex),
                url: img.src,
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height,
                title: img.alt || img.title || `Image ${index + 1}`,
                description: img.alt || img.title || ''
            });
        });
        
        updateStats();
    }

    function clearSelection() {
        const images = document.querySelectorAll('img.pinterest-ext-selected');
        images.forEach(img => {
            img.classList.remove('pinterest-ext-selected');
        });
        selectedImages = [];
        updateStats();
    }

    function updateStats() {
        const foundCount = document.querySelectorAll('img.pinterest-ext-selectable').length;
        const selectedCount = selectedImages.length;
        
        if (document.getElementById('pinterest-ext-found')) {
            document.getElementById('pinterest-ext-found').textContent = `${foundCount} found`;
        }
        if (document.getElementById('pinterest-ext-selected')) {
            document.getElementById('pinterest-ext-selected').textContent = `${selectedCount} selected`;
        }
    }

    function openPopupToSave() {
        if (selectedImages.length === 0) {
            alert('Please select at least one image first.');
            return;
        }

        // Store selected images for popup to access
        chrome.storage.local.set({
            pinterest_selected_images: selectedImages
        });

        // Open popup
        chrome.runtime.sendMessage({
            action: 'openPopup',
            selectedImages: selectedImages
        });
    }

    // Main activation/deactivation functions
    function activateExtension() {
        if (isExtensionActive) return;
        
        isExtensionActive = true;
        createOverlay();
        highlightImages();
        
        // Show activation message
        const message = document.createElement('div');
        message.className = 'pinterest-ext-message';
        message.textContent = 'Pinterest Extension activated! Click images to select them.';
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }

    function deactivateExtension() {
        if (!isExtensionActive) return;
        
        isExtensionActive = false;
        removeOverlay();
        unhighlightImages();
    }

    // Message listener for communication with popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractImages') {
            const images = Array.from(document.querySelectorAll('img')).map((img, index) => {
                if (img.src && img.src.startsWith('http')) {
                    return {
                        url: img.src,
                        width: img.naturalWidth || img.width || 0,
                        height: img.naturalHeight || img.height || 0,
                        title: img.alt || img.title || `Image ${index + 1}`,
                        description: img.alt || img.title || ''
                    };
                }
                return null;
            }).filter(img => img !== null);
            
            sendResponse(images);
        } else if (request.action === 'activateExtension') {
            activateExtension();
            sendResponse({ success: true });
        } else if (request.action === 'deactivateExtension') {
            deactivateExtension();
            sendResponse({ success: true });
        }
    });

    // Keyboard shortcut listener
    document.addEventListener('keydown', (event) => {
        // Alt + P to toggle extension
        if (event.altKey && event.key === 'p') {
            event.preventDefault();
            if (isExtensionActive) {
                deactivateExtension();
            } else {
                activateExtension();
            }
        }
    });

    // Auto-activate on Pinterest-related pages
    if (window.location.hostname.includes('pinterest') || 
        document.querySelector('meta[property="og:site_name"]')?.content?.toLowerCase().includes('pinterest')) {
        // Don't auto-activate on Pinterest itself
        return;
    }

    // Initialize
    console.log('Pinterest Extension content script loaded');
})();