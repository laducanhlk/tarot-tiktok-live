@echo off
chcp 65001 >nul
title TAT SERVER TAROT TIKTOK LIVE (PORT 3000)
color 0C

cd /d "%~dp0"

echo ============================================================
echo   DANG TAT SERVER TAROT TIKTOK LIVE TREN CONG 3000...
echo ============================================================

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Dang dung tien trinh PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [THANH CONG] Server Tarot tren cong 3000 da duoc tat hoan toan!
timeout /t 3 >nul

