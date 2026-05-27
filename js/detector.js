const VEHICLE_CLASSES = new Set(['car', 'truck', 'bus']);
const MIN_CONFIDENCE  = 0.40;

export class Detector {
  constructor() { this._model = null; }

  async load() {
    // cocoSsd is a global loaded via <script> tag in index.html
    this._model = await cocoSsd.load({ base: 'mobilenet_v2' });
  }

  isLoaded() { return this._model !== null; }

  async detect(canvas) {
    if (!this._model) return [];
    const predictions = await this._model.detect(canvas);
    return predictions
      .filter(p => VEHICLE_CLASSES.has(p.class) && p.score >= MIN_CONFIDENCE)
      .map(p => ({ bbox: p.bbox, class: p.class, score: p.score }));
  }
}
