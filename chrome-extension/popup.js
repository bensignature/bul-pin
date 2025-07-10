// Constants
const BACKEND_URL = 'http://localhost:8001';

// State management
let currentState = {
    isAuthenticated: false,
    accessToken: null,
    userProfile: null,
    extractedImages: [],
    selectedImages: [],
    boards: []
};

// DOM elements
const elements = {
    loading: document.getElementById('loading'),
    authSection: document.getElementById('auth-section'),
    userInfo: document.getElementById('user-info'),
    stats: document.getElementById('stats'),
    errorMessage: document.getElementById('error-message'),
    successMessage: document.getElementById('success-message'),
    extractBtn: document.getElementById('extract-btn'),
    imagesSection: document.getElementById('images-section'),
    noImages: document.getElementById('no-images'),
    boardsSection: document.getElementById('boards-section'),
    authBtn: document.getElementById('auth-btn'),
    demoBtn: document.getElementById('demo-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    selectAllBtn: document.getElementById('select-all-btn'),
    clearSelectionBtn: document.getElementById('clear-selection-btn'),
    imagesGrid: document.getElementById('images-grid'),
    boardsList: document.getElementById('boards-list'),
    profileImg: document.getElementById('profile-img'),
    username: document.getElementById('username'),
    imagesFound: document.getElementById('images-found'),
    imagesSelected: document.getElementById('images-selected')
};

// Utility functions
function showElement(element) {
    if (element) element.style.display = 'block';
}

function hideElement(element) {
    if (element) element.style.display = 'none';
}

function showError(message) {
    elements.errorMessage.textContent = message;
    showElement(elements.errorMessage);
    setTimeout(() => hideElement(elements.errorMessage), 5000);
}

function showSuccess(message) {
    elements.successMessage.textContent = message;
    showElement(elements.successMessage);
    setTimeout(() => hideElement(elements.successMessage), 5000);
}

function updateStats() {
    elements.imagesFound.textContent = currentState.extractedImages.length;
    elements.imagesSelected.textContent = currentState.selectedImages.length;
}

// Authentication functions
async function checkAuthentication() {
    try {
        const result = await chrome.storage.local.get(['pinterest_access_token', 'pinterest_user_profile']);
        if (result.pinterest_access_token) {
            currentState.isAuthenticated = true;
            currentState.accessToken = result.pinterest_access_token;
            currentState.userProfile = result.pinterest_user_profile;
            updateUserInterface();
        } else {
            showAuthSection();
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        showAuthSection();
    }
}

function showAuthSection() {
    hideElement(elements.loading);
    showElement(elements.authSection);
    hideElement(elements.userInfo);
    hideElement(elements.extractBtn);
    hideElement(elements.stats);
}

async function handleLogin(token) {
    try {
        currentState.accessToken = token;
        
        // Fetch user profile
        const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            currentState.userProfile = await response.json();
        } else {
            // Use demo profile
            currentState.userProfile = {
                username: 'demo_user',
                profile_image: 'https://via.placeholder.com/32x32'
            };
        }
        
        // Save to storage
        await chrome.storage.local.set({
            pinterest_access_token: token,
            pinterest_user_profile: currentState.userProfile
        });
        
        currentState.isAuthenticated = true;
        updateUserInterface();
        showSuccess('Successfully logged in!');
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Login failed. Please try again.');
    }
}

async function handleLogout() {
    try {
        await chrome.storage.local.remove(['pinterest_access_token', 'pinterest_user_profile']);
        currentState.isAuthenticated = false;
        currentState.accessToken = null;
        currentState.userProfile = null;
        currentState.extractedImages = [];
        currentState.selectedImages = [];
        currentState.boards = [];
        showAuthSection();
    } catch (error) {
        console.error('Logout error:', error);
        showError('Logout failed.');
    }
}

function updateUserInterface() {
    hideElement(elements.loading);
    hideElement(elements.authSection);
    
    if (currentState.isAuthenticated) {
        showElement(elements.userInfo);
        showElement(elements.extractBtn);
        showElement(elements.stats);
        
        // Update user info
        elements.username.textContent = currentState.userProfile?.username || 'Demo User';
        elements.profileImg.src = currentState.userProfile?.profile_image || 'https://via.placeholder.com/32x32';
        
        updateStats();
    }
}

// Image extraction functions
async function extractImages() {
    try {
        showElement(elements.loading);
        hideElement(elements.errorMessage);
        
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Execute content script to extract images
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractImagesFromPage
        });
        
        const extractedImages = results[0].result || [];
        
        if (extractedImages.length > 0) {
            // Filter images using backend
            const response = await fetch(`${BACKEND_URL}/api/images/filter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(extractedImages)
            });
            
            if (response.ok) {
                const result = await response.json();
                currentState.extractedImages = result.images;
            } else {
                // Fallback filtering
                currentState.extractedImages = extractedImages.filter(img => 
                    img.width > 100 && img.height > 100
                );
            }
            
            displayImages();
            loadBoards();
        } else {
            showNoImages();
        }
        
    } catch (error) {
        console.error('Error extracting images:', error);
        showError('Failed to extract images from page.');
    } finally {
        hideElement(elements.loading);
    }
}

// This function will be injected into the page
function extractImagesFromPage() {
    const images = Array.from(document.querySelectorAll('img'));
    const extractedImages = [];
    
    images.forEach((img, index) => {
        if (img.src && img.src.startsWith('http')) {
            extractedImages.push({
                url: img.src,
                width: img.naturalWidth || img.width || 0,
                height: img.naturalHeight || img.height || 0,
                title: img.alt || img.title || `Image ${index + 1}`,
                description: img.alt || img.title || ''
            });
        }
    });
    
    return extractedImages;
}

function displayImages() {
    if (currentState.extractedImages.length === 0) {
        showNoImages();
        return;
    }
    
    hideElement(elements.noImages);
    showElement(elements.imagesSection);
    
    const imagesGrid = elements.imagesGrid;
    imagesGrid.innerHTML = '';
    
    currentState.extractedImages.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.dataset.index = index;
        
        const isSelected = currentState.selectedImages.some(img => img.url === image.url);
        if (isSelected) {
            imageItem.classList.add('selected');
        }
        
        imageItem.innerHTML = `
            <img src="${image.url}" alt="${image.title}" loading="lazy">
            <div class="selection-indicator" style="display: ${isSelected ? 'flex' : 'none'};">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 6l2 2 4-4" stroke="#e60023" stroke-width="2" fill="none"/>
                </svg>
            </div>
        `;
        
        imageItem.addEventListener('click', () => toggleImageSelection(index));
        imagesGrid.appendChild(imageItem);
    });
    
    updateStats();
}

function showNoImages() {
    hideElement(elements.imagesSection);
    showElement(elements.noImages);
    updateStats();
}

function toggleImageSelection(index) {
    const image = currentState.extractedImages[index];
    const isSelected = currentState.selectedImages.some(img => img.url === image.url);
    
    if (isSelected) {
        currentState.selectedImages = currentState.selectedImages.filter(img => img.url !== image.url);
    } else {
        currentState.selectedImages.push(image);
    }
    
    displayImages();
    displayBoards();
}

function selectAllImages() {
    currentState.selectedImages = [...currentState.extractedImages];
    displayImages();
    displayBoards();
}

function clearSelection() {
    currentState.selectedImages = [];
    displayImages();
    displayBoards();
}

// Boards functions
async function loadBoards() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/boards`, {
            headers: {
                'Authorization': `Bearer ${currentState.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            currentState.boards = await response.json();
        } else {
            // Mock boards for demo
            currentState.boards = [
                {
                    id: 'mock-board-1',
                    name: 'Home Interior',
                    description: 'Beautiful home interior designs',
                    image_count: 45
                },
                {
                    id: 'mock-board-2',
                    name: 'Travel Photos',
                    description: 'Amazing travel destinations',
                    image_count: 128
                }
            ];
        }
        
        displayBoards();
        
    } catch (error) {
        console.error('Error loading boards:', error);
        showError('Failed to load boards.');
    }
}

function displayBoards() {
    if (currentState.selectedImages.length === 0) {
        hideElement(elements.boardsSection);
        return;
    }
    
    showElement(elements.boardsSection);
    
    const boardsList = elements.boardsList;
    boardsList.innerHTML = '';
    
    currentState.boards.forEach(board => {
        const boardItem = document.createElement('div');
        boardItem.className = 'board-item';
        
        boardItem.innerHTML = `
            <div class="board-info">
                <h4>${board.name}</h4>
                <p>${board.description || 'No description'}</p>
                <p style="font-size: 11px; color: #999;">${board.image_count} pins</p>
            </div>
            <button class="save-btn" onclick="saveToBoard('${board.id}')">Save</button>
        `;
        
        boardsList.appendChild(boardItem);
    });
}

async function saveToBoard(boardId) {
    if (currentState.selectedImages.length === 0) {
        showError('Please select images first.');
        return;
    }
    
    try {
        showElement(elements.loading);
        
        const response = await fetch(`${BACKEND_URL}/api/boards/${boardId}/save-images`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentState.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                board_id: boardId,
                images: currentState.selectedImages
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccess(`Successfully saved ${result.saved_count} images to board!`);
            
            // Clear selection after successful save
            currentState.selectedImages = [];
            displayImages();
            displayBoards();
        } else {
            showError('Failed to save images to board.');
        }
        
    } catch (error) {
        console.error('Error saving images:', error);
        showError('Failed to save images to board.');
    } finally {
        hideElement(elements.loading);
    }
}

// Event listeners
elements.authBtn.addEventListener('click', () => {
    // In a real implementation, this would open Pinterest OAuth
    const token = prompt('Enter your Pinterest access token (or leave empty for demo):');
    handleLogin(token || 'demo_access_token_12345');
});

elements.demoBtn.addEventListener('click', () => {
    handleLogin('demo_access_token_12345');
});

elements.logoutBtn.addEventListener('click', handleLogout);

elements.extractBtn.addEventListener('click', extractImages);

elements.selectAllBtn.addEventListener('click', selectAllImages);

elements.clearSelectionBtn.addEventListener('click', clearSelection);

// Make saveToBoard available globally
window.saveToBoard = saveToBoard;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
});