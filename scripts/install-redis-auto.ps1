# Automated Redis Installation Script for Windows
# Installs Chocolatey (if needed) and Redis automatically

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Automated Redis Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Check if Redis is already installed
Write-Host "[1/4] Checking if Redis is already installed..." -ForegroundColor Yellow
$redisInstalled = redis-server --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Redis is already installed" -ForegroundColor Green
    $redisVersion = redis-server --version
    Write-Host "  Version: $redisVersion" -ForegroundColor Gray
    exit 0
}

# Check if Chocolatey is installed
Write-Host "[2/4] Checking Chocolatey installation..." -ForegroundColor Yellow
$chocoInstalled = choco --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Chocolatey is not installed. Installing Chocolatey..." -ForegroundColor Cyan
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    try {
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "✓ Chocolatey installed successfully" -ForegroundColor Green
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } catch {
        Write-Host "ERROR: Failed to install Chocolatey." -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Chocolatey is already installed (version: $chocoInstalled)" -ForegroundColor Green
}

# Install Redis via Chocolatey
Write-Host "[3/4] Installing Redis via Chocolatey..." -ForegroundColor Yellow
choco install redis-64 -y --no-progress
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Redis installed successfully" -ForegroundColor Green
} else {
    Write-Host "WARNING: Chocolatey installation may have issues. Trying alternative method..." -ForegroundColor Yellow
    Write-Host "Please install Redis manually or use Docker: docker run -d -p 6379:6379 redis:latest" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Use Docker to run Redis:" -ForegroundColor Yellow
    Write-Host "  docker run -d -p 6379:6379 --name redis redis:latest" -ForegroundColor White
    exit 1
}

# Verify Redis installation
Write-Host "[4/4] Verifying Redis installation..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
$redisCheck = redis-server --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Redis verification successful" -ForegroundColor Green
} else {
    Write-Host "WARNING: Redis installed but not in PATH. You may need to restart PowerShell." -ForegroundColor Yellow
}

# Update .env file with Redis configuration
Write-Host ""
Write-Host "Updating .env file with Redis configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if (-not $envContent.Contains("REDIS_HOST")) {
        $envContent += "`n# Redis Configuration`n"
        $envContent += "REDIS_HOST=localhost`n"
        $envContent += "REDIS_PORT=6379`n"
        $envContent += "REDIS_PASSWORD=`n"
        Set-Content -Path ".env" -Value $envContent -NoNewline
        Write-Host "✓ .env file updated with Redis configuration" -ForegroundColor Green
    } else {
        Write-Host "✓ .env file already has Redis configuration" -ForegroundColor Green
    }
} else {
    Write-Host "WARNING: .env file not found. Please add Redis configuration manually:" -ForegroundColor Yellow
    Write-Host "  REDIS_HOST=localhost" -ForegroundColor White
    Write-Host "  REDIS_PORT=6379" -ForegroundColor White
    Write-Host "  REDIS_PASSWORD=" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Redis Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start Redis server:" -ForegroundColor Yellow
Write-Host "  redis-server" -ForegroundColor White
Write-Host ""
Write-Host "To start Redis as a Windows service:" -ForegroundColor Yellow
Write-Host "  redis-server --service-install" -ForegroundColor White
Write-Host "  redis-server --service-start" -ForegroundColor White
Write-Host ""
Write-Host "To test Redis connection:" -ForegroundColor Yellow
Write-Host "  redis-cli ping" -ForegroundColor White
Write-Host ""

