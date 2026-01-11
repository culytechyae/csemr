# NGINX Installation Script for Windows
# Taaleem Clinic Management System

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "NGINX Installation Script (Windows)" -ForegroundColor Cyan
Write-Host "Taaleem Clinic Management System" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$nginxVersion = "1.24.0"
$nginxUrl = "http://nginx.org/download/nginx-${nginxVersion}.zip"
$nginxDir = "C:\nginx"
$downloadPath = "$env:TEMP\nginx-${nginxVersion}.zip"

# Check if NGINX is already installed
if (Test-Path "$nginxDir\nginx.exe") {
    Write-Host "NGINX is already installed at: $nginxDir" -ForegroundColor Yellow
    $overwrite = Read-Host "Reinstall? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        exit 0
    }
    Remove-Item -Path $nginxDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Downloading NGINX $nginxVersion..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $nginxUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "Download complete" -ForegroundColor Green
} catch {
    Write-Host "Failed to download NGINX: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Extracting NGINX to $nginxDir..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $downloadPath -DestinationPath "C:\" -Force
    Rename-Item -Path "C:\nginx-${nginxVersion}" -NewName "nginx" -Force
    Write-Host "Extraction complete" -ForegroundColor Green
} catch {
    Write-Host "Failed to extract NGINX: $_" -ForegroundColor Red
    exit 1
}

# Clean up download
Remove-Item -Path $downloadPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "NGINX installed successfully!" -ForegroundColor Green
Write-Host "Installation directory: $nginxDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy NGINX configuration:"
Write-Host "   Copy-Item deployment\nginx\nginx.conf $nginxDir\conf\taaleem-emr.conf" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update nginx.conf to include:"
Write-Host "   include $nginxDir\conf\taaleem-emr.conf;" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test configuration:"
Write-Host "   $nginxDir\nginx.exe -t" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start NGINX:"
Write-Host "   Start-Process $nginxDir\nginx.exe" -ForegroundColor Gray
Write-Host ""

