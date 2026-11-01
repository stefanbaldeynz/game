@echo off
rem Double-click to play Hellkeep at http://localhost:8000/hellkeep/ (see serve.ps1).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" %*
