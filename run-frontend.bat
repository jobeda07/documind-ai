@echo off
title DocuMind AI - Frontend Server
cd /d "%~dp0frontend"
echo Starting DocuMind AI Frontend on port 5173...
npm run dev -- --host 127.0.0.1 --port 5173
pause
