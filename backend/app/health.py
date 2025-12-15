from fastapi import APIRouter, HTTPException
from datetime import datetime
from .database import get_database
from .middleware.monitoring import get_metrics
import asyncio

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "linkedin-marketing-api"
    }

@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check including database and other dependencies"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "linkedin-marketing-api",
        "components": {}
    }
    
    # Check database connectivity
    try:
        database = await get_database()
        await asyncio.wait_for(database.command('ping'), timeout=5.0)
        health_status["components"]["database"] = "connected"
    except asyncio.TimeoutError:
        health_status["components"]["database"] = "timeout"
        health_status["status"] = "degraded"
    except Exception as e:
        health_status["components"]["database"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"
    
    return health_status

@router.get("/health/database")
async def database_health_check():
    """Specific database health check"""
    try:
        database = await get_database()
        await database.command('ping')
        return {
            "status": "healthy",
            "component": "database",
            "message": "Database connection successful"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(e)}"
        )

@router.get("/metrics")
async def metrics_endpoint():
    """Expose application metrics"""
    return get_metrics()