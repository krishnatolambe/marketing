#!/bin/bash

echo "🚀 Starting LinkedIn AutoMarketer FastAPI Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create uploads directories
echo "📁 Creating upload directories..."
mkdir -p uploads/videos
mkdir -p uploads/audio
mkdir -p uploads/logos
mkdir -p uploads/posts

# Start the server
echo "🌟 Starting FastAPI server on http://localhost:3001"
echo "📊 API Documentation will be available at http://localhost:3001/docs"
echo "🔧 Alternative docs at http://localhost:3001/redoc"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn main:app --host 0.0.0.0 --port 3001 --reload