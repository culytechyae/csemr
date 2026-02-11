@echo off
REM Taaleem Clinic Management - Production Start Script
REM This script starts the production server using PM2

echo ========================================
echo Taaleem Clinic Management
echo Starting Production Server with PM2...
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
    echo PM2 not found. Installing PM2 globally...
    call npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install PM2
        pause
        exit /b 1
    )
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

REM Run database migrations
echo Running database migrations...
call npx prisma migrate deploy
set MIGRATION_STATUS=%ERRORLEVEL%
if %MIGRATION_STATUS% NEQ 0 (
    echo.
    echo WARNING: Database migration check returned error code %MIGRATION_STATUS%
    echo This might mean:
    echo   - No pending migrations (this is OK)
    echo   - Database connection issue
    echo   - Migration failed
    echo.
    echo Checking database connection...
    call npx prisma db execute --stdin <nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Cannot connect to database!
        echo Please check:
        echo   1. PostgreSQL is running
        echo   2. DATABASE_URL in .env is correct
        echo   3. Database exists
        echo.
        echo Continuing anyway, but server may not start properly...
        echo.
    ) else (
        echo Database connection OK. Continuing...
        echo.
    )
) else (
    echo Database migrations check completed.
    echo.
)

REM Check if PM2 process is already running
pm2 describe taaleem-emr >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo WARNING: Application is already running with PM2!
    echo Use restart.bat to restart the application.
    echo Or use stop.bat to stop it first.
    echo.
    pm2 list
    echo.
    pause
    exit /b 0
)

REM Check for port conflicts
echo Checking for port conflicts...
netstat -ano | findstr :8000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo WARNING: Port 8000 is already in use!
    echo.
    echo This might be an existing server instance.
    echo Please stop the process using port 8000 first:
    echo   1. Run stop.bat to stop all processes
    echo   2. Or manually stop the process using:
    echo      netstat -ano ^| findstr :8000
    echo      taskkill /PID [PID] /F
    echo.
    echo Attempting to stop existing processes...
    call stop.bat
    echo.
    echo Waiting 3 seconds for ports to be released...
    timeout /t 3 /nobreak >nul
    echo.
    REM Check again
    netstat -ano | findstr :8000 | findstr LISTENING >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ERROR: Port 8000 is still in use after cleanup!
        echo Please manually stop the process and try again.
        echo.
        pause
        exit /b 1
    ) else (
        echo Port 8000 is now available. Continuing...
        echo.
    )
)

REM Start the production server with PM2
echo.
echo Starting production server with PM2...
echo Server will be accessible on all network interfaces (0.0.0.0)
echo Access URLs:
echo   - Local:    http://localhost:8000
echo   - Network:  http://[SERVER_IP]:8000
echo.
echo PM2 will manage the application in cluster mode
echo Use 'pm2 list' to check status
echo Use 'pm2 logs taaleem-emr' to view logs
echo Use restart.bat to restart the application
echo.
echo ========================================
echo.

call pm2 start ecosystem.config.js
set PM2_START_STATUS=%ERRORLEVEL%
if %PM2_START_STATUS% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Failed to start application with PM2
    echo ========================================
    echo.
    echo Error code: %PM2_START_STATUS%
    echo.
    echo Please check:
    echo   1. PM2 is installed: pm2 --version
    echo   2. Application is built: Check if .next folder exists
    echo   3. Port 8000 is available: netstat -ano ^| findstr :8000
    echo   4. Database is accessible: Check DATABASE_URL in .env
    echo   5. View PM2 logs: pm2 logs taaleem-emr
    echo.
    echo Checking PM2 status...
    call pm2 list
    echo.
    pause
    exit /b 1
)

REM Save PM2 configuration
call pm2 save

echo.
echo ========================================
echo Application started successfully!
echo ========================================
echo.
echo PM2 Status:
call pm2 list
echo.
echo To view logs: pm2 logs taaleem-emr
echo To stop: pm2 stop taaleem-emr
echo To restart: run restart.bat
echo.

pause

