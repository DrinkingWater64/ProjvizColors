@echo off
REM ProjVizColors Docker Startup Script for Windows

echo 🚀 Starting ProjVizColors...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Parse command line arguments
set MODE=%1
if "%MODE%"=="" set MODE=production

if "%MODE%"=="production" (
    echo 🏗️  Building and starting production version...
    docker-compose up --build
) else if "%MODE%"=="development" (
    echo 🔧 Building and starting development version...
    docker-compose -f docker-compose.dev.yml up --build
) else (
    echo ❌ Invalid mode: %MODE%
    echo.
    echo Usage: %0 [production^|development]
    echo.
    echo Options:
    echo   production   - Run production build (default)
    echo   development  - Run development build with hot reloading
    echo.
    echo Examples:
    echo   %0              # Run production
    echo   %0 production   # Run production
    echo   %0 development  # Run development
    pause
    exit /b 1
)

pause 