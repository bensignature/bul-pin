import React, { useState, useEffect } from 'react';
import './App.css';
import ImageSelector from './components/ImageSelector';
import BoardSelector from './components/BoardSelector';
import AuthModal from './components/AuthModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentView, setCurrentView] = useState('images'); // 'images' or 'boards'
  const [selectedImages, setSelectedImages] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('pinterest_access_token'));

  useEffect(() => {
    // Check if user is authenticated
    if (accessToken) {
      setIsAuthenticated(true);
      fetchUserProfile();
    }
  }, [accessToken]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogin = (token) => {
    setAccessToken(token);
    localStorage.setItem('pinterest_access_token', token);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    fetchUserProfile();
  };

  const handleLogout = () => {
    setAccessToken(null);
    localStorage.removeItem('pinterest_access_token');
    setIsAuthenticated(false);
    setUserProfile(null);
    setCurrentView('images');
    setSelectedImages([]);
  };

  const handleImagesSelected = (images) => {
    setSelectedImages(images);
  };

  const handleNext = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setCurrentView('boards');
  };

  const handleBack = () => {
    setCurrentView('images');
  };

  const handleImagesSaved = () => {
    // Reset state after successful save
    setSelectedImages([]);
    setCurrentView('images');
    alert('Images berhasil disimpan ke Pinterest board!');
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.373 0 0 5.373 0 12C0 17.302 3.438 21.8 8.207 23.387C8.07 22.496 7.966 21.13 8.201 20.156C8.415 19.27 9.613 14.696 9.613 14.696C9.613 14.696 9.252 13.975 9.252 12.956C9.252 11.337 10.177 10.124 11.327 10.124C12.298 10.124 12.767 10.846 12.767 11.717C12.767 12.694 12.146 14.17 11.823 15.545C11.553 16.696 12.385 17.621 13.516 17.621C15.565 17.621 17.148 15.495 17.148 12.388C17.148 9.615 15.234 7.745 11.955 7.745C8.245 7.745 5.974 10.506 5.974 12.928C5.974 13.905 6.361 14.967 6.861 15.548C6.961 15.668 6.975 15.775 6.946 15.896C6.861 16.267 6.676 16.958 6.633 17.112C6.576 17.319 6.454 17.368 6.237 17.255C4.828 16.583 3.989 14.514 3.989 12.888C3.989 9.294 6.678 5.973 12.297 5.973C16.789 5.973 20.257 9.071 20.257 12.341C20.257 16.717 17.543 20.188 13.696 20.188C12.545 20.188 11.462 19.598 11.089 18.896C11.089 18.896 10.509 21.112 10.363 21.674C10.092 22.784 9.387 24.216 8.94 25.056C10.239 25.346 11.596 25.502 13 25.502C19.627 25.502 25 20.129 25 13.502C25 5.373 18.627 0 12 0Z" fill="#E60023"/>
              </svg>
              <span>Pinterest Extension</span>
            </div>
          </div>
          
          <div className="user-section">
            {isAuthenticated && userProfile ? (
              <div className="user-info">
                <img 
                  src={userProfile.profile_image || 'https://via.placeholder.com/32x32'} 
                  alt="Profile" 
                  className="profile-image"
                />
                <span>{userProfile.username}</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="login-btn"
              >
                Login to Pinterest
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'images' && (
          <ImageSelector
            onImagesSelected={handleImagesSelected}
            onNext={handleNext}
            selectedImages={selectedImages}
          />
        )}
        
        {currentView === 'boards' && (
          <BoardSelector
            selectedImages={selectedImages}
            onBack={handleBack}
            onImagesSaved={handleImagesSaved}
            accessToken={accessToken}
          />
        )}
      </main>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}

export default App;