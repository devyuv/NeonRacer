# NEON RACER

An original, mobile-first **2D top-down** arcade racing game built with plain
**HTML5 Canvas** (no rendering libraries at all), packaged as an installable
**Progressive Web App**. Drift and boost through a neon-lit city circuit against 5 AI
rivals, across Quick Race, Time Trial, Championship, and Free Drive modes.

Everything here — the car sprites, track, UI, and sound — is original and generated
procedurally in code. Nothing is copied from any existing game, and there are no
external image/audio assets to license.

---

## 1. Local development

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`) in your browser. On your
phone, use the "Network" URL Vite prints (same Wi-Fi network as your computer) to test
touch controls on a real device.

## 2. Production build

```bash
npm run build
npm run preview   # optional: serve the production build locally to double check it
```

The build output goes to `dist/`.

---

## 3. Deploy to GitHub + Vercel

### Step 1 — Create a GitHub repository
1. Go to [github.com/new](https://github.com/new) and create a new repository (e.g. `neon-racer`).
2. Do **not** initialize it with a README (you already have one here).

### Step 2 — Push this project
From inside this project folder:
```bash
git init
git add .
git commit -m "Initial commit: Neon Racer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/neon-racer.git
git push -u origin main
```

### Step 3 — Connect the repository to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and sign in (GitHub login is easiest).
2. Click **Import** next to your `neon-racer` repository.
3. Vercel auto-detects the **Vite** framework preset. Confirm these build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. No environment variables are required — this game has no backend.

### Step 4 — Deploy
Click **Deploy**. Vercel will install dependencies, run the build, and give you a live
`https://your-project.vercel.app` URL. Every future push to `main` auto-deploys.

### Step 5 — Verify PWA install
Open the deployed URL on a phone (installability requires HTTPS, which Vercel provides
automatically). You should see an **INSTALL GAME** button in the main menu on supported
browsers (Chrome/Edge on Android, and via the browser's native "Add to Home Screen" flow
on iOS Safari, which doesn't fire the same install prompt event). No custom domain is
required — the free Vercel tier is sufficient.

---

## 4. Project structure

```
neon-racer/
├── index.html              Single HTML shell with all screen containers
├── package.json
├── vite.config.js
├── public/
│   ├── manifest.webmanifest PWA manifest (name, icons, display mode)
│   ├── service-worker.js    Offline caching (app shell + runtime cache)
│   └── icons/               192x192 / 512x512 app icons
└── src/
    ├── main.js              Boots the Game, registers the service worker
    ├── style.css            All UI styling (neon/glassmorphism theme)
    ├── game/
    │   ├── Game.js           Screen flow, render loop, settings, PWA install
    │   ├── GameState.js      Wraps saved progress + session selections
    │   ├── RaceManager.js    Countdown, laps, positions, race timer, results
    │   ├── Physics.js        Top-down arcade car physics stepper
    │   ├── Collision.js      Car-car and car-barrier collision resolution
    │   └── Camera.js         2D follow camera (smoothing/zoom/shake)
    ├── cars/
    │   ├── CarData.js        Car stat/tuning definitions (3 original cars)
    │   ├── CarModel.js       Procedural 2D top-down car sprite (Canvas 2D drawing)
    │   ├── PlayerCar.js      Player car wrapper (input-driven)
    │   └── AICar.js          AI car wrapper (spline-following + overtaking)
    ├── tracks/
    │   ├── index.js          Track registry (Neon City implemented; two more stubbed)
    │   ├── TrackManager.js   Generic control-point -> road polygon builder (Catmull-Rom)
    │   └── NeonCity.js       Neon City track layout + decorations
    ├── ui/
    │   ├── MainMenu.js, HUD.js, Garage.js, Results.js, Settings.js
    ├── controls/
    │   ├── TouchControls.js  Steer/brake/nitro buttons + optional tilt steering
    │   └── KeyboardControls.js
    ├── audio/
    │   └── AudioManager.js   Procedurally synthesized SFX/engine sound (see below)
    └── utils/
        ├── Storage.js        localStorage save/load
        └── DeviceDetection.js Canvas/touch/mobile/vibration detection
```

Adding a new track later is just: write a new file like `NeonCity.js` with a different
list of control points and decorations, then register it in `tracks/index.js` and flip
`implemented: true` in the track list. The road/barrier/collision code is fully generic.

---

## 5. How the 2D view works

The camera is a simple top-down "follow cam": it centers on the player's car, zooms out
slightly at high speed, and shakes briefly on collisions. The world stays north-up at all
times — cars rotate to face their heading, the camera does not rotate. Everything is
drawn with plain Canvas 2D calls (`fillRect`, `arc`, paths) — there's no WebGL, no 3D
library, and no external image files.

## 6. Audio note

There are no bundled audio files. `AudioManager.js` synthesizes all sound effects and the
engine note live with the WebAudio API, so the game never ships with unlicensed or
placeholder-silent audio — what you hear is real, original, generated sound. If you'd
like richer music/SFX:
1. Add your own licensed files under `public/assets/audio/`.
2. Swap the relevant method bodies in `src/audio/AudioManager.js` to play those files
   instead of the oscillator-based sounds (the public methods like `playCollision()` can
   keep the same names, so nothing else in the game needs to change).

---

## 7. Controls

**Touch:** on-screen LEFT / RIGHT steer buttons, BRAKE, and NITRO. The car
auto-accelerates unless you're braking, so both thumbs stay free for steering and nitro.

**Tilt steering:** tap the 📱 button in the top-right of the HUD (next to pause) at any
time during a race to switch to tilt steering - just tilt the phone left/right instead of
tapping buttons. The on-screen L / R buttons hide automatically while tilt is active, for
a simpler two-button (brake + nitro) layout. Tap the button again to switch back. The same
toggle is also available in Settings → Control Type, and both stay in sync.

**Keyboard:** `W`/`↑` accelerate, `S`/`↓` brake, `A`/`←` and `D`/`→` steer, `SPACE` nitro.

---

## 8. Testing checklist

Verified by code review and manual reasoning during development:
- [x] Project structure has no dangling imports (every imported module file exists)
- [x] No remaining references to Three.js/WebGL anywhere in the code or dependencies
- [x] Canvas 2D support check shows a graceful fallback screen if unsupported
- [x] Touch controls use `touchstart`/`touchend`/`pointerdown`/`pointerup` with
      `preventDefault` to avoid scroll interference, and `touch-action: none` is set globally
- [x] Native pinch/rotate gestures are blocked (`gesturestart`/`gesturechange`/`gestureend`)
      so two-finger button presses can't spin or zoom the page
- [x] LocalStorage save/load has a try/catch fallback to defaults if corrupted
- [x] Manifest JSON is valid and icons are referenced with matching paths/sizes; no forced
      orientation lock (the game asks the player to rotate, rather than forcing it)
- [x] Service worker uses a safe versioned-cache activate/cleanup pattern

**Not actually executed in a browser or on Vercel by the author of this code** (no
sandboxed browser/network available in this environment) — please run `npm install &&
npm run dev` locally as a first check, since that will surface any environment-specific
issue (Node version, dependency resolution) immediately. If you hit a build error, check
the terminal output and feel free to paste it back for a fix.

---

## 9. Performance & graphics settings

Settings → Graphics (LOW / MEDIUM / HIGH) controls: device pixel ratio cap and decoration
density (buildings/trees/streetlights) on the track. Being 2D Canvas rather than 3D/WebGL,
this game is dramatically lighter on battery and works well even on older phones. The game
auto-picks a starting tier based on device cores/memory, biased toward LOW/MEDIUM on phones.
