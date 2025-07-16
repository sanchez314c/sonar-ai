@echo off
setlocal enabledelayedexpansion

REM ============================================
REM SonarAI - Windows Source Runner
REM Clean start script with port management
REM ============================================

REM ============================================
REM PORT CONFIGURATION (Random High Ports)
REM ============================================
set ELECTRON_DEBUG_PORT=60372
set ELECTRON_INSPECT_PORT=63102
set ELECTRON_PORT=58005

REM ============================================
REM COLORS (Windows 10+ ANSI support)
REM ============================================
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "RED=%ESC%[91m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "BLUE=%ESC%[94m"
set "CYAN=%ESC%[96m"
set "MAGENTA=%ESC%[95m"
set "NC=%ESC%[0m"

REM ============================================
REM HEADER
REM ============================================
echo %CYAN%
echo ╔═══════════════════════════════════════════════════════════╗
echo ║            SonarAI - Windows Source Runner               ║
echo ║         Neo-Noir Glass Monitor Edition                   ║
echo ╚═══════════════════════════════════════════════════════════╝
echo %NC%

echo %BLUE%[INFO]%NC% Working directory: %CD%
echo %BLUE%[INFO]%NC% Configured ports:
echo   - Vite Dev Server:  %ELECTRON_PORT%
echo   - Electron Debug:   %ELECTRON_DEBUG_PORT%
echo   - Electron Inspect: %ELECTRON_INSPECT_PORT%
echo.

REM ============================================
REM CLEANUP PHASE
REM ============================================
echo %CYAN%━━━ CLEANUP PHASE ━━━%NC%
echo %BLUE%[CLEANUP]%NC% Killing processes on configured ports...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%ELECTRON_DEBUG_PORT%" 2^>nul') do (
    echo %YELLOW%[CLEANUP]%NC% Killing PID %%a on port %ELECTRON_DEBUG_PORT%
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%ELECTRON_INSPECT_PORT%" 2^>nul') do (
    echo %YELLOW%[CLEANUP]%NC% Killing PID %%a on port %ELECTRON_INSPECT_PORT%
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%ELECTRON_PORT%" 2^>nul') do (
    echo %YELLOW%[CLEANUP]%NC% Killing PID %%a on port %ELECTRON_PORT%
    taskkill /F /PID %%a 2>nul
)

taskkill /F /IM electron.exe 2>nul
echo.

REM ============================================
REM VERIFICATION PHASE
REM ============================================
echo %CYAN%━━━ VERIFICATION PHASE ━━━%NC%
echo %BLUE%[CHECK]%NC% Verifying dependencies...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[ERROR]%NC% Node.js is not installed!
    echo   Install from: https://nodejs.org
    pause & exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo %GREEN%[OK]%NC% Node.js %%i

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %RED%[ERROR]%NC% npm is not installed!
    pause & exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo %GREEN%[OK]%NC% npm %%i

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %YELLOW%[WARN]%NC% Python not found - backend may not work
) else (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo %GREEN%[OK]%NC% %%i
)

if not exist "node_modules" (
    echo %YELLOW%[SETUP]%NC% Installing Node.js dependencies...
    call npm install
)

REM Setup Python virtual environment
if not exist "python\.venv" (
    echo %YELLOW%[SETUP]%NC% Creating Python virtual environment...
    python -m venv python\.venv
)

if exist "python\.venv\Scripts\activate.bat" (
    call python\.venv\Scripts\activate.bat
    if not exist "python\.venv\.deps_installed" (
        echo %YELLOW%[SETUP]%NC% Installing Python dependencies...
        pip install -q --upgrade pip
        pip install -q -r python\requirements.txt
        echo. > python\.venv\.deps_installed
    )
    echo %GREEN%[OK]%NC% Python virtual environment ready
)
echo.

REM ============================================
REM LAUNCH PHASE
REM ============================================
echo %CYAN%━━━ LAUNCH PHASE ━━━%NC%
echo %GREEN%[START]%NC% Launching SonarAI...
echo.
echo   Keyboard Shortcuts:
echo   - Ctrl+,        Open Settings
echo   - Ctrl++/-      Increase/Decrease font size
echo   - Ctrl+Shift+I  Open DevTools
echo   - Escape        Close dialogs
echo.

set ELECTRON_DEBUG_PORT=%ELECTRON_DEBUG_PORT%
set ELECTRON_INSPECT_PORT=%ELECTRON_INSPECT_PORT%
set ELECTRON_PORT=%ELECTRON_PORT%
set SONAR_PYTHON_PATH=%CD%\python\.venv\Scripts\python.exe

echo %GREEN%[MODE]%NC% Development mode (run from source)
call npm run dev

endlocal
