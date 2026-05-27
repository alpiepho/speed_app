# Side-Only Mode + Countdown Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove front mode entirely, add a countdown timer that auto-stops measurement, and make the duration configurable via a settings slider with localStorage persistence.

**Architecture:** All changes are confined to `js/speed.js`, `js/simulation.js`, `js/app.js`, `index.html`, `css/app.css`, and `tests/playwright/app.spec.js`. No new files are created. The countdown runs inside the existing `requestAnimationFrame` loop. Duration is stored in `state.duration` and persisted to `localStorage`.

**Tech Stack:** Vanilla HTML/CSS/JS, Playwright for tests.

---

### Task 1: Remove front mode

**Files:**
- Modify: `js/speed.js`
- Modify: `js/simulation.js`
- Modify: `js/app.js`
- Modify: `index.html`
- Modify: `css/app.css`
- Modify: `tests/playwright/app.spec.js`

- [ ] **Step 1: Remove two tests that cover deleted behaviour**

In `tests/playwright/app.spec.js`, delete the entire `test('settings: mode toggle switches SIDE / FRONT', ...)` block (lines 37–47) and the entire `test('calcFrontSpeed converts size growth to mph', ...)` block (lines 90–103).

After deletion the file should have 24 tests (was 25 in app.spec.js + 1 in accuracy.spec.js = 26 total; removing 2 leaves 24).

- [ ] **Step 2: Run tests to confirm 24 pass before any code change**

```bash
npx playwright test --config tests/playwright/playwright.config.js
```

Expected: `24 passed` (accuracy spec counts as 1, app spec 23 — both files together = 24).

- [ ] **Step 3: Replace js/speed.js**

```javascript
const CAR_WIDTH_M = 1.8;
const MS_TO_MPH   = 2.23694;

export function estimateFocalLength() {
  return 800;
}

export function calcSideSpeed(bbox, prevBbox, dt, focalPx) {
  const dx = bbox.x - prevBbox.x;
  const pixelsPerSec = Math.abs(dx) / dt;
  const dist_m = (CAR_WIDTH_M * focalPx) / bbox.width;
  const speed_ms = (pixelsPerSec * dist_m) / focalPx;
  return speed_ms * MS_TO_MPH;
}

export function rollingMedian(values, window) {
  const slice = values.slice(-window);
  const sorted = [...slice].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export class SpeedCalculator {
  constructor(focalPx = estimateFocalLength()) {
    this.focalPx = focalPx;
    this.prevBbox = null;
    this.prevTime = null;
    this.samples = [];
  }

  addFrame(bbox, timestamp) {
    if (!this.prevBbox || !this.prevTime) {
      this.prevBbox = bbox;
      this.prevTime = timestamp;
      return null;
    }
    const dt = (timestamp - this.prevTime) / 1000;
    if (dt <= 0) return null;

    const mph = calcSideSpeed(bbox, this.prevBbox, dt, this.focalPx);

    this.prevBbox = bbox;
    this.prevTime = timestamp;

    if (mph > 0 && mph < 200) this.samples.push(mph);
    return this.samples.length >= 3
      ? Math.round(rollingMedian(this.samples, 15))
      : null;
  }

  getCommittedSpeed() {
    if (this.samples.length < 5) return null;
    return Math.round(rollingMedian(this.samples, 30));
  }

  reset() {
    this.prevBbox = null;
    this.prevTime = null;
    this.samples = [];
  }
}
```

- [ ] **Step 4: Replace js/simulation.js**

```javascript
const CAR_W = 120;
const CAR_H = 55;
const CAR_WIDTH_M = 1.8;
const MS_TO_MPH   = 2.23694;

const PX_PER_MPH = CAR_W / (CAR_WIDTH_M * MS_TO_MPH);  // ≈ 29.8

export class SimulationMode {
  constructor(canvas, speedMph = 35) {
    this.canvas = canvas;
    this.speedMph = speedMph;
    this.ctx = canvas.getContext('2d');
    this._carX = -CAR_W;
    this._raf = null;
    this._lastTime = null;
  }

  start() {
    this._carX = -CAR_W;
    this._lastTime = null;
    this._loop();
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  getCanvas() { return this.canvas; }

  getPresetSpeed() { return this.speedMph; }

  getCarBbox() {
    const carY = this.canvas.height * 0.6;
    return [this._carX, carY, CAR_W, CAR_H];
  }

  _loop(timestamp) {
    this._raf = requestAnimationFrame(ts => this._loop(ts));
    if (!timestamp) return;

    const dt = this._lastTime ? (timestamp - this._lastTime) / 1000 : 0;
    this._lastTime = timestamp;

    this._carX += this.speedMph * PX_PER_MPH * dt;
    if (this._carX > this.canvas.width + CAR_W) this._carX = -CAR_W;

    this._draw();
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#333';
    ctx.fillRect(0, h * 0.55, w, h * 0.35);

    const carY = h * 0.6;
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(this._carX, carY, CAR_W, CAR_H);
    ctx.fillStyle = '#5aa0e9';
    ctx.fillRect(this._carX + CAR_W * 0.2, carY - 28, CAR_W * 0.6, 30);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(this._carX + 22,         carY + CAR_H, 12, 0, Math.PI * 2);
    ctx.arc(this._carX + CAR_W - 22, carY + CAR_H, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(245,158,11,0.7)';
    ctx.font = '11px Arial';
    ctx.fillText(`SIM: ${this.speedMph} mph`, 8, 18);
  }
}
```

- [ ] **Step 5: Replace js/app.js**

```javascript
import { CameraManager } from './camera.js';
import { SimulationMode } from './simulation.js';
import { Detector } from './detector.js';
import { Tracker } from './tracker.js';
import { SpeedCalculator } from './speed.js';

const APP_VERSION = 'v0.2.0';
const APP_URL = 'https://alpiepho.github.io/speed_app/';

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    const on = s.id === id;
    s.classList.toggle('active', on);
    s.classList.toggle('hidden', !on);
  });
}
window._showScreen = showScreen;

const state = {
  simOn: false,
  duration: parseInt(localStorage.getItem('duration') || '5', 10),
  measureStart: null,
  camera: null,
  sim: null,
  detector: new Detector(),
  tracker: new Tracker(),
  calculator: null,
  measureLoop: null,
};

function setSimVisible(on) {
  document.getElementById('sim-canvas').classList.toggle('hidden', !on);
  document.getElementById('camera-video').classList.toggle('hidden', on);
}

function openSettings() {
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}

function toggleSim() {
  state.simOn = !state.simOn;
  document.getElementById('sim-toggle').dataset.on = state.simOn;
  setSimVisible(state.simOn);
  if (state.simOn) {
    const canvas = document.getElementById('sim-canvas');
    canvas.width = 393; canvas.height = 600;
    state.sim = new SimulationMode(canvas, 35);
    state.sim.start();
  } else if (state.sim) {
    state.sim.stop();
    state.sim = null;
  }
}

function copyUrl() {
  navigator.clipboard.writeText(APP_URL).then(() => {
    const btn = document.getElementById('copy-url-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', async () => {
  showScreen('capture-screen');

  state.detector.load().catch(() => {});

  document.getElementById('app-version').textContent = APP_VERSION;

  const slider = document.getElementById('duration-slider');
  slider.value = state.duration;
  document.getElementById('duration-label').textContent = state.duration + 's';
  slider.addEventListener('input', () => {
    state.duration = parseInt(slider.value, 10);
    document.getElementById('duration-label').textContent = state.duration + 's';
    localStorage.setItem('duration', state.duration);
  });

  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  document.getElementById('settings-scrim').addEventListener('click', closeSettings);
  document.getElementById('sim-toggle').addEventListener('click', toggleSim);
  document.getElementById('copy-url-btn').addEventListener('click', copyUrl);

  document.getElementById('measure-btn').addEventListener('click', startMeasuring);
  document.getElementById('stop-btn').addEventListener('click', stopMeasuring);
  document.getElementById('result-screen').addEventListener('click', onResultTap);
  document.getElementById('new-btn').addEventListener('click', e => {
    e.stopPropagation();
    resetToCapture();
  });
});

async function startMeasuring() {
  state.sim?.stop();
  state.tracker.reset();
  state.calculator = new SpeedCalculator();
  state.measureStart = null;

  if (!state.simOn) {
    state.camera = new CameraManager(document.getElementById('tracking-video'));
    await state.camera.start();
  }

  showScreen('tracking-screen');

  if (state.simOn) {
    const simCanvas = document.getElementById('tracking-sim-canvas');
    simCanvas.classList.remove('hidden');
    document.getElementById('tracking-video').classList.add('hidden');
    simCanvas.width = 393; simCanvas.height = 600;
    state.sim = new SimulationMode(simCanvas, 35);
    state.sim.start();
  }

  state.measureLoop = requestAnimationFrame(measureFrame);
}

async function measureFrame(timestamp) {
  if (state.measureStart === null) state.measureStart = timestamp;

  const elapsed = (timestamp - state.measureStart) / 1000;

  if (elapsed >= state.duration) {
    document.getElementById('countdown').textContent = '';
    stopMeasuring();
    return;
  }

  document.getElementById('countdown').textContent = Math.ceil(state.duration - elapsed);

  const src = state.simOn ? state.sim?.getCanvas() : state.camera?.getCanvas();
  if (!src) { state.measureLoop = requestAnimationFrame(measureFrame); return; }

  const detections = state.simOn && state.sim
    ? [{ bbox: state.sim.getCarBbox(), class: 'car', score: 1.0 }]
    : await state.detector.detect(src);

  const locked = state.tracker.update(detections);
  drawOverlay(document.getElementById('tracking-overlay'), src, locked);

  if (locked) {
    const [x, y, w, h] = locked.bbox;
    const mph = state.calculator.addFrame({ x, y, width: w, height: h }, timestamp);
    if (mph !== null) {
      document.getElementById('speed-estimate').textContent = `${mph} mph`;
    }
  } else {
    const committed = state.calculator.getCommittedSpeed();
    if (committed !== null) { showResult(committed); return; }
  }

  state.measureLoop = requestAnimationFrame(measureFrame);
}

function drawOverlay(canvas, src, locked) {
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!locked) return;
  const [x, y, w, h] = locked.bbox;
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

function stopMeasuring() {
  if (state.measureLoop) cancelAnimationFrame(state.measureLoop);
  document.getElementById('countdown').textContent = '';
  const committed = state.calculator?.getCommittedSpeed();
  showResult(committed ?? 0);
}

function showResult(mph) {
  if (state.measureLoop) cancelAnimationFrame(state.measureLoop);
  state.sim?.stop();
  state.camera?.stop();

  document.getElementById('speed-number').textContent = mph;
  showScreen('result-screen');

  if ('orientation' in screen && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {});
  }
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').catch(() => {});
  }
}

function onResultTap() {
  const rs = document.getElementById('result-screen');
  if (rs.classList.contains('night')) {
    rs.classList.replace('night', 'day');
  } else {
    rs.classList.replace('day', 'night');
  }
}

function resetToCapture() {
  state.sim?.stop(); state.sim = null;
  state.camera?.stop(); state.camera = null;
  state.tracker.reset();
  state.calculator?.reset();
  state.measureStart = null;

  document.getElementById('countdown').textContent = '';
  const tsc = document.getElementById('tracking-sim-canvas');
  tsc.classList.add('hidden');
  document.getElementById('tracking-video').classList.remove('hidden');
  document.getElementById('speed-estimate').textContent = '-- mph';
  document.getElementById('result-screen').classList.replace('day', 'night');

  showScreen('capture-screen');
}
```

- [ ] **Step 6: Update index.html**

Remove the MODE row from the settings modal. The section to delete is:
```html
      <div class="settings-row">
        <span class="settings-label">MODE</span>
        <div id="mode-toggle">
          <button id="mode-side" class="active">SIDE</button>
          <button id="mode-front">FRONT</button>
        </div>
      </div>
```

Add a DURATION row immediately after the SIMULATION row (before the `<hr class="settings-divider">`):
```html
      <div class="settings-row">
        <span class="settings-label">DURATION</span>
        <div id="duration-control">
          <input type="range" id="duration-slider" min="3" max="15" step="1" value="5">
          <span id="duration-label">5s</span>
        </div>
      </div>
```

Add `#countdown` inside `#tracking-viewfinder`, after `<canvas id="tracking-overlay"></canvas>`:
```html
      <div id="countdown"></div>
```

The full updated `index.html` body section for the tracking screen should look like:
```html
  <!-- Screen 2: Tracking -->
  <div id="tracking-screen" class="screen hidden">
    <div id="tracking-viewfinder">
      <video id="tracking-video" autoplay playsinline muted></video>
      <canvas id="tracking-sim-canvas" class="hidden"></canvas>
      <canvas id="tracking-overlay"></canvas>
      <div id="countdown"></div>
      <div id="speed-estimate">-- mph</div>
    </div>
    <div id="tracking-controls">
      <button id="stop-btn">&#9646; STOP</button>
    </div>
  </div>
```

- [ ] **Step 7: Update css/app.css**

Remove the `#mode-toggle` block (lines 96–106 in the current file):
```css
/* Mode segmented control */
#mode-toggle {
  display: flex; background: #2a2a2a;
  border: 1px solid #3a3a3a; border-radius: 6px; overflow: hidden;
}
#mode-toggle button {
  padding: 6px 14px; background: transparent; color: #666;
  border: none; font-size: 10px; font-weight: 700;
  letter-spacing: 1px; cursor: pointer;
}
#mode-toggle button.active { background: #f59e0b; color: #000; }
```

Append to the end of `css/app.css`:
```css
/* Countdown overlay */
#countdown {
  position: absolute; top: 40%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 96px; font-weight: 900;
  color: rgba(255,255,255,0.85);
  text-shadow: 0 2px 20px rgba(0,0,0,0.9);
  z-index: 20; pointer-events: none;
  line-height: 1; min-width: 1ch; text-align: center;
}

/* Duration slider row */
#duration-control {
  display: flex; align-items: center; gap: 10px;
}
#duration-slider {
  width: 110px; accent-color: #f59e0b;
}
#duration-label {
  color: #f59e0b; font-size: 12px; font-weight: 700;
  min-width: 26px; text-align: right;
}
```

- [ ] **Step 8: Run all tests**

```bash
npx playwright test --config tests/playwright/playwright.config.js
```

Expected: `24 passed`

- [ ] **Step 9: Commit**

```bash
git add js/speed.js js/simulation.js js/app.js index.html css/app.css tests/playwright/app.spec.js
git commit -m "feat: remove front mode, add countdown timer and duration setting"
```

---

### Task 2: Add countdown and duration tests

**Files:**
- Modify: `tests/playwright/app.spec.js`

- [ ] **Step 1: Add three new tests to app.spec.js**

Append these three tests at the end of `tests/playwright/app.spec.js` (before the final closing line):

```javascript
test('settings: duration slider updates label', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settings-btn').tap();
  await expect(page.locator('#duration-label')).toHaveText('5s');
  await page.evaluate(() => {
    const s = document.getElementById('duration-slider');
    s.value = '8';
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#duration-label')).toHaveText('8s');
});

test('countdown displays during measurement', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settings-btn').tap();
  await page.locator('#sim-toggle').tap();
  await page.locator('#settings-close').tap();
  await page.locator('#measure-btn').tap();
  await expect(page.locator('#tracking-screen')).toBeVisible();
  await page.waitForTimeout(500);
  const text = await page.locator('#countdown').textContent();
  expect(parseInt(text)).toBeGreaterThan(0);
});

test('auto-stop after duration shows result screen', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settings-btn').tap();
  await page.evaluate(() => {
    const s = document.getElementById('duration-slider');
    s.value = '3';
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#sim-toggle').tap();
  await page.locator('#settings-close').tap();
  await page.locator('#measure-btn').tap();
  await expect(page.locator('#tracking-screen')).toBeVisible();
  await expect(page.locator('#result-screen')).toBeVisible({ timeout: 8000 });
});
```

- [ ] **Step 2: Run tests**

```bash
npx playwright test --config tests/playwright/playwright.config.js
```

Expected: `27 passed`

- [ ] **Step 3: Commit**

```bash
git add tests/playwright/app.spec.js
git commit -m "test: add countdown, duration slider, and auto-stop tests"
```

---

### Task 3: Bump service worker cache and version

**Files:**
- Modify: `service-worker.js`

- [ ] **Step 1: Bump cache name**

In `service-worker.js`, change:
```javascript
const CACHE = 'speedapp-v5';
```
to:
```javascript
const CACHE = 'speedapp-v6';
```

- [ ] **Step 2: Commit**

```bash
git add service-worker.js
git commit -m "chore: bump SW cache to v6 for v0.2.0 release"
```
