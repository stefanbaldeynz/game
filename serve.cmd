@echo off
rem Double-click to run the game collection at http://localhost:8000/ (see serve.ps1).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" %*
