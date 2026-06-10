@echo off
cd /d "%~dp0"
echo Starting SalonPing dev server on port 3001...
npm run dev -- --port 3001
pause
