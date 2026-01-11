# Complete Deployment Script for Windows
# Taaleem Clinic Management System - NGINX + PM2 Setup

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Taaleem Clinic Management System" -ForegroundColor Cyan
Write-Host "Production Deployment Script (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Some steps require Administrator privileges" -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator for full functionality" -ForegroundColor Yellow
    Write-Host ""
}

# Get application directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Split-Path -Parent (Split-Path -Parent $scriptDir)

Write-Host "Application directory: $appDir" -ForegroundColor Cyan
Set-Location $appDir

# Step 1: Install PM2
Write-Host ""
Write-Host "Step 1: Installing PM2..." -ForegroundColor Yellow
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    & "$scriptDir\install-pm2.ps1"
} else {
    Write-Host "✅ PM2 already installed" -ForegroundColor Green
}

# Step 2: Install NGINX
Write-Host ""
Write-Host "Step 2: Installing NGINX..." -ForegroundColor Yellow
$nginxPath = "C:\nginx\nginx.exe"
if (-not (Test-Path $nginxPath)) {
    & "$scriptDir\install-nginx.ps1"
} else {
    Write-Host "✅ NGINX already installed" -ForegroundColor Green
}

# Step 3: Setup PM2 configuration
Write-Host ""
Write-Host "Step 3: Setting up PM2 configuration..." -ForegroundColor Yellow
if (-not (Test-Path "ecosystem.config.js")) {
    Copy-Item "deployment\pm2\ecosystem.config.js" -Destination ".\ecosystem.config.js"
    Write-Host "✅ PM2 configuration copied" -ForegroundColor Green
} else {
    Write-Host "⚠️  ecosystem.config.js already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite? (y/N)"
    if ($overwrite -eq "y" -or $overwrite -eq "Y") {
        Copy-Item "deployment\pm2\ecosystem.config.js" -Destination ".\ecosystem.config.js" -Force
        Write-Host "✅ PM2 configuration updated" -ForegroundColor Green
    }
}

# Step 4: Build application
Write-Host ""
Write-Host "Step 4: Building application..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
}

Write-Host "Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

Write-Host "Building application..." -ForegroundColor Cyan
npm run build

# Step 5: Start PM2
Write-Host ""
Write-Host "Step 5: Starting application with PM2..." -ForegroundColor Yellow
$pm2Running = pm2 list | Select-String "taaleem-emr"
if ($pm2Running) {
    Write-Host "Application already running, reloading..." -ForegroundColor Cyan
    pm2 reload taaleem-emr
} else {
    pm2 start ecosystem.config.js
}
pm2 save

# Step 6: Setup NGINX configuration
Write-Host ""
Write-Host "Step 6: Setting up NGINX configuration..." -ForegroundColor Yellow
$nginxConfPath = "C:\nginx\conf\taaleem-emr.conf"
if (-not (Test-Path $nginxConfPath)) {
    Copy-Item "deployment\nginx\nginx.conf" -Destination $nginxConfPath
    Write-Host "✅ NGINX configuration copied" -ForegroundColor Green
    
    # Update paths in NGINX config
    $nginxConf = Get-Content $nginxConfPath -Raw
    $nginxConf = $nginxConf -replace '/opt/taaleem-emr', $appDir.Replace('\', '/')
    Set-Content -Path $nginxConfPath -Value $nginxConf
    
    # Update main nginx.conf to include our config
    $mainNginxConf = "C:\nginx\conf\nginx.conf"
    if (Test-Path $mainNginxConf) {
        $mainContent = Get-Content $mainNginxConf -Raw
        if ($mainContent -notmatch "taaleem-emr.conf") {
            Add-Content -Path $mainNginxConf -Value "`ninclude $nginxConfPath;"
            Write-Host "✅ NGINX main config updated" -ForegroundColor Green
        }
    }
} else {
    Write-Host "⚠️  NGINX configuration already exists" -ForegroundColor Yellow
}

# Step 7: Update domain in NGINX config
Write-Host ""
Write-Host "Step 7: Updating NGINX configuration..." -ForegroundColor Yellow
$domain = Read-Host "Enter your domain name (or press Enter to skip)"
if ($domain) {
    $nginxConf = Get-Content $nginxConfPath -Raw
    $nginxConf = $nginxConf -replace 'your-domain.com', $domain
    $nginxConf = $nginxConf -replace 'www.your-domain.com', "www.$domain"
    Set-Content -Path $nginxConfPath -Value $nginxConf
    Write-Host "✅ Domain updated in NGINX config" -ForegroundColor Green
}

# Step 8: Test NGINX configuration
Write-Host ""
Write-Host "Step 8: Testing NGINX configuration..." -ForegroundColor Yellow
& "C:\nginx\nginx.exe" -t
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ NGINX configuration is valid" -ForegroundColor Green
} else {
    Write-Host "❌ NGINX configuration has errors" -ForegroundColor Red
    Write-Host "Please fix the configuration" -ForegroundColor Yellow
    exit 1
}

# Step 9: SSL Certificate
Write-Host ""
Write-Host "Step 9: SSL Certificate Setup" -ForegroundColor Yellow
Write-Host "For Windows, SSL certificates should be configured manually:" -ForegroundColor Cyan
Write-Host "1. Copy your SSL certificate to C:\nginx\ssl\" -ForegroundColor Gray
Write-Host "2. Update certificate paths in C:\nginx\conf\taaleem-emr.conf" -ForegroundColor Gray
Write-Host ""

# Step 10: Final checks
Write-Host ""
Write-Host "Step 10: Final checks..." -ForegroundColor Yellow
Write-Host ""

# Check PM2
$pm2Status = pm2 list | Select-String "taaleem-emr.*online"
if ($pm2Status) {
    Write-Host "✅ PM2: Application is running" -ForegroundColor Green
} else {
    Write-Host "❌ PM2: Application is not running" -ForegroundColor Red
}

# Check NGINX
$nginxProcess = Get-Process -Name nginx -ErrorAction SilentlyContinue
if ($nginxProcess) {
    Write-Host "✅ NGINX: Service is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  NGINX: Service is not running" -ForegroundColor Yellow
    Write-Host "Start with: Start-Process C:\nginx\nginx.exe" -ForegroundColor Gray
}

# Check health endpoint
Write-Host ""
Write-Host "Testing health endpoint..." -ForegroundColor Cyan
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:5005/api/health" -UseBasicParsing -TimeoutSec 5
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "✅ Application health check passed" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Application health check failed (may need to wait a few seconds)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure SSL certificate in C:\nginx\conf\taaleem-emr.conf" -ForegroundColor Gray
Write-Host "2. Update firewall rules to allow ports 80 and 443" -ForegroundColor Gray
Write-Host "3. Test the application: https://your-domain.com" -ForegroundColor Gray
Write-Host "4. Monitor logs:" -ForegroundColor Gray
Write-Host "   - PM2: pm2 logs taaleem-emr" -ForegroundColor DarkGray
Write-Host "   - NGINX: C:\nginx\logs\" -ForegroundColor DarkGray
Write-Host ""
Write-Host "For detailed documentation, see: deployment\README.md" -ForegroundColor Cyan

