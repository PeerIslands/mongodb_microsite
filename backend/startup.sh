#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting application..."

# Detect if we're running on Linux (Azure) or macOS (local dev)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IS_LINUX=true
    echo "📍 Running on Linux (Azure)"
else
    IS_LINUX=false
    echo "📍 Running on macOS (Local)"
fi

# Install Tesseract OCR if not already installed (Linux only)
if [ "$IS_LINUX" = true ]; then
    if ! command -v tesseract &> /dev/null
    then
        echo "⚠️  Tesseract not found. Installing in background..."
        (
            timeout 180 apt-get update -qq && \
            timeout 180 apt-get install -y -qq tesseract-ocr tesseract-ocr-eng && \
            echo "✅ Tesseract installed successfully"
        ) &
        TESSERACT_PID=$!
    else
        echo "✅ Tesseract is already installed"
    fi
else
    echo "⏭️  Skipping Tesseract installation (macOS - install manually if needed)"
fi

# Check if gunicorn is available
if ! command -v gunicorn &> /dev/null; then
    echo "❌ Error: gunicorn not found!"
    echo "💡 Install dependencies: pip install -r requirements.txt"
    exit 1
fi

# Start the Gunicorn server
echo "🌐 Starting Gunicorn server..."
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --graceful-timeout 30 \
    --keep-alive 5 \
    --log-level info \
    --access-logfile - \
    --error-logfile -
