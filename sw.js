const CACHE_NAME = 'spotify-clone-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css.css',
  '/javascript.js',
  '/logo.png',
  '/playing.gif',
  '/manifest.json'
];

// 1. Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Fetch Resources (Cache First, then Network)
self.addEventListener('fetch', (event) => {
    // Skip caching for API calls (backend) so songs are always fresh
    if (event.request.url.includes('/api/')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached file if found, else go to network
            return response || fetch(event.request);
        })
    );
});

// 3. Activate & Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});