import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from pydantic_settings import BaseSettings
from typing import Optional
import asyncio

# Load environment variables explicitly
from dotenv import load_dotenv
load_dotenv()

# Import logging
from .logging_config import get_logger

logger = get_logger(__name__)

class Settings(BaseSettings):
    mongodb_url: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    database_name: str = os.getenv("DATABASE_NAME", "linkedin_marketing")
    secret_key: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    max_connections: int = int(os.getenv("MAX_CONNECTIONS", 100))
    min_connections: int = int(os.getenv("MIN_CONNECTIONS", 10))
    connection_timeout: int = int(os.getenv("CONNECTION_TIMEOUT", 20))
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"

settings = Settings()

class Database:
    client: Optional[AsyncIOMotorClient] = None

db = Database()

async def get_database():
    return db.client[settings.database_name]

async def init_db():
    """Initialize database connection and create indexes"""
    # Configure connection pool with better settings
    db.client = AsyncIOMotorClient(
        settings.mongodb_url,
        maxPoolSize=settings.max_connections,
        minPoolSize=settings.min_connections,
        serverSelectionTimeoutMS=settings.connection_timeout * 1000,
        connectTimeoutMS=settings.connection_timeout * 1000,
        socketTimeoutMS=settings.connection_timeout * 1000,
        waitQueueTimeoutMS=5000,
        retryWrites=True,
        retryReads=True,
    )
    
    # Test connection
    try:
        await db.client.admin.command('ping')
        logger.info("✅ Connected to MongoDB successfully")
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        return
    except Exception as e:
        logger.error(f"❌ Unexpected error connecting to MongoDB: {e}")
        return
    
    database = await get_database()
    
    # Create indexes for better performance
    indexes = [
        # Users collection
        ("users", [IndexModel("email", unique=True), IndexModel("username", unique=True)]),
        # Scheduled posts collection
        ("scheduled_posts", [IndexModel("userId"), IndexModel("scheduledAt"), IndexModel("status")]),
        # Posts collection
        ("posts", [IndexModel("userId"), IndexModel("status"), IndexModel("createdAt")]),
    ]
    
    for collection_name, collection_indexes in indexes:
        collection = database[collection_name]
        try:
            # Try to create indexes, but continue if they already exist
            await collection.create_indexes(collection_indexes)
            logger.info(f"✅ Indexes created for {collection_name}")
        except Exception as e:
            if "IndexKeySpecsConflict" in str(e) or "already exists" in str(e):
                logger.info(f"ℹ️  Indexes already exist for {collection_name}")
            else:
                logger.warning(f"⚠️  Warning: Could not create indexes for {collection_name}: {e}")
    
    logger.info("✅ Database initialized successfully")

async def close_db():
    if db.client:
        # Log connection stats before closing
        try:
            stats = db.client.primary.database_names()
            logger.info(f"📊 Closing database connection. Active databases: {len(stats) if stats else 0}")
        except Exception as e:
            logger.debug(f"Debug: Could not get database stats: {e}")
        
        db.client.close()
        logger.info("🔌 Database connection closed")