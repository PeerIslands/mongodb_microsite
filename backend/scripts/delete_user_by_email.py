"""
Delete User by Email - Helper script for testing

This script deletes a user and all related data by email address.
Useful for testing during development.

Usage:
    python scripts/delete_user_by_email.py email@example.com
    
Or interactive:
    python scripts/delete_user_by_email.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


class Colors:
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


async def delete_user_by_email(email: str):
    """Delete user and all related data by email."""
    
    print(f"\n{Colors.WARNING}{Colors.BOLD}⚠️  WARNING{Colors.ENDC}")
    print(f"{Colors.WARNING}This will permanently delete the user: {email}{Colors.ENDC}")
    print(f"{Colors.WARNING}Are you sure? (yes/no): {Colors.ENDC}", end='')
    
    confirmation = input().strip().lower()
    if confirmation != 'yes':
        print(f"{Colors.WARNING}Deletion cancelled.{Colors.ENDC}")
        return
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        # Find user
        user = await db.users.find_one({'user_email': email})
        
        if not user:
            print(f"{Colors.FAIL}❌ User not found: {email}{Colors.ENDC}")
            return
        
        user_id = user['_id']
        print(f"\n{Colors.OKGREEN}✓ Found user:{Colors.ENDC}")
        print(f"  Email: {user['user_email']}")
        print(f"  User ID: {user_id}")
        print(f"  Name: {user.get('first_name', '')} {user.get('last_name', '')}")
        print(f"  TOTP Enabled: {user.get('totp_enabled', False)}")
        
        print(f"\n{Colors.WARNING}Deleting user data...{Colors.ENDC}")
        
        # Delete from users collection
        result1 = await db.users.delete_one({'_id': user_id})
        print(f"{Colors.OKGREEN}  ✓ Deleted from users: {result1.deleted_count} document{Colors.ENDC}")
        
        # Delete from login_creds collection
        result2 = await db.login_creds.delete_one({'_id': user_id})
        print(f"{Colors.OKGREEN}  ✓ Deleted from login_creds: {result2.deleted_count} document{Colors.ENDC}")
        
        # Delete from totp_secrets collection
        result3 = await db.totp_secrets.delete_one({'user_id': user_id})
        print(f"{Colors.OKGREEN}  ✓ Deleted from totp_secrets: {result3.deleted_count} document{Colors.ENDC}")
        
        print(f"\n{Colors.OKGREEN}{Colors.BOLD}✅ User deleted successfully!{Colors.ENDC}")
        print(f"{Colors.OKGREEN}You can now register with this email again.{Colors.ENDC}\n")
        
    except Exception as e:
        print(f"{Colors.FAIL}❌ Error: {e}{Colors.ENDC}")
    finally:
        client.close()


def main():
    """Main entry point."""
    # Get email from command line or prompt
    if len(sys.argv) > 1:
        email = sys.argv[1]
    else:
        print(f"\n{Colors.BOLD}Delete User by Email{Colors.ENDC}")
        print("=" * 50)
        email = input(f"{Colors.WARNING}Enter email address: {Colors.ENDC}").strip()
    
    if not email:
        print(f"{Colors.FAIL}Email address is required.{Colors.ENDC}")
        sys.exit(1)
    
    # Run deletion
    asyncio.run(delete_user_by_email(email))


if __name__ == "__main__":
    main()

