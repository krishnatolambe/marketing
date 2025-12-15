@echo off
echo 🚀 Starting LinkedIn AutoMarketer FastAPI Backend...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3 is required but not installed.
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing dependencies...
pip install -r requirements.txt

REM Create uploads directories
echo 📁 Creating upload directories...
if not exist "uploads" mkdir uploads
if not exist "uploads\videos" mkdir uploads\videos
if not exist "uploads\audio" mkdir uploads\audio
if not exist "uploads\logos" mkdir uploads\logos
if not exist "uploads\posts" mkdir uploads\posts

REM Start the server
echo 🌟 Starting FastAPI server on http://localhost:3001
echo 📊 API Documentation will be available at http://localhost:3001/docs
echo 🔧 Alternative docs at http://localhost:3001/redoc
echo.
echo Press Ctrl+C to stop the server
echo.

uvicorn main:app --host 0.0.0.0 --port 3001 --reload

pause