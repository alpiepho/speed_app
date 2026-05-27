# Side-Only Mode + Countdown Timer Design

## Goal

Simplify SpeedApp for its primary real-world use case: measuring car speeds from a sidewalk while walking against traffic. Remove the unused front mode, add a configurable countdown timer that auto-stops measurement, and persist the duration preference.

## Context

The app was built with a SIDE/FRONT mode toggle, but front mode is not useful in practice — users stand or walk beside the road with the camera aimed perpendicular to traffic. Walking against traffic at ~3 mph introduces a minor relative-velocity bias (~3 mph over-read) that is acceptable noise for casual speed checking. No physics correction is needed.

---

## Architecture

### Files modified

- `js/speed.js` — remove `calcFrontSpeed`; remove `mode` param from `SpeedCalculator`
- `js/simulation.js` — remove `mode` param and all front-mode branches; side-only
- `js/app.js` — remove `state.mode`, `setMode()`; add `state.duration`; wire duration slider; add countdown logic inside `measureFrame`
- `index.html` — remove MODE row from settings modal; add DURATION slider row; add `#countdown` element in tracking viewfinder
- `css/app.css` — remove `#mode-toggle` styles; add countdown overlay styles; add duration slider styles
- `tests/playwright/app.spec.js` — remove mode-toggle test; add countdown and duration tests

---

## Feature 1: Algorithm simplification

- `calcFrontSpeed` is deleted from `speed.js`.
- `SpeedCalculator` constructor no longer accepts `mode`. It always calls `calcSideSpeed`.
- `SimulationMode` constructor no longer accepts `mode`. The `_loop`, `_draw`, and `getCarBbox` methods drop all front-mode branches.
- `state.mode` is removed from `app.js`. Both `SimulationMode` and `SpeedCalculator` constructors are called without a mode argument.
- `setMode()` function and its event listeners are deleted.
- The MODE segmented control (`#mode-toggle`, `#mode-side`, `#mode-front`) is removed from the settings modal HTML and its CSS is removed.
- The settings modal now has two rows: SIMULATION and DURATION.

---

## Feature 2: Countdown timer

### Behavior

- `state.duration` holds the measurement duration in seconds (default 5).
- When `startMeasuring()` is called, `state.measureStart` is set to the current timestamp.
- Inside `measureFrame(timestamp)`, elapsed time is checked each frame:
  ```
  elapsed = (timestamp - state.measureStart) / 1000
  remaining = Math.ceil(state.duration - elapsed)
  ```
- The `#countdown` element shows `remaining` each frame (integer seconds).
- When `elapsed >= state.duration`, `stopMeasuring()` is called automatically.
- STOP button remains visible and functional for early exit.

### UI

- `#countdown` is a centered overlay element in `#tracking-viewfinder`, above `#speed-estimate`.
- Displays as a large bold number (e.g. "5", "4" … "1").
- Disappears (hidden) when not on the tracking screen.

---

## Feature 3: Duration setting

### UI

- DURATION row in settings modal: label "DURATION", a `<input type="range">` slider (id `#duration-slider`, min=3, max=15, step=1), and a `<span>` label (id `#duration-label`) showing the current value as "Xs" (e.g. "5s").
- Label updates live as slider moves.

### State & persistence

- `state.duration` is initialized from `localStorage.getItem('duration')` on load, defaulting to 5 if not set.
- On slider input, `state.duration` is updated and `localStorage.setItem('duration', state.duration)` is called.

---

## Testing

Tests to add (in `app.spec.js`):
1. **Duration slider updates label** — open settings, move slider, verify `#duration-label` text changes.
2. **Countdown counts down** — start sim mode, tap MEASURE SPEED, wait 1.5s, verify `#countdown` shows a number less than `state.duration`.
3. **Auto-stop after duration** — start sim mode, set duration to 3s via slider, tap MEASURE, wait 4s, verify result screen is visible.

Tests to remove:
- `settings: mode toggle switches SIDE / FRONT` (mode toggle no longer exists)

---

## Out of scope

- Correcting for walking speed (bias is acceptable).
- Saving any other settings to localStorage beyond duration.
- Changing the simulation preset speed (still 35 mph).
