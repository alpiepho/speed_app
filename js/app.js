import { CameraManager } from './camera.js';
import { SimulationMode } from './simulation.js';
import { Detector } from './detector.js';
import { Tracker } from './tracker.js';
import { SpeedCalculator } from './speed.js';

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.toggle('active', s.id === id);
    s.classList.toggle('hidden', s.id !== id);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  showScreen('capture-screen');
});
