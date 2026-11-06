@echo off
title Interactive Tarot TikTok Live Overlay - Server

echo ============================================================
echo   KHOI DONG HE THONG BOI TAROT TIKTOK LIVE OVERLAY
echo ============================================================
echo.

cd /d "%~dp0"

if not exist "node_modules\tiktok-live-connector\" (
    echo [1/3] Dang cai dat thu vien can thiet ^(npm install^)...
    call npm install
    if errorlevel 1 (
        echo.
        echo [LOI] Khong the cai dat thu vien npm. Vui long kiem tra ket noi mang hoac Node.js!
        pause
        exit /b 1
    )
    echo.
)

echo [2/3] Dang kiem tra cong 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Phat hien phien Server cu dang chay ^(PID: %%a^), dang khoi dong lai...
    taskkill /F /PID %%a >nul 2>&1
)

echo [3/3] Dang mo trang Admin va Overlay tren trinh duyet...
powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:3000/admin'; Start-Process 'http://localhost:3000/overlay.html'"

echo Dang khoi chay Node.js Server tai cong 3000...
call npm start
pause
