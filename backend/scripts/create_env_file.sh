#!/bin/bash

# Script to create .env file in backend directory

ENV_FILE="../.env"

echo "🔧 Creating .env file for Newsletter Script"
echo "============================================"
echo ""

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env file already exists at: backend/.env"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled. Existing .env file preserved."
        exit 0
    fi
fi

# Create .env file
cat > "$ENV_FILE" << 'EOF'
# =====================================================
# MONGODB DATABASE SETTINGS (Required for full app)
# =====================================================
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=mongodb_microsite

# =====================================================
# AZURE COMMUNICATION SERVICES (Required for sending emails)
# =====================================================
# Get this from Azure Portal > Communication Services > Keys
AZURE_COMMUNICATION_CONNECTION_STRING="Endpoint=https://your-acs-resource.communication.azure.com/;AccessKey=your_access_key_here"

# The email address that will appear as the sender
AZURE_COMMUNICATION_SENDER_ADDRESS="DoNotReply@your-verified-domain.com"

# =====================================================
# AZURE BLOB STORAGE (Required for hosting newsletter images)
# =====================================================
# Get this from Azure Portal > Storage Account > Shared access signature
# IMPORTANT: Include the container name and full SAS token (?sv=...&sig=...)
AZURE_BLOB_SAS_URL="https://your-storage-account.blob.core.windows.net/newsletter-assets?sv=2021-08-06&ss=b&srt=sco&sp=rwdlacx&se=2026-12-31T23:59:59Z&st=2026-01-01T00:00:00Z&spr=https&sig=your_signature_here"

# =====================================================
# CONTACT FORM EMAIL SETTINGS
# =====================================================
CONTACTUS_RECEIVER_EMAIL="your.email@example.com"
CONTACTUS_RECEIVER_CC_EMAIL=""

# =====================================================
# SECURITY SETTINGS
# =====================================================
SECRET_KEY="change-me-in-production-random-string-here"
JWT_SECRET_KEY="jwt-secret-change-in-production-random-string"
JWT_ALGORITHM="HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# =====================================================
# TOTP/MFA SETTINGS
# =====================================================
TOTP_SECRET_ENCRYPTION_KEY="32-byte-base64-encoded-encryption-key-here"
TOTP_ENABLED=true
TOTP_ISSUER_NAME="MongoDB Microsite"

# =====================================================
# SENDGRID EMAIL SETTINGS (Optional - for future use)
# =====================================================
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL="noreply@peerislands.io"
SENDGRID_FROM_NAME="PeerIslands"

# =====================================================
# CORS SETTINGS
# =====================================================
BACKEND_CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
EOF

echo "✅ Created .env file at: backend/.env"
echo ""
echo "📝 Next Steps:"
echo "   1. Open backend/.env in your editor"
echo "   2. Fill in your Azure credentials:"
echo "      - AZURE_COMMUNICATION_CONNECTION_STRING"
echo "      - AZURE_COMMUNICATION_SENDER_ADDRESS"
echo "      - AZURE_BLOB_SAS_URL"
echo "   3. Save the file"
echo "   4. Run: python scripts/send_newsletter_with_sas.py your.email@example.com"
echo ""
echo "📚 See backend/CREATE_ENV_FILE.md for detailed instructions"
