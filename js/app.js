import { CameraManager } from './camera.js';
import { SimulationMode } from './simulation.js';
import { Detector } from './detector.js';
import { Tracker } from './tracker.js';
import { SpeedCalculator } from './speed.js';

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    const active = s.id === id;
    s.classList.toggle('active', active);
    s.classList.toggle('hidden', !active);
  });
}

// Expose for Playwright
window._showScreen = showScreen;

const state = {
  mode: 'side',
  simOn: false,
};

document.addEventListener('DOMContentLoaded', () => {
  showScreen('capture-screen');

  const modeBadge = document.getElementById('mode-badge');
  modeBadge.addEventListener('click', () => {
    state.mode = state.mode === 'side' ? 'front' : 'side';
    modeBadge.textContent = state.mode === 'side' ? 'SIDE' : 'FRONT';
    modeBadge.dataset.mode = state.mode;
  });

  const simBadge = document.getElementById('sim-badge');
  simBadge.addEventListener('click', () => {
    state.simOn = !state.simOn;
    simBadge.textContent = state.simOn ? 'SIM ON' : 'SIM OFF';
    simBadge.dataset.sim = state.simOn ? 'on' : 'off';
  });
});
