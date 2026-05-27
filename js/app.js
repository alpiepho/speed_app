import { CameraManager } from './camera.js';
import { SimulationMode } from './simulation.js';
import { Detector } from './detector.js';
import { Tracker } from './tracker.js';
import { SpeedCalculator } from './speed.js';

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    const on = s.id === id;
    s.classList.toggle('active', on);
    s.classList.toggle('hidden', !on);
  });
}
window._showScreen = showScreen;

const state = {
  mode: 'side',
  simOn: false,
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

document.addEventListener('DOMContentLoaded', async () => {
  showScreen('capture-screen');

  // Pre-load model in background
  state.detector.load().catch(() => {});

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
  });

  document.getElementById('measure-btn').addEventListener('click', startMeasuring);
  document.getElementById('stop-btn').addEventListener('click', stopMeasuring);
  document.getElementById('result-screen').addEventListener('click', onResultTap);
  document.getElementById('new-btn').addEventListener('click', e => {
    e.stopPropagation();
    resetToCapture();
  });
});

async function startMeasuring() {
  state.sim?.stop();   // stop capture-screen sim before creating tracking-screen sim
  state.tracker.reset();
  state.calculator = new SpeedCalculator(state.mode);

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
  const src = state.simOn ? state.sim?.getCanvas() : state.camera?.getCanvas();
  if (!src) { state.measureLoop = requestAnimationFrame(measureFrame); return; }

  const detections = await state.detector.detect(src);
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

  const tsc = document.getElementById('tracking-sim-canvas');
  tsc.classList.add('hidden');
  document.getElementById('tracking-video').classList.remove('hidden');
  document.getElementById('speed-estimate').textContent = '-- mph';
  document.getElementById('result-screen').classList.replace('day', 'night');

  showScreen('capture-screen');
}
