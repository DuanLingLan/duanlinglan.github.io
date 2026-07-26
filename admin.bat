@echo off
cd /d "%~dp0"

echo Starting local admin server...
node scripts\admin-server.js --open

pause
