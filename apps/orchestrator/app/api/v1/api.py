# Created automatically by Cursor AI (2024-12-19)
from fastapi import APIRouter
from .endpoints import health, agreements, orchestrator

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(agreements.router, prefix="/agreements", tags=["agreements"])
api_router.include_router(orchestrator.router, prefix="/orchestrator", tags=["orchestrator"])
