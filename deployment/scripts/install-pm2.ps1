# PM2 Installation Script for Windows
# Taaleem Clinic Management System

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PM2 Installation Script (Windows)" -ForegroundColor Cyan
Write-Host "Taaleem Clinic Management System" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 20+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = node -v
Write-Host "Detected Node.js: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Check if npm is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host "Installing PM2 globally..." -ForegroundColor Yellow
npm install -g pm2

Write-Host ""
Write-Host "Installing PM2 log rotation module..." -ForegroundColor Yellow
pm2 install pm2-logrotate

Write-Host ""
Write-Host "Configuring PM2 log rotation..." -ForegroundColor Yellow
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss

# Verify installation
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    $pm2Version = pm2 -v
    Write-Host ""
    Write-Host "PM2 installed successfully!" -ForegroundColor Green
    Write-Host "Version: $pm2Version" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Copy PM2 configuration:"
    Write-Host "   Copy-Item deployment\pm2\ecosystem.config.js .\" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Start application:"
    Write-Host "   pm2 start ecosystem.config.js" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Save PM2 configuration:"
    Write-Host "   pm2 save" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Setup PM2 to start on boot (Windows):"
    Write-Host "   pm2-startup install" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "PM2 installation failed" -ForegroundColor Red
    exit 1
}

