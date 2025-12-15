#!/bin/bash

echo "🚀 Starting LinkedIn AutoMarketer AI - Full Stack"

# Start the backend in the background
cd backend
echo "Starting backend..."
python main.py &

# Store the backend process ID
BACKEND_PID=$!

# Navigate back to the root directory
cd ..

# Start the frontend
echo "Starting frontend..."
cd frontend
npm run dev

# When the frontend is stopped, kill the backend process
kill $BACKEND_PID

echo ""
echo "✅ Both frontend and backend have been stopped"