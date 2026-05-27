# SpeedApp

A PWA that uses your phone camera and on-device ML to measure the speed of passing or approaching cars. No server required — everything runs locally after the first load.

## Features

- **Side mode** — car passes left to right; tracks horizontal motion across frames
- **Front mode** — car approaches head-on; tracks bounding box size growth
- **Full-screen result** — large number fills the screen, tap to toggle night/day mode
- **Simulation mode** — animated car for testing without a real vehicle
- **Fully offline** — TF.js and COCO-SSD model cached by service worker after first load

## How It Works

1. Point your phone at the road in portrait mode
2. Tap **▶ MEASURE SPEED**
3. The app tracks the car with a live bounding box overlay
4. Tap **■ STOP** (or the car leaves frame) to commit the reading
5. The speed fills the screen — rotate sideways to show it to the driver
6. Tap the number to toggle night/day brightness; tap **⟳ NEW** to measure again

## Tech Stack

- Vanilla HTML/CSS/JS — no build step, no framework
- [TensorFlow.js](https://www.tensorflow.org/js) + [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) for on-device vehicle detection
- [Playwright](https://playwright.dev) for end-to-end testing
- PWA service worker for offline caching

## Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
npx playwright install chromium
```

### Run locally

```bash
npm run serve
```

Open [http://localhost:3000](http://localhost:3000) in Chrome.

> **Note:** Camera access requires HTTPS on a real device. Use the iPhone instructions below for on-device testing.

### Run tests

```bash
npm test
```

All tests run against a local server at port 3000. The Playwright config uses an iPhone 17 viewport (393×852).

## Testing on iPhone

`getUserMedia` (camera access) requires HTTPS on iOS Safari. Use `mkcert` to create a trusted local certificate:

```bash
# Install mkcert (one-time)
brew install mkcert
mkcert -install

# Generate a local certificate valid for localhost and LAN IP (one-time per machine)
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1

# Serve with HTTPS
npx serve . -p 3000 --ssl-cert localhost.pem --ssl-key localhost-key.pem
```

**Trust the certificate on your iPhone** (one-time per device):

1. AirDrop `$(mkcert -CAROOT)/rootCA.pem` from your Mac to your iPhone and tap Accept
2. On iPhone: **Settings → General → VPN & Device Management** → tap the downloaded profile → **Install**
3. **Settings → General → About → Certificate Trust Settings** → enable full trust for the mkcert certificate

> Step 3 is required — installing the profile alone is not enough.

Then open the app:

1. Find your Mac's local IP: `ipconfig getifaddr en0`
2. Open `https://<your-mac-ip>:3000` in Safari
3. Tap **Share → Add to Home Screen** to install as a PWA
4. Open from your home screen for the full-screen experience

> The `*.pem` certificate files are git-ignored. Re-run the `mkcert` command above if you switch machines.

## Project Structure

```
speed_app/
├── index.html            # Single-page app shell
├── manifest.json         # PWA config
├── service-worker.js     # Offline asset cache
├── icon.svg              # "55" home screen icon
├── css/
│   ├── app.css           # Capture + tracking screen layout
│   └── result.css        # Full-screen number, night/day themes
├── js/
│   ├── app.js            # Screen router and event wiring
│   ├── camera.js         # getUserMedia + 30fps canvas loop
│   ├── simulation.js     # Animated car canvas for testing
│   ├── detector.js       # COCO-SSD wrapper
│   ├── tracker.js        # IoU-based bounding box tracker
│   └── speed.js          # Side/front MPH math, rolling median
├── tests/playwright/
│   ├── playwright.config.js
│   ├── app.spec.js       # UI flow + unit tests
│   └── accuracy.spec.js  # End-to-end speed accuracy test
└── docs/
    └── superpowers/
        ├── specs/        # Design spec
        └── plans/        # Implementation plan
```

## Accuracy Notes

- Target accuracy: ±3–5 mph at typical residential speeds
- Uses the car's bounding box width (side mode) or height growth (front mode) plus an estimated focal length to convert pixel velocity to MPH
- A ±20% focal length nudge is available in `js/speed.js` (`estimateFocalLength()`) if readings feel consistently high or low on your device
- The COCO-SSD model detects cars, trucks, and buses with ≥40% confidence
