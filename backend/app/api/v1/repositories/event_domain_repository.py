"""
Event domain whitelist + access request repository.
"""
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from motor.motor_asyncio import AsyncIOMotorDatabase

WHITELIST_COLLECTION = "event_domain_whitelist"
REQUESTS_COLLECTION = "event_domain_requests"


def _clean_domain(domain: str) -> str:
    return domain.lower().strip().lstrip("@").strip(".")


def _fmt_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(doc)
    for field in ("added_at", "first_requested_at", "last_requested_at"):
        if field in out and hasattr(out[field], "isoformat"):
            out[field] = out[field].isoformat()
    return out


class EventDomainRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.whitelist = db[WHITELIST_COLLECTION]
        self.requests = db[REQUESTS_COLLECTION]

    # -------------------------------------------------------------------------
    # Whitelist
    # -------------------------------------------------------------------------

    async def is_domain_whitelisted(self, domain: str) -> bool:
        domain = _clean_domain(domain)
        doc = await self.whitelist.find_one({"_id": domain})
        return doc is not None

    async def get_all_whitelisted(self) -> List[Dict[str, Any]]:
        docs = await self.whitelist.find({}).sort("added_at", -1).to_list(length=None)
        return [_fmt_doc(d) for d in docs]

    async def add_domain(self, domain: str) -> Dict[str, Any]:
        domain = _clean_domain(domain)
        now = datetime.now(timezone.utc)
        doc = {"_id": domain, "domain": domain, "added_at": now}
        await self.whitelist.update_one({"_id": domain}, {"$setOnInsert": doc}, upsert=True)
        return _fmt_doc(doc)

    async def remove_domain(self, domain: str) -> bool:
        domain = _clean_domain(domain)
        result = await self.whitelist.delete_one({"_id": domain})
        return result.deleted_count > 0

    # -------------------------------------------------------------------------
    # Domain access requests (new unique domains that attempted registration)
    # -------------------------------------------------------------------------

    async def record_domain_request(self, domain: str) -> bool:
        """
        Upsert a domain request. Returns True if this is the FIRST time this
        domain has requested access (so caller knows whether to notify).
        """
        domain = _clean_domain(domain)
        now = datetime.now(timezone.utc)

        existing = await self.requests.find_one({"_id": domain})
        if existing:
            await self.requests.update_one(
                {"_id": domain},
                {"$inc": {"request_count": 1}, "$set": {"last_requested_at": now}},
            )
            return False  # not new
        else:
            doc = {
                "_id": domain,
                "domain": domain,
                "first_requested_at": now,
                "last_requested_at": now,
                "request_count": 1,
                "status": "pending",
            }
            await self.requests.insert_one(doc)
            return True  # new domain

    async def get_pending_requests(self) -> List[Dict[str, Any]]:
        docs = await self.requests.find({"status": "pending"}).sort("first_requested_at", -1).to_list(length=None)
        return [_fmt_doc(d) for d in docs]

    async def get_all_requests(self) -> List[Dict[str, Any]]:
        docs = await self.requests.find({}).sort("first_requested_at", -1).to_list(length=None)
        return [_fmt_doc(d) for d in docs]

    async def count_pending_requests(self) -> int:
        return await self.requests.count_documents({"status": "pending"})

    async def approve_domain(self, domain: str) -> bool:
        """Mark request as approved AND add to whitelist."""
        domain = _clean_domain(domain)
        await self.requests.update_one({"_id": domain}, {"$set": {"status": "approved"}})
        await self.add_domain(domain)
        return True

    async def reject_domain(self, domain: str) -> bool:
        domain = _clean_domain(domain)
        result = await self.requests.update_one({"_id": domain}, {"$set": {"status": "rejected"}})
        return result.modified_count > 0
