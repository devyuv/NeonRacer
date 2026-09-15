# NEON RACER 3D

An original, mobile-first 3D arcade racing PWA built with Vite + Three.js. No backend or API keys are required.

## Features

- Third-person 3D racing camera
- Procedural futuristic sports car and neon city circuit
- Five AI opponents
- Acceleration, braking, steering, drift feel and nitro
- Touch + keyboard controls
- 3-lap race loop, position, timer, speed and nitro HUD
- Race results, restart and menu navigation
- Local progress storage
- Garage, tracks and settings screens
- Web App Manifest + service worker
- Responsive mobile/desktop layout
- Graceful WebGL error
- Graphics quality setting and device-pixel-ratio cap
- Original procedural geometry; no external game assets are required

## Run locally

Install Node.js 18+ (Node 20+ recommended).

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Production build

```bash
npm run build
npm run preview
```

The production files are created in `dist/`.

## GitHub

1. Create a new empty repository on GitHub, for example `neon-racer-3d`.
2. Extract this project folder.
3. From the project folder:

```bash
git init
git add .
git commit -m "Initial NEON RACER 3D"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

You can also upload the files through GitHub's web interface.

## Vercel

1. Sign in to Vercel.
2. Choose **Add New → Project**.
3. Import the GitHub repository.
4. Vercel should detect Vite automatically.
5. Build command: `npm run build`
6. Output directory: `dist`
7. No environment variables are required.
8. Deploy.

The included `vite.config.js` uses a relative base so the generated site works cleanly as a static Vercel deployment.

## PWA installation

The browser controls installation availability. When supported, the game receives the browser's `beforeinstallprompt` event and shows **INSTALL GAME** in the main menu. The button calls the real browser install prompt; it does not fake installation.

On iOS/iPadOS, installation behavior is controlled by Safari and may use the browser's Share → Add to Home Screen flow rather than `beforeinstallprompt`.

## Offline behavior

The service worker precaches the shell and caches same-origin game files as they are requested. After the initial successful visit, the core game can continue to load offline when the browser retains the cache.

## Controls

Keyboard:
- W / Arrow Up — accelerate
- S / Arrow Down — brake
- A / Arrow Left — steer left
- D / Arrow Right — steer right
- Space — nitro

Mobile:
- Left steering button
- Right steering button
- Brake button
- N₂ nitro button

## Audio

The project includes an original Web Audio fallback system that synthesizes simple beeps for countdown, nitro, crash and finish. It does not download copyrighted music or sound effects.

Music/SFX toggles are persisted. A future version can add properly licensed audio files without changing the core game architecture.

## Testing note

The source is structured for Vite and the imports are internally consistent. Before public release, run `npm install` and `npm run build` on your machine and test on the actual Android/iOS devices you plan to support. Browser/PWA installation prompts vary by browser and OS, so those cannot be guaranteed programmatically on every device.

## License / assets

The code and procedural game concept are original for this project. No third-party 3D models, game textures, logos, characters, tracks, or copyrighted audio are required.
