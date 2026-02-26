"""
MongoDB Initialization Script.
Creates collections, indexes, and optionally seeds initial data.

Field naming convention: snake_case (matching frontend requirements)

Usage:
    python -m app.core.mongodb_init
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


async def create_indexes(db) -> None:
    """
    Create indexes for all collections.
    Indexes improve query performance.
    """
    print("📦 Creating indexes...")
    
    # ==========================================================================
    # CASE STUDIES COLLECTION
    # ==========================================================================
    case_studies = db["case_studies"]
    
    # Unique index on slug (for URL lookups)
    await case_studies.create_index("slug", unique=True)
    print("  ✅ case_studies.slug (unique)")
    
    # Index for filtering
    await case_studies.create_index("status")
    print("  ✅ case_studies.status")
    
    await case_studies.create_index("industry")
    print("  ✅ case_studies.industry")
    
    await case_studies.create_index("featured")
    print("  ✅ case_studies.featured")
    
    # Index for sorting by date
    await case_studies.create_index([("created_at", -1)])
    print("  ✅ case_studies.created_at (descending)")
    
    # Compound index for common queries
    await case_studies.create_index([
        ("status", 1),
        ("featured", 1),
        ("created_at", -1)
    ])
    print("  ✅ case_studies.status+featured+created_at (compound)")
    
    # ==========================================================================
    # USERS COLLECTION
    # ==========================================================================
    users = db["users"]
    
    # Unique index on email
    await users.create_index("user_email", unique=True)
    print("  ✅ users.user_email (unique)")
    
    # Index for internal users
    await users.create_index("is_internal")
    print("  ✅ users.is_internal")
    
    # Index for active accounts
    await users.create_index("account_active")
    print("  ✅ users.account_active")
    
    # Index for MFA enabled users
    await users.create_index("totp_enabled")
    print("  ✅ users.totp_enabled")
    
    # ==========================================================================
    # LOGIN CREDENTIALS COLLECTION
    # ==========================================================================
    login_creds = db["login_creds"]
    
    # Unique index on email
    await login_creds.create_index("user_email", unique=True)
    print("  ✅ login_creds.user_email (unique)")
    
    # ==========================================================================
    # BLOGS COLLECTION
    # ==========================================================================
    blogs = db["blogs"]
    
    # Unique index on slug
    await blogs.create_index("slug", unique=True)
    print("  ✅ blogs.slug (unique)")
    
    # Index for status
    await blogs.create_index("status")
    print("  ✅ blogs.status")
    
    # Index for featured
    await blogs.create_index("featured")
    print("  ✅ blogs.featured")
    
    # Index for sorting by date
    await blogs.create_index([("created_at", -1)])
    print("  ✅ blogs.created_at (descending)")
    
    # Compound index for common queries
    await blogs.create_index([("status", 1), ("featured", 1), ("created_at", -1)])
    print("  ✅ blogs.status+featured+created_at (compound)")
    
    # ==========================================================================
    # ACCELERATORS COLLECTION
    # ==========================================================================
    accelerators = db["accelerators"]
    
    # Unique index on slug
    await accelerators.create_index("slug", unique=True)
    print("  ✅ accelerators.slug (unique)")
    
    # Index for status
    await accelerators.create_index("status")
    print("  ✅ accelerators.status")
    
    # Index for sorting by date
    await accelerators.create_index([("created_at", -1)])
    print("  ✅ accelerators.created_at (descending)")
    
    # Display order for admin-controlled ordering (lower = first on site)
    await accelerators.create_index("display_order")
    print("  ✅ accelerators.display_order")
    
    # Backfill display_order for existing documents (by created_at ascending)
    from datetime import datetime, timezone
    last = await accelerators.find_one(
        {"display_order": {"$exists": True}}, sort=[("display_order", -1)], projection={"display_order": 1}
    )
    next_order = (last.get("display_order", 0) + 1) if last else 1
    cursor = accelerators.find({"display_order": {"$exists": False}}).sort("created_at", 1)
    backfill_count = 0
    now = datetime.now(timezone.utc)
    async for doc in cursor:
        await accelerators.update_one(
            {"_id": doc["_id"]},
            {"$set": {"display_order": next_order, "updated_at": now}},
        )
        next_order += 1
        backfill_count += 1
    if backfill_count:
        print(f"  ✅ accelerators display_order backfilled for {backfill_count} document(s)")
    
    # ==========================================================================
    # EVENTS COLLECTION
    # ==========================================================================
    events = db["events"]
    
    # Unique index on slug
    await events.create_index("slug", unique=True)
    print("  ✅ events.slug (unique)")
    
    # Index for status
    await events.create_index("status")
    print("  ✅ events.status")
    
    # Index for event date
    await events.create_index("event_date")
    print("  ✅ events.event_date")
    
    # Index for sorting by date
    await events.create_index([("created_at", -1)])
    print("  ✅ events.created_at (descending)")
    
    # Compound index for common queries
    await events.create_index([("status", 1), ("event_date", -1)])
    print("  ✅ events.status+event_date (compound)")
    
    # ==========================================================================
    # EMAIL TEMPLATES COLLECTION
    # ==========================================================================
    email_templates = db["email_templates"]
    
    # Unique index on slug
    await email_templates.create_index("slug", unique=True)
    print("  ✅ email_templates.slug (unique)")
    
    # Index for status
    await email_templates.create_index("status")
    print("  ✅ email_templates.status")
    
    # Index for category
    await email_templates.create_index("category")
    print("  ✅ email_templates.category")
    
    # Index for sorting by date
    await email_templates.create_index([("created_at", -1)])
    print("  ✅ email_templates.created_at (descending)")
    
    # Index for last sent at
    await email_templates.create_index("last_sent_at")
    print("  ✅ email_templates.last_sent_at")
    
    # Compound index for common queries
    await email_templates.create_index([("status", 1), ("category", 1), ("created_at", -1)])
    print("  ✅ email_templates.status+category+created_at (compound)")
    
    # ==========================================================================
    # TOTP SECRETS COLLECTION
    # ==========================================================================
    totp_secrets = db["totp_secrets"]
    
    # Unique index on user_id
    await totp_secrets.create_index("user_id", unique=True)
    print("  ✅ totp_secrets.user_id (unique)")
    
    # Index for expiry
    await totp_secrets.create_index("expires_at")
    print("  ✅ totp_secrets.expires_at")
    
    # ==========================================================================
    # ANALYTICS EVENTS COLLECTION
    # ==========================================================================
    analytics_events = db["analytics_events"]
    
    # Index for time-based queries (most common - descending for recent first)
    await analytics_events.create_index([("timestamp", -1)])
    print("  ✅ analytics_events.timestamp (descending)")
    
    # Index for event type filtering
    await analytics_events.create_index("event_type")
    print("  ✅ analytics_events.event_type")
    
    # Index for session tracking
    await analytics_events.create_index("session_id")
    print("  ✅ analytics_events.session_id")
    
    # Index for page-based queries
    await analytics_events.create_index("page_path")
    print("  ✅ analytics_events.page_path")
    
    # Compound index for common queries (event type + time)
    await analytics_events.create_index([
        ("event_type", 1),
        ("timestamp", -1)
    ])
    print("  ✅ analytics_events.event_type+timestamp (compound)")
    
    # ==========================================================================
    # ANALYTICS SESSIONS COLLECTION
    # ==========================================================================
    analytics_sessions = db["analytics_sessions"]
    
    # Unique index on session_id
    await analytics_sessions.create_index("session_id", unique=True)
    print("  ✅ analytics_sessions.session_id (unique)")
    
    # Index for user tracking
    await analytics_sessions.create_index("user_id")
    print("  ✅ analytics_sessions.user_id")
    
    # Index for time-based queries
    await analytics_sessions.create_index([("start_time", -1)])
    print("  ✅ analytics_sessions.start_time (descending)")
    
    # Index for source analysis
    await analytics_sessions.create_index("source")
    print("  ✅ analytics_sessions.source")
    # EVENT REGISTRATIONS COLLECTION
    # ==========================================================================
    event_registrations = db["event_registrations"]
    
    # Unique compound index to prevent duplicate registrations (one user per event)
    await event_registrations.create_index(
        [("user_id", 1), ("event_id", 1)],
        unique=True
    )
    print("  ✅ event_registrations.user_id+event_id (unique compound)")
    
    # Index for querying by user
    await event_registrations.create_index("user_id")
    print("  ✅ event_registrations.user_id")
    
    # Index for querying by event
    await event_registrations.create_index("event_id")
    print("  ✅ event_registrations.event_id")
    
    # Index for filtering by status
    await event_registrations.create_index("status")
    print("  ✅ event_registrations.status")
    
    # Index for sorting by registration date
    await event_registrations.create_index([("registered_at", -1)])
    print("  ✅ event_registrations.registered_at (descending)")
    
    # ==========================================================================
    # PDF DOWNLOADS COLLECTION (Lead Capture)
    # ==========================================================================
    pdf_downloads = db["pdf_downloads"]
    
    # Index for email-based queries
    await pdf_downloads.create_index("email")
    print("  ✅ pdf_downloads.email")
    
    # Index for resource type filtering
    await pdf_downloads.create_index("resource_type")
    print("  ✅ pdf_downloads.resource_type")
    
    # Index for resource id queries
    await pdf_downloads.create_index("resource_id")
    print("  ✅ pdf_downloads.resource_id")
    
    # Index for time-based queries
    await pdf_downloads.create_index([("created_at", -1)])
    print("  ✅ pdf_downloads.created_at (descending)")
    
    # Compound index for resource queries
    await pdf_downloads.create_index([
        ("resource_type", 1),
        ("resource_id", 1)
    ])
    print("  ✅ pdf_downloads.resource_type+resource_id (compound)")
    
    print("✅ All indexes created successfully!")


async def create_collections(db) -> None:
    """
    Create collections with validation schemas.
    """
    print("📦 Creating collections...")
    
    # Get existing collections
    existing = await db.list_collection_names()
    
    # Collections to create
    collections_to_create = [
        "case_studies",
        "users",
        "login_creds",
        "blogs",
        "accelerators",
        "events",
        "email_templates",
        "totp_secrets",
        "analytics_events",
        "analytics_sessions",
        "pdf_downloads",
    ]
    
    for collection_name in collections_to_create:
        if collection_name not in existing:
            await db.create_collection(collection_name)
            print(f"  ✅ Created: {collection_name}")
        else:
            print(f"  ⏭️  Exists: {collection_name}")
    
    # Event Registrations Collection
    if "event_registrations" not in existing:
        await db.create_collection("event_registrations")
        print("  ✅ Created: event_registrations")
    else:
        print("  ⏭️  Exists: event_registrations")
    
    print("✅ All collections ready!")


async def seed_sample_data(db) -> None:
    """
    Seed sample data for development/testing.
    Only runs if collections are empty.
    """
    print("🌱 Checking for sample data...")
    
    case_studies = db["case_studies"]
    
    # Only seed if collection is empty
    count = await case_studies.count_documents({})
    if count > 0:
        print(f"  ⏭️  Skipping: {count} case studies already exist")
        return
    
    # Sample case study data with new snake_case field structure
    from datetime import datetime, timezone
    import uuid
    
    sample_case_study = {
        "_id": str(uuid.uuid4()),
        "title": "Sample MongoDB Migration Case Study",
        "slug": "sample-mongodb-migration",
        "featured": True,
        "status": "published",
        "industry": "Technology",
        "tech_stack": ["MongoDB", "Python", "FastAPI", "Docker"],
        "migration_type": "Oracle to MongoDB",
        "company_name": "Sample Tech Corp",
        "company_logo": "",
        "description": "This is a sample case study demonstrating MongoDB migration best practices.",
        "industry_details": "Technology sector focusing on cloud solutions.",
        "challenges": "Legacy system complexity. Data migration at scale. Zero downtime requirement.",
        "technical_constraints": "Must maintain backward compatibility.",
        "approach": "Phased migration with parallel running systems.",
        "architecture_diagram": None,
        "implementation_details": "Implemented using MongoDB Atlas with Python drivers.",
        "metrics": {
            "time_reduction": "60%",
            "ingestion_speed": "3x faster",
            "data_accuracy": "99.9%"
        },
        "business_outcomes": "Reduced operational costs. Improved query performance. Better scalability.",
        "testimonial_quote": "The migration exceeded our expectations.",
        "testimonial_author": "John Doe",
        "testimonial_position": "CTO, Sample Tech Corp",
        "hero_image": "",
        "pdf_url": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # Set id to match _id
    sample_case_study["id"] = sample_case_study["_id"]
    
    await case_studies.insert_one(sample_case_study)
    print("  ✅ Inserted sample case study")
    print("✅ Sample data seeded!")


async def init_mongodb(seed_data: bool = False) -> None:
    """
    Initialize MongoDB database.
    
    Args:
        seed_data: If True, seed sample data for development
    """
    print("=" * 60)
    print("🚀 MongoDB Initialization")
    print("=" * 60)
    print(f"Database URL: {settings.MONGODB_URI}")
    print(f"Database Name: {settings.MONGODB_DB_NAME}")
    print("=" * 60)
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Verify connection
        await client.admin.command("ping")
        print("✅ Connected to MongoDB")
        print()
        
        # Create collections
        await create_collections(db)
        print()
        
        # Create indexes
        await create_indexes(db)
        print()
        
        # Seed sample data (optional)
        if seed_data:
            await seed_sample_data(db)
            print()
        
        print("=" * 60)
        print("🎉 MongoDB initialization complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        raise
    finally:
        client.close()


def main():
    """Entry point for the initialization script."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Initialize MongoDB database")
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Seed sample data for development"
    )
    args = parser.parse_args()
    
    asyncio.run(init_mongodb(seed_data=args.seed))


if __name__ == "__main__":
    main()
