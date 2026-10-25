const CACHE = 'home-poker-v25';
const ASSETS = [
  './', './index.html', './styles.css?v=25', './putty.css?v=25', './app.js?v=25', './manifest.webmanifest',
  './icon.svg', './icon-192.png', './icon-512.png',
  './icons/lucide/play.svg', './icons/lucide/pause.svg',
  './icons/lucide/skip-back.svg', './icons/lucide/skip-forward.svg',
  './icons/lucide/chevron-up.svg', './icons/lucide/chevron-down.svg',
  './icons/lucide/trash.svg', './icons/lucide/spade.svg', './icons/lucide/plus.svg',
  './fonts/nunito-400.ttf', './fonts/nunito-500.ttf',
  './fonts/nunito-600.ttf', './fonts/nunito-700.ttf'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      }))
  );
});
