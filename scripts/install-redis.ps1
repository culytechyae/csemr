# Redis Installation Script for Windows
# Optional but recommended for caching and session storage

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Redis Installation for Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Redis Installation Options:" -ForegroundColor Yellow
Write-Host "1. Install via Chocolatey (Recommended)" -ForegroundColor White
Write-Host "2. Install via WSL (Windows Subsystem for Linux)" -ForegroundColor White
Write-Host "3. Manual installation instructions" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option (1-3)"

switch ($choice) {
    "1" {
        Write-Host "Installing Redis via Chocolatey..." -ForegroundColor Yellow
        
        # Check if Chocolatey is installed
        $chocoInstalled = choco --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Chocolatey is not installed. Installing Chocolatey..." -ForegroundColor Cyan
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "ERROR: Failed to install Chocolatey." -ForegroundColor Red
                exit 1
            }
            Write-Host "✓ Chocolatey installed" -ForegroundColor Green
        }
        
        Write-Host "Installing Redis..." -ForegroundColor Cyan
        choco install redis-64 -y
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Redis installed successfully" -ForegroundColor Green
            Write-Host ""
            Write-Host "To start Redis:" -ForegroundColor Yellow
            Write-Host "  redis-server" -ForegroundColor White
            Write-Host ""
            Write-Host "To start Redis as a Windows service:" -ForegroundColor Yellow
            Write-Host "  redis-server --service-install" -ForegroundColor White
            Write-Host "  redis-server --service-start" -ForegroundColor White
        } else {
            Write-Host "ERROR: Failed to install Redis via Chocolatey." -ForegroundColor Red
        }
    }
    "2" {
        Write-Host "Installing Redis via WSL..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To install Redis in WSL, run the following commands in WSL:" -ForegroundColor Cyan
        Write-Host "  sudo apt-get update" -ForegroundColor White
        Write-Host "  sudo apt-get install redis-server" -ForegroundColor White
        Write-Host "  sudo service redis-server start" -ForegroundColor White
        Write-Host ""
        Write-Host "Note: You'll need to configure your application to connect to localhost:6379" -ForegroundColor Yellow
    }
    "3" {
        Write-Host "Manual Redis Installation Instructions:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option A: Download from GitHub" -ForegroundColor Cyan
        Write-Host "  1. Visit: https://github.com/microsoftarchive/redis/releases" -ForegroundColor White
        Write-Host "  2. Download the latest Windows release" -ForegroundColor White
        Write-Host "  3. Extract and run redis-server.exe" -ForegroundColor White
        Write-Host ""
        Write-Host "Option B: Use Memurai (Redis-compatible for Windows)" -ForegroundColor Cyan
        Write-Host "  1. Visit: https://www.memurai.com/" -ForegroundColor White
        Write-Host "  2. Download and install Memurai" -ForegroundColor White
        Write-Host "  3. It's compatible with Redis commands" -ForegroundColor White
        Write-Host ""
        Write-Host "Option C: Use Docker" -ForegroundColor Cyan
        Write-Host "  1. Install Docker Desktop for Windows" -ForegroundColor White
        Write-Host "  2. Run: docker run -d -p 6379:6379 redis:latest" -ForegroundColor White
        Write-Host ""
    }
    default {
        Write-Host "Invalid option selected." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "After installing Redis, update your .env file:" -ForegroundColor Yellow
Write-Host "  REDIS_HOST=localhost" -ForegroundColor White
Write-Host "  REDIS_PORT=6379" -ForegroundColor White
Write-Host "  REDIS_PASSWORD=  # Optional, if password is set" -ForegroundColor White
Write-Host ""

