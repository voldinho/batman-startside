const CACHE='batman-startside-v85-static';
const STATIC=[
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './ev-background.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Never cache live news or third-party API data.
  if (
    url.pathname.endsWith('/news.json') ||
    url.hostname.includes('open-meteo.com') ||
    url.hostname.includes('coingecko.com')
  ) {
    event.respondWith(fetch(event.request, {cache:'no-store'}));
    return;
  }

  // HTML/navigation: network first, so installed iPhone app gets current code.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, {cache:'no-store'})
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static same-origin assets may be cached.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
        if (resp && resp.ok) {
          const copy=resp.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
        }
        return resp;
      }))
    );
  }
});
