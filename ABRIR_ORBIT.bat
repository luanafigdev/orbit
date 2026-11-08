@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title ORBIT - Explore o Sistema Solar

where py >nul 2>nul
if %errorlevel%==0 (
    echo Iniciando ORBIT na porta 5176...
    start "ORBIT - Servidor local" cmd /k "py -m http.server 5176"
    timeout /t 2 /nobreak >nul
    start "" "http://localhost:5176"
    exit /b 0
)
where python >nul 2>nul
if %errorlevel%==0 (
    echo Iniciando ORBIT na porta 5176...
    start "ORBIT - Servidor local" cmd /k "python -m http.server 5176"
    timeout /t 2 /nobreak >nul
    start "" "http://localhost:5176"
    exit /b 0
)

echo Python nao encontrado. Abrindo o arquivo HTML diretamente.
start "" "index.html"
exit /b 0
