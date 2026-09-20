@echo off
cd /d "%~dp0"
echo ========================================
echo  Deploy to GitHub (Main Branch)
echo ========================================
echo.
git push origin main
echo.
echo ========================================
echo  Finished.
echo ========================================
pause
