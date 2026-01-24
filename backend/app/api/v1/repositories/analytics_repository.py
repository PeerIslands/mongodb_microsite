"""
Analytics Repository - Database operations for analytics.

Handles:
- Event tracking and storage
- Session management
- Aggregation queries for analytics
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import uuid


class AnalyticsRepository:
    """Repository for analytics operations"""
    
    EVENTS_COLLECTION = "analytics_events"
    SESSIONS_COLLECTION = "analytics_sessions"
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self._db = db
        self._events = db[self.EVENTS_COLLECTION]
        self._sessions = db[self.SESSIONS_COLLECTION]
    
    # =========================================================================
    # EVENT TRACKING
    # =========================================================================
    
    async def track_event(self, event_data: Dict[str, Any]) -> str:
        """
        Track an analytics event.
        
        Args:
            event_data: Event data including type, session_id, page_path, etc.
            
        Returns:
            Event ID
        """
        event_id = str(uuid.uuid4())
        event = {
            "_id": event_id,
            **event_data,
            "timestamp": datetime.now(timezone.utc),
        }
        
        await self._events.insert_one(event)
        
        # Update session with this event
        await self._sessions.update_one(
            {"session_id": event_data["session_id"]},
            {
                "$inc": {"page_views": 1 if event_data["event_type"] == "page_view" else 0},
                "$push": {"events": event_id},
                "$set": {"last_activity": datetime.now(timezone.utc)}
            },
            upsert=True
        )
        
        return event_id
    
    async def create_session(self, session_data: Dict[str, Any]) -> str:
        """
        Create a new analytics session.
        
        Args:
            session_data: Session data including session_id, user_id, source, etc.
            
        Returns:
            Session ID
        """
        session = {
            "_id": str(uuid.uuid4()),
            **session_data,
            "start_time": datetime.now(timezone.utc),
            "page_views": 0,
            "events": [],
        }
        
        # Use upsert to avoid duplicate session errors
        await self._sessions.update_one(
            {"session_id": session_data["session_id"]},
            {"$setOnInsert": session},
            upsert=True
        )
        
        return session["session_id"]
    
    # =========================================================================
    # AGGREGATION QUERIES
    # =========================================================================
    
    async def get_top_pages(
        self, 
        start_date: datetime, 
        end_date: datetime,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top pages by views"""
        pipeline = [
            {
                "$match": {
                    "event_type": "page_view",
                    "timestamp": {"$gte": start_date, "$lt": end_date},
                    "page_path": {
                        "$not": {"$regex": "^/admin|^/profile|^/contact"}
                    }
                }
            },
            {
                "$group": {
                    "_id": "$page_path",
                    "views": {"$sum": 1},
                    "avg_duration": {"$avg": "$metadata.duration"},
                    "unique_sessions": {"$addToSet": "$session_id"}
                }
            },
            {
                "$project": {
                    "page": "$_id",
                    "views": 1,
                    "avg_time": {
                        "$cond": {
                            "if": {"$gt": ["$avg_duration", 0]},
                            "then": {"$divide": ["$avg_duration", 1000]},
                            "else": 0
                        }
                    },
                    "unique_visitors": {"$size": "$unique_sessions"},
                    "bounce_rate": 30.0  # Placeholder - calculate properly
                }
            },
            {"$sort": {"views": -1}},
            {"$limit": limit}
        ]
        
        results = await self._events.aggregate(pipeline).to_list(None)
        return results
    
    async def get_top_downloads(
        self,
        start_date: datetime,
        end_date: datetime,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top downloads"""
        pipeline = [
            {
                "$match": {
                    "event_type": "download",
                    "timestamp": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$metadata.download_item",
                    "downloads": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"}
                }
            },
            {
                "$project": {
                    "item": "$_id",
                    "downloads": 1,
                    "unique_downloaders": {"$size": "$unique_users"}
                }
            },
            {"$sort": {"downloads": -1}},
            {"$limit": limit}
        ]
        
        results = await self._events.aggregate(pipeline).to_list(None)
        return results
    
    async def get_traffic_sources(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get traffic sources breakdown"""
        pipeline = [
            {
                "$match": {
                    "start_time": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$source",
                    "visitors": {"$sum": 1},
                    "sessions": {"$addToSet": "$session_id"}
                }
            },
            {
                "$project": {
                    "source": "$_id",
                    "visitors": 1,
                    "unique_sessions": {"$size": "$sessions"}
                }
            },
            {"$sort": {"visitors": -1}}
        ]
        
        results = await self._sessions.aggregate(pipeline).to_list(None)
        return results
    
    async def get_cta_performance(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get CTA click performance"""
        pipeline = [
            {
                "$match": {
                    "event_type": "cta_click",
                    "timestamp": {"$gte": start_date, "$lt": end_date},
                    "page_path": {
                        "$ne": "/",
                        "$not": {"$regex": "^/admin|^/profile"}
                    },
                    "metadata.cta_name": {"$not": {"$regex": "Admin"}}
                }
            },
            {
                "$group": {
                    "_id": "$metadata.cta_name",
                    "clicks": {"$sum": 1},
                    "page": {"$first": "$metadata.cta_location"},
                    "conversions": {
                        "$sum": {
                            "$cond": [{"$eq": ["$metadata.converted", True]}, 1, 0]
                        }
                    }
                }
            },
            {
                "$project": {
                    "cta": "$_id",
                    "clicks": 1,
                    "page": 1,
                    "conversions": 1,
                    "conversion_rate": {
                        "$cond": {
                            "if": {"$gt": ["$clicks", 0]},
                            "then": {
                                "$multiply": [
                                    {"$divide": ["$conversions", "$clicks"]},
                                    100
                                ]
                            },
                            "else": 0
                        }
                    }
                }
            },
            {"$sort": {"clicks": -1}}
        ]
        
        results = await self._events.aggregate(pipeline).to_list(None)
        return results
    
    async def get_total_visitors(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> int:
        """Get total unique visitors"""
        result = await self._sessions.count_documents({
            "start_time": {"$gte": start_date, "$lt": end_date}
        })
        return result
    
    async def get_total_page_views(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> int:
        """Get total page views"""
        result = await self._events.count_documents({
            "event_type": "page_view",
            "timestamp": {"$gte": start_date, "$lt": end_date}
        })
        return result
    
    async def get_scroll_depth_stats(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get scroll depth statistics by page"""
        pipeline = [
            {
                "$match": {
                    "event_type": "scroll_depth",
                    "timestamp": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$page_path",
                    "avg_depth": {"$avg": "$metadata.scroll_depth"},
                    "completions": {
                        "$sum": {
                            "$cond": [{"$eq": ["$metadata.scroll_depth", 100]}, 1, 0]
                        }
                    }
                }
            },
            {
                "$project": {
                    "page": "$_id",
                    "avgDepth": {"$round": ["$avg_depth", 0]},
                    "completions": 1
                }
            },
            {"$sort": {"avgDepth": -1}},
            {"$limit": 10}
        ]
        
        results = await self._events.aggregate(pipeline).to_list(None)
        return results
    
    async def get_accelerator_metrics(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get page views and average time for accelerator pages"""
        pipeline = [
            {
                "$match": {
                    "event_type": "page_view",
                    "timestamp": {"$gte": start_date, "$lt": end_date},
                    "page_path": {"$regex": "^/accelerators/"}
                }
            },
            {
                "$group": {
                    "_id": "$page_path",
                    "page_views": {"$sum": 1},
                    "avg_duration": {"$avg": "$metadata.duration"}
                }
            },
            {
                "$project": {
                    "page_path": "$_id",
                    "page_views": 1,
                    "avg_time_seconds": {
                        "$cond": {
                            "if": {"$gt": ["$avg_duration", 0]},
                            "then": {"$divide": ["$avg_duration", 1000]},
                            "else": 0
                        }
                    }
                }
            }
        ]
        
        results = await self._events.aggregate(pipeline).to_list(None)
        return results
    
    async def get_user_activity(
        self,
        start_time: datetime,
        event_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get user activity with email and action details."""
        match_filter: Dict[str, Any] = {
            "timestamp": {"$gte": start_time}
        }
        
        # Filter by event type if specified
        if event_type and event_type != "all":
            match_filter["event_type"] = event_type
        
        pipeline = [
            {"$match": match_filter},
            # Lookup user email from sessions
            {
                "$lookup": {
                    "from": "analytics_sessions",
                    "localField": "session_id",
                    "foreignField": "session_id",
                    "as": "session_data"
                }
            },
            # Unwind session data
            {
                "$unwind": {
                    "path": "$session_data",
                    "preserveNullAndEmptyArrays": True
                }
            },
            # Convert user_id string to ObjectId for lookup (safely)
            {
                "$addFields": {
                    "session_user_id_obj": {
                        "$convert": {
                            "input": "$session_data.user_id",
                            "to": "objectId",
                            "onError": None,
                            "onNull": None
                        }
                    }
                }
            },
            # Lookup user details if user_id exists in session
            {
                "$lookup": {
                    "from": "users",
                    "localField": "session_user_id_obj",
                    "foreignField": "_id",
                    "as": "user_data"
                }
            },
            # Unwind user data
            {
                "$unwind": {
                    "path": "$user_data",
                    "preserveNullAndEmptyArrays": True
                }
            },
            # Project fields
            {
                "$project": {
                    "_id": 0,
                    "event_type": 1,
                    "timestamp": 1,
                    "page_path": 1,
                    "page_title": 1,
                    "user_id": {
                        "$ifNull": [
                            {"$toString": "$user_data._id"},
                            "$session_data.user_id"
                        ]
                    },
                    "user_email": {"$ifNull": ["$user_data.email", None]},
                    "resource_name": {"$ifNull": ["$metadata.resource_name", None]},
                    "cta_name": {"$ifNull": ["$metadata.cta_name", None]},
                    "source": {"$ifNull": ["$session_data.source", None]}
                }
            },
            # Sort by timestamp descending (most recent first)
            {"$sort": {"timestamp": -1}},
            # Limit results
            {"$limit": 500}
        ]
        
        results = await self._events.aggregate(pipeline).to_list(None)
        return results
    
    async def get_user_domains_breakdown(self) -> List[Dict[str, Any]]:
        """Get count of users grouped by email domain (only users with analytics activity)."""
        pipeline = [
            # Start from analytics_sessions to get only users who have interacted
            {
                "$match": {
                    "user_id": {"$exists": True, "$ne": None, "$ne": ""}
                }
            },
            # Get unique user IDs
            {
                "$group": {
                    "_id": "$user_id"
                }
            },
            # Join with users collection (user_id in sessions is actually the email)
            {
                "$lookup": {
                    "from": "users",
                    "localField": "_id",
                    "foreignField": "user_email",
                    "as": "user_data"
                }
            },
            # Unwind user data
            {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": False}},
            # Filter out users without emails
            {
                "$match": {
                    "user_data.user_email": {"$exists": True, "$ne": None, "$ne": ""}
                }
            },
            # Extract domain from email
            {
                "$addFields": {
                    "domain": {
                        "$arrayElemAt": [
                            {"$split": ["$user_data.user_email", "@"]},
                            1
                        ]
                    }
                }
            },
            # Group by domain
            {
                "$group": {
                    "_id": "$domain",
                    "user_count": {"$sum": 1}
                }
            },
            # Sort by user count descending
            {"$sort": {"user_count": -1}},
            # Project to friendly field names
            {
                "$project": {
                    "_id": 0,
                    "domain": "$_id",
                    "user_count": 1
                }
            }
        ]
        
        # Query the analytics_sessions collection
        results = await self._db.analytics_sessions.aggregate(pipeline).to_list(None)
        return results
    
