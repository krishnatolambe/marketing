@echo off
echo 🚀 Starting LinkedIn AutoMarketer AI - Full Stack

REM Start the frontend in a new terminal
start "Frontend" cmd /k "cd frontend && npm run dev"

REM Wait a moment for the frontend to start
timeout /t 2 /nobreak >nul

REM Start the backend in a new terminal
cd backend
start "Backend" cmd /k "python main.py"

echo.
echo ✅ Both frontend and backend have been started in separate terminals
echo 🌐 Frontend: http://localhost:8080
echo 🌐 Backend API: http://localhost:3001
echo.
echo Press any key to close this window...
pause >nul