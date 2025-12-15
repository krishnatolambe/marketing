from datetime import datetime, timedelta
from typing import Optional
import uuid
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .database import get_database, settings
from .models import TokenData

# Import logging
from .logging_config import get_logger

logger = get_logger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    # Add issued at time
    iat = datetime.utcnow()
    
    to_encode.update({
        "exp": expire,
        "iat": iat,
        "jti": str(uuid.uuid4())  # JWT ID for potential revocation
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

async def get_user_by_username(username: str):
    """Get user from database by username"""
    database = await get_database()
    user = await database.users.find_one({"username": username})
    return user

async def authenticate_user(username: str, password: str):
    """Authenticate user credentials"""
    user = await get_user_by_username(username)
    if not user:
        logger.warning(f"Authentication failed for user: {username} - user not found")
        return False
    
    password_valid = verify_password(password, user["password_hash"])
    
    if not password_valid:
        logger.warning(f"Authentication failed for user: {username} - invalid password")
        return False
    
    logger.info(f"User {username} authenticated successfully")
    return user

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            logger.warning("JWT token missing subject")
            raise credentials_exception
        
        # Check if token has expired
        exp = payload.get("exp")
        if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
            logger.warning("JWT token has expired")
            raise credentials_exception
        
        token_data = TokenData(username=username)
        logger.debug(f"Decoded JWT token for user: {username}")
    except JWTError as e:
        logger.warning(f"JWT validation failed: {e}")
        raise credentials_exception
    
    user = await get_user_by_username(username=token_data.username)
    if user is None:
        logger.warning(f"User not found for token subject: {token_data.username}")
        raise credentials_exception
    
    # Check if user account is still active
    if user["status"] != "active":
        logger.warning(f"User account is not active: {user['username']}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive")
    
    logger.debug(f"Retrieved user: {user['username']} from JWT token")
    return user

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Get current active user"""
    if current_user["status"] != "active":
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user