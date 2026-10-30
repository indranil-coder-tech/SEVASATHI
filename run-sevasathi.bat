@echo off
title SevaSathi Platform Launcher
echo ========================================================
echo       Starting SevaSathi Agricultural Platform
echo ========================================================
echo.
echo [1/2] Starting FastAPI Backend on port 8000...
start "SevaSathi Backend (Port 8000)" cmd /k "cd /d %~dp0backend && .venv\Scripts\activate && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Vite Frontend on port 5173...
start "SevaSathi Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching!
echo App will be available at: http://localhost:5173
echo Backend API Docs at:     http://127.0.0.1:8000/docs
echo.
timeout /t 3 >nul
start http://localhost:5173
