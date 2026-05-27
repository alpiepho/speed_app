const CAR_W = 120;
const CAR_H = 55;

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

  _loop(timestamp) {
    this._raf = requestAnimationFrame(ts => this._loop(ts));
    if (!timestamp) return;

    const dt = this._lastTime ? (timestamp - this._lastTime) / 1000 : 0;
    this._lastTime = timestamp;

    // 1 mph ≈ 4 px/s at this canvas scale
    const pxPerSec = this.speedMph * 4;
    this._carX += pxPerSec * dt;

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
    ctx.arc(this._carX + 22, carY + CAR_H, 12, 0, Math.PI * 2);
    ctx.arc(this._carX + CAR_W - 22, carY + CAR_H, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(245,158,11,0.7)';
    ctx.font = '11px Arial';
    ctx.fillText(`SIM: ${this.speedMph} mph`, 8, 18);
  }
}
