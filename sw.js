const CACHE = 'home-poker-v10';
const ASSETS = [
  './', './index.html', './styles.css', './putty.css', './app.js', './manifest.webmanifest',
  './icon.svg', './icon-192.png', './icon-512.png',
  './icons/phosphor/play-duotone.svg', './icons/phosphor/pause-duotone.svg',
  './icons/phosphor/skip-back-duotone.svg', './icons/phosphor/skip-forward-duotone.svg',
  './icons/phosphor/caret-up-duotone.svg', './icons/phosphor/caret-down-duotone.svg',
  './icons/phosphor/trash-duotone.svg',
  './fonts/nunito-400.ttf', './fonts/nunito-500.ttf',
  './fonts/nunito-600.ttf', './fonts/nunito-700.ttf'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match('./index.html'))));
});
