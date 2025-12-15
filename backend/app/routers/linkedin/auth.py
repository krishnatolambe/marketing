from fastapi import APIRouter, HTTPException, status
from typing import Optional
from pydantic import BaseModel
import os
from urllib.parse import urlencode

router = APIRouter(tags=["Authentication"])

# Pydantic models for request/response
class LinkedInLoginResponse(BaseModel):
    success: bool
    message: str
    redirectUrl: str

class LinkedInCallbackResponse(BaseModel):
    success: bool
    message: str
    token: str
    member_urn: Optional[str] = None

@router.get("/login", response_model=LinkedInLoginResponse)
async def linkedin_login():
    """
    Initiate LinkedIn OAuth login flow.
    """
    try:
                # Get LinkedIn app configuration from environment
        client_id = os.getenv("LINKEDIN_CLIENT_ID")
        redirect_uri = os.getenv("LINKEDIN_REDIRECT_URI")
        
        if not client_id or not redirect_uri:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="LinkedIn app configuration missing"
            )
        
        # Build authorization URL
        AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
        params = {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": "openid profile w_member_social",
            "state": "2025"
        }
        
        auth_url = AUTH_URL + "?" + urlencode(params)
        
        return LinkedInLoginResponse(
            success=True,
            message="Redirecting to LinkedIn for authentication",
            redirectUrl=auth_url
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/callback", response_model=LinkedInCallbackResponse)
async def linkedin_callback(code: str = None, error: str = None):
    """
    Handle LinkedIn OAuth callback.
    """
    try:
        if error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"LinkedIn OAuth error: {error}"
            )
        
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing authorization code"
            )
        
        # Exchange code for access token
        import requests
        
        # Get LinkedIn app configuration from environment
        client_id = os.getenv("LINKEDIN_CLIENT_ID")
        client_secret = os.getenv("LINKEDIN_CLIENT_SECRET")
        redirect_uri = os.getenv("LINKEDIN_REDIRECT_URI")
        
        if not client_id or not client_secret or not redirect_uri:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="LinkedIn app configuration missing"
            )
        
        # Exchange authorization code for access token
        TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "client_secret": client_secret
        }
        
        response = requests.post(TOKEN_URL, data=data)
        
        # Handle specific error cases for expired or invalid codes
        if response.status_code == 400:
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
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to exchange code for token: {response.text}"
            )
        
        token_data = response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to extract access token from response"
            )
        
        # Get user info to get the member URN
        USER_INFO_URL = "https://api.linkedin.com/v2/userinfo"
        user_response = requests.get(USER_INFO_URL, headers={"Authorization": f"Bearer {access_token}"})
        
        member_urn = None
        if user_response.status_code == 200:
            user_data = user_response.json()
            sub = user_data.get("sub")
            if sub:
                member_urn = f"urn:li:person:{sub}"
        
        # Return both token and member URN
        return {
            "success": True,
            "message": "Successfully authenticated with LinkedIn",
            "token": access_token,
            "member_urn": member_urn
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )