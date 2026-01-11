# Production Setup Script for School Clinic EMR System (PowerShell)
# This script sets up the production environment

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up School Clinic EMR System for Production..." -ForegroundColor Green

# Check if .env file exists
if (-Not (Test-Path .env)) {
    Write-Host "❌ .env file not found. Please create it from .env.example" -ForegroundColor Red
    exit 1
}

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)\s*$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Check if DATABASE_URL is set
if (-Not $env:DATABASE_URL) {
    Write-Host "❌ DATABASE_URL is not set in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install --production=false

Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

Write-Host "🌱 Seeding initial data..." -ForegroundColor Yellow
npm run db:seed

Write-Host "✅ Production setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update JWT_SECRET in .env with a strong random string"
Write-Host "2. Update MALAFFI_API_KEY in .env with your production API key"
Write-Host "3. Run 'npm run build' to build the application"
Write-Host "4. Run 'npm start' to start the production server"

