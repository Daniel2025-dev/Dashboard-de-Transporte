@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Dashboard de Transporte - Warehousing Chile

echo =====================================================
echo  Dashboard de Transporte - Warehousing Chile
echo =====================================================
echo.
echo 1. Actualizando la copia local de la planilla...

where powershell.exe >nul 2>nul
if errorlevel 1 goto SIN_POWERSHELL

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0actualizar_datos_locales.ps1" -Silencioso
if errorlevel 1 (
    echo AVISO: No se pudo actualizar la copia local.
    echo El dashboard se abrira igualmente y permitira carga manual.
    echo.
)

echo 2. Iniciando servidor local seguro...
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor_local.ps1"
if errorlevel 1 goto ERROR_SERVIDOR
exit /b 0

:SIN_POWERSHELL
echo No se encontro Windows PowerShell.
echo Abre el proyecto con Live Server en Visual Studio Code.
echo.
pause
exit /b 1

:ERROR_SERVIDOR
echo.
echo No fue posible iniciar el dashboard.
echo Revisa que el antivirus no haya bloqueado PowerShell.
echo Tambien puedes ejecutar: python server.py
echo.
pause
exit /b 1
