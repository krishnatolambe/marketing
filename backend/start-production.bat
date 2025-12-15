@echo off
echo 🚀 Starting LinkedIn AutoMarketer in Production Mode...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3 is required but not installed.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    
    REM Activate virtual environment
    call venv\Scripts\activate.bat
    
    REM Install dependencies
    echo 📚 Installing dependencies...
    pip install -r requirements.txt
) else (
    REM Activate virtual environment
    call venv\Scripts\activate.bat
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "uploads" mkdir uploads
if not exist "uploads\videos" mkdir uploads\videos
if not exist "uploads\audio" mkdir uploads\audio
if not exist "uploads\logos" mkdir uploads\logos
if not exist "uploads\posts" mkdir uploads\posts
if not exist "logs" mkdir logs

REM Validate critical environment variables
echo 🔒 Validating environment configuration...

REM Check if JWT secret is set
setlocal enabledelayedexpansion
if "%JWT_SECRET%"=="" (
    echo ❌ ERROR: JWT_SECRET is not set!
    echo Please set a secure JWT_SECRET in your environment variables.
    pause
    exit /b 1
)
if "!JWT_SECRET!"=="your_very_secure_random_jwt_secret_key_here_min_32_chars" (
    echo ❌ ERROR: JWT_SECRET is using default value!
    echo Please set a secure JWT_SECRET in your environment variables.
    pause
    exit /b 1
)

REM Check if encryption key is set
if "%ENCRYPTION_KEY%"=="" (
    echo ❌ ERROR: ENCRYPTION_KEY is not set!
    echo Please set a secure ENCRYPTION_KEY in your environment variables.
    pause
    exit /b 1
)
if "!ENCRYPTION_KEY!"=="your_very_secure_random_encryption_key_at_least_32_characters" (
    echo ❌ ERROR: ENCRYPTION_KEY is using default value!
    echo Please set a secure ENCRYPTION_KEY in your environment variables.
    pause
    exit /b 1
)

REM Check if MongoDB URI is set
if "%MONGODB_URI%"=="" (
    echo ⚠️  WARNING: MONGODB_URI is not set. Using default value.
    echo Make sure MongoDB is running locally.
)

echo ✅ Environment validation passed.

REM Start the server with production settings
echo 🌟 Starting FastAPI server...
echo 📊 API Documentation will be available at http://localhost:3001/docs
echo 🔧 Alternative docs at http://localhost:3001/redoc

REM Run with multiple workers for production (using gunicorn equivalent for Windows)
uvicorn main:app --host 0.0.0.0 --port %PORT% --log-level %LOG_LEVEL%

pause