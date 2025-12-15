from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from pydantic import BaseModel, Field, validator
import os
import uuid
from datetime import datetime
import re

# Import database models and utilities
from ...database import get_database
from ...services.ai_services import generate_linkedin_post_with_llama
from ...auth_utils import get_current_active_user

# Import logging
from ...logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Content"])

# Pydantic models for request/response
class GeneratePostRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200, description="Topic for the LinkedIn post")
    tone: str = Field("professional", description="Tone of the post (professional, casual, inspirational, educational)")
    audience: Optional[str] = Field(None, max_length=100, description="Target audience for the post")
    url: Optional[str] = Field(None, max_length=2048, description="URL to include in the post")
    length: Optional[str] = Field("Medium", description="Length of the post (Short, Medium, Long)")
    includeHashtags: Optional[bool] = Field(True, description="Include hashtags in the post")
    emojis: Optional[bool] = Field(True, description="Include emojis in the post")
    
    @validator('tone')
    def validate_tone(cls, v):
        allowed_tones = ["professional", "casual", "inspirational", "educational"]
        if v.lower() not in allowed_tones:
            raise ValueError(f'Tone must be one of: {", ".join(allowed_tones)}')
        return v.lower()
    
    @validator('length')
    def validate_length(cls, v):
        allowed_lengths = ["short", "medium", "long"]
        if v.lower() not in allowed_lengths:
            raise ValueError(f'Length must be one of: {", ".join(allowed_lengths)}')
        return v.lower()
    
    @validator('url')
    def validate_url(cls, v):
        if v is not None and not re.match(r'^https?://', v):
            raise ValueError('URL must start with http:// or https://')
        return v

class GeneratePostResponse(BaseModel):
    success: bool
    posts: List[str]

class SavePostRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=3000, description="Content of the LinkedIn post")
    hashtags: Optional[List[str]] = Field(None, max_items=30, description="List of hashtags")
    imageUrl: Optional[str] = Field(None, max_length=2048, description="URL of the image")
    
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
    
    @validator('imageUrl')
    def validate_image_url(cls, v):
        if v is not None and not re.match(r'^https?://', v):
            raise ValueError('Image URL must start with http:// or https://')
        return v

class SavePostResponse(BaseModel):
    success: bool
    post: dict

@router.post("/generate", response_model=GeneratePostResponse)
async def generate_post(request: GeneratePostRequest):
    """
    Generate LinkedIn posts using AI or return sample posts if no AI provider is configured.
    """
    try:
        # Generate post using Llama model
        generated_post = await generate_linkedin_post_with_llama(
            topic=request.topic,
            tone=request.tone,
            audience=request.audience
        )
        
        # Return the generated post
        return GeneratePostResponse(success=True, posts=[generated_post])
    except Exception as e:
        logger.error(f"Error generating post: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/save", response_model=SavePostResponse)
async def save_post(request: SavePostRequest, current_user: dict = Depends(get_current_active_user)):
    """
    Save a post to the database.
    """
    try:
        # Use authenticated user ID
        user_id = current_user["user_id"]
        
        # Get database connection
        database = await get_database()
        posts_collection = database["posts"]
        
        # Create post in database
        post_id = f"post_{uuid.uuid4()}"[:24]
        post_data = {
            "_id": post_id,
            "userId": user_id,
            "content": request.content,
            "hashtags": request.hashtags or [],
            "imageUrl": request.imageUrl,
            "status": "draft",
            "linkedinPostId": None,
            "engagementMetrics": {
                "views": 0,
                "likes": 0,
                "comments": 0,
                "shares": 0,
                "impressions": 0,
                "engagementRate": 0.0
            },
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        # Save post to database
        await posts_collection.insert_one(post_data)
        
        return SavePostResponse(success=True, post=post_data)
    except Exception as e:
        logger.error(f"Error saving post: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )