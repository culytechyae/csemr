@echo off
REM Taaleem Clinic Management - Install Dependencies Script
REM This script installs all required dependencies

echo ========================================
echo Taaleem Clinic Management
echo Installing Dependencies...
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

REM Display Node.js and npm versions
echo Node.js version:
call node --version
echo.
echo npm version:
call npm --version
echo.

REM Install dependencies
echo Installing npm packages...
echo This may take several minutes...
echo.

call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

REM Generate Prisma client
echo.
echo Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Failed to generate Prisma client
    echo You may need to run this manually: npx prisma generate
    echo.
)

echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Configure your .env file with database and API settings
echo 2. Run database migrations: npx prisma migrate deploy
echo 3. Build the application: run build.bat
echo 4. Start the server: run start.bat
echo.

pause

