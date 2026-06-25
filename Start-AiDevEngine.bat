@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-aidevengine-local.ps1" %*
if errorlevel 1 (
  echo.
  echo AiDevEngine failed to start. See messages above.
  pause
  exit /b 1
)
exit /b 0
