#!/usr/bin/env python3
"""
Script to promote an internal user to admin status.

Usage:
    python3 promote_admin.py <email>
    
Example:
    python3 promote_admin.py admin@peerislands.io
"""

import sys
import os
import asyncio
from pathlib import Path

# Add parent directory to path FIRST
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Load .env file BEFORE importing any app modules
from dotenv import load_dotenv

env_path = backend_dir / "app" / ".env"
if not env_path.exists():
    env_path = backend_dir / ".env"

if env_path.exists():
    load_dotenv(env_path, override=True)
else:
    print(f"Error: .env file not found")
    print(f"Looked in: {backend_dir / 'app' / '.env'} and {backend_dir / '.env'}")
    sys.exit(1)

# NOW import app modules (after environment is configured)
from motor.motor_asyncio import AsyncIOMotorClient
from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.services.user_service import UserService
from app.core.config import settings


async def promote_user_to_admin(email: str) -> bool:
    """
    Promote an internal user to admin status.
    
    Args:
        email: User's email address
        
    Returns:
        True if successful, False otherwise
    """
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Initialize repository with MongoDB
        repository = UserRepository(db)
        
        # Initialize service for internal domain check
        service = UserService(repository)
        
        # Normalize email
        email = email.strip().lower()
        
        # Step 1: Check if user is internal
        if not service.is_internal_user(email):
            print(f"Error: User with email '{email}' is not an internal user")
            print(f"Only users with email ending in '{service.INTERNAL_DOMAIN}' can be promoted to admin")
            return False
        
        # Step 2: Check if user exists
        user = await repository.get_user_by_email(email)
        if not user:
            print(f"Error: User with email '{email}' not found in database")
            return False
        
        # Step 3: Check if already admin
        if user.get('is_admin', False):
            print(f"Info: User '{email}' is already an admin")
            return True
        
        # Step 4: Update user to admin
        user_id = user['_id']
        success = await repository.update_user(user_id, {'is_admin': True})
        
        if success:
            print(f"Changed {email} as Admin")
            return True
        else:
            print(f"Error: Failed to update user '{email}'")
            return False
            
    finally:
        # Close MongoDB connection
        client.close()


async def main():
    """Main entry point for the script."""
    
    # Check command line arguments
    if len(sys.argv) < 2:
        print("Error: Email address required")
        print("Usage: python3 promote_admin.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    
    # Validate email format (basic check)
    if '@' not in email or '.' not in email:
        print(f"Error: Invalid email format: {email}")
        sys.exit(1)
    
    # Promote user to admin
    success = await promote_user_to_admin(email)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

