"""
Event Resource Request Repository - Data access for event PDF resource requests.
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Literal
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.v1.models.event_resource_request import EventResourceRequestModel


class EventResourceRequestRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["event_resource_requests"]

    def generate_id(self) -> str:
        return str(uuid.uuid4())

    async def create_request(
        self,
        event_id: str,
        requester_type: Literal["authenticated", "guest"],
        user_email: str,
        user_name: Optional[str] = None,
        user_id: Optional[str] = None,
        guest_registration_id: Optional[str] = None,
        company: Optional[str] = None,
        designation: Optional[str] = None,
        phone: Optional[str] = None,
        event_title: Optional[str] = None,
    ) -> str:
        request_id = self.generate_id()
        now = datetime.now(timezone.utc)
        model = EventResourceRequestModel(
            _id=request_id,
            event_id=event_id,
            event_title=event_title,
            requester_type=requester_type,
            user_email=user_email.lower(),
            user_name=user_name,
            user_id=user_id,
            guest_registration_id=guest_registration_id,
            company=company,
            designation=designation,
            phone=phone,
            status="pending",
            requested_at=now,
            resolved_at=None,
            resolved_by=None,
            admin_note=None,
            created_at=now,
            updated_at=now,
        )
        await self.collection.insert_one(model.to_dict())
        return request_id

    async def get_request_by_id(self, request_id: str) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"_id": request_id})
        if doc and "requested_at" in doc and hasattr(doc["requested_at"], "isoformat"):
            doc["requested_at"] = doc["requested_at"].isoformat() if doc["requested_at"] else None
        if doc and doc.get("resolved_at") and hasattr(doc["resolved_at"], "isoformat"):
            doc["resolved_at"] = doc["resolved_at"].isoformat()
        return doc

    async def check_existing_pending(self, event_id: str, user_email: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({
            "event_id": event_id,
            "user_email": user_email.lower(),
            "status": "pending",
        })

    async def get_pending_requests(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"status": "pending"}).sort("requested_at", -1).skip(skip).limit(limit)
        items = await cursor.to_list(length=limit)
        for doc in items:
            if doc.get("requested_at") and hasattr(doc["requested_at"], "isoformat"):
                doc["requested_at"] = doc["requested_at"].isoformat()
            if doc.get("resolved_at") and hasattr(doc["resolved_at"], "isoformat"):
                doc["resolved_at"] = doc["resolved_at"].isoformat()
        return items

    async def get_pending_count(self) -> int:
        return await self.collection.count_documents({"status": "pending"})

    async def get_all_requests(
        self,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        query = {} if status is None else {"status": status}
        cursor = self.collection.find(query).sort("requested_at", -1).skip(skip).limit(limit)
        items = await cursor.to_list(length=limit)
        for doc in items:
            if doc.get("requested_at") and hasattr(doc["requested_at"], "isoformat"):
                doc["requested_at"] = doc["requested_at"].isoformat()
            if doc.get("resolved_at") and hasattr(doc["resolved_at"], "isoformat"):
                doc["resolved_at"] = doc["resolved_at"].isoformat()
        return items

    async def update_status(
        self,
        request_id: str,
        status: Literal["approved", "denied"],
        resolved_by: str,
        admin_note: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        result = await self.collection.find_one_and_update(
            {"_id": request_id},
            {
                "$set": {
                    "status": status,
                    "resolved_at": now,
                    "resolved_by": resolved_by,
                    "admin_note": admin_note or None,
                    "updated_at": now.isoformat(),
                }
            },
            return_document=True,
        )
        if result:
            if result.get("requested_at") and hasattr(result["requested_at"], "isoformat"):
                result["requested_at"] = result["requested_at"].isoformat()
            if result.get("resolved_at") and hasattr(result["resolved_at"], "isoformat"):
                result["resolved_at"] = result["resolved_at"].isoformat()
        return result

    async def delete_request(self, request_id: str) -> bool:
        result = await self.collection.delete_one({"_id": request_id})
        return result.deleted_count > 0
