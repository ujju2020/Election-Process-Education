/* 
 * Matdan Sathi - Election Process Education Assistant
 * Copyright (c) 2026 Ujjwal Kumar Bhowmick (ujjwalkumarbhowmick30@gmail.com)
 * Service Worker v3 - Cache-busted to fix CSP issue
 */
const CACHE_NAME = 'matdan-sathi-v3';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    'https://unpkg.com/lucide@latest',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@400;500;600&display=swap'
];

// On install: delete ALL old caches and install fresh
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force activate immediately
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(cacheNames.map(name => caches.delete(name)))
        ).then(() =>
            caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
        )
    );
});

// On activate: claim all clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Never cache API calls or Cloud Function calls
    const url = new URL(event.request.url);
    if (url.hostname.includes('run.app') || 
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('firebaseio.com')) {
        return; // Let these go straight to network
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
