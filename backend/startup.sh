#!/bin/bash
set -e

echo "=== Custom Startup Script ==="
echo "Current directory: $(pwd)"
echo "Python path: $PYTHONPATH"

# Install Tesseract OCR if not already installed
if ! command -v tesseract &> /dev/null
then
    echo "Tesseract not found. Installing..."
    # Check if we have sudo/root access
    if [ "$EUID" -eq 0 ] || sudo -n true 2>/dev/null; then
        apt-get update
        apt-get install -y tesseract-ocr tesseract-ocr-eng
        echo "Tesseract installed successfully"
    else
        echo "WARNING: No root access to install Tesseract. This may cause OCR features to fail."
        echo "Consider using a Docker container approach instead."
    fi
else
    echo "Tesseract is already installed: $(tesseract --version)"
fi

# Start the Gunicorn server
echo "Starting Gunicorn server..."
cd "${APP_PATH:-/tmp/8de59b7ab45beaa}"
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
