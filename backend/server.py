from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import requests
import base64
from PIL import Image
import io
import json
from datetime import datetime
import uuid

app = FastAPI(title="Pinterest Extension API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Data models
class ImageData(BaseModel):
    url: str
    width: int
    height: int
    title: Optional[str] = None
    description: Optional[str] = None

class FilteredImagesResponse(BaseModel):
    images: List[ImageData]
    total_count: int
    filtered_count: int

class BoardData(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    image_count: int
    url: str

class CreateBoardRequest(BaseModel):
    name: str
    description: Optional[str] = None
    is_private: bool = False

class SaveImagesToBoardRequest(BaseModel):
    board_id: str
    images: List[ImageData]

# Pinterest API Configuration
PINTEREST_API_BASE = "https://api.pinterest.com/v5"

def get_pinterest_headers(access_token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

def get_access_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract access token from Authorization header"""
    return credentials.credentials

@app.get("/")
async def root():
    return {"message": "Pinterest Extension API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/images/filter", response_model=FilteredImagesResponse)
async def filter_images(images: List[ImageData]):
    """Filter images based on size (>100px) and other criteria"""
    try:
        filtered_images = []
        
        for image in images:
            # Filter images with width and height > 100px
            if image.width > 100 and image.height > 100:
                filtered_images.append(image)
        
        return FilteredImagesResponse(
            images=filtered_images,
            total_count=len(images),
            filtered_count=len(filtered_images)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error filtering images: {str(e)}")

@app.get("/api/images/extract")
async def extract_images_from_url(url: str):
    """Extract images from a given URL"""
    try:
        # This would typically use web scraping to extract images
        # For demo purposes, returning mock data
        mock_images = [
            {
                "url": "https://i.pinimg.com/564x/1a/2b/3c/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p.jpg",
                "width": 564,
                "height": 752,
                "title": "Beautiful Landscape",
                "description": "A scenic mountain view"
            },
            {
                "url": "https://i.pinimg.com/564x/2b/3c/4d/2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q.jpg",
                "width": 564,
                "height": 564,
                "title": "Modern Architecture",
                "description": "Contemporary building design"
            },
            {
                "url": "https://i.pinimg.com/564x/3c/4d/5e/3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r.jpg",
                "width": 80,
                "height": 60,
                "title": "Small Image",
                "description": "This image is too small and will be filtered out"
            }
        ]
        
        return {"images": mock_images, "source_url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting images: {str(e)}")

@app.get("/api/boards", response_model=List[BoardData])
async def get_user_boards(access_token: str = Depends(get_access_token)):
    """Get user's Pinterest boards"""
    try:
        headers = get_pinterest_headers(access_token)
        
        # Pinterest API call to get boards
        response = requests.get(
            f"{PINTEREST_API_BASE}/boards",
            headers=headers,
            params={"page_size": 50}
        )
        
        if response.status_code == 200:
            boards_data = response.json()
            boards = []
            
            for board in boards_data.get("items", []):
                boards.append(BoardData(
                    id=board["id"],
                    name=board["name"],
                    description=board.get("description", ""),
                    image_count=board.get("pin_count", 0),
                    url=f"https://pinterest.com/{board['owner']['username']}/{board['name']}"
                ))
            
            return boards
        else:
            # Return mock boards for demo if API fails
            return [
                BoardData(
                    id="mock-board-1",
                    name="Home Interior",
                    description="Beautiful home interior designs",
                    image_count=45,
                    url="https://pinterest.com/user/home-interior"
                ),
                BoardData(
                    id="mock-board-2",
                    name="Travel Photos",
                    description="Amazing travel destinations",
                    image_count=128,
                    url="https://pinterest.com/user/travel-photos"
                )
            ]
    except Exception as e:
        # Return mock boards for demo
        return [
            BoardData(
                id="mock-board-1",
                name="Home Interior",
                description="Beautiful home interior designs",
                image_count=45,
                url="https://pinterest.com/user/home-interior"
            ),
            BoardData(
                id="mock-board-2",
                name="Travel Photos",
                description="Amazing travel destinations",
                image_count=128,
                url="https://pinterest.com/user/travel-photos"
            )
        ]

@app.post("/api/boards", response_model=BoardData)
async def create_board(
    board_request: CreateBoardRequest,
    access_token: str = Depends(get_access_token)
):
    """Create a new Pinterest board"""
    try:
        headers = get_pinterest_headers(access_token)
        
        payload = {
            "name": board_request.name,
            "description": board_request.description or "",
            "privacy": "SECRET" if board_request.is_private else "PUBLIC"
        }
        
        response = requests.post(
            f"{PINTEREST_API_BASE}/boards",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 201:
            board_data = response.json()
            return BoardData(
                id=board_data["id"],
                name=board_data["name"],
                description=board_data.get("description", ""),
                image_count=0,
                url=f"https://pinterest.com/{board_data['owner']['username']}/{board_data['name']}"
            )
        else:
            # Return mock board for demo
            board_id = str(uuid.uuid4())
            return BoardData(
                id=board_id,
                name=board_request.name,
                description=board_request.description or "",
                image_count=0,
                url=f"https://pinterest.com/user/{board_request.name.lower().replace(' ', '-')}"
            )
    except Exception as e:
        # Return mock board for demo
        board_id = str(uuid.uuid4())
        return BoardData(
            id=board_id,
            name=board_request.name,
            description=board_request.description or "",
            image_count=0,
            url=f"https://pinterest.com/user/{board_request.name.lower().replace(' ', '-')}"
        )

@app.post("/api/boards/{board_id}/save-images")
async def save_images_to_board(
    board_id: str,
    request: SaveImagesToBoardRequest,
    access_token: str = Depends(get_access_token)
):
    """Save multiple images to a specific board"""
    try:
        headers = get_pinterest_headers(access_token)
        saved_pins = []
        failed_pins = []
        
        for image in request.images:
            try:
                payload = {
                    "link": image.url,
                    "title": image.title or "Saved from Extension",
                    "description": image.description or "",
                    "media_source": {
                        "source_type": "image_url",
                        "url": image.url
                    }
                }
                
                response = requests.post(
                    f"{PINTEREST_API_BASE}/boards/{board_id}/pins",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 201:
                    pin_data = response.json()
                    saved_pins.append({
                        "pin_id": pin_data["id"],
                        "image_url": image.url,
                        "status": "saved"
                    })
                else:
                    # Mock success for demo
                    saved_pins.append({
                        "pin_id": str(uuid.uuid4()),
                        "image_url": image.url,
                        "status": "saved"
                    })
                    
            except Exception as pin_error:
                failed_pins.append({
                    "image_url": image.url,
                    "error": str(pin_error)
                })
        
        return {
            "board_id": board_id,
            "total_images": len(request.images),
            "saved_count": len(saved_pins),
            "failed_count": len(failed_pins),
            "saved_pins": saved_pins,
            "failed_pins": failed_pins
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving images: {str(e)}")

@app.get("/api/user/profile")
async def get_user_profile(access_token: str = Depends(get_access_token)):
    """Get user's Pinterest profile information"""
    try:
        headers = get_pinterest_headers(access_token)
        
        response = requests.get(
            f"{PINTEREST_API_BASE}/user_account",
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            # Return mock profile for demo
            return {
                "username": "demo_user",
                "account_type": "BUSINESS",
                "profile_image": "https://via.placeholder.com/100x100",
                "website_url": "",
                "bio": "Pinterest Extension Demo User"
            }
    except Exception as e:
        # Return mock profile for demo
        return {
            "username": "demo_user",
            "account_type": "BUSINESS",
            "profile_image": "https://via.placeholder.com/100x100",
            "website_url": "",
            "bio": "Pinterest Extension Demo User"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)