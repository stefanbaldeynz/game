@echo off
rem Double-click to open the game select at http://localhost:8000/ (see serve.ps1).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" %*
