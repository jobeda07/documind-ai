@echo off
title DocuMind AI - Queue Worker
cd /d "%~dp0backend"
set "PATH=C:\Users\pc\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe;%PATH%"
echo Starting DocuMind AI Background Queue Worker (Processing Embeddings & Chunks)...
php artisan queue:work --tries=3 --timeout=180
pause
