from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from pydantic import BaseModel
import os
import requests
import logging
from urllib.parse import urlencode
from ...auth_utils import get_current_active_user

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["LinkedIn Credentials"])

# Pydantic models for request/response
class LinkedInCredentialsRequest(BaseModel):
    client_id: str
    client_secret: str

class LinkedInCredentialsResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None
    member_urn: Optional[str] = None

class LinkedInTokenRequest(BaseModel):
    client_id: str
    client_secret: str
    code: str
    redirect_uri: str

class LinkedInTokenResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None
    expires_in: Optional[int] = None

class LinkedInUserInfoResponse(BaseModel):
    success: bool
    message: str
    member_urn: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None

@router.post("/exchange-code", response_model=LinkedInTokenResponse)
async def exchange_code_for_token(request: LinkedInTokenRequest):
    """
    Exchange authorization code for access token.
    """
    try:
        logger.info("Attempting to exchange code for token")
        # LinkedIn token endpoint
        token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        
        # Prepare the request data
        data = {
            "grant_type": "authorization_code",
            "code": request.code,
            "redirect_uri": request.redirect_uri,
            "client_id": request.client_id,
            "client_secret": request.client_secret
        }
        
        logger.info(f"Making request to LinkedIn token endpoint with client_id: {request.client_id}")
        # Make the request to LinkedIn
        response = requests.post(token_url, data=data)
        
        logger.info(f"Received response from LinkedIn with status code: {response.status_code}")
        
        # Handle specific error cases for expired or invalid codes
        if response.status_code == 400:
            try:
                error_data = response.json()
                error_description = error_data.get("error_description", "")
                
                # Check if it's an expired or invalid code error
                if "expired" in error_description.lower() or "invalid" in error_description.lower():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Authorization code is invalid or has expired. Please generate a new authorization code. Details: {error_description}"
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to exchange code for token: {error_description}"
                    )
            except ValueError:
                # If JSON parsing fails, use the text response
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to exchange code for token: {response.text}"
                )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to exchange code for token: {response.text}"
            )
        
        token_data = response.json()
        
        logger.info("Successfully exchanged code for token")
        return LinkedInTokenResponse(
            success=True,
            message="Successfully exchanged code for access token",
            access_token=token_data.get("access_token"),
            expires_in=token_data.get("expires_in")
        )
        
    except Exception as e:
        logger.error(f"Exception in exchange_code_for_token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/user-info", response_model=LinkedInUserInfoResponse)
async def get_linkedin_user_info(access_token: str):
    """
    Get LinkedIn user information to extract member URN.
    """
    try:
        logger.info("Attempting to get LinkedIn user info")
        # LinkedIn userinfo endpoint for OpenID Connect
        userinfo_url = "https://api.linkedin.com/v2/userinfo"
        
        # Make the request to LinkedIn
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        logger.info(f"Making request to LinkedIn userinfo endpoint with token: {access_token[:10]}...")
        response = requests.get(userinfo_url, headers=headers)
        
        logger.info(f"Received response from LinkedIn userinfo with status code: {response.status_code}")
        if response.status_code != 200:
            logger.error(f"Failed to get user info: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get user info: {response.text}"
            )
        
        user_data = response.json()
        
        logger.info(f"Successfully retrieved user info: {user_data}")
        # Extract member URN from subject
        member_urn = f"urn:li:person:{user_data.get('sub')}"
        
        return LinkedInUserInfoResponse(
            success=True,
            message="Successfully retrieved user information",
            member_urn=member_urn,
            name=user_data.get("name"),
            email=user_data.get("email")
        )
        
    except Exception as e:
        logger.error(f"Exception in get_linkedin_user_info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )