# Powershell Launch Script for AAGAZZ 2K26 Full Stack
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "     AAGAZZ 2K26 - SGBIT AI & DS Freshers Platform       " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow

Write-Host "1. Starting Backend API on http://localhost:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd aagazz-backend; `$env:PYTHONPATH='.'; python run.py"

Start-Sleep -Seconds 2

Write-Host "2. Starting Student User Portal on http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd aagazz-user-portal; npm run dev"

Start-Sleep -Seconds 2

Write-Host "3. Starting Admin & Scanner Portal on http://localhost:5174..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd aagazz-admin-portal; npm run dev"

Write-Host "`nAll 3 applications are starting in separate windows!" -ForegroundColor Green
Write-Host "• Student Portal: http://localhost:5173" -ForegroundColor White
Write-Host "• Admin Portal:   http://localhost:5174" -ForegroundColor White
Write-Host "• Backend Docs:   http://localhost:8000/docs" -ForegroundColor White

