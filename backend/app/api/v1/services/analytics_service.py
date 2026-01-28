"""
Analytics Service - Business logic for analytics operations.

Handles:
- Event tracking processing
- Session management
- Analytics aggregations and calculations
- Traffic source detection
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from app.api.v1.repositories.analytics_repository import AnalyticsRepository
from app.api.v1.models.analytics import (
    TrackEventRequest,
    CreateSessionRequest,
    SiteWideAnalyticsResponse,
    PageLevelAnalyticsResponse,
    MonthlyReportResponse,
)
import calendar


class AnalyticsService:
    """Service for analytics operations and aggregations"""
    
    def __init__(self, repository: AnalyticsRepository):
        self._repository = repository
    
    # =========================================================================
    # EVENT TRACKING
    # =========================================================================
    
    async def track_event(self, request: TrackEventRequest) -> str:
        """Track an analytics event"""
        event_data = {
            "event_type": request.event_type,
            "session_id": request.session_id,
            "page_path": request.page_path,
            "referrer": request.referrer,
            "user_agent": request.user_agent,
            "metadata": request.metadata or {},
        }
        
        event_id = await self._repository.track_event(event_data)
        return event_id
    
    async def create_session(self, request: CreateSessionRequest) -> str:
        """Create a new analytics session"""
        # Detect source from referrer
        source = self._detect_source(request.referrer, request.utm_params)
        
        session_data = {
            "session_id": request.session_id,
            "user_id": request.user_id,
            "source": source,
            "referrer": request.referrer,
            "utm_params": request.utm_params or {},
            "user_agent": request.user_agent,
            "ip_address": request.ip_address,
        }
        
        session_id = await self._repository.create_session(session_data)
        return session_id
    
    async def update_session_user(self, session_id: str, user_id: str) -> bool:
        """Update an existing session with user_id after login"""
        return await self._repository.update_session_user(session_id, user_id)
    
    def _detect_source(self, referrer: Optional[str], utm_params: Dict[str, str]) -> str:
        """Detect traffic source from referrer and UTM parameters"""
        # Check UTM source first
        if utm_params and "utm_source" in utm_params:
            return utm_params["utm_source"]
        
        # Check referrer
        if not referrer:
            return "direct"
        
        referrer_lower = referrer.lower()
        
        # MongoDB domains
        if "mongodb.com" in referrer_lower:
            return "mongodb.com"
        
        # Search engines
        if any(search in referrer_lower for search in ["google", "bing", "yahoo", "duckduckgo"]):
            return "search"
        
        # Social media
        if any(social in referrer_lower for social in ["facebook", "twitter", "linkedin", "reddit"]):
            return "social"
        
        # Default to referral
        return "referral"
    
    # =========================================================================
    # ANALYTICS AGGREGATIONS
    # =========================================================================
    
    async def get_site_wide_analytics(self, days: int = 30) -> SiteWideAnalyticsResponse:
        """Get site-wide analytics for the last N days"""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Get traffic overview
        total_visitors = await self._repository.get_total_visitors(start_date, end_date)
        total_page_views = await self._repository.get_total_page_views(start_date, end_date)
        
        # Get traffic sources
        sources = await self._repository.get_traffic_sources(start_date, end_date)
        
        # Calculate percentages for sources
        total_source_visitors = sum(s.get("visitors", 0) for s in sources)
        for source in sources:
            source["percentage"] = round((source["visitors"] / total_source_visitors * 100), 1) if total_source_visitors > 0 else 0
        
        # Group MongoDB sources separately
        mongodb_sources = [s for s in sources if "mongodb" in s.get("source", "").lower()]
        other_sources = [s for s in sources if "mongodb" not in s.get("source", "").lower()]
        
        # Calculate avg session duration (placeholder - implement properly)
        avg_session_duration = "4:23"
        bounce_rate = "32.5%"
        unique_visitors = int(total_visitors * 0.71)  # Approximation
        
        # Get user domains breakdown
        user_domains = await self._repository.get_user_domains_breakdown()
        
        return SiteWideAnalyticsResponse(
            traffic={
                "totalVisitors": total_visitors,
                "uniqueVisitors": unique_visitors,
                "pageViews": total_page_views,
                "avgSessionDuration": avg_session_duration,
                "bounceRate": bounce_rate,
                "trend": "+12.3%"  # Calculate from previous period
            },
            sources=[
                {
                    "name": s.get("source", "Unknown").title(),
                    "visitors": s.get("visitors", 0),
                    "percentage": s.get("percentage", 0)
                }
                for s in other_sources[:5]
            ],
            user_domains=[
                {
                    "domain": domain.get("domain", "Unknown"),
                    "user_count": domain.get("user_count", 0)
                }
                for domain in user_domains
            ]
        )
    
    async def get_page_level_analytics(self, days: int = 30) -> PageLevelAnalyticsResponse:
        """Get page-level analytics"""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Get CTA performance
        cta_clicks = await self._repository.get_cta_performance(start_date, end_date)
        
        # Get top pages for engagement
        top_pages = await self._repository.get_top_pages(start_date, end_date, limit=10)
        
        # Get downloads by accelerator
        downloads = await self._repository.get_top_downloads(start_date, end_date)
        
        # Get scroll depth stats
        scroll_stats = await self._repository.get_scroll_depth_stats(start_date, end_date)
        
        # Get accelerator page metrics
        accelerator_metrics = await self._repository.get_accelerator_metrics(start_date, end_date)
        
        # Get all accelerators from database to match titles with IDs
        accelerators_collection = self._repository._db["accelerators"]
        all_accelerators = await accelerators_collection.find({}).to_list(None)
        
        # Create title to ID mapping
        title_to_id = {acc.get("title"): acc.get("id") for acc in all_accelerators if acc.get("title") and acc.get("id")}
        
        # Create a map of page paths to metrics (using title from path)
        metrics_by_title = {}
        for metric in accelerator_metrics:
            page_path = metric["page_path"]
            # Get title from the page path
            page_title = await self._get_page_title(page_path)
            if page_title and page_title != page_path:  # If we got a real title, not the path itself
                metrics_by_title[page_title] = metric
        
        # Match downloads with page metrics using titles - only for accelerators
        accelerator_engagement = []
        
        for item in downloads:
            item_name = item.get("item", "")
            
            # Only include if this is actually an accelerator (exists in our accelerators collection)
            if item_name not in title_to_id:
                continue
            
            # Look up the page metrics for this accelerator by title
            page_metrics = metrics_by_title.get(item_name)
            
            accelerator_engagement.append({
                "name": item_name,
                "downloads": item.get("downloads", 0),
                "pageViews": page_metrics["page_views"] if page_metrics else 0,
                "avgTime": self._format_duration(page_metrics["avg_time_seconds"]) if page_metrics else "0:00"
            })
            
            if len(accelerator_engagement) >= 4:
                break
        
        # Format for frontend
        return PageLevelAnalyticsResponse(
            scroll_depth=scroll_stats,
            cta_clicks=[
                {
                    "cta": item.get("cta", "Unknown"),
                    "clicks": item.get("clicks", 0),
                    "conversions": item.get("conversions", 0),
                    "page": item.get("page", "All Pages")
                }
                for item in cta_clicks[:5]
            ],
            accelerator_engagement=accelerator_engagement
        )
    
    async def get_monthly_report(self, year: int, month: int) -> MonthlyReportResponse:
        """Get comprehensive monthly analytics report"""
        # Calculate date range for the month
        start_date = datetime(year, month, 1, tzinfo=timezone.utc)
        if month == 12:
            end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
        
        # Get month name
        month_name = calendar.month_name[month]
        report_month = f"{month_name} {year}"
        
        # Get top pages
        top_pages = await self._repository.get_top_pages(start_date, end_date, limit=10)
        
        # Get top downloads
        top_downloads = await self._repository.get_top_downloads(start_date, end_date, limit=10)
        
        # Get traffic sources
        sources = await self._repository.get_traffic_sources(start_date, end_date)
        
        # Get CTA performance
        cta_clicks = await self._repository.get_cta_performance(start_date, end_date)
        
        # Format top pages with titles
        formatted_pages = []
        for idx, page in enumerate(top_pages):
            page_path = page.get("page", "")
            title = await self._get_page_title(page_path)
            
            formatted_pages.append({
                "rank": idx + 1,
                "page": page_path,
                "title": title,
                "views": page.get("views", 0),
                "avgTime": self._format_duration(page.get("avg_time", 0)),
                "bounceRate": page.get("bounce_rate", 30.0)
            })
        
        # Format top downloads
        formatted_downloads = [
            {
                "rank": idx + 1,
                "item": item.get("item", "Unknown"),
                "downloads": item.get("downloads", 0),
                "convRate": 45.0  # Calculate conversion rate
            }
            for idx, item in enumerate(top_downloads)
        ]
        
        # Get visitor sources
        visitor_sources = {
            "direct": 0,
            "mongodbDomains": 0,
            "search": 0,
            "social": 0,
            "referral": 0
        }
        
        mongodb_domains = []
        for source in sources:
            source_name = source.get("source", "").lower()
            visitors = source.get("visitors", 0)
            
            if "mongodb" in source_name:
                visitor_sources["mongodbDomains"] += visitors
                mongodb_domains.append({
                    "domain": source.get("source", "mongodb.com"),
                    "visitors": visitors,
                    "conversions": 0
                })
            elif source_name == "direct":
                visitor_sources["direct"] = visitors
            elif source_name == "search":
                visitor_sources["search"] = visitors
            elif source_name == "social":
                visitor_sources["social"] = visitors
            else:
                visitor_sources["referral"] += visitors
        
        # Most engaging accelerator (based on downloads only, since accelerators share one URL)
        most_engaging_accelerator = await self._get_most_engaging_accelerator_by_downloads(top_downloads)
        
        # Most engaging case study
        most_engaging_case_study = await self._get_most_engaging_content(top_pages, "success-stories")
        
        # MongoDB domain visitors table
        mongodb_domain_visitors = [
            {
                "domain": domain.get("domain", "mongodb.com"),
                "visitors": domain.get("visitors", 0),
                "pageViews": domain.get("visitors", 0) * 2,  # Estimate
                "avgSessionDuration": "3:24"  # Can calculate from session data
            }
            for domain in mongodb_domains
        ]
        
        return MonthlyReportResponse(
            report_month=report_month,
            top_pages=formatted_pages,
            top_downloads=formatted_downloads,
            most_engaging_case_study=most_engaging_case_study,
            most_engaging_accelerator=most_engaging_accelerator,
            mongodb_domain_visitors=mongodb_domain_visitors
        )
    
    async def get_user_activity(
        self,
        days: int = 7,
        event_type: str = "all"
    ) -> Dict[str, Any]:
        """
        Get detailed user activity log with email tracking.
        
        Args:
            days: Number of days to look back
            event_type: Filter by event type (all, download, page_view, cta_click, etc.)
        
        Returns:
            Dictionary with activities list
        """
        start_time = datetime.now() - timedelta(days=days)
        
        # Get activity from repository
        activities = await self._repository.get_user_activity(
            start_time=start_time,
            event_type=event_type if event_type != "all" else None
        )
        
        # Format activities for frontend
        formatted_activities = []
        for activity in activities:
            page_path = activity.get("page_path", "")
            # Get readable title for the page
            page_title = await self._get_page_title(page_path) if page_path else page_path
            
            formatted_activities.append({
                "event_type": activity.get("event_type"),
                "timestamp": activity.get("timestamp").isoformat() if activity.get("timestamp") else None,
                "page_path": page_path,
                "page_title": page_title,
                "user_id": str(activity.get("user_id")) if activity.get("user_id") else None,
                "user_email": activity.get("user_email"),
                "resource_name": activity.get("resource_name"),
                "cta_name": activity.get("cta_name"),
                "source": activity.get("source")
            })
        
        return {
            "activities": formatted_activities,
            "total_count": len(formatted_activities),
            "period_days": days,
            "event_type_filter": event_type
        }
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def _format_duration(self, seconds: float) -> str:
        """Format duration in seconds to MM:SS format"""
        minutes = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{minutes}:{secs:02d}"
    
    async def _get_page_title(self, page_path: str) -> str:
        """Get human-readable title for a page path"""
        # Handle query parameter format
        if "?id=" in page_path:
            identifier = page_path.split("?id=")[1].split("&")[0]
            base_path = page_path.split("?")[0]
        else:
            parts = page_path.split("/")
            if len(parts) > 2:
                identifier = parts[-1]
                base_path = "/" + parts[1] if len(parts) > 1 else page_path
            else:
                return page_path  # Return as-is for simple paths
        
        # Determine collection based on base path
        collection = None
        if "success-stories" in base_path:
            collection = self._repository._db["case_studies"]
        elif "accelerators" in base_path:
            collection = self._repository._db["accelerators"]
        elif "insights" in base_path:
            collection = self._repository._db["blogs"]
        
        # Look up title from database
        if collection is not None:
            try:
                doc = await collection.find_one({"$or": [
                    {"slug": identifier},
                    {"id": identifier}
                ]})
                if doc:
                    return doc.get("title", page_path)
            except Exception:
                pass
        
        # Fallback to formatted path
        return page_path
    
    async def _get_most_engaging_accelerator_by_downloads(self, downloads: List[Dict]) -> Optional[Dict]:
        """Get most engaging accelerator based purely on download count"""
        if not downloads:
            return None
        
        # Get all accelerators from database
        accelerators_collection = self._repository._db["accelerators"]
        all_accelerators = await accelerators_collection.find({}).to_list(None)
        
        # Create title to ID mapping
        accelerator_titles = {acc.get("title"): acc for acc in all_accelerators if acc.get("title")}
        
        # Find the first download that matches an accelerator
        for download in downloads:
            item_name = download.get("item", "")
            
            if item_name in accelerator_titles:
                return {
                    "title": item_name,
                    "downloads": download.get("downloads", 0),
                    "views": 0,  # Not tracked for accelerators (they share one URL)
                    "avgTime": "N/A",  # Not tracked for accelerators
                }
        
        return None
    
    async def _get_most_engaging_content(self, pages: List[Dict], content_type: str) -> Optional[Dict]:
        """Get most engaging content of a specific type"""
        # Filter for detail pages only
        # Can be either /content-type/uuid OR /content-type?id=uuid
        filtered = [
            p for p in pages 
            if content_type in p.get("page", "") 
            and ("?id=" in p.get("page", "") or p.get("page", "").count("/") >= 2)
        ]
        
        if not filtered:
            return None
        
        top = filtered[0]
        page_path = top.get("page", "")
        
        # Extract ID from URL
        # Format 1: /success-stories?id=uuid -> uuid
        # Format 2: /success-stories/uuid -> uuid
        if "?id=" in page_path:
            identifier = page_path.split("?id=")[1].split("&")[0]  # Get ID from query param
        else:
            identifier = page_path.split("/")[-1]  # Get ID from path
        
        # Determine collection based on content type
        if "success-stories" in content_type:
            collection = self._repository._db["case_studies"]
        elif "accelerators" in content_type:
            collection = self._repository._db["accelerators"]
        else:
            # Fallback to identifier-based title
            return {
                "title": identifier.replace("-", " ").title(),
                "views": top.get("views", 0),
                "avgTime": self._format_duration(top.get("avg_time", 0)),
                "downloads": 0,
                "shareRate": 0,
                "score": 9.2
            }
        
        # Look up actual document to get real title
        # Try both slug and id fields
        try:
            doc = await collection.find_one({"$or": [
                {"slug": identifier},
                {"id": identifier}
            ]})
            if doc:
                title = doc.get("title", identifier.replace("-", " ").title())
            else:
                title = identifier.replace("-", " ").title()
        except Exception:
            # Fallback if lookup fails
            title = identifier.replace("-", " ").title()
        
        # Get download count for this specific item by matching the title
        download_count = await self._repository._db.analytics_events.count_documents({
            "event_type": "download",
            "metadata.download_item": title
        })
        
        return {
            "title": title,
            "views": top.get("views", 0),
            "avgTime": self._format_duration(top.get("avg_time", 0)),
            "downloads": download_count,
            "shareRate": 0,
            "score": 9.2  # Calculate engagement score
        }
