@echo off
echo ========================================
echo TS EAMCET Question Scraper
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Install Playwright browsers
echo Installing Playwright browsers...
python -m playwright install chromium

echo.
echo Starting scraper...
echo Press Ctrl+C to stop (progress will be saved)
echo.

python scraper.py

echo.
echo ========================================
echo Scraping complete!
echo ========================================
pause















