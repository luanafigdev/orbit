@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title ORBIT - Servidor local

where py >nul 2>nul
if not errorlevel 1 (
    py -3 iniciar_orbit.py
    if not errorlevel 1 exit /b 0
)
where python >nul 2>nul
if not errorlevel 1 (
    python iniciar_orbit.py
    if not errorlevel 1 exit /b 0
)
where node >nul 2>nul
if not errorlevel 1 (
    node iniciar_orbit.js
    if not errorlevel 1 exit /b 0
)

echo Nao foi possivel iniciar o servidor.
echo Instale Python ou Node.js para abrir o ORBIT corretamente.
pause
