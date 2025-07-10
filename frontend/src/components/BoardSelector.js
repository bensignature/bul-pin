import React, { useState, useEffect } from 'react';
import '../styles/BoardSelector.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const BoardSelector = ({ selectedImages, onBack, onImagesSaved, accessToken }) => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardData, setNewBoardData] = useState({
    name: '',
    description: '',
    is_private: false
  });

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/boards`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const boardsData = await response.json();
        setBoards(boardsData);
      } else {
        console.error('Failed to load boards');
      }
    } catch (error) {
      console.error('Error loading boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardData.name.trim()) {
      alert('Please enter a board name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/boards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBoardData),
      });

      if (response.ok) {
        const newBoard = await response.json();
        setBoards([newBoard, ...boards]);
        setShowCreateBoard(false);
        setNewBoardData({ name: '', description: '', is_private: false });
      } else {
        alert('Failed to create board');
      }
    } catch (error) {
      console.error('Error creating board:', error);
      alert('Error creating board');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBoard = async (boardId) => {
    setSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/boards/${boardId}/save-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board_id: boardId,
          images: selectedImages
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Save result:', result);
        
        if (result.saved_count > 0) {
          alert(`Successfully saved ${result.saved_count} images to board!`);
          onImagesSaved();
        } else {
          alert('No images were saved. Please try again.');
        }
      } else {
        alert('Failed to save images to board');
      }
    } catch (error) {
      console.error('Error saving images:', error);
      alert('Error saving images to board');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="board-selector">
      <div className="selector-header">
        <button onClick={onBack} className="back-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Back
        </button>
        <h2>Choose a board</h2>
        <div className="selected-count">
          {selectedImages?.length || 0} images selected
        </div>
      </div>

      <div className="board-content">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading boards...</p>
          </div>
        ) : (
          <>
            <div className="search-section">
              <input 
                type="text" 
                placeholder="Search by name..."
                className="search-input"
              />
            </div>

            <div className="boards-section">
              <h3>My Boards</h3>
              <div className="boards-grid">
                {boards.map((board) => (
                  <div key={board.id} className="board-item">
                    <div className="board-preview">
                      <div className="board-thumbnail">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                          <rect width="40" height="40" rx="4" fill="#f0f0f0"/>
                          <rect x="8" y="8" width="24" height="16" rx="2" fill="#e0e0e0"/>
                          <rect x="8" y="26" width="16" height="6" rx="1" fill="#d0d0d0"/>
                        </svg>
                      </div>
                      <div className="board-info">
                        <h4>{board.name}</h4>
                        <p className="board-description">{board.description}</p>
                        <span className="board-count">{board.image_count} pins</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSaveToBoard(board.id)}
                      className="save-btn"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="create-board-section">
              {!showCreateBoard ? (
                <button 
                  onClick={() => setShowCreateBoard(true)}
                  className="create-board-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Create board
                </button>
              ) : (
                <div className="create-board-form">
                  <h3>Create board</h3>
                  <div className="form-group">
                    <label>Board name</label>
                    <input 
                      type="text" 
                      placeholder="Add a name that describes your board"
                      value={newBoardData.name}
                      onChange={(e) => setNewBoardData({...newBoardData, name: e.target.value})}
                      className="board-name-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description (optional)</label>
                    <textarea 
                      placeholder="What's your board about?"
                      value={newBoardData.description}
                      onChange={(e) => setNewBoardData({...newBoardData, description: e.target.value})}
                      className="board-description-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox"
                        checked={newBoardData.is_private}
                        onChange={(e) => setNewBoardData({...newBoardData, is_private: e.target.checked})}
                      />
                      Keep this board secret
                    </label>
                  </div>
                  <div className="form-actions">
                    <button 
                      onClick={() => setShowCreateBoard(false)}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateBoard}
                      className="create-btn"
                      disabled={!newBoardData.name.trim() || loading}
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BoardSelector;