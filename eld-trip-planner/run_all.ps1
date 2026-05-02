# ELD Trip Planner - Quick Start Script
# This script opens two new PowerShell windows to run the backend and frontend simultaneously.

Write-Host "🚀 Launching ELD Trip Planner..." -ForegroundColor Cyan

# Start Backend
Write-Host "📦 Starting Backend (Django)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; python manage.py runserver"

# Start Frontend
Write-Host "🎨 Starting Frontend (React)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "✅ Both services are launching in separate windows." -ForegroundColor Green
