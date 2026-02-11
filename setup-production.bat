@echo off
REM Production Setup Batch Script for School Clinic EMR
echo ========================================
echo School Clinic EMR - Production Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo After installation, restart this script
    pause
    exit /b 1
)

echo [1/5] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Generating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo [3/5] Running database migrations...
call npx prisma migrate deploy
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Database migration failed
    echo Please ensure:
    echo   1. PostgreSQL is running
    echo   2. Database 'school_emr_prod' exists
    echo   3. Connection string in .env is correct
    pause
)

echo.
echo [4/5] Seeding initial data...
call npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Seeding failed
    echo You may need to run this manually later
)

echo.
echo [5/5] Building application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Verify .env file has correct settings
echo   2. Update MALAFFI_API_KEY in .env if needed
echo   3. Run: npm start
echo   4. Open: http://localhost:8000
echo   5. Login: admin@emr.local / admin123
echo.
pause

