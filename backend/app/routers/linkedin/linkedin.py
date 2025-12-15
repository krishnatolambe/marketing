import os
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

# Import database and auth utilities
from ...database import get_database
from ...auth_utils import get_current_active_user

# Import LinkedIn service
from ...services.linkedin_service import linkedin_service

router = APIRouter(tags=["LinkedIn"])

# Pydantic models for request/response
class PostToLinkedInRequest(BaseModel):
    postId: str

class PostToLinkedInResponse(BaseModel):
    success: bool
    message: str
    linkedinPostId: str

@router.post("/post", response_model=PostToLinkedInResponse)
async def post_to_linkedin(request: PostToLinkedInRequest, current_user: dict = Depends(get_current_active_user)):
    """
    Post content to LinkedIn.
    """
    try:
        # Get database connection
        database = await get_database()
        posts_collection = database["posts"]
        
        # Get the post content from database
        post = await posts_collection.find_one({"_id": request.postId, "userId": current_user["user_id"]})
        
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found or unauthorized access"
            )
        
        # Get LinkedIn credentials from environment or database
        # For now, we'll use environment variables
        access_token = os.getenv("LINKEDIN_ACCESS_TOKEN")
        member_urn = os.getenv("LINKEDIN_MEMBER_URN")
        
        if not access_token or not member_urn:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="LinkedIn credentials not configured. Please connect your LinkedIn account."
            )
        
        # Post to LinkedIn using the service
        result = linkedin_service.post_to_linkedin(
            access_token=access_token,
            member_urn=member_urn,
            content=post["content"],
            image_url=post.get("imageUrl")
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )
        
        # Update the post in the database with LinkedIn post ID and status
        await posts_collection.update_one(
            {"_id": request.postId},
            {
                "$set": {
                    "linkedinPostId": result["linkedin_post_id"],
                    "status": "linkedin_published",
                    "updatedAt": datetime.utcnow().isoformat()
                }
            }
        )
        
        return PostToLinkedInResponse(
            success=True,
            message="Post published to LinkedIn successfully",
            linkedinPostId=result["linkedin_post_id"]
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )