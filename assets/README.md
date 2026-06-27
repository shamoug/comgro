# assets/

This folder is intentionally light: **Common Ground ships with no external
media**. All visuals are CSS + inline SVG + system emoji, and all audio is
synthesised in-browser via the Web Audio API (see `src/audio.js`). The game
runs fully without anything here.

Drop optional extras in this folder if you like:

- `screenshot.png` — referenced by the README's screenshot section.
- Custom fonts, icons, or replacement art if you fork the visual direction.

Anything you add here is loaded with **relative paths**, so it keeps working
both locally (via `start.bat` / `start.sh`) and on GitHub Pages.
