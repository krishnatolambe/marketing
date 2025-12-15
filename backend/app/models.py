from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, Dict, List
from datetime import datetime
from enum import Enum
import re

class UserRole(str, Enum):
    USER = "user"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

# User Models
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username must be between 3 and 50 characters")
    email: EmailStr = Field(..., description="Valid email address")
    full_name: str = Field(..., min_length=1, max_length=100, description="Full name must be between 1 and 100 characters")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number (optional)")
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None and not re.match(r'^[+]?[0-9\s\-()]+$', v):
            raise ValueError('Invalid phone number format')
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128, description="Password must be between 8 and 128 characters")

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="Username must be between 3 and 50 characters")
    email: Optional[EmailStr] = Field(None, description="Valid email address")
    full_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Full name must be between 1 and 100 characters")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number (optional)")
    status: Optional[UserStatus] = None
    
    @validator('username')
    def validate_username(cls, v):
        if v is not None and not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None and not re.match(r'^[+]?[0-9\s\-()]+$', v):
            raise ValueError('Invalid phone number format')
        return v

class User(UserBase):
    user_id: str
    created_at: datetime
    last_login: Optional[datetime] = None

class UserInDB(User):
    password_hash: str

# Add new models for posts with LinkedIn integration
class PostEngagementMetrics(BaseModel):
    views: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    impressions: int = 0
    engagement_rate: float = 0.0

class PostStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    LINKEDIN_PUBLISHED = "linkedin_published"

# Authentication Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50, description="Username")
    password: str = Field(..., min_length=1, max_length=128, description="Password")

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username must be between 3 and 50 characters")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password must be between 8 and 128 characters")
    full_name: str = Field(..., min_length=1, max_length=100, description="Full name must be between 1 and 100 characters")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number (optional)")
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None and not re.match(r'^[+]?[0-9\s\-()]+$', v):
            raise ValueError('Invalid phone number format')
        return v

# API Response Models
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict] = None

class PaginatedResponse(BaseModel):
    items: List[Dict]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool
