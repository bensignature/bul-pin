import requests
import unittest
import json
import sys
from datetime import datetime

class PinterestExtensionAPITester(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(PinterestExtensionAPITester, self).__init__(*args, **kwargs)
        self.base_url = "http://localhost:8001"
        self.access_token = "demo_access_token_12345"
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.access_token}'
        }
        self.test_images = [
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
                "url": "https://via.placeholder.com/80x60",
                "width": 80,
                "height": 60,
                "title": "Small Image 1",
                "description": "This should be filtered out"
            }
        ]

    def test_01_health_check(self):
        """Test the health check endpoint"""
        print("\n🔍 Testing health check endpoint...")
        response = requests.get(f"{self.base_url}/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        print("✅ Health check endpoint is working")

    def test_02_filter_images(self):
        """Test the image filtering endpoint"""
        print("\n🔍 Testing image filtering endpoint...")
        response = requests.post(
            f"{self.base_url}/api/images/filter",
            headers={'Content-Type': 'application/json'},
            json=self.test_images
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify that images smaller than 100px are filtered out
        self.assertEqual(data["total_count"], 3)
        self.assertEqual(data["filtered_count"], 2)
        
        # Check that all returned images are > 100px
        for image in data["images"]:
            self.assertTrue(image["width"] > 100 and image["height"] > 100)
        
        print("✅ Image filtering endpoint is working")

    def test_03_get_boards(self):
        """Test getting user boards"""
        print("\n🔍 Testing get boards endpoint...")
        response = requests.get(
            f"{self.base_url}/api/boards",
            headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        boards = response.json()
        self.assertTrue(isinstance(boards, list))
        
        # Check that we have at least one board
        self.assertTrue(len(boards) > 0)
        
        # Check board structure
        for board in boards:
            self.assertTrue("id" in board)
            self.assertTrue("name" in board)
            self.assertTrue("image_count" in board)
            self.assertTrue("url" in board)
        
        print(f"✅ Get boards endpoint returned {len(boards)} boards")
        return boards

    def test_04_create_board(self):
        """Test creating a new board"""
        print("\n🔍 Testing create board endpoint...")
        board_data = {
            "name": f"Test Board {datetime.now().strftime('%Y%m%d%H%M%S')}",
            "description": "Created by automated test",
            "is_private": False
        }
        
        response = requests.post(
            f"{self.base_url}/api/boards",
            headers=self.headers,
            json=board_data
        )
        self.assertEqual(response.status_code, 200)
        new_board = response.json()
        
        # Check board structure
        self.assertTrue("id" in new_board)
        self.assertEqual(new_board["name"], board_data["name"])
        self.assertEqual(new_board["description"], board_data["description"])
        
        print(f"✅ Created board: {new_board['name']} (ID: {new_board['id']})")
        return new_board

    def test_05_save_images_to_board(self):
        """Test saving images to a board"""
        print("\n🔍 Testing save images to board endpoint...")
        
        # First create a board
        new_board = self.test_04_create_board()
        board_id = new_board["id"]
        
        # Filter images to get only valid ones
        response = requests.post(
            f"{self.base_url}/api/images/filter",
            headers={'Content-Type': 'application/json'},
            json=self.test_images
        )
        filtered_images = response.json()["images"]
        
        # Save filtered images to board
        save_data = {
            "board_id": board_id,
            "images": filtered_images
        }
        
        response = requests.post(
            f"{self.base_url}/api/boards/{board_id}/save-images",
            headers=self.headers,
            json=save_data
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        
        # Check save result
        self.assertEqual(result["board_id"], board_id)
        self.assertEqual(result["total_images"], len(filtered_images))
        self.assertTrue(result["saved_count"] > 0)
        
        print(f"✅ Saved {result['saved_count']} images to board {board_id}")

    def test_06_user_profile(self):
        """Test getting user profile"""
        print("\n🔍 Testing user profile endpoint...")
        response = requests.get(
            f"{self.base_url}/api/user/profile",
            headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        profile = response.json()
        
        # Check profile structure
        self.assertTrue("username" in profile)
        
        print(f"✅ Got user profile for: {profile['username']}")

def run_tests():
    """Run all tests and return results"""
    test_suite = unittest.TestSuite()
    test_suite.addTest(PinterestExtensionAPITester('test_01_health_check'))
    test_suite.addTest(PinterestExtensionAPITester('test_02_filter_images'))
    test_suite.addTest(PinterestExtensionAPITester('test_03_get_boards'))
    test_suite.addTest(PinterestExtensionAPITester('test_04_create_board'))
    test_suite.addTest(PinterestExtensionAPITester('test_05_save_images_to_board'))
    test_suite.addTest(PinterestExtensionAPITester('test_06_user_profile'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    return result.wasSuccessful()

if __name__ == "__main__":
    print("🧪 Running Pinterest Extension API Tests")
    success = run_tests()
    sys.exit(0 if success else 1)