@echo off
REM Run 2 AP Medical scrapers in parallel: one from start, one from end
REM Output: ap_medical_scraped_data (sprites, CSS, questions)

echo ============================================================
echo Starting 2 AP Medical Scrapers (Start + Reverse)
echo Output: ap_medical_scraped_data (sprites, CSS, questions)
echo ============================================================
echo.

cd /d "%~dp0"

start "AP-Medical-Scraper-Start" cmd /c "python ap-medical-scraper.py & pause"
start "AP-Medical-Scraper-Reverse" cmd /c "python ap-medical-scraper-reverse.py & pause"

echo.
echo Both scrapers launched in separate windows.
echo Start = first half, Reverse = second half (from end)
echo Close each window when done, or wait for completion.
echo.
