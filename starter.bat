@echo off
title Word ↔ PDF Converter
echo Starting Word ↔ PDF Converter...
cd /d "%~dp0"

:: Ensure dependencies are installed
if not exist "node_modules" (
  echo Installing required packages...
  call npm install >nul 2>&1
)

:: Start the app with Electron
echo Launching application window...
npx electron .
pause
