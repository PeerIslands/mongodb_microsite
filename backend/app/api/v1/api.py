from fastapi import APIRouter
from app.api.v1.endpoints import (
    health, 
    users, 
    auth, 
    case_studies, 
    password_reset, 
    blogs, 
    accelerators, 
    email, 
    email_templates,
    contact,
    ai_extract,
    events,
    analytics,
    event_registrations,
    pdf_downloads,
    chatbot,
    testimonials,
    newsletter_access,
    event_resource_requests,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(case_studies.router, tags=["case-studies"])
api_router.include_router(accelerators.router, tags=["accelerators"])
api_router.include_router(password_reset.router, tags=["password-reset"])
api_router.include_router(blogs.router, tags=["blogs"])
api_router.include_router(email.router, prefix="/email", tags=["email"])
api_router.include_router(email_templates.router, prefix="/email-templates", tags=["email-templates"])
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])
api_router.include_router(ai_extract.router, tags=["AI Extract"])
api_router.include_router(events.router, tags=["events"])
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(event_registrations.router, tags=["event-registrations"])
api_router.include_router(pdf_downloads.router, tags=["pdf-downloads"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
api_router.include_router(testimonials.router, tags=["testimonials"])
api_router.include_router(newsletter_access.router, prefix="/newsletter-access", tags=["newsletter-access"])
api_router.include_router(event_resource_requests.router, tags=["event-resource-requests"])









