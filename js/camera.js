export class CameraManager {
  constructor(videoEl) {
    this.videoEl = videoEl;
    this.frameCanvas = document.createElement('canvas');
    this.frameCtx = this.frameCanvas.getContext('2d');
    this._stream = null;
    this._raf = null;
  }

  async start() {
    this._stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    this.videoEl.srcObject = this._stream;
    await this.videoEl.play();
    this.frameCanvas.width = this.videoEl.videoWidth || 640;
    this.frameCanvas.height = this.videoEl.videoHeight || 480;
    this._loop();
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._stream) this._stream.getTracks().forEach(t => t.stop());
    this._raf = null;
    this._stream = null;
  }

  getCanvas() { return this.frameCanvas; }

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop());
    if (this.videoEl.readyState < 2) return;
    this.frameCtx.drawImage(this.videoEl, 0, 0, this.frameCanvas.width, this.frameCanvas.height);
  }
}
