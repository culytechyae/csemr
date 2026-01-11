# Generate JWT Secret for Production
$bytes = New-Object byte[] 64
$rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
$rng.GetBytes($bytes)
$secret = [System.Convert]::ToBase64String($bytes)

Write-Host "Generated JWT Secret:" -ForegroundColor Green
Write-Host $secret
Write-Host ""
Write-Host "Add this to your .env file as:" -ForegroundColor Yellow
Write-Host "JWT_SECRET=`"$secret`""

# Save to file
$secret | Out-File -FilePath "jwt-secret.txt" -Encoding utf8
Write-Host ""
Write-Host "Secret also saved to jwt-secret.txt" -ForegroundColor Cyan

