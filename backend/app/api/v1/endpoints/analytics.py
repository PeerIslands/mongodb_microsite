"""
Analytics Endpoints - API endpoints for analytics operations.

Endpoints:
- POST /analytics/track - Track analytics event
- POST /analytics/session - Create analytics session
- GET /analytics/site-wide - Get site-wide analytics
- GET /analytics/page-level - Get page-level analytics
- GET /analytics/monthly/{year}/{month} - Get monthly report
"""

from fastapi import APIRouter, Depends, Query
from typing import Dict, Any

from app.api.v1.models.analytics import (
    TrackEventRequest,
    TrackEventResponse,
    CreateSessionRequest,
    SiteWideAnalyticsResponse,
    PageLevelAnalyticsResponse,
    MonthlyReportResponse,
)
from app.api.v1.services.analytics_service import AnalyticsService
from app.api.v1.dependencies.services import get_analytics_service

router = APIRouter(prefix="/analytics")


# =============================================================================
# EVENT TRACKING ENDPOINTS (Public)
# =============================================================================

@router.post(
    "/track",
    response_model=TrackEventResponse,
    summary="Track Analytics Event",
    description="Track a user analytics event (page view, download, CTA click, etc.)"
)
async def track_event(
    request: TrackEventRequest,
    service: AnalyticsService = Depends(get_analytics_service),
) -> TrackEventResponse:
    """
    Track an analytics event.
    
    This endpoint is called by the frontend to log user interactions.
    """
    try:
        event_id = await service.track_event(request)
        return TrackEventResponse(
            success=True,
            event_id=event_id,
            message="Event tracked successfully"
        )
    except Exception as e:
        return TrackEventResponse(
            success=False,
            message=f"Failed to track event: {str(e)}"
        )


@router.post(
    "/session",
    summary="Create Analytics Session",
    description="Create a new analytics session for tracking"
)
async def create_session(
    request: CreateSessionRequest,
    service: AnalyticsService = Depends(get_analytics_service),
) -> Dict[str, Any]:
    """Create a new analytics session."""
    try:
        session_id = await service.create_session(request)
        return {
            "success": True,
            "session_id": session_id,
            "message": "Session created successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to create session: {str(e)}"
        }


@router.post(
    "/session/update-user",
    summary="Update Session User",
    description="Update an existing session with user_id after login"
)
async def update_session_user(
    request: dict,
    service: AnalyticsService = Depends(get_analytics_service),
) -> Dict[str, Any]:
    """
    Update session with user_id after user logs in.
    
    This ensures that events tracked before login are associated with the user.
    """
    try:
        session_id = request.get("session_id")
        user_id = request.get("user_id")
        
        if not session_id or not user_id:
            return {"success": False, "message": "session_id and user_id are required"}
        
        result = await service.update_session_user(session_id, user_id)
        
        return {
            "success": True,
            "message": "Session user updated successfully",
            "updated": result
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to update session user: {str(e)}"
        }


# =============================================================================
# ANALYTICS DASHBOARD ENDPOINTS (Admin only - add auth later)
# =============================================================================

@router.get(
    "/site-wide",
    response_model=SiteWideAnalyticsResponse,
    summary="Get Site-Wide Analytics",
    description="Get site-wide analytics dashboard data"
)
async def get_site_wide_analytics(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to analyze"),
    service: AnalyticsService = Depends(get_analytics_service),
) -> SiteWideAnalyticsResponse:
    """
    Get site-wide analytics for the admin dashboard.
    
    Returns traffic overview, sources, geography, and MongoDB domain sources.
    """
    return await service.get_site_wide_analytics(days)


@router.get(
    "/page-level",
    response_model=PageLevelAnalyticsResponse,
    summary="Get Page-Level Analytics",
    description="Get detailed page-level analytics"
)
async def get_page_level_analytics(
    days: int = Query(default=30, ge=1, le=365),
    service: AnalyticsService = Depends(get_analytics_service),
) -> PageLevelAnalyticsResponse:
    """
    Get page-level analytics including scroll depth, CTA performance,
    engagement time, drop-offs, and accelerator engagement.
    """
    return await service.get_page_level_analytics(days)


@router.get(
    "/monthly/{year}/{month}",
    response_model=MonthlyReportResponse,
    summary="Get Monthly Analytics Report",
    description="Get comprehensive monthly analytics report"
)
async def get_monthly_report(
    year: int,
    month: int,
    service: AnalyticsService = Depends(get_analytics_service),
) -> MonthlyReportResponse:
    """
    Get monthly analytics report including:
    - Top 10 pages and downloads
    - Most engaging content
    - Traffic sources
    - CTA performance
    - Conversion funnel
    - Page speed metrics
    """
    return await service.get_monthly_report(year, month)


@router.get(
    "/user-activity",
    summary="Get User Activity",
    description="Get detailed user activity with email tracking"
)
async def get_user_activity(
    days: int = Query(default=7, ge=1, le=365),
    event_type: str = Query(default="all"),
    service: AnalyticsService = Depends(get_analytics_service),
) -> Dict[str, Any]:
    """
    Get user activity log with email and action details.
    Includes downloads, blog reads, CTA clicks, form submissions.
    """
    return await service.get_user_activity(days, event_type)

