@echo off
REM Taaleem Clinic Management - Production Start Script
REM This script starts the production server on port 5005

echo ========================================
echo Taaleem Clinic Management
echo Starting Production Server...
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

REM Check if .next build exists
if not exist ".next" (
    echo .next build not found. Building application...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to build application
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

REM Set production environment
set NODE_ENV=production

REM Start the production server
echo.
echo Starting server on port 5005...
echo Server will be accessible on all network interfaces (0.0.0.0)
echo Access URLs:
echo   - Local:    http://localhost:5005
echo   - Network:  http://[SERVER_IP]:5005
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

call npm start

pause

