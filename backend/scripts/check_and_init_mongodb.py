#!/usr/bin/env python3
"""
MongoDB Initialization Check and Seed Script for CI/CD

This script checks if MongoDB collections exist and are properly indexed.
If not, it initializes them with indexes and optionally seeds data.

Exit codes:
  0 - Success (collections exist or were created successfully)
  1 - Error (MongoDB connection failed or initialization failed)
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def check_and_init_mongodb() -> int:
    """
    Check MongoDB collections and initialize if needed.
    
    Returns:
        0 if successful, 1 if error
    """
    print("=" * 60)
    print("🔍 MongoDB Initialization Check")
    print("=" * 60)
    print(f"Database: {settings.MONGODB_DB_NAME}")
    print("=" * 60)
    
    client = None
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        db = client[settings.MONGODB_DB_NAME]
        
        # Verify connection
        await client.admin.command("ping")
        print("✅ Connected to MongoDB")
        print()
        
        # Check existing collections
        existing_collections = await db.list_collection_names()
        print(f"📦 Found {len(existing_collections)} collections:")
        for coll in existing_collections:
            count = await db[coll].count_documents({})
            print(f"  - {coll}: {count} documents")
        print()
        
        # Expected collections
        expected_collections = [
            "case_studies",
            "users",
            "login_creds",
            "blogs",
            "accelerators",
            "events",
            "email_templates",
            "totp_secrets",
        ]
        
        missing_collections = [c for c in expected_collections if c not in existing_collections]
        
        if missing_collections:
            print(f"⚠️ Missing collections: {', '.join(missing_collections)}")
            print("🚀 Running full initialization...")
            print()
            
            # Import and run the full initialization
            from app.core.mongodb_init import init_mongodb
            await init_mongodb(seed_data=False)
            
            print()
            print("=" * 60)
            print("✅ MongoDB initialization completed successfully!")
            print("=" * 60)
        else:
            print("✅ All expected collections exist")
            print()
            
            # Check if indexes exist
            print("🔍 Checking indexes...")
            needs_indexes = False
            
            # Check a few key indexes
            users_indexes = await db["users"].index_information()
            if "user_email_1" not in users_indexes:
                print("  ⚠️ Missing user_email index")
                needs_indexes = True
            
            email_templates_indexes = await db["email_templates"].index_information()
            if "slug_1" not in email_templates_indexes:
                print("  ⚠️ Missing email_templates.slug index")
                needs_indexes = True
            
            if needs_indexes:
                print("🚀 Creating missing indexes...")
                from app.core.mongodb_init import create_indexes
                await create_indexes(db)
                print("✅ Indexes created")
            else:
                print("✅ All indexes present")
            
            print()
            print("=" * 60)
            print("✅ MongoDB is properly initialized!")
            print("=" * 60)
        
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("=" * 60)
        return 1
        
    finally:
        if client:
            client.close()


def main():
    """Entry point"""
    exit_code = asyncio.run(check_and_init_mongodb())
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
