# Aima

A cute pixel-moon period tracker for two friends. It shows today's cycle day, your phase and when your next period is expected. Everything stays on your own phone.

**Open it:** https://nadiagalavants.github.io/bloodbath/

## Files

| File | What it does |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | The app: setup, home, history and settings screens |
| `cycle.js` | All the cycle maths (predictions, phases, averages) |
| `pixel.js` | The pixel art: moon buddy, ring blocks, icons |
| `sw.js`, `manifest.webmanifest`, `icons/` | Makes it installable and lets it work offline |
| `test.html` | Tests for the cycle maths (open it in a browser) |
| `serve.ps1` | Tiny local server for trying it on this computer |
| `make-icons.ps1` | Redraws the app icons |

## Try it on this computer

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:5173.

## Put it on your phones

The phones need to load the app once from an `https://` address, so the files have to be hosted somewhere. Free options are GitHub Pages and Netlify Drop (drag this folder onto app.netlify.com/drop). Only the app files are served; no data ever goes there.

Then, on each phone:

- **iPhone:** open the link in Safari, tap Share, then **Add to Home Screen**.
- **Android:** open the link in Chrome, tap the menu, then **Install app**.

Aima then opens from its own icon, full screen, and works offline.

## Good to know

- Data lives only in that phone's app storage. Deleting the app or clearing website data erases it.
- Predictions are estimates, not medical or contraception advice.
