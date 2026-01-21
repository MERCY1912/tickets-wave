@echo off
title Tickets Wave Beta
color 0A

echo.
echo ============================================
echo    Starting Tickets Wave Beta...
echo ============================================
echo.

cd /d "%~dp0"

:: Check if pnpm is available, fallback to npm
where pnpm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    pnpm dev
) else (
    echo Using npm instead of pnpm...
    npm run dev
)

pause
