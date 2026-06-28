@echo off
REM ============================================================
REM  COMMON GROUND - publish to GitHub
REM  Commits all local changes and pushes them to GitHub, so the
REM  live site at https://shamoug.github.io/comgro/ updates.
REM
REM  Just double-click this file (or run it) whenever you want to
REM  upload a new version. It uses your saved GitHub login.
REM ============================================================
REM  CHANGELOG (newest first):
REM  2026-06-28  Mercy intervention now counts tries only once a player has
REM              reached square 90 (was: within one roll of 100). game.js v13.
REM  2026-06-28  The Long Road now always ends. Exact-landing on 100 is kept,
REM              but after 8 failed tries from finishing range (overshoot/bounce,
REM              or the impossible square 99 with two dice) the field steps in and
REM              rolls the player home. Fixes the endless climb-bounce-snake loop
REM              on the home stretch. game.js v12.
REM  2026-06-28  Final standings: show only "Champions of the Road"
REM              (removed the per-player ranking list). Tap/click outside
REM              any card to close it. Pull-to-refresh on touch screens
REM              (hard, cache-busted reload). game.js v11, styles.css v13,
REM              platform.js v8.
REM ============================================================
setlocal
cd /d "%~dp0"

echo.
echo   =========================================
echo     COMMON GROUND - Publish to GitHub
echo   =========================================
echo.

REM --- Make sure this folder is a git repo ---
if not exist ".git" (
  echo   This folder is not a git repository yet. Setting it up...
  git init -b main
  git remote add origin https://github.com/shamoug/comgro.git
)

REM --- Make sure the remote exists ---
git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin https://github.com/shamoug/comgro.git
)

REM --- Stage everything (the entire game: all files in this folder) ---
git add -A

REM --- Show what is going up so you can see the whole game is included ---
echo   Files in this upload:
git ls-files
echo.
for /f %%C in ('git ls-files ^| find /c /v ""') do set "FILECOUNT=%%C"
echo   Total: %FILECOUNT% files will be on GitHub.
echo.

REM --- Build a commit message: use the first argument if given, else a timestamp ---
set "MSG=%~1"
if "%MSG%"=="" set "MSG=Update Common Ground (%DATE% %TIME%)"

REM --- Commit (skip cleanly if there is nothing to commit) ---
git diff --cached --quiet
if %errorlevel%==0 (
  echo   No changes to commit. Pushing anything unpushed...
) else (
  git commit -m "%MSG%"
  if errorlevel 1 (
    echo   Commit failed. Stopping.
    goto :end
  )
)

REM --- Push to GitHub ---
echo.
echo   Pushing to https://github.com/shamoug/comgro ...
git push -u origin main
if errorlevel 1 (
  echo.
  echo   Push failed. If you were asked to log in, complete the login
  echo   and run this file again. You can also push from GitHub Desktop.
  goto :end
)

echo.
echo   Done. Your changes are uploaded.
echo   The live site will refresh in about a minute:
echo     https://shamoug.github.io/comgro/
echo.

:end
pause
endlocal
