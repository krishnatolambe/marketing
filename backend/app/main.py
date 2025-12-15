# Load environment variables explicitly
import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
from datetime import datetime

# Import database functions
from .database import init_db, close_db

# Import logging configuration
from .logging_config import setup_logging, get_logger

# Import middleware
from .middleware.middleware import RateLimitMiddleware
from .middleware.security_middleware import SecurityHeadersMiddleware
from .middleware.monitoring import MetricsMiddleware

# Import AI services to initialize API keys
from .services import ai_services

# Set up logging
setup_logging()
logger = get_logger(__name__)

# Import routers
from .routers.linkedin.content import router as content_router
from .routers.linkedin.scheduler import router as scheduler_router
from .routers.auth import router as auth_router
from .routers.linkedin.analytics import router as analytics_router
from .routers.linkedin.auth import router as linkedin_auth_router
from .routers.linkedin.linkedin import router as linkedin_router
from .routers.linkedin.credentials import router as linkedin_credentials_router
from .health import router as health_router

app = FastAPI(
    title="LinkedIn AutoMarketer API",
    description="API for managing LinkedIn content generation and scheduling",
    version="1.0.0",
    contact={
        "name": "Support Team",
        "url": "https://github.com/your-org/linkedin-auto-marketer/issues",
        "email": "support@linkedin-auto-marketer.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://github.com/your-org/linkedin-auto-marketer/blob/main/LICENSE",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("Application startup complete")

# Close database connection on shutdown
@app.on_event("shutdown")
async def shutdown_event():
    await close_db()
    logger.info("Application shutdown complete")

# Security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Metrics middleware
app.add_middleware(MetricsMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:8080")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Access-Control-Allow-Origin"],
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/videos", exist_ok=True)
os.makedirs("uploads/audio", exist_ok=True)
os.makedirs("uploads/logos", exist_ok=True)
os.makedirs("uploads/posts", exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(content_router, prefix="/api/content", tags=["Content"])
app.include_router(scheduler_router, prefix="/api/schedule", tags=["Scheduler"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(linkedin_auth_router, prefix="/api/auth/linkedin", tags=["LinkedIn Auth"])
app.include_router(linkedin_router, prefix="/api/linkedin", tags=["LinkedIn"])
app.include_router(linkedin_credentials_router, prefix="/api/linkedin/credentials", tags=["LinkedIn Credentials"])
app.include_router(health_router, prefix="/api", tags=["Health"])

# Root endpoint
@app.get("/")
async def root():
    return {"message": "LinkedIn AutoMarketer API", "version": "1.0.0"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "linkedin-marketing-api"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 3001)),
        reload=os.getenv("NODE_ENV", "production") == "development",
        workers=int(os.getenv("WORKERS", 1)),
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )