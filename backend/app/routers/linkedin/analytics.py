from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import os

# Import database and auth utilities
from ...database import get_database
from ...auth_utils import get_current_active_user

# Import LinkedIn service
from ...services.linkedin_service import linkedin_service

# Import logging
from ...logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Analytics"])

# Pydantic models for request/response
class PostAnalyticsResponse(BaseModel):
    success: bool
    analytics: dict

class PostEngagementResponse(BaseModel):
    success: bool
    metrics: dict
    message: str

class BestPostingTimesResponse(BaseModel):
    success: bool
    bestTimes: List[dict]

@router.get("/{post_id}", response_model=PostAnalyticsResponse)
async def get_post_analytics(post_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Get analytics for a specific post.
    """
    try:
        # Get database connection
        database = await get_database()
        posts_collection = database["posts"]
        
        # Get the post from database
        post = await posts_collection.find_one({"_id": post_id, "userId": current_user["user_id"]})
        
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found or unauthorized access"
            )
        
        # In a real implementation, fetch actual analytics data from LinkedIn API or database
        # For now, we'll return mock analytics data
        mock_analytics = {
            "postId": post_id,
            "views": post.get("engagementMetrics", {}).get("views", 150),
            "likes": post.get("engagementMetrics", {}).get("likes", 25),
            "comments": post.get("engagementMetrics", {}).get("comments", 8),
            "shares": post.get("engagementMetrics", {}).get("shares", 3),
            "impressions": post.get("engagementMetrics", {}).get("impressions", 420),
            "engagementRate": post.get("engagementMetrics", {}).get("engagementRate", 8.5),
            "createdAt": post.get("createdAt", datetime.utcnow().isoformat())
        }
        
        return PostAnalyticsResponse(
            success=True,
            analytics=mock_analytics
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error getting post analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{post_id}/engagement", response_model=PostEngagementResponse)
async def get_post_engagement(post_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Get real engagement metrics for a LinkedIn post.
    """
    try:
        # Get database connection
        database = await get_database()
        posts_collection = database["posts"]
        
        # Get the post from database
        post = await posts_collection.find_one({"_id": post_id, "userId": current_user["user_id"]})
        
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found or unauthorized access"
            )
        
        # Check if post has been published to LinkedIn
        if not post.get("linkedinPostId"):
            return PostEngagementResponse(
                success=False,
                metrics={
                    "views": 0,
                    "likes": 0,
                    "comments": 0,
                    "shares": 0,
                    "impressions": 0,
                    "engagementRate": 0.0
                },
                message="Post has not been published to LinkedIn yet"
            )
        
        # Get LinkedIn credentials
        access_token = os.getenv("LINKEDIN_ACCESS_TOKEN")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="LinkedIn credentials not configured"
            )
        
        # Fetch engagement metrics from LinkedIn
        linkedin_post_urn = f"urn:li:share:{post['linkedinPostId']}"
        result = linkedin_service.get_post_engagement(access_token, linkedin_post_urn)
        
        if result["success"]:
            # Update the post in database with new engagement metrics
            await posts_collection.update_one(
                {"_id": post_id},
                {
                    "$set": {
                        "engagementMetrics": result["metrics"],
                        "updatedAt": datetime.utcnow().isoformat()
                    }
                }
            )
            
            return PostEngagementResponse(
                success=True,
                metrics=result["metrics"],
                message="Engagement metrics fetched successfully"
            )
        else:
            return PostEngagementResponse(
                success=False,
                metrics={
                    "views": post.get("engagementMetrics", {}).get("views", 0),
                    "likes": post.get("engagementMetrics", {}).get("likes", 0),
                    "comments": post.get("engagementMetrics", {}).get("comments", 0),
                    "shares": post.get("engagementMetrics", {}).get("shares", 0),
                    "impressions": post.get("engagementMetrics", {}).get("impressions", 0),
                    "engagementRate": post.get("engagementMetrics", {}).get("engagementRate", 0.0)
                },
                message=result["message"]
            )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error getting post engagement: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/best-times", response_model=BestPostingTimesResponse)
async def get_best_posting_times():
    """
    Get best times to post based on analytics.
    """
    try:
        # In a real implementation, analyze actual user engagement data
        # For now, we'll return mock best posting times
        mock_best_times = [
            {"day": "Monday", "hour": 10, "engagement": 85},
            {"day": "Tuesday", "hour": 14, "engagement": 78},
            {"day": "Wednesday", "hour": 11, "engagement": 82},
            {"day": "Thursday", "hour": 15, "engagement": 79},
            {"day": "Friday", "hour": 9, "engagement": 88}
        ]
        
        return BestPostingTimesResponse(
            success=True,
            bestTimes=mock_best_times
        )
    except Exception as e:
        logger.error(f"Error getting best posting times: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )