@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo Starting Expo (Clearing Cache)...
call npx expo start -c
pause
