# Create PostgreSQL Database - school_emr_prod
# This script will create the database using the provided password

$dbName = "school_emr_prod"
$dbUser = "postgres"
$dbPassword = "M@gesh@020294"

Write-Host "Creating PostgreSQL database: $dbName" -ForegroundColor Yellow
Write-Host ""

# Try to find psql in common locations
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files\PostgreSQL\12\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\14\bin\psql.exe"
)

$psql = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psql = $path
        Write-Host "Found PostgreSQL at: $path" -ForegroundColor Green
        break
    }
}

# Also check if psql is in PATH
if (-not $psql) {
    try {
        $psqlCheck = Get-Command psql -ErrorAction Stop
        $psql = $psqlCheck.Source
        Write-Host "Found PostgreSQL in PATH: $psql" -ForegroundColor Green
    } catch {
        Write-Host "PostgreSQL (psql) not found." -ForegroundColor Red
        Write-Host ""
        Write-Host "Please run this SQL command manually:" -ForegroundColor Yellow
        Write-Host "CREATE DATABASE school_emr_prod;" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "You can use:" -ForegroundColor Yellow
        Write-Host "  1. pgAdmin (GUI tool)" -ForegroundColor White
        Write-Host "  2. psql command line" -ForegroundColor White
        Write-Host "  3. Any PostgreSQL client" -ForegroundColor White
        exit 1
    }
}

# Set password environment variable
$env:PGPASSWORD = $dbPassword

# Create database
Write-Host ""
Write-Host "Executing: CREATE DATABASE $dbName" -ForegroundColor Yellow

try {
    $result = & $psql -U $dbUser -d postgres -c "CREATE DATABASE $dbName;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Database '$dbName' created successfully!" -ForegroundColor Green
    } else {
        # Check if database already exists
        if ($result -match "already exists") {
            Write-Host ""
            Write-Host "⚠️  Database '$dbName' already exists." -ForegroundColor Yellow
            Write-Host "This is okay - the database is ready to use." -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Error creating database:" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            Write-Host ""
            Write-Host "Please create the database manually using:" -ForegroundColor Yellow
            Write-Host "CREATE DATABASE school_emr_prod;" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create the database manually using:" -ForegroundColor Yellow
    Write-Host "CREATE DATABASE school_emr_prod;" -ForegroundColor Cyan
} finally {
    # Clean up
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Next step: Run 'npm install' and then 'setup-production.bat'" -ForegroundColor Cyan

