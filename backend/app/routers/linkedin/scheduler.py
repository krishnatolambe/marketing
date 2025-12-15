from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from datetime import datetime, timezone
import asyncio
import traceback
import uuid
import re

# Import logging
from ...logging_config import get_logger

logger = get_logger(__name__)

# Import database connection
from ...database import get_database
from ...auth_utils import get_current_active_user

router = APIRouter(tags=["Scheduler"])

# Pydantic models for request/response
class SchedulePostRequest(BaseModel):
    postId: str = Field(..., min_length=1, max_length=50, description="ID of the post to schedule")
    scheduledAt: str = Field(..., description="ISO format datetime string for scheduling")
    
    @validator('scheduledAt')
    def validate_scheduled_at(cls, v):
        # Validate ISO format datetime
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError('Invalid datetime format. Use ISO format.')
        return v

class UpdateScheduledPostRequest(BaseModel):
    scheduledAt: str = Field(..., description="ISO format datetime string for scheduling")
    
    @validator('scheduledAt')
    def validate_scheduled_at(cls, v):
        # Validate ISO format datetime
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError('Invalid datetime format. Use ISO format.')
        return v

class UpdateScheduledPostWithContentRequest(BaseModel):
    scheduledAt: str = Field(..., description="ISO format datetime string for scheduling")
    content: str = Field(..., min_length=1, max_length=3000, description="Content of the LinkedIn post")
    hashtags: Optional[List[str]] = Field(None, max_items=30, description="List of hashtags")
    
    @validator('scheduledAt')
    def validate_scheduled_at(cls, v):
        # Validate ISO format datetime
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError('Invalid datetime format. Use ISO format.')
        return v
    
    @validator('hashtags')
    def validate_hashtags(cls, v):
        if v is not None:
            # Validate each hashtag
            for hashtag in v:
                if not re.match(r'^[a-zA-Z0-9_]+$', hashtag):
                    raise ValueError(f'Invalid hashtag: {hashtag}')
            # Remove duplicates while preserving order
            return list(dict.fromkeys(v))
        return v

class SchedulePostResponse(BaseModel):
    success: bool
    message: str
    job: dict

class ScheduledPost(BaseModel):
    id: str
    postId: str
    content: str
    scheduledAt: str
    status: str

class GetScheduledPostsResponse(BaseModel):
    success: bool
    scheduledPosts: List[ScheduledPost]

@router.post("/", response_model=SchedulePostResponse)
async def schedule_post(request: SchedulePostRequest, current_user: dict = Depends(get_current_active_user)):
    """
    Schedule a post for future publishing.
    """
    try:
        # Validate the scheduled time is in the future
        # Handle different datetime formats
        try:
            scheduled_time = datetime.fromisoformat(request.scheduledAt.replace("Z", "+00:00"))
        except ValueError:
            # Try parsing without timezone adjustment
            scheduled_time = datetime.fromisoformat(request.scheduledAt)
        
        # Ensure both datetimes are timezone aware for comparison
        if scheduled_time.tzinfo is None:
            scheduled_time = scheduled_time.replace(tzinfo=timezone.utc)
        current_time = datetime.now(timezone.utc)
        
        if scheduled_time < current_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scheduled time must be in the future"
            )
        
        # Use authenticated user ID
        user_id = current_user["user_id"]
        
        # Get database connection
        database = await get_database()
        
        # Get post content from database
        post_collection = database["posts"]
        post = await post_collection.find_one({"_id": request.postId, "userId": user_id})
        
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found or unauthorized access"
            )
        
        # Create scheduled post document
        scheduled_post_id = str(uuid.uuid4())
        scheduled_post_doc = {
            "_id": scheduled_post_id,
            "postId": request.postId,
            "userId": user_id,
            "content": post.get("content", "Sample post content"),
            "scheduledAt": request.scheduledAt,
            "status": "scheduled",
            "createdAt": datetime.utcnow().isoformat()
        }
        
        # Save scheduled post to database
        scheduled_posts_collection = database["scheduled_posts"]
        await scheduled_posts_collection.insert_one(scheduled_post_doc)
        
        # Create a mock job
        job = {
            "id": f"job_{scheduled_post_id[:8]}",
            "postId": request.postId,
            "userId": user_id,
            "scheduleTime": request.scheduledAt,
            "status": "pending"
        }
        
        return SchedulePostResponse(
            success=True,
            message="Post scheduled successfully",
            job=job
        )
    except ValueError as e:
        logger.error(f"ValueError in schedule_post: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid datetime format. Use ISO format."
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error in schedule_post: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{scheduled_post_id}", response_model=SchedulePostResponse)
async def update_scheduled_post(scheduled_post_id: str, request: UpdateScheduledPostRequest):
    """
    Update a scheduled post.
    """
    try:
        # Get database connection
        database = await get_database()
        scheduled_posts_collection = database["scheduled_posts"]
        
        # Find the scheduled post
        scheduled_post = await scheduled_posts_collection.find_one({"_id": scheduled_post_id})
        if not scheduled_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scheduled post not found"
            )
        
        # Update the scheduled time
        update_data = {
            "scheduledAt": request.scheduledAt,
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        await scheduled_posts_collection.update_one(
            {"_id": scheduled_post_id},
            {"$set": update_data}
        )
        
        # Create a mock job
        job = {
            "id": f"job_{scheduled_post_id[:8]}",
            "postId": scheduled_post["postId"],
            "scheduleTime": request.scheduledAt,
            "status": "pending"
        }
        
        return SchedulePostResponse(
            success=True,
            message="Scheduled post updated successfully",
            job=job
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error in update_scheduled_post: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{scheduled_post_id}/content", response_model=SchedulePostResponse)
async def update_scheduled_post_with_content(scheduled_post_id: str, request: UpdateScheduledPostWithContentRequest):
    """
    Update a scheduled post with new content and scheduled time.
    """
    try:
        # Validate request data
        if not request.content or not request.scheduledAt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Content and scheduled time are required"
            )
        
        # Get database connection
        database = await get_database()
        scheduled_posts_collection = database["scheduled_posts"]
        
        # Find the scheduled post
        scheduled_post = await scheduled_posts_collection.find_one({"_id": scheduled_post_id})
        if not scheduled_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scheduled post not found"
            )
        
        # Update the scheduled post content and time
        update_data = {
            "content": request.content,
            "scheduledAt": request.scheduledAt,
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        if request.hashtags is not None:
            update_data["hashtags"] = request.hashtags
        
        await scheduled_posts_collection.update_one(
            {"_id": scheduled_post_id},
            {"$set": update_data}
        )
        
        # Create a mock job
        job = {
            "id": f"job_{scheduled_post_id[:8]}",
            "postId": scheduled_post["postId"],
            "scheduleTime": request.scheduledAt,
            "status": "pending"
        }
        
        return SchedulePostResponse(
            success=True,
            message="Scheduled post and content updated successfully",
            job=job
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error updating scheduled post: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update scheduled post: {str(e)}"
        )

@router.delete("/{scheduled_post_id}")
async def delete_scheduled_post(scheduled_post_id: str):
    """
    Delete a scheduled post.
    """
    try:
        # Validate input
        if not scheduled_post_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scheduled post ID is required"
            )
        
        # Get database connection
        database = await get_database()
        scheduled_posts_collection = database["scheduled_posts"]
        
        # Delete the scheduled post
        result = await scheduled_posts_collection.delete_one({"_id": scheduled_post_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scheduled post not found"
            )
        
        return {"success": True, "message": "Scheduled post deleted successfully"}
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error deleting scheduled post: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete scheduled post: {str(e)}"
        )

@router.get("/", response_model=GetScheduledPostsResponse)
async def get_scheduled_posts(current_user: dict = Depends(get_current_active_user)):
    """
    Get all scheduled posts for the current user.
    """
    try:
        # Use authenticated user ID
        user_id = current_user["user_id"]
        
        # Get database connection
        database = await get_database()
        scheduled_posts_collection = database["scheduled_posts"]
        
        # Get scheduled posts for the user
        cursor = scheduled_posts_collection.find({"userId": user_id})
        user_scheduled_posts = await cursor.to_list(length=None)
        
        # Convert to ScheduledPost objects
        scheduled_post_objects = [
            ScheduledPost(
                id=post["_id"],
                postId=post["postId"],
                content=post["content"],
                scheduledAt=post["scheduledAt"],
                status=post["status"]
            )
            for post in user_scheduled_posts
        ]
        
        return GetScheduledPostsResponse(
            success=True,
            scheduledPosts=scheduled_post_objects
        )
    except Exception as e:
        logger.error(f"Error in get_scheduled_posts: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )