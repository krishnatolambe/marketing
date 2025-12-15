"""
LinkedIn service for posting content to LinkedIn
"""
import os
import requests
import urllib.parse
from typing import Dict, Any, Optional
from ..logging_config import get_logger

logger = get_logger(__name__)

# LinkedIn API constants
LINKEDIN_API_BASE = "https://api.linkedin.com/v2"

class LinkedInService:
    def __init__(self):
        self.client_id = os.getenv("LINKEDIN_CLIENT_ID")
        self.client_secret = os.getenv("LINKEDIN_CLIENT_SECRET")
        self.redirect_uri = os.getenv("LINKEDIN_REDIRECT_URI")
        
    def post_to_linkedin(self, access_token: str, member_urn: str, content: str, image_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Post content to LinkedIn
        
        Args:
            access_token: LinkedIn OAuth access token
            member_urn: LinkedIn member URN
            content: Content to post
            image_url: Optional image URL to include
            
        Returns:
            Dictionary with success status and LinkedIn post ID
        """
        try:
            # Prepare the post payload
            payload = {
                "author": member_urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {"text": content},
                        "shareMediaCategory": "IMAGE" if image_url else "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
            
            # Add image if provided
            if image_url:
                payload["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [
                    {
                        "status": "READY",
                        "description": {"text": "Image for post"},
                        "media": image_url,
                        "title": {"text": "Image"}
                    }
                ]
            
            # Make the API request
            headers = {
                "Authorization": f"Bearer {access_token}",
                "X-Restli-Protocol-Version": "2.0.0",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{LINKEDIN_API_BASE}/ugcPosts",
                headers=headers,
                json=payload
            )
            
            # Check if the request was successful
            if response.status_code in (200, 201):
                response_data = response.json()
                linkedin_post_id = response_data.get("id", "")
                
                logger.info(f"Successfully posted to LinkedIn. Post ID: {linkedin_post_id}")
                return {
                    "success": True,
                    "linkedin_post_id": linkedin_post_id,
                    "message": "Post published to LinkedIn successfully"
                }
            else:
                error_message = f"Failed to post to LinkedIn. Status: {response.status_code}"
                try:
                    error_data = response.json()
                    error_message += f" - {error_data}"
                except:
                    error_message += f" - {response.text}"
                    
                logger.error(error_message)
                return {
                    "success": False,
                    "message": error_message
                }
                
        except Exception as e:
            error_message = f"Error posting to LinkedIn: {str(e)}"
            logger.error(error_message)
            return {
                "success": False,
                "message": error_message
            }
    
    def get_post_engagement(self, access_token: str, post_urn: str) -> Dict[str, Any]:
        """
        Get engagement metrics for a LinkedIn post using the correct API endpoint
        
        Args:
            access_token: LinkedIn OAuth access token
            post_urn: LinkedIn post URN (e.g., urn:li:share:123456789 or just the ID part)
            
        Returns:
            Dictionary with engagement metrics
        """
        try:
            # Make the API request to get post statistics
            headers = {
                "Authorization": f"Bearer {access_token}",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            # Ensure we have a proper URN format
            if not post_urn.startswith("urn:li:share:"):
                post_urn = f"urn:li:share:{post_urn}"
            
            # Extract just the ID part for the API call
            # The LinkedIn API expects just the numeric ID part for socialActions endpoint
            if post_urn.startswith("urn:li:share:"):
                post_id = post_urn.replace("urn:li:share:", "")
            else:
                post_id = post_urn
            
            # URL encode the post ID to handle special characters
            encoded_post_id = urllib.parse.quote(post_id, safe='')
            
            # Use the correct endpoint for social actions - simplified approach
            # Just fetch the social actions for the post to get likes and comments
            analytics_url = f"{LINKEDIN_API_BASE}/socialActions/{encoded_post_id}"
            
            response = requests.get(analytics_url, headers=headers)
            
            # Check if the request was successful
            if response.status_code == 200:
                response_data = response.json()
                
                # Parse engagement metrics from response
                metrics = {
                    "views": 0,
                    "likes": 0,
                    "comments": 0,
                    "shares": 0,
                    "impressions": 0,
                    "engagement_rate": 0.0
                }
                
                # Extract likes count if available
                if "likesSummary" in response_data:
                    metrics["likes"] = response_data["likesSummary"].get("aggregatedTotalLikes", 0)
                
                # Extract comments count if available
                if "commentsSummary" in response_data:
                    metrics["comments"] = response_data["commentsSummary"].get("aggregatedTotalComments", 0)
                
                logger.info(f"Successfully fetched engagement metrics for post {post_urn}")
                return {
                    "success": True,
                    "metrics": metrics
                }
            elif response.status_code == 404:
                # Post not found, return zeros
                logger.warning(f"Post {post_urn} not found on LinkedIn")
                return {
                    "success": True,
                    "metrics": {
                        "views": 0,
                        "likes": 0,
                        "comments": 0,
                        "shares": 0,
                        "impressions": 0,
                        "engagement_rate": 0.0
                    }
                }
            else:
                error_message = f"Failed to fetch engagement metrics. Status: {response.status_code}"
                try:
                    error_data = response.json()
                    error_message += f" - {error_data}"
                except:
                    error_message += f" - {response.text}"
                    
                logger.error(error_message)
                return {
                    "success": False,
                    "message": error_message,
                    "metrics": {
                        "views": 0,
                        "likes": 0,
                        "comments": 0,
                        "shares": 0,
                        "impressions": 0,
                        "engagement_rate": 0.0
                    }
                }
                
        except Exception as e:
            error_message = f"Error fetching engagement metrics: {str(e)}"
            logger.error(error_message)
            return {
                "success": False,
                "message": error_message,
                "metrics": {
                    "views": 0,
                    "likes": 0,
                    "comments": 0,
                    "shares": 0,
                    "impressions": 0,
                    "engagement_rate": 0.0
                }
            }
    
    def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """
        Get LinkedIn user profile information
        
        Args:
            access_token: LinkedIn OAuth access token
            
        Returns:
            Dictionary with user profile information
        """
        try:
            # For new OpenID apps, use /userinfo endpoint
            url = f"{LINKEDIN_API_BASE}/userinfo"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                logger.info("Successfully retrieved LinkedIn user profile")
                return {
                    "success": True,
                    "profile": user_data
                }
            else:
                error_message = f"Failed to get LinkedIn user profile. Status: {response.status_code}"
                try:
                    error_data = response.json()
                    error_message += f" - {error_data}"
                except:
                    error_message += f" - {response.text}"
                    
                logger.error(error_message)
                return {
                    "success": False,
                    "message": error_message
                }
                
        except Exception as e:
            error_message = f"Error getting LinkedIn user profile: {str(e)}"
            logger.error(error_message)
            return {
                "success": False,
                "message": error_message
            }

# Global instance of LinkedInService
linkedin_service = LinkedInService()