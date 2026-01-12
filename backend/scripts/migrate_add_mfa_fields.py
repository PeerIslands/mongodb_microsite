"""
Database Migration: Add MFA Fields to Users Collection

This migration script:
1. Adds MFA/TOTP fields to existing users collection
2. Creates totp_secrets collection
3. Adds required indexes
4. Handles existing users (grandfather clause)

Run this script BEFORE deploying the new code.

Usage:
    python migrate_add_mfa_fields.py

Or with custom MongoDB URI:
    MONGODB_URI=mongodb://localhost:27017 python migrate_add_mfa_fields.py
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


# Migration configuration
GRANDFATHER_EXISTING_USERS = True  # Set to True to allow existing users to skip MFA
FORCE_MFA_FOR_EXISTING = False      # Set to True to require MFA for all users

# Colors for console output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_header(message: str):
    """Print a header message."""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{message:^70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")


def print_success(message: str):
    """Print a success message."""
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")


def print_info(message: str):
    """Print an info message."""
    print(f"{Colors.OKCYAN}ℹ {message}{Colors.ENDC}")


def print_warning(message: str):
    """Print a warning message."""
    print(f"{Colors.WARNING}⚠ {message}{Colors.ENDC}")


def print_error(message: str):
    """Print an error message."""
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")


async def migrate_database():
    """Execute the database migration."""
    
    print_header("MFA Fields Migration Script")
    
    # Connect to MongoDB
    mongodb_uri = os.getenv("MONGODB_URI") or settings.MONGODB_URI
    mongodb_db_name = os.getenv("MONGODB_DB_NAME") or settings.MONGODB_DB_NAME
    
    print_info(f"Connecting to MongoDB...")
    print_info(f"Database: {mongodb_db_name}")
    
    try:
        client = AsyncIOMotorClient(mongodb_uri)
        db = client[mongodb_db_name]
        
        # Test connection
        await client.admin.command('ping')
        print_success("Connected to MongoDB successfully")
        
    except Exception as e:
        print_error(f"Failed to connect to MongoDB: {e}")
        return False
    
    # =========================================================================
    # STEP 1: Backup existing data (optional)
    # =========================================================================
    
    print_header("Step 1: Analyzing Existing Data")
    
    users_collection = db["users"]
    
    # Count existing users
    total_users = await users_collection.count_documents({})
    print_info(f"Found {total_users} existing users")
    
    # Check if migration already ran
    users_with_mfa = await users_collection.count_documents({"totp_enabled": {"$exists": True}})
    if users_with_mfa > 0:
        print_warning(f"{users_with_mfa} users already have MFA fields")
        print_warning("Migration may have already been run. Continue anyway? (y/n)")
        response = input().strip().lower()
        if response != 'y':
            print_info("Migration cancelled")
            return False
    
    # =========================================================================
    # STEP 2: Update existing users collection
    # =========================================================================
    
    print_header("Step 2: Adding MFA Fields to Users")
    
    now = datetime.now(timezone.utc)
    
    # Determine migration strategy
    if GRANDFATHER_EXISTING_USERS:
        print_info("Strategy: Grandfather existing users (skip MFA requirement)")
        update_data = {
            "totp_enabled": False,
            "totp_setup_at": None,
            "totp_last_used": None,
            "registration_status": "completed",  # Allow existing users to skip MFA
            "registration_started_at": now,
            "registration_completed_at": now,
            "account_active": True,
            "can_login": True,
        }
    elif FORCE_MFA_FOR_EXISTING:
        print_warning("Strategy: Force MFA setup for all existing users")
        update_data = {
            "totp_enabled": False,
            "totp_setup_at": None,
            "totp_last_used": None,
            "registration_status": "pending_mfa",  # Force MFA setup
            "registration_started_at": now,
            "registration_completed_at": None,
            "account_active": True,  # Allow login temporarily
            "can_login": True,        # But show MFA setup prompt
        }
    else:
        print_info("Strategy: Default (grandfather existing users)")
        update_data = {
            "totp_enabled": False,
            "totp_setup_at": None,
            "totp_last_used": None,
            "registration_status": "completed",
            "registration_started_at": now,
            "registration_completed_at": now,
            "account_active": True,
            "can_login": True,
        }
    
    # Update users that don't have MFA fields
    try:
        result = await users_collection.update_many(
            {"totp_enabled": {"$exists": False}},
            {"$set": update_data}
        )
        
        print_success(f"Updated {result.modified_count} users with MFA fields")
        
    except Exception as e:
        print_error(f"Failed to update users: {e}")
        return False
    
    # =========================================================================
    # STEP 3: Create totp_secrets collection
    # =========================================================================
    
    print_header("Step 3: Creating TOTP Secrets Collection")
    
    # Check if collection exists
    collections = await db.list_collection_names()
    if "totp_secrets" in collections:
        print_warning("totp_secrets collection already exists")
        existing_secrets = await db["totp_secrets"].count_documents({})
        print_info(f"Found {existing_secrets} existing TOTP secrets")
    else:
        # Create collection (MongoDB creates it automatically on first insert)
        print_success("totp_secrets collection will be created on first use")
    
    # =========================================================================
    # STEP 4: Create indexes
    # =========================================================================
    
    print_header("Step 4: Creating Database Indexes")
    
    # Users collection indexes
    print_info("Creating indexes on users collection...")
    
    try:
        # Index on user_email (should already exist, but ensure it's unique)
        await users_collection.create_index("user_email", unique=True)
        print_success("Index created: users.user_email (unique)")
        
        # Index on totp_enabled
        await users_collection.create_index("totp_enabled")
        print_success("Index created: users.totp_enabled")
        
        # Index on registration_status
        await users_collection.create_index("registration_status")
        print_success("Index created: users.registration_status")
        
        # Index on account_active
        await users_collection.create_index("account_active")
        print_success("Index created: users.account_active")
        
    except Exception as e:
        print_warning(f"Some indexes may already exist: {e}")
    
    # TOTP secrets collection indexes
    print_info("Creating indexes on totp_secrets collection...")
    
    totp_secrets_collection = db["totp_secrets"]
    
    try:
        # Index on user_id (unique)
        await totp_secrets_collection.create_index("user_id", unique=True)
        print_success("Index created: totp_secrets.user_id (unique)")
        
        # Index on user_email
        await totp_secrets_collection.create_index("user_email")
        print_success("Index created: totp_secrets.user_email")
        
        # Index on is_verified
        await totp_secrets_collection.create_index("is_verified")
        print_success("Index created: totp_secrets.is_verified")
        
    except Exception as e:
        print_warning(f"Some indexes may already exist: {e}")
    
    # =========================================================================
    # STEP 5: Verify migration
    # =========================================================================
    
    print_header("Step 5: Verifying Migration")
    
    # Check updated users
    users_with_mfa_after = await users_collection.count_documents({"totp_enabled": {"$exists": True}})
    users_completed = await users_collection.count_documents({"registration_status": "completed"})
    users_pending = await users_collection.count_documents({"registration_status": "pending_mfa"})
    
    print_success(f"Users with MFA fields: {users_with_mfa_after}/{total_users}")
    print_info(f"Users with completed registration: {users_completed}")
    print_info(f"Users with pending MFA: {users_pending}")
    
    # Check indexes
    user_indexes = await users_collection.index_information()
    totp_indexes = await totp_secrets_collection.index_information()
    
    print_success(f"Users collection has {len(user_indexes)} indexes")
    print_success(f"TOTP secrets collection has {len(totp_indexes)} indexes")
    
    # =========================================================================
    # Summary
    # =========================================================================
    
    print_header("Migration Summary")
    
    print_success("Migration completed successfully!")
    print_info(f"Total users: {total_users}")
    print_info(f"Users updated: {result.modified_count}")
    print_info(f"Migration strategy: {'Grandfather existing users' if GRANDFATHER_EXISTING_USERS else 'Force MFA for all'}")
    
    if GRANDFATHER_EXISTING_USERS:
        print_info("✓ Existing users can login without MFA setup")
        print_info("✓ New users MUST complete MFA setup")
    else:
        print_warning("⚠ All users will be prompted to set up MFA")
    
    print_header("Next Steps")
    
    print_info("1. Add encryption key to environment:")
    print(f"   {Colors.OKCYAN}export TOTP_SECRET_ENCRYPTION_KEY=<your-generated-key>{Colors.ENDC}")
    print_info("2. Deploy the new code with MFA support")
    print_info("3. Test registration flow with MFA")
    print_info("4. Monitor user adoption of MFA")
    
    # Close connection
    client.close()
    
    return True


def main():
    """Main entry point."""
    print_info("Starting MFA migration...")
    print_info(f"GRANDFATHER_EXISTING_USERS = {GRANDFATHER_EXISTING_USERS}")
    print_info(f"FORCE_MFA_FOR_EXISTING = {FORCE_MFA_FOR_EXISTING}")
    
    # Confirm before running
    print_warning("\n⚠️  This will modify your database. Continue? (y/n)")
    response = input().strip().lower()
    
    if response != 'y':
        print_info("Migration cancelled by user")
        sys.exit(0)
    
    # Run migration
    try:
        success = asyncio.run(migrate_database())
        
        if success:
            print_success("\n✓ Migration completed successfully!")
            sys.exit(0)
        else:
            print_error("\n✗ Migration failed!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print_warning("\n\nMigration interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"\n✗ Migration failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

