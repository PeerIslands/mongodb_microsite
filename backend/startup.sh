#!/bin/bash

# Install Tesseract OCR if not already installed
if ! command -v tesseract &> /dev/null
then
    echo "Tesseract not found. Installing..."
    apt-get update
    apt-get install -y tesseract-ocr tesseract-ocr-eng
    echo "Tesseract installed successfully"
else
    echo "Tesseract is already installed"
fi

# Start the Gunicorn server
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
