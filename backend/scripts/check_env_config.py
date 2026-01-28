#!/usr/bin/env python3
"""
Script to check backend .env file configuration for email sending.
"""
import sys
from pathlib import Path

# Add the parent directory to the path so we can import from app
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import settings


def check_env_config():
    """Check and display environment configuration"""
    
    print("\n" + "="*70)
    print("Backend Environment Configuration Check")
    print("="*70)
    
    env_file = Path(__file__).parent.parent / ".env"
    
    print(f"\n📁 Looking for .env file at:")
    print(f"   {env_file}")
    
    if env_file.exists():
        print(f"✅ .env file found")
    else:
        print(f"❌ .env file NOT found")
        print(f"\n💡 To create .env file:")
        print(f"   cd backend")
        print(f"   touch .env")
        print(f"   # Then edit .env with your configuration")
    
    print("\n" + "-"*70)
    print("Email Configuration (Azure Communication Services)")
    print("-"*70)
    
    # Check AZURE_COMMUNICATION_CONNECTION_STRING
    if settings.AZURE_COMMUNICATION_CONNECTION_STRING:
        # Mask most of the connection string for security
        conn_str = settings.AZURE_COMMUNICATION_CONNECTION_STRING
        if len(conn_str) > 50:
            masked = conn_str[:20] + "..." + conn_str[-10:]
        else:
            masked = conn_str[:10] + "..." if len(conn_str) > 10 else "***"
        print(f"✅ AZURE_COMMUNICATION_CONNECTION_STRING: {masked}")
    else:
        print(f"❌ AZURE_COMMUNICATION_CONNECTION_STRING: NOT SET")
        print(f"   Required format: endpoint=https://...;accesskey=...")
    
    # Check AZURE_COMMUNICATION_SENDER_ADDRESS
    if settings.AZURE_COMMUNICATION_SENDER_ADDRESS:
        print(f"✅ AZURE_COMMUNICATION_SENDER_ADDRESS: {settings.AZURE_COMMUNICATION_SENDER_ADDRESS}")
    else:
        print(f"❌ AZURE_COMMUNICATION_SENDER_ADDRESS: NOT SET")
        print(f"   Required format: noreply@yourdomain.com")
    
    # Check contact form email settings
    print("\n" + "-"*70)
    print("Contact Form Email Settings")
    print("-"*70)
    
    if settings.CONTACTUS_RECEIVER_EMAIL:
        print(f"✅ CONTACTUS_RECEIVER_EMAIL: {settings.CONTACTUS_RECEIVER_EMAIL}")
    else:
        print(f"⚠️  CONTACTUS_RECEIVER_EMAIL: NOT SET (optional)")
    
    if settings.CONTACTUS_RECEIVER_CC_EMAIL:
        print(f"✅ CONTACTUS_RECEIVER_CC_EMAIL: {settings.CONTACTUS_RECEIVER_CC_EMAIL}")
    else:
        print(f"⚠️  CONTACTUS_RECEIVER_CC_EMAIL: NOT SET (optional)")
    
    # Check SMTP settings (if configured)
    print("\n" + "-"*70)
    print("SMTP Email Settings (Alternative to Azure)")
    print("-"*70)
    
    if settings.SMTP_HOST:
        print(f"✅ SMTP_HOST: {settings.SMTP_HOST}")
        print(f"✅ SMTP_PORT: {settings.SMTP_PORT}")
        print(f"✅ SMTP_TLS: {settings.SMTP_TLS}")
        if settings.SMTP_USER:
            print(f"✅ SMTP_USER: {settings.SMTP_USER}")
        else:
            print(f"⚠️  SMTP_USER: NOT SET")
        if settings.SMTP_PASSWORD:
            print(f"✅ SMTP_PASSWORD: {'*' * 10} (masked)")
        else:
            print(f"⚠️  SMTP_PASSWORD: NOT SET")
        if settings.SMTP_FROM_EMAIL:
            print(f"✅ SMTP_FROM_EMAIL: {settings.SMTP_FROM_EMAIL}")
    else:
        print(f"ℹ️  SMTP not configured (using Azure Communication Services)")
    
    # Check MongoDB settings
    print("\n" + "-"*70)
    print("MongoDB Settings")
    print("-"*70)
    
    if settings.MONGODB_URI:
        # Mask credentials in URI
        uri = settings.MONGODB_URI
        if "@" in uri and "://" in uri:
            parts = uri.split("://")
            if len(parts) > 1 and "@" in parts[1]:
                creds_and_rest = parts[1].split("@")
                masked_uri = parts[0] + "://***:***@" + creds_and_rest[1]
            else:
                masked_uri = uri[:20] + "..." if len(uri) > 20 else uri
        else:
            masked_uri = uri[:20] + "..." if len(uri) > 20 else uri
        print(f"✅ MONGODB_URI: {masked_uri}")
    else:
        print(f"❌ MONGODB_URI: NOT SET")
    
    if settings.MONGODB_DB_NAME:
        print(f"✅ MONGODB_DB_NAME: {settings.MONGODB_DB_NAME}")
    else:
        print(f"❌ MONGODB_DB_NAME: NOT SET")
    
    # Check other important settings
    print("\n" + "-"*70)
    print("Other Settings")
    print("-"*70)
    
    if settings.SECRET_KEY and settings.SECRET_KEY != "change-me-in-production":
        print(f"✅ SECRET_KEY: Set (masked)")
    else:
        print(f"⚠️  SECRET_KEY: Using default or not set (change in production!)")
    
    if settings.JWT_SECRET_KEY and settings.JWT_SECRET_KEY != "jwt-secret-change-in-production":
        print(f"✅ JWT_SECRET_KEY: Set (masked)")
    else:
        print(f"⚠️  JWT_SECRET_KEY: Using default or not set (change in production!)")
    
    # Summary
    print("\n" + "="*70)
    print("Summary")
    print("="*70)
    
    can_send_email = bool(
        settings.AZURE_COMMUNICATION_CONNECTION_STRING and 
        settings.AZURE_COMMUNICATION_SENDER_ADDRESS
    ) or bool(
        settings.SMTP_HOST and 
        settings.SMTP_USER and 
        settings.SMTP_PASSWORD
    )
    
    if can_send_email:
        print("✅ Email sending is properly configured!")
        print("\n💡 You can now send test emails using:")
        print("   python scripts/send_test_newsletter.py your.email@example.com")
    else:
        print("❌ Email sending is NOT properly configured")
        print("\n💡 To configure email sending, add to your .env file:")
        print("\n   # Azure Communication Services (Recommended)")
        print("   AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://...;accesskey=...")
        print("   AZURE_COMMUNICATION_SENDER_ADDRESS=noreply@yourdomain.com")
        print("\n   OR")
        print("\n   # SMTP (Alternative)")
        print("   SMTP_HOST=smtp.gmail.com")
        print("   SMTP_PORT=587")
        print("   SMTP_TLS=True")
        print("   SMTP_USER=your.email@gmail.com")
        print("   SMTP_PASSWORD=your-app-password")
        print("   SMTP_FROM_EMAIL=your.email@gmail.com")
    
    print("\n" + "="*70 + "\n")
    
    return can_send_email


def main():
    """Main entry point"""
    try:
        can_send = check_env_config()
        sys.exit(0 if can_send else 1)
    except Exception as e:
        print(f"\n❌ Error checking configuration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
