import time
import asyncio
from functools import wraps
from typing import Callable, Any
from fastapi import Request, Response
from ..logging_config import get_logger

logger = get_logger(__name__)

# In-memory metrics storage
# In production, you should use Prometheus, StatsD, or another monitoring system
metrics = {
    "request_count": 0,
    "total_response_time": 0,
    "error_count": 0,
    "endpoint_metrics": {},
}

class MetricsMiddleware:
    """Middleware to collect and expose application metrics"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        # For simplicity, we'll just pass through to the next middleware
        # In a production environment, you would implement proper ASGI middleware here
        await self.app(scope, receive, send)

def monitor_performance(func: Callable) -> Callable:
    """Decorator to monitor function performance"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            execution_time = time.time() - start_time
            
            # Log slow function executions
            if execution_time > 0.5:
                logger.warning(f"Slow function {func.__name__} took {execution_time:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in function {func.__name__}: {str(e)}")
            raise
    
    return wrapper

def get_metrics():
    """Get current metrics"""
    # Calculate average response time
    avg_response_time = 0
    if metrics["request_count"] > 0:
        avg_response_time = metrics["total_response_time"] / metrics["request_count"]
    
    # Calculate endpoint averages
    endpoint_stats = {}
    for endpoint, data in metrics["endpoint_metrics"].items():
        avg_time = 0
        if data["count"] > 0:
            avg_time = data["total_time"] / data["count"]
        
        error_rate = 0
        if data["count"] > 0:
            error_rate = data["errors"] / data["count"] * 100
        
        endpoint_stats[endpoint] = {
            "count": data["count"],
            "average_response_time": round(avg_time, 3),
            "error_count": data["errors"],
            "error_rate": round(error_rate, 2)
        }
    
    return {
        "overall": {
            "total_requests": metrics["request_count"],
            "average_response_time": round(avg_response_time, 3),
            "total_errors": metrics["error_count"],
            "error_rate": round(
                metrics["error_count"] / metrics["request_count"] * 100 if metrics["request_count"] > 0 else 0, 
                2
            )
        },
        "endpoints": endpoint_stats
    }

def reset_metrics():
    """Reset all metrics"""
    global metrics
    metrics = {
        "request_count": 0,
        "total_response_time": 0,
        "error_count": 0,
        "endpoint_metrics": {},
    }