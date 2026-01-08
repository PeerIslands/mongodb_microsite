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
    
    # ==========================================================================
    # LOGIN CREDENTIALS COLLECTION
    # ==========================================================================
    login_creds = db["login_creds"]
    
    # Unique index on email
    await login_creds.create_index("user_email", unique=True)
    print("  ✅ login_creds.user_email (unique)")
    
    print("✅ All indexes created successfully!")


async def create_collections(db) -> None:
    """
    Create collections with validation schemas.
    """
    print("📦 Creating collections...")
    
    # Get existing collections
    existing = await db.list_collection_names()
    
    # Case Studies Collection
    if "case_studies" not in existing:
        await db.create_collection("case_studies")
        print("  ✅ Created: case_studies")
    else:
        print("  ⏭️  Exists: case_studies")
    
    # Users Collection
    if "users" not in existing:
        await db.create_collection("users")
        print("  ✅ Created: users")
    else:
        print("  ⏭️  Exists: users")
    
    # Login Credentials Collection
    if "login_creds" not in existing:
        await db.create_collection("login_creds")
        print("  ✅ Created: login_creds")
    else:
        print("  ⏭️  Exists: login_creds")
    
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
