@echo off
REM Taaleem Clinic Management - Development Start Script
REM This script starts the development server

echo ========================================
echo Taaleem Clinic Management
echo Starting Development Server...
echo ========================================
echo.

REM Set Node.js path
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Change to project directory
cd /d "%~dp0.."

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please ensure environment variables are configured.
    echo.
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo node_modules not found. Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Generate Prisma client
echo Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Failed to generate Prisma client
    echo Continuing anyway...
    echo.
)

REM Start the development server
echo.
echo Starting development server...
echo The application will be available at http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

call npm run dev

pause

