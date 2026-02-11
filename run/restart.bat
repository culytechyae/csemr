@echo off
REM Taaleem Clinic Management - Production Restart Script
REM This script restarts the production server using PM2

echo ========================================
echo Taaleem Clinic Management
echo Restarting Production Server...
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

REM Check if PM2 is installed
where pm2 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PM2 is not installed
    echo Please install PM2: npm install -g pm2
    pause
    exit /b 1
)

REM Check if application is running
pm2 describe taaleem-emr >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Application is not running with PM2.
    echo Starting application instead...
    echo.
    call start.bat
    exit /b %ERRORLEVEL%
)

REM Check for port conflicts (other than PM2)
echo Checking for port conflicts...
netstat -ano | findstr :8000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Port 8000 is in use. This may be the PM2 process.
    echo Continuing with restart...
    echo.
)

REM Generate Prisma client (in case schema changed)
echo Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Failed to generate Prisma client
    echo Continuing anyway...
    echo.
)

REM Run database migrations (in case schema changed)
echo Running database migrations...
call npx prisma migrate deploy
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Database migration failed
    echo Continuing anyway...
    echo.
)

REM Check if build is needed
if not exist ".next" (
    echo .next build not found. Building application...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to build application
        pause
        exit /b 1
    )
)

REM Restart the application with PM2
echo.
echo Restarting production server with PM2...
echo This will gracefully restart all instances...
echo.

call pm2 restart taaleem-emr
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to restart application
    pause
    exit /b 1
)

REM Save PM2 configuration
call pm2 save

echo.
echo ========================================
echo Application restarted successfully!
echo ========================================
echo.
echo PM2 Status:
call pm2 list
echo.
echo Server is accessible at:
echo   - Local:    http://localhost:8000
echo   - Network:  http://[SERVER_IP]:8000
echo.
echo To view logs: pm2 logs taaleem-emr
echo To stop: pm2 stop taaleem-emr
echo.

pause

