"""
Event domain whitelist endpoints.
Admin: CRUD for whitelisted domains + view/manage access requests.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.v1.models.event_domain import (
    WhitelistedDomainResponse,
    AddDomainRequest,
    DomainRequestResponse,
    DomainRequestCountResponse,
)
from app.api.v1.models.user import UserModel
from app.api.v1.repositories.event_domain_repository import EventDomainRepository
from app.api.v1.dependencies.services import get_event_domain_repository, get_current_user

router = APIRouter(prefix="/event-domains", tags=["event-domains"])


def require_admin(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user


# =============================================================================
# Whitelist
# =============================================================================

@router.get("/whitelist", response_model=List[WhitelistedDomainResponse])
async def list_whitelist(
    repo: EventDomainRepository = Depends(get_event_domain_repository),
    _: UserModel = Depends(require_admin),
):
    """List all whitelisted email domains."""
    return await repo.get_all_whitelisted()


@router.post("/whitelist", response_model=WhitelistedDomainResponse, status_code=status.HTTP_201_CREATED)
async def add_to_whitelist(
    body: AddDomainRequest,
    repo: EventDomainRepository = Depends(get_event_domain_repository),
    _: UserModel = Depends(require_admin),
):
    """Add an email domain to the whitelist."""
    domain = body.domain.lower().strip().lstrip("@").strip(".")
    if not domain or "." not in domain:
        raise HTTPException(status_code=400, detail="Invalid domain format")
    doc = await repo.add_domain(domain)
    return WhitelistedDomainResponse(domain=doc["domain"], added_at=doc["added_at"])


@router.delete("/whitelist/{domain}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_whitelist(
    domain: str,
    repo: EventDomainRepository = Depends(get_event_domain_repository),
    _: UserModel = Depends(require_admin),
):
    """Remove an email domain from the whitelist."""
    removed = await repo.remove_domain(domain)
    if not removed:
        raise HTTPException(status_code=404, detail="Domain not found in whitelist")


# =============================================================================
# Domain access requests (new unique domains that attempted guest registration)
# =============================================================================

@router.get("/requests/count", response_model=DomainRequestCountResponse)
async def get_pending_count(
    repo: EventDomainRepository = Depends(get_event_domain_repository),
    _: UserModel = Depends(require_admin),
):
    """Count of pending domain access requests (for admin badge)."""
    count = await repo.count_pending_requests()
    return DomainRequestCountResponse(pending_count=count)


@router.get("/requests", response_model=List[DomainRequestResponse])
async def list_domain_requests(
    repo: EventDomainRepository = Depends(get_event_domain_repository),
    _: UserModel = Depends(require_admin),
):
    """List all unique domain access requests."""
    docs = await repo.get_all_requests()
    return [
        DomainRequestResponse(
            domain=d["domain"],
            first_requested_at=d["first_requested_at"],
            last_requested_at=d["last_requested_at"],
            request_count=d["request_count"],
            status=d["status"],
        )
        for d in docs
    ]


@router.post("/requests/{domain}/approve", status_code=status.HTTP_200_OK)
async def approve_domain_request(
    domain: str,
    repo: EventDomainRepository = Depends(get_event_domain_repository),
    _: UserModel = Depends(require_admin),
):
    """Approve a domain request — adds it to the whitelist automatically."""
    await repo.approve_domain(domain)
    return {"message": f"{domain} approved and added to whitelist"}


@router.post("/requests/{domain}/reject", status_code=status.HTTP_200_OK)
async def reject_domain_request(
    domain: str,
    repo: EventDomainRepository = Depends(get_event_domain_repository),
    _: UserModel = Depends(require_admin),
):
    """Reject a domain request."""
    rejected = await repo.reject_domain(domain)
    if not rejected:
        raise HTTPException(status_code=404, detail="Domain request not found")
    return {"message": f"{domain} rejected"}
