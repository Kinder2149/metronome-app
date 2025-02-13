/// <reference lib="webworker" />

export {}; // Nécessaire pour que TypeScript traite ce fichier comme un module

declare let self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'metronome-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/bundle.js',
  '/styles/main.css',
  '/sounds/click.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});