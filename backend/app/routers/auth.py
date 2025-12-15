from fastapi import APIRouter, Depends, HTTPException, status, Form
from datetime import timedelta, datetime
from ..models import LoginRequest, RegisterRequest, Token, APIResponse, UserRole, UserUpdate
from ..auth_utils import authenticate_user, create_access_token, get_current_active_user, get_password_hash, verify_password
from ..database import get_database, settings
from ..logging_config import get_logger
import uuid
from typing import Optional

logger = get_logger(__name__)

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(login_request: LoginRequest):
    """Authenticate user and return access token"""
    logger.info(f"Login request received for username: {login_request.username}")
    user = await authenticate_user(login_request.username, login_request.password)
    if not user:
        logger.warning(f"Authentication failed for user: {login_request.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"User {login_request.username} authenticated successfully")
    
    if user["status"] != "active":
        logger.warning(f"User {login_request.username} is not active (status: {user['status']})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    # Update last login time
    database = await get_database()
    await database.users.update_one(
        {"username": user["username"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    logger.info(f"Login successful for user: {login_request.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout", response_model=APIResponse)
async def logout(current_user: dict = Depends(get_current_active_user)):
    """Logout user (in a real implementation, you might blacklist the token)"""
    return APIResponse(
        success=True,
        message="Successfully logged out"
    )

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current user information"""
    # Remove sensitive information
    user_info = {
        "user_id": current_user["user_id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"],
        "status": current_user["status"],
        "created_at": current_user["created_at"],
        "last_login": current_user.get("last_login")
    }
    
    return APIResponse(
        success=True,
        message="User information retrieved successfully",
        data=user_info
    )

@router.put("/me", response_model=APIResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update current user's profile information"""
    database = await get_database()
    
    # Check if user exists
    existing_user = await database.users.find_one({"user_id": current_user["user_id"]})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prepare update data
    update_data = {}
    if user_update.username is not None:
        # Check if new username already exists (excluding current user)
        existing_username = await database.users.find_one({
            "username": user_update.username,
            "user_id": {"$ne": current_user["user_id"]}
        })
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        update_data["username"] = user_update.username
    
    if user_update.email is not None:
        # Check if new email already exists (excluding current user)
        existing_email = await database.users.find_one({
            "email": user_update.email,
            "user_id": {"$ne": current_user["user_id"]}
        })
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        update_data["email"] = user_update.email
    
    if user_update.full_name is not None:
        update_data["full_name"] = user_update.full_name
    if user_update.phone is not None:
        update_data["phone"] = user_update.phone
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        
        # Update user in database
        result = await database.users.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user"
            )
    
    return APIResponse(
        success=True,
        message="Profile updated successfully",
        data={"user_id": current_user["user_id"]}
    )

@router.put("/me/password", response_model=APIResponse)
async def change_current_user_password(
    current_password: str = Form(...),
    new_password: str = Form(...),
    current_user: dict = Depends(get_current_active_user)
):
    """Change current user's password"""
    database = await get_database()
    
    # Verify current password
    if not verify_password(current_password, current_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    hashed_password = get_password_hash(new_password)
    
    # Update password in database
    result = await database.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"password_hash": hashed_password, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )
    
    return APIResponse(
        success=True,
        message="Password changed successfully",
        data={"user_id": current_user["user_id"]}
    )

@router.post("/register", response_model=APIResponse)
async def register_user(register_request: RegisterRequest):
    """Register a new user"""
    database = await get_database()
    
    # Check if username already exists
    existing_username = await database.users.find_one({"username": register_request.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    existing_email = await database.users.find_one({"email": register_request.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Create user document
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(register_request.password)
    
    user_doc = {
        "user_id": user_id,
        "username": register_request.username,
        "email": register_request.email,
        "full_name": register_request.full_name,
        "phone": register_request.phone,
        "role": "user",  # Simple user role
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
    
    if not result.inserted_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    return APIResponse(
        success=True,
        message="User registered successfully",
        data={"user_id": user_id, "username": register_request.username}
    )

@router.get("/preferences")
async def get_user_preferences(current_user: dict = Depends(get_current_active_user)):
    """Get current user's preferences"""
    # Return user preferences or default preferences if not set
    preferences = current_user.get("preferences", {
        "notifications": {
            "postReminders": True,
            "engagementAlerts": False,
            "weeklyReports": True
        }
    })
    
    return {"success": True, "preferences": preferences}

@router.put("/preferences")
async def update_user_preferences(
    preferences_data: dict,
    current_user: dict = Depends(get_current_active_user)
):
    """Update current user's preferences"""
    database = await get_database()
    
    # Extract preferences from the request
    preferences = preferences_data.get("preferences", {})
    
    # Update user preferences in database
    result = await database.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"preferences": preferences, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences"
        )
    
    return {"success": True, "message": "Preferences updated successfully", "preferences": preferences}

