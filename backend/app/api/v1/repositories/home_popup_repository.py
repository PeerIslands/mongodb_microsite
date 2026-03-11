"""
Home popup repository - single-document config for the home page popup.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

DOC_ID = "config"
COLLECTION_NAME = "home_popup"


def _sanitize(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if doc is None:
        return None
    out = dict(doc)
    out.pop("_id", None)
    return out


class HomePopupRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db[COLLECTION_NAME]

    async def get(self) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"_id": DOC_ID})
        return _sanitize(doc)

    async def set(self, data: Dict[str, Any]) -> None:
        now = datetime.now(timezone.utc)
        payload = {
            "_id": DOC_ID,
            "image_url": data.get("image_url"),
            "title_text": data.get("title_text", "On-Demand webinar"),
            "cta_text": data.get("cta_text", "Click here to visit our On-Demand Webinars"),
            "cta_link": data.get("cta_link", "/events/on-demand"),
            "enabled": data.get("enabled", True),
            "updated_at": now,
        }
        await self.collection.update_one(
            {"_id": DOC_ID},
            {"$set": payload},
            upsert=True,
        )

    async def update(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update only provided fields; returns current doc after update."""
        if not data:
            return await self.get()
        now = datetime.now(timezone.utc)
        set_fields = {"updated_at": now}
        for key in ("image_url", "title_text", "cta_text", "cta_link", "enabled"):
            if key in data:
                set_fields[key] = data[key]
        await self.collection.update_one(
            {"_id": DOC_ID},
            {"$set": set_fields},
            upsert=True,
        )
        return await self.get()
