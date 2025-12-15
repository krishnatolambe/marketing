#!/bin/bash

# Production startup script for LinkedIn AutoMarketer backend

echo "🚀 Starting LinkedIn AutoMarketer in Production Mode..."

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    echo "📚 Installing dependencies..."
    pip install -r requirements.txt
else
    # Activate virtual environment
    source venv/bin/activate
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads/videos
mkdir -p uploads/audio
mkdir -p uploads/logos
mkdir -p uploads/posts
mkdir -p logs

# Validate critical environment variables
echo "🔒 Validating environment configuration..."

# Check if JWT secret is set
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your_very_secure_random_jwt_secret_key_here_min_32_chars" ]; then
    echo "❌ ERROR: JWT_SECRET is not set or using default value!"
    echo "Please set a secure JWT_SECRET in your environment variables."
    exit 1
fi

# Check if encryption key is set
if [ -z "$ENCRYPTION_KEY" ] || [ "$ENCRYPTION_KEY" = "your_very_secure_random_encryption_key_at_least_32_characters" ]; then
    echo "❌ ERROR: ENCRYPTION_KEY is not set or using default value!"
    echo "Please set a secure ENCRYPTION_KEY in your environment variables."
    exit 1
fi

# Check if MongoDB URI is set
if [ -z "$MONGODB_URI" ] || [ "$MONGODB_URI" = "mongodb://localhost:27017/linkedin-auto-marketer" ]; then
    echo "⚠️  WARNING: Using default MongoDB URI. Make sure MongoDB is running locally."
fi

echo "✅ Environment validation passed."

# Start the server with production settings
echo "🌟 Starting FastAPI server..."
echo "📊 API Documentation will be available at http://localhost:3001/docs"
echo "🔧 Alternative docs at http://localhost:3001/redoc"

# Run with multiple workers for production
exec uvicorn main:app \
    --host 0.0.0.0 \
    --port ${PORT:-3001} \
    --workers ${WORKERS:-4} \
    --log-level ${LOG_LEVEL:-info} \
    --no-server-header \
    --timeout-keep-alive 120