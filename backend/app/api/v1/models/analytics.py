"""
Analytics Models - Request/Response models for analytics operations.

Contains:
- Request models for tracking events and sessions
- Response models for analytics data
- Database models for MongoDB documents
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal, List
from datetime import datetime


# =============================================================================
# REQUEST MODELS
# =============================================================================

class TrackEventRequest(BaseModel):
    """Request model for tracking an analytics event"""
    event_type: Literal["page_view", "download", "cta_click", "scroll_depth", "video_play", "form_submit"]
    session_id: str
    page_path: str
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class CreateSessionRequest(BaseModel):
    """Request model for creating a new session"""
    session_id: str
    user_id: Optional[str] = None
    source: Optional[str] = "direct"
    referrer: Optional[str] = None
    utm_params: Optional[Dict[str, str]] = Field(default_factory=dict)
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class TrackEventResponse(BaseModel):
    """Response model for event tracking"""
    success: bool
    event_id: Optional[str] = None
    message: str = "Event tracked successfully"


class SiteWideAnalyticsResponse(BaseModel):
    """Site-wide analytics response"""
    traffic: Dict[str, Any]
    sources: List[Dict[str, Any]]
    user_domains: List[Dict[str, Any]]


class PageLevelAnalyticsResponse(BaseModel):
    """Page-level analytics response"""
    scroll_depth: List[Dict[str, Any]]
    cta_clicks: List[Dict[str, Any]]
    accelerator_engagement: List[Dict[str, Any]]


class MonthlyReportResponse(BaseModel):
    """Monthly analytics report response"""
    report_month: str
    top_pages: List[Dict[str, Any]]
    top_downloads: List[Dict[str, Any]]
    most_engaging_case_study: Optional[Dict[str, Any]] = None
    most_engaging_accelerator: Optional[Dict[str, Any]] = None
    mongodb_domain_visitors: List[Dict[str, Any]]  # Table of MongoDB domain visitors


# =============================================================================
# DATABASE MODELS
# =============================================================================

class AnalyticsEventModel(BaseModel):
    """Analytics event stored in MongoDB"""
    id: str = Field(alias="_id")
    event_type: str
    timestamp: datetime
    session_id: str
    user_id: Optional[str] = None
    page_path: str
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    country: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AnalyticsSessionModel(BaseModel):
    """Analytics session stored in MongoDB"""
    id: str = Field(alias="_id")
    session_id: str
    user_id: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    page_views: int = 0
    events: List[str] = Field(default_factory=list)
    source: str = "direct"
    referrer: Optional[str] = None
    utm_params: Dict[str, str] = Field(default_factory=dict)
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    country: Optional[str] = None

