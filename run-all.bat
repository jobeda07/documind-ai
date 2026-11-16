@echo off
title DocuMind AI - One-Click Launcher
echo ===================================================
echo Starting DocuMind AI Full Stack Services...
echo ===================================================
start "DocuMind Backend" cmd /k "%~dp0run-backend.bat"
start "DocuMind Queue Worker" cmd /k "%~dp0run-queue.bat"
start "DocuMind Frontend" cmd /k "%~dp0run-frontend.bat"
echo.
echo All services are launching in separate windows!
echo - Frontend: http://127.0.0.1:5173/
echo - Backend:  http://127.0.0.1:8000/api/v1
echo.
timeout /t 5
exit
