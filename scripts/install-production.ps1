# Production Deployment Installation Script
# Installs all recommended software from PRODUCTION_DEPLOYMENT_RECOMMENDATIONS.md

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production Deployment Installation" -ForegroundColor Cyan
Write-Host "Taaleem Clinic Management System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Check Node.js installation
Write-Host "[1/7] Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js 20+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green

# Check npm installation
Write-Host "[2/7] Checking npm installation..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm is not installed or not in PATH." -ForegroundColor Red
    exit 1
}
Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green

# Install PM2 globally
Write-Host "[3/7] Installing PM2 globally..." -ForegroundColor Yellow
$pm2Installed = pm2 --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing PM2..." -ForegroundColor Cyan
    npm install -g pm2
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install PM2." -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ PM2 installed successfully" -ForegroundColor Green
} else {
    Write-Host "✓ PM2 is already installed (version: $pm2Installed)" -ForegroundColor Green
}

# Install PM2 Windows Startup
Write-Host "[4/7] Installing PM2 Windows Startup..." -ForegroundColor Yellow
$pm2StartupInstalled = pm2-startup --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing pm2-windows-startup..." -ForegroundColor Cyan
    npm install -g pm2-windows-startup
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Failed to install pm2-windows-startup. Continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "✓ pm2-windows-startup installed successfully" -ForegroundColor Green
    }
} else {
    Write-Host "✓ pm2-windows-startup is already installed" -ForegroundColor Green
}

# Install PM2 log rotation
Write-Host "[5/7] Installing PM2 log rotation module..." -ForegroundColor Yellow
pm2 install pm2-logrotate 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Configuring PM2 log rotation..." -ForegroundColor Cyan
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 7
    pm2 set pm2-logrotate:compress true
    pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
    Write-Host "✓ PM2 log rotation configured" -ForegroundColor Green
} else {
    Write-Host "WARNING: Failed to install pm2-logrotate. Continuing..." -ForegroundColor Yellow
}

# Setup PM2 Windows Startup
Write-Host "[6/7] Setting up PM2 Windows Startup..." -ForegroundColor Yellow
try {
    pm2-startup install 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PM2 Windows startup configured" -ForegroundColor Green
    } else {
        Write-Host "INFO: PM2 startup may need manual configuration. Run 'pm2 startup' manually if needed." -ForegroundColor Yellow
    }
} catch {
    Write-Host "INFO: PM2 startup configuration skipped. You can run 'pm2 startup' manually later." -ForegroundColor Yellow
}

# Check PostgreSQL connection
Write-Host "[7/7] Checking PostgreSQL connection..." -ForegroundColor Yellow
$env:PGPASSWORD = "M@gesh@020294"
$pgTest = psql -U postgres -d postgres -c "SELECT version();" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Could not connect to PostgreSQL. Please ensure PostgreSQL is installed and running." -ForegroundColor Yellow
} else {
    Write-Host "✓ PostgreSQL connection successful" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Software Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Manual Configuration Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Update .env file with connection pooling:" -ForegroundColor White
$ampChar = [char]38
Write-Host "   Add to DATABASE_URL: $ampChar" + "connection_limit=20$ampChar" + "pool_timeout=20" -ForegroundColor Gray
Write-Host "   Example: DATABASE_URL=`"postgresql://...?schema=public" + "$ampChar" + "connection_limit=20" + "$ampChar" + "pool_timeout=20`"" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Ensure NODE_ENV is set to production in .env" -ForegroundColor White
Write-Host ""
Write-Host "3. Run database migrations: npm run db:migrate:prod" -ForegroundColor White
Write-Host ""
Write-Host "4. Build the application: npm run build" -ForegroundColor White
Write-Host ""
Write-Host "5. Start with PM2: pm2 start ecosystem.config.js -i max" -ForegroundColor White
Write-Host ""
Write-Host "6. Save PM2 configuration: pm2 save" -ForegroundColor White
Write-Host ""
Write-Host "Optional: Install Redis for caching (see scripts/install-redis.ps1)" -ForegroundColor Cyan
Write-Host ""
Write-Host "PM2 Commands:" -ForegroundColor Yellow
Write-Host "  pm2 start ecosystem.config.js -i max  # Start with cluster mode" -ForegroundColor White
Write-Host "  pm2 monit                              # Monitor processes" -ForegroundColor White
Write-Host "  pm2 logs                               # View logs" -ForegroundColor White
Write-Host "  pm2 reload taaleem-emr                 # Zero-downtime reload" -ForegroundColor White
Write-Host "  pm2 stop taaleem-emr                   # Stop application" -ForegroundColor White
Write-Host ""

