const CACHE = 'barbarian-bulk-v22';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './nutrition.js', './cardio.js',
  './volume.js', './plate-counter.js', './rest-timer.js', './warmup.js', './weight-sync.js', './exercise-library.js', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const appShell = sameOrigin && /\.(?:html|js|css)$/.test(url.pathname);
  const navigation = request.mode === 'navigate';

  if (navigation || appShell) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      if (sameOrigin) caches.open(CACHE).then(cache => cache.put(request, copy));
      return response;
    }))
  );
});
