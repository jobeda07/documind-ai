@echo off
title DocuMind AI - Backend Server
cd /d "%~dp0backend"
set "PATH=C:\Users\pc\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe;%PATH%"
echo Starting DocuMind AI Backend on port 8000 (Using PHP 8.4)...
php artisan serve --port 8000
pause
