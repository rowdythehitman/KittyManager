# Kitty Manager

An always-on feeding log for Chuchi and Diego, made for a spare Android phone.

- Big **+ HALF** and **+ FULL** pouch buttons per cat, with **UNDO** for mis-taps
- Today's total, last-fed time and how long ago per cat; resets itself at midnight
- **LOG** shows the last 7 days and every feed logged today
- OLED-friendly screensaver: after 10 idle minutes (3 between 22:00 and 07:00) it cuts to a black screen with dim greyscale cats, the time and each cat's total; the first tap just wakes it
- Pixel Chuchi and Diego wander a pixel version of the living room (tap them, or feed them, for a hop)
- Day and night looks: **AUTO** switches to night at 19:00 and back at 07:00; tap it to force **DAY** or **NIGHT**
- Keeps the screen awake while open, and works offline once loaded

It is a plain static web app (no build step). The log is stored on the phone itself.

## Put it on the phone

1. On GitHub: **Settings → Pages → Deploy from a branch**, pick the branch holding these files and `/ (root)`.
2. Open the Pages URL in Chrome on the phone.
3. Chrome menu **⋮ → Add to Home screen → Install**. Launch it from the new icon for fullscreen.
4. Leave the phone on charge. If the screen still sleeps, turn off Battery Saver (it blocks the keep-awake request).

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files

- `index.html`, `style.css`, `app.js` – the app
- `sprites.js` – the pixel-art cats and their colours
- `room.js` – the living-room backdrop (wall, floor, furniture) in day and night colours
- `sw.js`, `manifest.webmanifest`, `icons/` – install + offline support
- `tools/make-icons.js` – regenerates the icons from the sprites
- `fonts/` – Press Start 2P (SIL Open Font License)
