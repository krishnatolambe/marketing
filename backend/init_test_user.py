#!/usr/bin/env python3
"""
Script to initialize the test user in the database
"""

import os
import sys
import asyncio
from datetime import datetime
import uuid

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from app.database import init_db, get_database
from app.auth_utils import get_password_hash

async def create_test_user():
    """Create the test user in the database"""
    # Initialize database connection
    await init_db()
    
    # Get database connection
    database = await get_database()
    
    # Check if test user already exists
    existing_user = await database.users.find_one({"username": "testuser"})
    if existing_user:
        print("Test user already exists in the database")
        return
    
    # Create test user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash("testpass123")
    
    user_doc = {
        "user_id": user_id,
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Test User",
        "phone": None,
        "role": "user",
        "status": "active",
        "password_hash": hashed_password,
        "created_at": datetime.utcnow(),
        "last_login": None,
        "preferences": {
            "notifications": {
                "postReminders": True,
                "engagementAlerts": False,
                "weeklyReports": True
            }
        }
    }
    
    # Insert user into database
    result = await database.users.insert_one(user_doc)
    
    if result.inserted_id:
        print(f"✅ Test user created successfully with ID: {user_id}")
    else:
        print("❌ Failed to create test user")

if __name__ == "__main__":
    asyncio.run(create_test_user())