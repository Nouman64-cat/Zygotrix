# Install resend package for email functionality

Write-Host "Installing resend package..." -ForegroundColor Cyan
pip install resend==2.7.0

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resend package installed successfully!" -ForegroundColor Green
    Write-Host "Please restart the uvicorn server for changes to take effect." -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to install resend package" -ForegroundColor Red
}
