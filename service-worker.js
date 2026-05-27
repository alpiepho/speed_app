const CACHE = 'speedapp-v6';
// Relative URLs so the SW works at any base path (localhost / GitHub Pages /speed_app/)
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/app.css',
  './css/result.css',
  './js/app.js',
  './js/camera.js',
  './js/simulation.js',
  './js/detector.js',
  './js/tracker.js',
  './js/speed.js',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
