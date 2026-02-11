@echo off
REM Taaleem Clinic Management - Stop Script
REM This script stops the production server and cleans up processes

echo ========================================
echo Taaleem Clinic Management
echo Stopping Production Server...
echo ========================================
echo.

REM Set Node.js path
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Change to project directory
cd /d "%~dp0.."

REM Check if PM2 is installed
where pm2 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo PM2 is not installed. Skipping PM2 cleanup...
    goto :check_ports
)

REM Stop PM2 process if running
pm2 describe taaleem-emr >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Stopping PM2 process...
    call pm2 stop taaleem-emr
    call pm2 delete taaleem-emr
    echo PM2 process stopped.
) else (
    echo No PM2 process found.
)

:check_ports
echo.
echo Checking for processes on ports 5005 and 8000...

REM Check port 8000 (primary production port)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Found process on port 8000 (PID: %%a)
    echo Stopping process...
    taskkill /PID %%a /F >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Process stopped successfully.
    ) else (
        echo WARNING: Could not stop process. You may need administrator privileges.
    )
)

REM Check port 5005 (alternative port)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5005 ^| findstr LISTENING') do (
    echo Found process on port 5005 (PID: %%a)
    echo Stopping process...
    taskkill /PID %%a /F >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Process stopped successfully.
    ) else (
        echo WARNING: Could not stop process. You may need administrator privileges.
    )
)

REM Check port 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Found process on port 8000 (PID: %%a)
    echo Stopping process...
    taskkill /PID %%a /F >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Process stopped successfully.
    ) else (
        echo WARNING: Could not stop process. You may need administrator privileges.
    )
)

echo.
echo ========================================
echo Cleanup complete!
echo ========================================
echo.
echo You can now run start.bat to start the server.
echo.

pause

