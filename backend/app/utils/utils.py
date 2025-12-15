import os
import uuid
import aiofiles
from datetime import datetime
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image
import io

# Import logging
from ..logging_config import get_logger

logger = get_logger(__name__)

# Allowed file extensions
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".webm"}
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".aac", ".m4a", ".webm"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}

# Maximum file sizes (in bytes)
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MAX_AUDIO_SIZE = 50 * 1024 * 1024   # 50MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10MB

def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename while preserving the extension"""
    name, ext = os.path.splitext(original_filename)
    unique_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{timestamp}_{unique_id}{ext}"

def validate_file_type(filename: str, allowed_extensions: set) -> bool:
    """Validate if file extension is allowed"""
    _, ext = os.path.splitext(filename.lower())
    return ext in allowed_extensions

def validate_file_size(file_size: int, max_size: int) -> bool:
    """Validate if file size is within limits"""
    return file_size <= max_size

async def save_uploaded_file(file: UploadFile, upload_dir: str, allowed_extensions: set, max_size: int) -> Tuple[str, str]:
    """
    Save uploaded file to disk with validation
    
    Args:
        file: FastAPI UploadFile object
        upload_dir: Directory to save the file
        allowed_extensions: Set of allowed file extensions
        max_size: Maximum file size in bytes
    
    Returns:
        Tuple of (filename, file_path)
    
    Raises:
        HTTPException: If validation fails
    """
    
    # Validate file type
    if not validate_file_type(file.filename, allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Read file content to get size
    content = await file.read()
    file_size = len(content)
    
    # Validate file size
    if not validate_file_size(file_size, max_size):
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {max_size // (1024*1024)}MB"
        )
    
    # Generate unique filename
    unique_filename = generate_unique_filename(file.filename)
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Ensure directory exists
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    return unique_filename, file_path

async def save_video_file(file: UploadFile) -> dict:
    """Save video file and return file info"""
    filename, file_path = await save_uploaded_file(
        file, "uploads/videos", ALLOWED_VIDEO_EXTENSIONS, MAX_VIDEO_SIZE
    )
    
    return {
        "filename": filename,
        "file_path": file_path,
        "file_url": f"/uploads/videos/{filename}",
        "file_size": os.path.getsize(file_path)
    }

async def save_audio_file(file: UploadFile) -> dict:
    """Save audio file and return file info"""
    filename, file_path = await save_uploaded_file(
        file, "uploads/audio", ALLOWED_AUDIO_EXTENSIONS, MAX_AUDIO_SIZE
    )
    
    return {
        "filename": filename,
        "file_path": file_path,
        "file_url": f"/uploads/audio/{filename}",
        "file_size": os.path.getsize(file_path)
    }

async def save_image_file(file: UploadFile, resize: Optional[Tuple[int, int]] = None) -> dict:
    """Save image file with optional resizing"""
    filename, file_path = await save_uploaded_file(
        file, "uploads/logos", ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE
    )
    
    # Resize image if specified
    if resize:
        try:
            with Image.open(file_path) as img:
                # Convert to RGB if necessary
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                
                # Resize maintaining aspect ratio
                img.thumbnail(resize, Image.Resampling.LANCZOS)
                img.save(file_path, optimize=True, quality=85)
        except Exception as e:
            # If resize fails, keep original
            logger.warning(f"Could not resize image {filename}: {e}")
    
    return {
        "filename": filename,
        "file_path": file_path,
        "file_url": f"/uploads/logos/{filename}",
        "file_size": os.path.getsize(file_path)
    }

def delete_file(file_path: str) -> bool:
    """Delete file from filesystem"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting file {file_path}: {e}")
        return False

def format_phone_number(phone: str) -> str:
    """Format phone number to a standard format"""
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # Add country code if not present (assuming India +91)
    if len(digits) == 10:
        digits = "91" + digits
    elif len(digits) == 11 and digits.startswith("0"):
        digits = "91" + digits[1:]
    
    return f"+{digits}"

def validate_otp(provided_otp: str, expected_otp: str = "123456") -> bool:
    """Validate OTP (demo implementation)"""
    return provided_otp == expected_otp

async def create_audit_log(database, action: str, user_id: str, details: str = None, tenant_id: str = "default"):
    """Create an audit log entry"""
    log_data = {
        "log_id": str(uuid.uuid4()),
        "action": action,
        "user_id": user_id,
        "tenant_id": tenant_id,
        "details": details,
        "timestamp": datetime.utcnow()
    }
    
    await database.audit_logs.insert_one(log_data)
    return log_data