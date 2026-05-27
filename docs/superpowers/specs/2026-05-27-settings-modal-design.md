# Settings Modal Design

**Date:** 2026-05-27
**Status:** Approved

## Overview

Replace the two overlay badges on the capture screen (SIDE/FRONT mode and SIM ON/OFF) with a single ⚙ settings button that opens a centered modal. Add an About section to the modal showing the app version and a copyable GitHub Pages URL.

## Capture Screen Changes

- Remove `#mode-badge` and `#sim-badge` elements from the HTML and all related JS event listeners.
- Add a single `#settings-btn` button (⚙ glyph) positioned top-right, styled semi-transparent with an amber icon to match the existing aesthetic.
- No mode or sim state is shown on the capture screen when the modal is closed; users open Settings to see or change them.

## Settings Modal

A centered overlay modal triggered by `#settings-btn`. Sits above a dark semi-transparent scrim. Dismissed by tapping the ✕ button or tapping outside the modal card.

### Controls

| Row | Label | Control |
|-----|-------|---------|
| 1 | MODE | Segmented SIDE / FRONT toggle. Active segment has amber background, inactive is dim. |
| 2 | SIMULATION | Toggle switch. Off = grey, On = amber. |

### About Section

Separated from controls by a horizontal rule. Contains:
- **Version** row: label "Version" left, `v0.1.0` right (hardcoded constant `APP_VERSION` in `app.js` — no build step needed).
- **URL** row: GitHub Pages URL (`https://alpiepho.github.io/speed_app/`) in blue, truncated with ellipsis if needed, plus a **Copy** button. Tapping Copy writes the URL to the clipboard and briefly changes the button label to "Copied!" for 1.5 s before reverting.

## State Management

`state.mode` and `state.simOn` in `app.js` are unchanged. The modal controls read from and write to those same state values. Closing the modal does not reset state; the last-selected values persist for the session.

## File Changes

| File | Change |
|------|--------|
| `index.html` | Remove mode/sim badges; add `#settings-btn`; add modal HTML (hidden by default) |
| `css/app.css` | Add styles for `#settings-btn`, modal scrim, modal card, segmented control, toggle switch, copy button |
| `js/app.js` | Remove badge click handlers; add open/close modal logic; wire Mode + Sim controls; add Copy-to-clipboard with "Copied!" feedback |

## What Does Not Change

- `state.mode` and `state.simOn` fields — same names, same values.
- Tracking screen, result screen, sim/camera logic — untouched.
- The `#mode-badge` data attribute (`data-mode`) used in any tests will need updating (see Testing).

## Testing

- `app.spec.js` has a test `'sim badge toggles SIM OFF / SIM ON on tap'` and several others referencing `#sim-badge` and `#mode-badge` — update selectors to the new modal controls.
- Add tests: open modal, change mode, close, verify `state.mode` reflects change; same for sim toggle.
