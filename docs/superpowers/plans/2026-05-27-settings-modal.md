# Settings Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SIDE/FRONT and SIM ON/OFF overlay badges on the capture screen with a single ⚙ settings button that opens a centered modal, and add an About section with version number and copyable GitHub Pages URL.

**Architecture:** All changes are confined to `index.html`, `css/app.css`, and `js/app.js`. The modal is a hidden `<div>` in the HTML, shown/hidden via the `.hidden` CSS class. State management (`state.mode`, `state.simOn`) is unchanged — only the UI controls that write to it are replaced. Tests in `app.spec.js` are updated to drive settings through the modal rather than direct badge taps.

**Tech Stack:** Vanilla HTML/CSS/JS, Playwright for tests.

---

### Task 1: HTML — replace badges with settings button and modal

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace badge elements with settings button**

Inside `<div id="viewfinder">`, replace:
```html
<div id="mode-badge" data-mode="side">SIDE</div>
<div id="sim-badge" data-sim="off">SIM OFF</div>
```
with:
```html
<button id="settings-btn">⚙</button>
```

- [ ] **Step 2: Add modal HTML**

Add this immediately before `</body>`:
```html
<!-- Settings modal -->
<div id="settings-modal" class="hidden">
  <div id="settings-scrim"></div>
  <div id="settings-card">
    <div id="settings-header">
      <span>SETTINGS</span>
      <button id="settings-close">✕</button>
    </div>
    <div class="settings-row">
      <span class="settings-label">MODE</span>
      <div id="mode-toggle">
        <button id="mode-side" class="active">SIDE</button>
        <button id="mode-front">FRONT</button>
      </div>
    </div>
    <div class="settings-row">
      <span class="settings-label">SIMULATION</span>
      <button id="sim-toggle" data-on="false"></button>
    </div>
    <hr class="settings-divider">
    <div id="settings-about">
      <span class="settings-label">ABOUT</span>
      <div class="settings-row">
        <span class="settings-about-key">Version</span>
        <span id="app-version"></span>
      </div>
      <div id="settings-url-row">
        <span id="app-url">https://alpiepho.github.io/speed_app/</span>
        <button id="copy-url-btn">Copy</button>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "feat: replace badges with settings button and modal HTML"
```

---

### Task 2: CSS — remove badge styles, add settings button and modal styles

**Files:**
- Modify: `css/app.css`

- [ ] **Step 1: Remove badge styles**

Delete these lines from `css/app.css`:
```css
#mode-badge, #sim-badge {
  position: absolute; z-index: 10;
  padding: 4px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 700; letter-spacing: 1px;
  cursor: pointer; user-select: none;
}
#mode-badge { top: 12px; left: 12px; background: rgba(96,165,250,0.25); color: #60a5fa; }
#sim-badge  { top: 12px; right: 12px; background: rgba(245,158,11,0.2); color: #f59e0b; }
```

- [ ] **Step 2: Append settings button and modal styles**

Add to the end of `css/app.css`:
```css
/* Settings button */
#settings-btn {
  position: absolute; top: 12px; right: 12px; z-index: 10;
  width: 34px; height: 34px;
  background: rgba(0,0,0,0.55); border: 1px solid #333; border-radius: 6px;
  color: #f59e0b; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

/* Modal overlay */
#settings-modal {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
}
#settings-scrim {
  position: absolute; inset: 0; background: rgba(0,0,0,0.72);
}
#settings-card {
  position: relative; background: #1c1c1e; border-radius: 14px;
  padding: 20px 22px; width: min(320px, 85vw);
  box-shadow: 0 8px 40px rgba(0,0,0,0.9);
}
#settings-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}
#settings-header span {
  color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 1.5px;
}
#settings-close {
  background: none; border: none; color: #555; font-size: 18px;
  cursor: pointer; line-height: 1; padding: 0;
}

/* Settings rows */
.settings-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.settings-label {
  color: #aaa; font-size: 10px; font-weight: 600; letter-spacing: 1px;
}

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

/* Sim toggle switch */
#sim-toggle {
  width: 52px; height: 28px;
  background: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 14px;
  position: relative; cursor: pointer;
}
#sim-toggle::after {
  content: ''; width: 22px; height: 22px;
  background: #555; border-radius: 50%;
  position: absolute; top: 2px; left: 2px;
  transition: left 0.2s, background 0.2s;
}
#sim-toggle[data-on="true"] {
  background: rgba(245,158,11,0.2); border-color: #f59e0b;
}
#sim-toggle[data-on="true"]::after {
  background: #f59e0b; left: 26px;
}

/* About section */
.settings-divider { border: none; border-top: 1px solid #2a2a2a; margin: 4px 0 16px; }
#settings-about .settings-label { display: block; margin-bottom: 10px; }
.settings-about-key { color: #666; font-size: 11px; }
#app-version { color: #aaa; font-size: 11px; font-weight: 600; }
#settings-url-row {
  display: flex; align-items: center; gap: 8px; margin-top: 8px;
}
#app-url {
  color: #4a9eff; font-size: 10px;
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
#copy-url-btn {
  background: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 5px;
  color: #ccc; font-size: 10px; padding: 4px 10px; cursor: pointer;
  white-space: nowrap; flex-shrink: 0;
}
```

- [ ] **Step 3: Commit**
```bash
git add css/app.css
git commit -m "feat: add settings button and modal CSS"
```

---

### Task 3: JS — wire settings modal, mode/sim controls, copy button

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add constants at top of file (after imports)**

```javascript
const APP_VERSION = 'v0.1.0';
const APP_URL = 'https://alpiepho.github.io/speed_app/';
```

- [ ] **Step 2: Remove old badge wiring from DOMContentLoaded**

Delete the `modeBadge` block:
```javascript
// DELETE:
const modeBadge = document.getElementById('mode-badge');
modeBadge.addEventListener('click', () => {
  state.mode = state.mode === 'side' ? 'front' : 'side';
  modeBadge.textContent = state.mode === 'side' ? 'SIDE' : 'FRONT';
  modeBadge.dataset.mode = state.mode;
});
```

Delete the `simBadge` block:
```javascript
// DELETE:
const simBadge = document.getElementById('sim-badge');
simBadge.addEventListener('click', () => {
  state.simOn = !state.simOn;
  simBadge.textContent = state.simOn ? 'SIM ON' : 'SIM OFF';
  simBadge.dataset.sim = state.simOn ? 'on' : 'off';
  setSimVisible(state.simOn);
  if (state.simOn) {
    const canvas = document.getElementById('sim-canvas');
    canvas.width = 393; canvas.height = 600;
    state.sim = new SimulationMode(canvas, 35, state.mode);
    state.sim.start();
  } else if (state.sim) {
    state.sim.stop();
    state.sim = null;
  }
});
```

- [ ] **Step 3: Add settings event listeners in DOMContentLoaded**

After the line `state.detector.load().catch(() => {});`, add:
```javascript
  document.getElementById('app-version').textContent = APP_VERSION;

  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  document.getElementById('settings-scrim').addEventListener('click', closeSettings);
  document.getElementById('mode-side').addEventListener('click', () => setMode('side'));
  document.getElementById('mode-front').addEventListener('click', () => setMode('front'));
  document.getElementById('sim-toggle').addEventListener('click', toggleSim);
  document.getElementById('copy-url-btn').addEventListener('click', copyUrl);
```

- [ ] **Step 4: Add helper functions after `setSimVisible`**

```javascript
function openSettings() {
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}

function setMode(mode) {
  state.mode = mode;
  document.getElementById('mode-side').classList.toggle('active', mode === 'side');
  document.getElementById('mode-front').classList.toggle('active', mode === 'front');
}

function toggleSim() {
  state.simOn = !state.simOn;
  document.getElementById('sim-toggle').dataset.on = state.simOn;
  setSimVisible(state.simOn);
  if (state.simOn) {
    const canvas = document.getElementById('sim-canvas');
    canvas.width = 393; canvas.height = 600;
    state.sim = new SimulationMode(canvas, 35, state.mode);
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
```

- [ ] **Step 5: Verify in browser**

Serve the app (`npm run serve`) and open it. Confirm:
- ⚙ button visible top-right, old badges gone
- Tapping ⚙ opens centered modal over dark scrim
- SIDE button is amber (active), FRONT is dim
- Sim toggle is grey (off)
- Version shows `v0.1.0`, URL row shows the GitHub link
- Tapping FRONT highlights it amber and dims SIDE
- Tapping sim toggle animates pill right and turns amber; capture viewfinder shows sim canvas
- Tapping ✕ or outside modal closes it
- Copy button changes to "Copied!" for 1.5 s

- [ ] **Step 6: Commit**
```bash
git add js/app.js
git commit -m "feat: wire settings modal with mode, sim, and copy controls"
```

---

### Task 4: Update tests

**Files:**
- Modify: `tests/playwright/app.spec.js`

- [ ] **Step 1: Replace mode badge test**

Replace `test('mode badge toggles SIDE / FRONT on tap', ...)` with:
```javascript
test('settings: mode toggle switches SIDE / FRONT', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settings-btn').tap();
  await expect(page.locator('#settings-modal')).toBeVisible();
  await expect(page.locator('#mode-side')).toHaveClass(/active/);
  await page.locator('#mode-front').tap();
  await expect(page.locator('#mode-front')).toHaveClass(/active/);
  await expect(page.locator('#mode-side')).not.toHaveClass(/active/);
  await page.locator('#mode-side').tap();
  await expect(page.locator('#mode-side')).toHaveClass(/active/);
});
```

- [ ] **Step 2: Replace sim badge test**

Replace `test('sim badge toggles SIM OFF / SIM ON on tap', ...)` with:
```javascript
test('settings: sim toggle switches ON / OFF', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settings-btn').tap();
  await expect(page.locator('#sim-toggle')).toHaveAttribute('data-on', 'false');
  await page.locator('#sim-toggle').tap();
  await expect(page.locator('#sim-toggle')).toHaveAttribute('data-on', 'true');
});
```

- [ ] **Step 3: Replace "sim canvas becomes visible when SIM ON" test**

Replace `test('sim canvas becomes visible when SIM ON', ...)` with:
```javascript
test('sim canvas becomes visible when SIM ON', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#sim-canvas')).toBeHidden();
  await page.locator('#settings-btn').tap();
  await page.locator('#sim-toggle').tap();
  await page.locator('#settings-close').tap();
  await expect(page.locator('#sim-canvas')).toBeVisible();
});
```

- [ ] **Step 4: Replace "SIM ON shows sim canvas, hides video" test**

Replace `test('SIM ON shows sim canvas, hides video', ...)` with:
```javascript
test('SIM ON shows sim canvas, hides video', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settings-btn').tap();
  await page.locator('#sim-toggle').tap();
  await page.locator('#settings-close').tap();
  await expect(page.locator('#sim-canvas')).toBeVisible();
  await expect(page.locator('#camera-video')).toBeHidden();
});
```

- [ ] **Step 5: Update flow tests — replace #sim-badge tap with settings sequence**

In each of these three tests, replace `await page.locator('#sim-badge').tap()` with the three-line settings sequence:
```javascript
  await page.locator('#settings-btn').tap();
  await page.locator('#sim-toggle').tap();
  await page.locator('#settings-close').tap();
```

Tests to update:
- `test('STOP button commits speed and shows result', ...)`
- `test('full sim flow: capture → tracking → stop → result shows a number', ...)`
- `test('MEASURE SPEED button navigates to tracking screen', ...)`

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: all tests pass. Fix any failing test before continuing.

- [ ] **Step 7: Commit**
```bash
git add tests/playwright/app.spec.js
git commit -m "test: update specs to use settings modal instead of badges"
```

---

### Task 5: Bump service worker cache version

**Files:**
- Modify: `service-worker.js`

- [ ] **Step 1: Increment cache version**

Change:
```javascript
const CACHE = 'speedapp-v4';
```
to:
```javascript
const CACHE = 'speedapp-v5';
```

- [ ] **Step 2: Commit**
```bash
git add service-worker.js
git commit -m "chore: bump SW cache to v5 for settings modal release"
```
