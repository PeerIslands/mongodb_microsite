"""
Migration Script: Fix Deleted Users Email
==========================================
This script updates all deleted users to modify their email addresses,
freeing up the original emails for new registrations.

Run with: python -m scripts.fix_deleted_users
"""

import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def fix_deleted_users():
    """Update all deleted users to modify their email addresses."""
    
    # Connect to MongoDB
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name = os.getenv("DATABASE_NAME", "microsite")
    
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    users_collection = db["users"]
    login_creds_collection = db["login_creds"]
    totp_secrets_collection = db["totp_secrets"]
    
    print("🔍 Finding deleted users with unmodified emails...")
    
    # Find all deleted users whose email doesn't start with "deleted_"
    deleted_users = await users_collection.find({
        "is_deleted": True,
        "user_email": {"$not": {"$regex": "^deleted_"}}
    }).to_list(length=None)
    
    print(f"Found {len(deleted_users)} deleted users to fix.")
    
    for user in deleted_users:
        user_id = user["_id"]
        original_email = user["user_email"]
        
        # Generate timestamp-based modified email
        timestamp = int(datetime.now(timezone.utc).timestamp())
        deleted_email = f"deleted_{timestamp}_{original_email}"
        
        print(f"\n📧 Fixing user: {user['first_name']} {user['last_name']}")
        print(f"   Original email: {original_email}")
        print(f"   New email: {deleted_email}")
        
        # Update users collection
        await users_collection.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "user_email": deleted_email,
                    "original_email": original_email
                }
            }
        )
        print(f"   ✅ Updated users collection")
        
        # Update login_creds collection
        result = await login_creds_collection.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "user_email": deleted_email
                }
            }
        )
        if result.modified_count > 0:
            print(f"   ✅ Updated login_creds collection")
        
        # Update totp_secrets collection
        result = await totp_secrets_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "user_email": deleted_email
                }
            }
        )
        if result.modified_count > 0:
            print(f"   ✅ Updated totp_secrets collection")
    
    print(f"\n✨ Migration complete! Fixed {len(deleted_users)} deleted users.")
    print("📧 Original emails are now available for new registrations.")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(fix_deleted_users())
