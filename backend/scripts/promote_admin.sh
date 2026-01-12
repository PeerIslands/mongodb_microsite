#!/bin/bash

# Script to promote an internal user to admin
# Usage: ./promote_admin.sh

echo "======================================"
echo "   Promote Internal User to Admin"
echo "======================================"
echo ""

# Check if email is provided as argument
if [ -n "$1" ]; then
    USER_EMAIL="$1"
else
    # Prompt for email
    read -p "Enter user email: " USER_EMAIL
fi

# Validate email is not empty
if [ -z "$USER_EMAIL" ]; then
    echo "Error: Email cannot be empty"
    exit 1
fi

echo ""
echo "Processing: $USER_EMAIL"
echo "--------------------------------------"

# Run the Python script
python3 "$(dirname "$0")/promote_admin.py" "$USER_EMAIL"

# Check exit status
if [ $? -eq 0 ]; then
    echo "--------------------------------------"
    echo "✓ Operation completed successfully"
else
    echo "--------------------------------------"
    echo "✗ Operation failed"
    exit 1
fi

