const CACHE = 'heldkraft-atlas-v30-pilot';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './nutrition.js', './cardio.js',
  './volume.js', './plate-counter.js', './rest-timer.js', './warmup.js', './weight-sync.js', './exercise-library.js', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png',
  './exercise-art/pec-deck-start-v30.svg', './exercise-art/pec-deck-finish-v30.svg', './exercise-art/barbell-bench-press-start-v30.svg', './exercise-art/barbell-bench-press-finish-v30.svg', './exercise-art/barbell-back-squat-start-v30.svg', './exercise-art/barbell-back-squat-finish-v30.svg',
  './exercise-art/pec-deck-pilot.webp', './exercise-art/barbell-bench-press-pilot.webp', './exercise-art/barbell-back-squat-pilot.webp',
  './exercise-art/front-squat.svg', './exercise-art/barbell-back-squat.svg', './exercise-art/smith-machine-squat.svg', './exercise-art/plate-loaded-hack-squat.svg', './exercise-art/plate-loaded-seated-calf-raise.svg', './exercise-art/lunges.svg', './exercise-art/leg-press.svg', './exercise-art/leg-curls.svg', './exercise-art/barbell-deadlift.svg', './exercise-art/smith-machine-deadlift.svg', './exercise-art/rdl.svg', './exercise-art/yes-machine.svg', './exercise-art/no-machine.svg', './exercise-art/barbell-bench-press.svg', './exercise-art/smith-machine-bench-press.svg', './exercise-art/incline-bench.svg', './exercise-art/db-bench.svg', './exercise-art/pec-deck.svg', './exercise-art/db-fly.svg', './exercise-art/cable-fly.svg', './exercise-art/machine-chest-press.svg', './exercise-art/plate-loaded-chest-press.svg', './exercise-art/close-grip-bench.svg', './exercise-art/incline-db-press.svg', './exercise-art/overhead-press.svg', './exercise-art/seated-db-press.svg', './exercise-art/lateral-raise.svg', './exercise-art/rear-delt-fly.svg', './exercise-art/pullups.svg', './exercise-art/assisted-chin-ups.svg', './exercise-art/lat-pulldown.svg', './exercise-art/landmine-row.svg', './exercise-art/chest-supported-row.svg', './exercise-art/cable-row.svg', './exercise-art/ez-curl.svg', './exercise-art/incline-db-curl.svg', './exercise-art/hammer-curl.svg', './exercise-art/cable-bent-over-triceps-extension.svg', './exercise-art/triceps-pushdown.svg'
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
