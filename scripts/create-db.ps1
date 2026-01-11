# Create PostgreSQL Database for Production
# This script creates the school_emr_prod database

Write-Host "Creating PostgreSQL database..." -ForegroundColor Yellow

$dbName = "school_emr_prod"
$dbUser = "postgres"
$dbPassword = "M@gesh@020294"

# Try to find psql in common locations
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files\PostgreSQL\12\bin\psql.exe",
    "psql.exe"
)

$psql = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psql = $path
        break
    }
    # Also try without .exe for PATH
    $pathWithoutExe = $path -replace '\.exe$', ''
    if (Get-Command $pathWithoutExe -ErrorAction SilentlyContinue) {
        $psql = $pathWithoutExe
        break
    }
}

if (-not $psql) {
    Write-Host "PostgreSQL (psql) not found in common locations." -ForegroundColor Red
    Write-Host "Please run the following SQL commands manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "CREATE DATABASE school_emr_prod;" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use pgAdmin or another PostgreSQL client." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found PostgreSQL at: $psql" -ForegroundColor Green

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $dbPassword

# Create database
Write-Host "Creating database: $dbName" -ForegroundColor Yellow
$createDbQuery = "CREATE DATABASE $dbName;"

try {
    & $psql -U $dbUser -d postgres -c $createDbQuery
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Database might already exist or there was an error." -ForegroundColor Yellow
        Write-Host "This is okay if the database already exists." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error creating database: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create the database manually using:" -ForegroundColor Yellow
    Write-Host "CREATE DATABASE school_emr_prod;" -ForegroundColor Cyan
}

# Clean up
Remove-Item Env:\PGPASSWORD

