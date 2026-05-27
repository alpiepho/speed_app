# SpeedApp — Design Spec
_Date: 2026-05-27_

## Overview

SpeedApp is a PWA that uses the phone camera and on-device ML to measure the speed of passing or approaching cars. The user holds the phone in portrait, points it at a car, taps Measure, and when a reading is ready the app displays a full-screen number they can turn sideways to read — or flash at the oncoming car.

---

## Target Platform

- **Device:** iPhone 17 (logical viewport: 393×852px portrait, 852×393px landscape)
- **Browser:** iOS Safari, installed as PWA via Add to Home Screen
- **Connectivity:** Fully offline after first load (model cached by service worker)
- **HTTPS:** Required for `getUserMedia`; use `mkcert` for local dev

---

## User Flow

```
[Portrait — Capture Screen]
  User points camera at road, selects Side or Front mode.
  Taps "▶ MEASURE SPEED"
      ↓
[Portrait — Tracking Screen]
  Live camera feed with bounding box overlay.
  Rolling speed estimate updates in real time (~34 mph).
  User taps "■ STOP" (or car leaves frame automatically stops).
      ↓
[Landscape — Result Screen]
  Full-screen speed number. Tiny "mph" in corner. No other chrome.
  App requests max screen brightness.
  Tap anywhere → toggles night mode (white-on-black) ↔ day mode (black-on-white).
  "⟳ NEW" button (faded, top-left) → returns to Capture Screen.
```

---

## Screens

### 1. Capture Screen (portrait)
- Live camera viewfinder fills most of the screen
- Mode badge top-left: **SIDE** or **FRONT** (tappable to toggle)
- Simulation toggle top-right: **SIM OFF / SIM ON**
- Red **▶ MEASURE SPEED** button at the bottom
- When sim is ON, the camera feed is replaced by the simulation canvas

### 2. Tracking Screen (portrait)
- Camera (or sim) feed with a green bounding box drawn around the locked car
- A motion trail shows the direction of travel
- Rolling speed estimate displayed in large text at the bottom of the viewfinder
- **■ STOP** button below the feed
- Automatically stops and advances to result when the car leaves frame

### 3. Result Screen (landscape)
- Full-screen number, maximum font size to fill the viewport height
- Tiny **mph** label in bottom-right corner (unobtrusive)
- Background is black (night mode default)
- **Tap anywhere** toggles night (white-on-black) ↔ day (black-on-white) mode
- **⟳ NEW** button: faded, top-left corner — returns to Capture Screen and resets state
- App calls `screen.orientation.lock('landscape')` and maximises brightness on entry
- Returns to portrait on ⟳ NEW

---

## Speed Detection — Approach A (COCO-SSD + bbox tracking)

### Pipeline (both modes share steps 1–3 and 5)

1. **Frame capture** — `CameraManager` grabs 30fps frames to a hidden canvas. In sim mode, `SimulationMode` draws an animated car at a preset speed instead.
2. **COCO-SSD detection** — TensorFlow.js runs inference each frame. Accepts detections classified as `car`, `truck`, or `bus` with confidence ≥ 40%.
3. **Target lock** — Locks onto the largest bounding box (closest car). Tracks identity across frames using IoU overlap. Re-acquires if the car leaves frame.
4. **Speed math (mode-dependent):**
   - **Side mode:** Track centroid X across frames.
     ```
     pixelsPerSec = Δx / Δt
     dist_m       = (CAR_WIDTH_M × focalPx) / bboxWidth_px
     speed_ms     = pixelsPerSec × dist_m / focalPx
     speed_mph    = speed_ms × 2.237
     ```
   - **Front mode:** Track bbox height growth each frame.
     ```
     dist_m    = (CAR_HEIGHT_M × focalPx) / bboxHeight_px
     speed_ms  = Δdist_m / Δt
     speed_mph = speed_ms × 2.237
     ```
   - `CAR_WIDTH_M = 1.8`, `CAR_HEIGHT_M = 1.5` (average sedan)
   - `focalPx` estimated from device pixel ratio + known iPhone camera spec; user can apply ±20% nudge in settings
5. **Smooth + commit** — Rolling median over 15 frames suppresses spikes. On STOP, the median of the last 30 stable frames is the committed result.

### Accuracy target: ±3–5 mph

---

## Simulation Mode

- A canvas animation draws a car (rectangle with wheels) moving at a configurable preset speed (default 35 mph)
- The animated canvas is fed directly into the same detection pipeline as a real camera feed
- Used for Playwright testing and for demoing the app without a car present
- Preset speed is visible as a small label during simulation so test assertions can compare input vs. output

---

## App Icon

- SVG showing bold **"55"** in a contrasting color on a dark background
- Renders sharp at all PWA icon sizes (192×192, 512×512, maskable)

---

## File Structure

```
speed_app/
├── index.html            # Single-page app shell, all screens in DOM
├── manifest.json         # PWA: display fullscreen, orientation any, icon
├── service-worker.js     # Pre-caches TF.js + COCO-SSD model on install
├── icon.svg              # "55" app icon
├── css/
│   ├── app.css           # Screen layout, capture + tracking screens
│   └── result.css        # Full-screen number, night/day themes
└── js/
    ├── app.js            # Screen router, state machine
    ├── camera.js         # getUserMedia, 30fps canvas frame loop
    ├── detector.js       # COCO-SSD wrapper, confidence filter
    ├── tracker.js        # Bbox lock, IoU identity tracking
    ├── speed.js          # Side + front MPH calculations
    └── simulation.js     # Animated car canvas at preset speed
```

---

## Tech Stack

- **Vanilla HTML/CSS/JS** — no framework, no build step
- **TensorFlow.js** (~3MB, cached)
- **COCO-SSD model** (~8MB, cached)
- **Playwright** for end-to-end testing
- **npx serve .** for local dev; HTTPS via `mkcert` for real-device testing

---

## Testing Plan (Playwright)

| Test | How |
|------|-----|
| App loads, capture screen visible | Navigate to localhost, assert `#capture-screen` visible |
| Sim mode toggle | Click SIM toggle, assert canvas animation starts |
| Measure → tracking screen | Click MEASURE, assert `#tracking-screen` visible and bbox overlay appears |
| Speed accuracy | Sim at 35 mph preset, assert committed result is 30–40 mph |
| Result screen layout | Assert number fills viewport, no overflow, ⟳ NEW visible |
| Night/day toggle | Tap result screen, assert background color flips |
| Reset flow | Tap ⟳ NEW, assert capture screen returns |
| iPhone 17 viewport | Set viewport 393×852, run full flow |

---

## Out of Scope (v1)

- Speed history / logging (noted for future)
- KPH units
- Multiple simultaneous car tracking
- Audio alert when speed is determined
