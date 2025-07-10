import React, { useState, useEffect } from 'react';
import '../styles/ImageSelector.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ImageSelector = ({ onImagesSelected, onNext, selectedImages }) => {
  const [allImages, setAllImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Load mock images or extract from current page
    loadMockImages();
  }, []);

  const loadMockImages = () => {
    // Mock images for demonstration
    const mockImages = [
      {
        url: 'https://i.pinimg.com/564x/1a/2b/3c/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p.jpg',
        width: 564,
        height: 752,
        title: 'Beautiful Landscape',
        description: 'A scenic mountain view'
      },
      {
        url: 'https://i.pinimg.com/564x/2b/3c/4d/2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q.jpg',
        width: 564,
        height: 564,
        title: 'Modern Architecture',
        description: 'Contemporary building design'
      },
      {
        url: 'https://i.pinimg.com/564x/3c/4d/5e/3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r.jpg',
        width: 564,
        height: 846,
        title: 'Interior Design',
        description: 'Beautiful home interior'
      },
      {
        url: 'https://i.pinimg.com/564x/4d/5e/6f/4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s.jpg',
        width: 564,
        height: 376,
        title: 'Travel Photography',
        description: 'Amazing travel destination'
      },
      {
        url: 'https://i.pinimg.com/564x/5e/6f/7g/5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t.jpg',
        width: 564,
        height: 705,
        title: 'Fashion Style',
        description: 'Trendy fashion inspiration'
      },
      {
        url: 'https://i.pinimg.com/564x/6f/7g/8h/6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u.jpg',
        width: 564,
        height: 564,
        title: 'Food Photography',
        description: 'Delicious food inspiration'
      },
      {
        url: 'https://i.pinimg.com/564x/7g/8h/9i/7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v.jpg',
        width: 564,
        height: 423,
        title: 'Art & Design',
        description: 'Creative art inspiration'
      },
      {
        url: 'https://i.pinimg.com/564x/8h/9i/0j/8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w.jpg',
        width: 564,
        height: 752,
        title: 'Nature Photography',
        description: 'Beautiful nature scenes'
      },
      // Add some small images that should be filtered out
      {
        url: 'https://via.placeholder.com/80x60',
        width: 80,
        height: 60,
        title: 'Small Image 1',
        description: 'This should be filtered out'
      },
      {
        url: 'https://via.placeholder.com/95x95',
        width: 95,
        height: 95,
        title: 'Small Image 2',
        description: 'This should be filtered out'
      }
    ];

    setAllImages(mockImages);
    filterImages(mockImages);
  };

  const filterImages = async (images) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/images/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(images),
      });

      if (response.ok) {
        const result = await response.json();
        setFilteredImages(result.images);
      } else {
        // Fallback filtering on client side
        const filtered = images.filter(img => img.width > 100 && img.height > 100);
        setFilteredImages(filtered);
      }
    } catch (error) {
      console.error('Error filtering images:', error);
      // Fallback filtering on client side
      const filtered = images.filter(img => img.width > 100 && img.height > 100);
      setFilteredImages(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const imagesToSelect = filteredImages.map(img => ({
      ...img,
      selected: true
    }));
    onImagesSelected(imagesToSelect);
  };

  const handleClearSelection = () => {
    onImagesSelected([]);
  };

  const handleImageToggle = (imageUrl) => {
    const currentSelected = selectedImages || [];
    const isSelected = currentSelected.some(img => img.url === imageUrl);
    
    if (isSelected) {
      // Remove from selection
      const newSelected = currentSelected.filter(img => img.url !== imageUrl);
      onImagesSelected(newSelected);
    } else {
      // Add to selection
      const imageToAdd = filteredImages.find(img => img.url === imageUrl);
      if (imageToAdd) {
        onImagesSelected([...currentSelected, { ...imageToAdd, selected: true }]);
      }
    }
  };

  const isImageSelected = (imageUrl) => {
    return selectedImages?.some(img => img.url === imageUrl) || false;
  };

  return (
    <div className="image-selector">
      <div className="selector-header">
        <h2>Found {filteredImages.length} images on this page</h2>
        <div className="controls">
          <button 
            onClick={handleSelectAll}
            className="select-all-btn"
            disabled={loading}
          >
            Select All Images
          </button>
          <button 
            onClick={handleClearSelection}
            className="clear-selection-btn"
            disabled={!selectedImages?.length}
          >
            Clear Selection
          </button>
        </div>
      </div>

      <div className="content-area">
        <div className="images-grid">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading images...</p>
            </div>
          ) : (
            filteredImages.map((image, index) => (
              <div 
                key={index} 
                className={`image-item ${isImageSelected(image.url) ? 'selected' : ''}`}
                onClick={() => handleImageToggle(image.url)}
              >
                <img 
                  src={image.url} 
                  alt={image.title || `Image ${index + 1}`}
                  loading="lazy"
                />
                <div className="image-overlay">
                  <div className="image-info">
                    <span className="image-size">{image.width}×{image.height}</span>
                  </div>
                  <div className="selection-indicator">
                    {isImageSelected(image.url) && (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="10" fill="#fff"/>
                        <path d="M8 10l2 2 4-4" stroke="#007bff" strokeWidth="2" fill="none"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sidebar">
          <div className="sidebar-header">
            <h3>Selected Images: {selectedImages?.length || 0}</h3>
          </div>
          
          <div className="selected-images">
            {selectedImages?.length > 0 ? (
              selectedImages.map((image, index) => (
                <div key={index} className="selected-image">
                  <img 
                    src={image.url} 
                    alt={image.title || `Selected ${index + 1}`}
                  />
                  <div className="selected-image-info">
                    <p className="image-title">{image.title || 'Untitled'}</p>
                    <p className="image-dimensions">{image.width}×{image.height}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageToggle(image.url);
                    }}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div className="no-selection">
                <p>No images selected</p>
                <p className="hint">Click "Select All Images" or click individual images to select them</p>
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <button 
              onClick={onNext}
              className="next-btn"
              disabled={!selectedImages?.length}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {filteredImages.length < allImages.length && (
        <div className="filter-info">
          <p>
            Filtered out {allImages.length - filteredImages.length} images that were smaller than 100×100 pixels
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageSelector;