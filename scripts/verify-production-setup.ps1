# Production Setup Verification Script
# Verifies that all recommended production components are installed and configured

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production Setup Verification" -ForegroundColor Cyan
Write-Host "Taaleem Clinic Management System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allChecksPassed = $true

# Check Node.js
Write-Host "[1/10] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -ge 20) {
        Write-Host "  ✓ Node.js $nodeVersion (>= 20 required)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Node.js $nodeVersion (>= 20 required)" -ForegroundColor Red
        $allChecksPassed = $false
    }
} else {
    Write-Host "  ✗ Node.js not found" -ForegroundColor Red
    $allChecksPassed = $false
}

# Check npm
Write-Host "[2/10] Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ npm $npmVersion" -ForegroundColor Green
} else {
    Write-Host "  ✗ npm not found" -ForegroundColor Red
    $allChecksPassed = $false
}

# Check PM2
Write-Host "[3/10] Checking PM2..." -ForegroundColor Yellow
$pm2Version = pm2 --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ PM2 $pm2Version installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ PM2 not installed. Run: npm install -g pm2" -ForegroundColor Red
    $allChecksPassed = $false
}

# Check PM2 log rotation
Write-Host "[4/10] Checking PM2 log rotation..." -ForegroundColor Yellow
$pm2Modules = pm2 list 2>$null
$logrotateInstalled = pm2 describe pm2-logrotate 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ PM2 log rotation module installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ PM2 log rotation not installed. Run: pm2 install pm2-logrotate" -ForegroundColor Yellow
}

# Check PostgreSQL
Write-Host "[5/10] Checking PostgreSQL..." -ForegroundColor Yellow
$pgVersion = psql --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ PostgreSQL client found" -ForegroundColor Green
    
    # Test connection
    $env:PGPASSWORD = "M@gesh@020294"
    $pgTest = psql -U postgres -d postgres -c "SELECT version();" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ PostgreSQL connection successful" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ PostgreSQL connection failed. Check credentials and service status." -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ PostgreSQL client not found in PATH" -ForegroundColor Yellow
}

# Check .env file
Write-Host "[6/10] Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  ✓ .env file exists" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    
    # Check DATABASE_URL
    if ($envContent -match 'DATABASE_URL=') {
        if ($envContent -match 'connection_limit') {
            Write-Host "  ✓ DATABASE_URL has connection pooling configured" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ DATABASE_URL missing connection pooling parameters" -ForegroundColor Yellow
            Write-Host "    Add: &connection_limit=20&pool_timeout=20" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ DATABASE_URL not found in .env" -ForegroundColor Red
        $allChecksPassed = $false
    }
    
    # Check NODE_ENV
    if ($envContent -match 'NODE_ENV="production"') {
        Write-Host "  ✓ NODE_ENV set to production" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ NODE_ENV not set to production" -ForegroundColor Yellow
    }
    
    # Check JWT_SECRET
    if ($envContent -match 'JWT_SECRET=') {
        Write-Host "  ✓ JWT_SECRET configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ JWT_SECRET not found in .env" -ForegroundColor Red
        $allChecksPassed = $false
    }
} else {
    Write-Host "  ✗ .env file not found" -ForegroundColor Red
    Write-Host "    Create from template: Copy env.production.template to .env" -ForegroundColor Gray
    $allChecksPassed = $false
}

# Check ecosystem.config.js
Write-Host "[7/10] Checking PM2 ecosystem config..." -ForegroundColor Yellow
if (Test-Path "ecosystem.config.js") {
    Write-Host "  ✓ ecosystem.config.js exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ ecosystem.config.js not found" -ForegroundColor Yellow
}

# Check if application is built
Write-Host "[8/10] Checking application build..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Write-Host "  ✓ Application is built (.next directory exists)" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Application not built. Run: npm run build" -ForegroundColor Yellow
}

# Check PM2 processes
Write-Host "[9/10] Checking PM2 processes..." -ForegroundColor Yellow
$pm2List = pm2 jlist 2>$null | ConvertFrom-Json
if ($LASTEXITCODE -eq 0 -and $pm2List.Count -gt 0) {
    $taaleemProcess = $pm2List | Where-Object { $_.name -eq "taaleem-emr" }
    if ($taaleemProcess) {
        Write-Host "  ✓ Application running in PM2 (Status: $($taaleemProcess.pm2_env.status))" -ForegroundColor Green
        Write-Host "    Instances: $($taaleemProcess.pm2_env.instances)" -ForegroundColor Gray
        Write-Host "    Mode: $($taaleemProcess.pm2_env.exec_mode)" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠ Application not running in PM2" -ForegroundColor Yellow
        Write-Host "    Start with: pm2 start ecosystem.config.js -i max" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠ No PM2 processes running" -ForegroundColor Yellow
}

# Check logs directory
Write-Host "[10/10] Checking logs directory..." -ForegroundColor Yellow
if (Test-Path "logs") {
    Write-Host "  ✓ logs directory exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ logs directory not found. Creating..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
    Write-Host "  ✓ logs directory created" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allChecksPassed) {
    Write-Host "✓ All critical checks passed!" -ForegroundColor Green
} else {
    Write-Host "⚠ Some checks failed. Please review and fix issues above." -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  - Run 'scripts\install-production-recommendations.ps1' to install missing components" -ForegroundColor White
Write-Host "  - Run 'npm run build' to build the application" -ForegroundColor White
Write-Host "  - Run 'pm2 start ecosystem.config.js -i max' to start with PM2 cluster mode" -ForegroundColor White
Write-Host "  - Run 'pm2 save' to save PM2 configuration" -ForegroundColor White
Write-Host ""

