@echo off
title HB Minigun Local Runner
echo ==========================================
echo Starting HB Minigun...
echo ==========================================
echo.
cd /d "%~dp0"

:: Check if local binaries are missing and set them up
if not exist "bin\HandBrakeCLI.exe" (
    echo [Setup] HandBrakeCLI not found in bin. Installing...
    powershell -ExecutionPolicy Bypass -File .\setup-binaries.ps1
) else (
    if not exist "bin\MediaInfo.exe" (
        echo [Setup] MediaInfo not found in bin. Installing...
        powershell -ExecutionPolicy Bypass -File .\setup-binaries.ps1
    )
)

echo [Launcher] Running app dev server...
call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start HB Minigun. Make sure Node.js is installed.
    pause
)
