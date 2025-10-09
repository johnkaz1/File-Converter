@echo off
title Word ↔ PDF Converter
echo ---------------------------------------------------
echo   Word ↔ PDF Converter (Node.js + CloudConvert)
echo ---------------------------------------------------

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed.
    echo Please install it from https://nodejs.org/en/download/
    pause
    exit /b
)

:: Install dependencies (only first run)
if not exist node_modules (
    echo 📦 Installing required dependencies...
    npm install
)

:: Start the server
echo 🚀 Starting the converter...
npm start

pause
