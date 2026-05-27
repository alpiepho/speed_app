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
