@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Actualizar datos locales del Dashboard

echo =====================================================
echo  Actualizar planilla local del Dashboard
echo =====================================================
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0actualizar_datos_locales.ps1"
echo.
if errorlevel 1 (
    echo No se pudo preparar la planilla. Revisa la carpeta data.
) else (
    echo Proceso finalizado correctamente.
)
echo.
pause
