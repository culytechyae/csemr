# Find Node.js Installation
Write-Host "Searching for Node.js installation..." -ForegroundColor Yellow

$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:APPDATA\npm\node.exe",
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
)

$found = $false
foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        Write-Host "Found Node.js at: $path" -ForegroundColor Green
        $version = & $path --version
        Write-Host "Version: $version" -ForegroundColor Green
        $found = $true
        
        # Check if in PATH
        $parentDir = Split-Path $path -Parent
        if ($env:PATH -like "*$parentDir*") {
            Write-Host "Node.js is in PATH" -ForegroundColor Green
        } else {
            Write-Host "Node.js is NOT in PATH" -ForegroundColor Yellow
            Write-Host "Add to PATH: $parentDir" -ForegroundColor Cyan
        }
        break
    }
}

if (-not $found) {
    Write-Host "Node.js not found in common locations." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Install Node.js from https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Restart your terminal/PowerShell after installation" -ForegroundColor White
    Write-Host "3. Or add Node.js installation directory to PATH" -ForegroundColor White
}

