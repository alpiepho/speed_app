const CAR_W = 120;
const CAR_H = 55;
const CAR_WIDTH_M  = 1.8;
const CAR_HEIGHT_M = 1.5;
const FOCAL_PX     = 800;
const MS_TO_MPH    = 2.23694;

// px/s that makes calcSideSpeed return the correct mph
// speed_mph = pxPerSec * CAR_W / (CAR_WIDTH_M * FOCAL_PX * MS_TO_MPH)
const PX_PER_MPH = CAR_W / (CAR_WIDTH_M * MS_TO_MPH);  // ≈ 29.8

const FRONT_START_M = 50;  // meters — car starts this far away
const FRONT_MIN_M   = 5;   // meters — reset when this close

export class SimulationMode {
  constructor(canvas, speedMph = 35, mode = 'side') {
    this.canvas = canvas;
    this.speedMph = speedMph;
    this.mode = mode;
    this.ctx = canvas.getContext('2d');
    this._carX = -CAR_W;
    this._dist_m = FRONT_START_M;
    this._raf = null;
    this._lastTime = null;
  }

  start() {
    this._carX = -CAR_W;
    this._dist_m = FRONT_START_M;
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
    if (this.mode === 'side') {
      const carY = this.canvas.height * 0.6;
      return [this._carX, carY, CAR_W, CAR_H];
    }
    // front: bbox sized by apparent distance so calcFrontSpeed returns correct mph
    const bh = (CAR_HEIGHT_M * FOCAL_PX) / this._dist_m;
    const bw = (CAR_WIDTH_M  * FOCAL_PX) / this._dist_m;
    return [(this.canvas.width - bw) / 2, (this.canvas.height - bh) / 2, bw, bh];
  }

  _loop(timestamp) {
    this._raf = requestAnimationFrame(ts => this._loop(ts));
    if (!timestamp) return;

    const dt = this._lastTime ? (timestamp - this._lastTime) / 1000 : 0;
    this._lastTime = timestamp;

    if (this.mode === 'side') {
      this._carX += this.speedMph * PX_PER_MPH * dt;
      if (this._carX > this.canvas.width + CAR_W) this._carX = -CAR_W;
    } else {
      this._dist_m -= (this.speedMph / MS_TO_MPH) * dt;
      if (this._dist_m < FRONT_MIN_M) this._dist_m = FRONT_START_M;
    }

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

    if (this.mode === 'side') {
      const carY = h * 0.6;
      ctx.fillStyle = '#4a90d9';
      ctx.fillRect(this._carX, carY, CAR_W, CAR_H);
      ctx.fillStyle = '#5aa0e9';
      ctx.fillRect(this._carX + CAR_W * 0.2, carY - 28, CAR_W * 0.6, 30);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(this._carX + 22,          carY + CAR_H, 12, 0, Math.PI * 2);
      ctx.arc(this._carX + CAR_W - 22,  carY + CAR_H, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const bh = (CAR_HEIGHT_M * FOCAL_PX) / this._dist_m;
      const bw = (CAR_WIDTH_M  * FOCAL_PX) / this._dist_m;
      const cx = w / 2;
      const cy = h * 0.65;
      const x  = cx - bw / 2;
      const y  = cy - bh;
      ctx.fillStyle = '#4a90d9';
      ctx.fillRect(x, y, bw, bh);
      ctx.fillStyle = '#5aa0e9';
      ctx.fillRect(x + bw * 0.15, y - bh * 0.4, bw * 0.7, bh * 0.4);
      ctx.fillStyle = '#222';
      const wr = bh * 0.18;
      ctx.beginPath();
      ctx.arc(x + bw * 0.25, y + bh + wr * 0.5, wr, 0, Math.PI * 2);
      ctx.arc(x + bw * 0.75, y + bh + wr * 0.5, wr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(245,158,11,0.7)';
    ctx.font = '11px Arial';
    ctx.fillText(`SIM ${this.mode.toUpperCase()}: ${this.speedMph} mph`, 8, 18);
  }
}
