@echo off
REM ============================================================
REM  COMMON GROUND - Windows local launcher
REM  Double-click this file to play. No installation needed
REM  beyond a web browser. Tries a local server (best); if
REM  Python is missing, opens the game file directly.
REM ============================================================
setlocal
cd /d "%~dp0"
set PORT=8099

echo.
echo   =========================================
echo     COMMON GROUND: THE LONG ROAD
echo     Roll two dice. Climb the ladders.
echo     Dodge the snakes. Finish the mandate.
echo   =========================================
echo.

REM --- Try Python 3 (py launcher) ---
where py >nul 2>nul
if %errorlevel%==0 (
  echo   Starting local server at http://localhost:%PORT%
  echo   Opening your browser...
  echo   ^(Keep this window open while you play. Close it to stop.^)
  echo.
  start "" "http://localhost:%PORT%/index.html"
  py -3 -m http.server %PORT%
  goto :eof
)

REM --- Try plain "python" ---
where python >nul 2>nul
if %errorlevel%==0 (
  echo   Starting local server at http://localhost:%PORT%
  echo   Opening your browser...
  echo   ^(Keep this window open while you play. Close it to stop.^)
  echo.
  start "" "http://localhost:%PORT%/index.html"
  python -m http.server %PORT%
  goto :eof
)

REM --- Fallback: open the file directly (no server) ---
echo   Python was not found, so opening the game file directly.
echo   The game works fully this way.
echo.
start "" "index.html"
echo   If the game did not open, double-click index.html yourself.
echo.
pause
endlocal
