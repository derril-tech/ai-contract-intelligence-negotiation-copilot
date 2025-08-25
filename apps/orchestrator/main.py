# Created automatically by Cursor AI (2024-12-19)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
import structlog

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.api import api_router
from app.core.events import create_start_app_handler, create_stop_app_handler

# Setup structured logging
setup_logging()
logger = structlog.get_logger()

def create_application() -> FastAPI:
    """Create FastAPI application with all middleware and routes."""
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Contract Intelligence & Negotiation Copilot - Orchestrator",
        version="1.0.0",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Security middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Add startup and shutdown events
    app.add_event_handler("startup", create_start_app_handler(app))
    app.add_event_handler("shutdown", create_stop_app_handler(app))

    return app

app = create_application()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
    )
