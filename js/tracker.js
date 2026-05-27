// box format: [x, y, width, height]
export function iou(a, b) {
  const [ax, ay, aw, ah] = a;
  const [bx, by, bw, bh] = b;
  const ix = Math.max(0, Math.min(ax + aw, bx + bw) - Math.max(ax, bx));
  const iy = Math.max(0, Math.min(ay + ah, by + bh) - Math.max(ay, by));
  const intersection = ix * iy;
  const union = aw * ah + bw * bh - intersection;
  return union <= 0 ? 0 : intersection / union;
}

function area(box) { return box[2] * box[3]; }

export class Tracker {
  constructor() { this.locked = null; }

  update(detections) {
    if (!detections.length) {
      this.locked = null;
      return null;
    }

    if (!this.locked) {
      this.locked = detections.reduce((best, d) =>
        area(d.bbox) > area(best.bbox) ? d : best
      );
      return this.locked;
    }

    // Find detection with highest IoU vs locked
    let best = null, bestIou = 0;
    for (const d of detections) {
      const score = iou(this.locked.bbox, d.bbox);
      if (score > bestIou) { bestIou = score; best = d; }
    }

    if (bestIou > 0.2) {
      this.locked = best;
      return this.locked;
    }

    // Re-acquire: pick largest
    this.locked = detections.reduce((b, d) =>
      area(d.bbox) > area(b.bbox) ? d : b
    );
    return this.locked;
  }

  reset() { this.locked = null; }
}
