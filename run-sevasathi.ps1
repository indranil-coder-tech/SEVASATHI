Write-Host "========================================================" -ForegroundColor Green
Write-Host "      Starting SevaSathi Agricultural Platform         " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

Write-Host "[1/2] Starting FastAPI Backend (Port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\.venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "[2/2] Starting Vite Frontend (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
Write-Host "Both services are running! Opened http://localhost:5173 in browser." -ForegroundColor Green
