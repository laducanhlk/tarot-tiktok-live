@echo off
chcp 65001 >nul
title TAROT TIKTOK LIVE STUDIO (PORT 3000)
color 0B

cd /d "%~dp0"

echo ============================================================
echo   ???? DANG KHOI DONG HE THONG TAROT TIKTOK LIVE...
echo ============================================================
echo.

echo [*] Giai phong cong 3000 neu dang ban...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

if exist "%~dp0runtime\node.exe" (
    set "NODE_CMD=%~dp0runtime\node.exe"
) else (
    set "NODE_CMD=node"
)

echo [*] Dang mo trinh duyet Admin...
powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:3000/admin'"

echo [*] Dang khoi chay Server tai http://localhost:3000 ...
echo.
"%NODE_CMD%" server.js
pause
