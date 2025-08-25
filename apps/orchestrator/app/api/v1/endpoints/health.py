# Created automatically by Cursor AI (2024-12-19)
from fastapi import APIRouter, Depends
from typing import Dict, Any

router = APIRouter()

@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "contract-intelligence-orchestrator",
        "version": "1.0.0"
    }

@router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """Readiness check endpoint."""
    return {
        "status": "ready",
        "service": "contract-intelligence-orchestrator"
    }

@router.get("/live")
async def liveness_check() -> Dict[str, Any]:
    """Liveness check endpoint."""
    return {
        "status": "alive",
        "service": "contract-intelligence-orchestrator"
    }
