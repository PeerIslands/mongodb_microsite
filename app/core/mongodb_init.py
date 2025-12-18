"""
MongoDB Initialization Script.
Creates collections, indexes, and optionally seeds initial data.

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
    await case_studies.create_index([("createdAt", -1)])
    print("  ✅ case_studies.createdAt (descending)")
    
    # Compound index for common queries
    await case_studies.create_index([
        ("status", 1),
        ("featured", 1),
        ("createdAt", -1)
    ])
    print("  ✅ case_studies.status+featured+createdAt (compound)")
    
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
    
    # Sample case study data
    from datetime import datetime, timezone
    import uuid
    
    sample_case_study = {
        "_id": str(uuid.uuid4()),
        "id": str(uuid.uuid4()),
        "title": "Sample MongoDB Migration Case Study",
        "slug": "sample-mongodb-migration",
        "industry": "Technology",
        "migrationType": "Oracle to MongoDB",
        "techStack": ["MongoDB", "Python", "FastAPI", "Docker"],
        "companyName": "Sample Tech Corp",
        "companyLogo": "",
        "summary": "A sample case study demonstrating MongoDB migration best practices.",
        "description": "This is a sample case study created during database initialization.",
        "industryDetails": "Technology sector focusing on cloud solutions.",
        "challenges": [
            {"text": "Legacy system complexity"},
            {"text": "Data migration at scale"},
            {"text": "Zero downtime requirement"}
        ],
        "businessImpact": "Significant cost savings and performance improvements.",
        "technicalConstraints": "Must maintain backward compatibility.",
        "solutionApproach": "Phased migration with parallel running systems.",
        "architectureDiagram": "",
        "implementationDetails": "Implemented using MongoDB Atlas with Python drivers.",
        "codeSnippets": None,
        "metrics": [
            {"label": "Cost Reduction", "value": "40%"},
            {"label": "Performance Improvement", "value": "3x"},
            {"label": "Migration Time", "value": "3 months"}
        ],
        "businessOutcomes": [
            {"text": "Reduced operational costs"},
            {"text": "Improved query performance"},
            {"text": "Better scalability"}
        ],
        "testimonialQuote": "The migration exceeded our expectations.",
        "testimonialAuthor": "John Doe",
        "testimonialPosition": "CTO, Sample Tech Corp",
        "heroImage": "",
        "galleryImages": None,
        "pdfUrl": None,
        "status": "published",
        "featured": True,
        "views": 0,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    
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
    print(f"Database URL: {settings.MONGODB_URL}")
    print(f"Database Name: {settings.MONGODB_DB_NAME}")
    print("=" * 60)
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
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

