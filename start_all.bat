@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ==========================================
echo   WAHAT TOURS - DEV ENVIRONMENT LAUNCHER
echo ==========================================

echo.
echo 1. Starting Backend Server (Port 3001)...
start "Backend Server" cmd /k "cd server && npm run dev"

echo.
echo 2. Starting Mobile App...
cd mobile
call start.bat
