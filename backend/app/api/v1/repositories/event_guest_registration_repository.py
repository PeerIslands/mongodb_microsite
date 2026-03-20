"""
Guest event registration repository.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from motor.motor_asyncio import AsyncIOMotorDatabase

COLLECTION = "event_guest_registrations"


def _fmt(doc: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(doc)
    out["id"] = str(out.pop("_id", ""))
    ra = out.get("registered_at")
    if ra and hasattr(ra, "isoformat"):
        out["registered_at"] = ra.isoformat()
    return out


class EventGuestRegistrationRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db[COLLECTION]

    async def create(
        self,
        event_id: str,
        first_name: str,
        last_name: str,
        email: str,
        company: Optional[str] = None,
        designation: Optional[str] = None,
        phone: Optional[str] = None,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        doc = {
            "_id": str(uuid.uuid4()),
            "event_id": event_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email.lower().strip(),
            "company": company or "",
            "designation": designation or "",
            "phone": phone or "",
            "status": "REGISTERED",
            "registered_at": now,
        }
        await self.collection.insert_one(doc)
        return _fmt(doc)

    async def find_by_event_and_email(self, event_id: str, email: str) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"event_id": event_id, "email": email.lower().strip()})
        return _fmt(doc) if doc else None

    async def get_by_event(self, event_id: str) -> List[Dict[str, Any]]:
        docs = await self.collection.find({"event_id": event_id}).sort("registered_at", -1).to_list(length=None)
        return [_fmt(d) for d in docs]
