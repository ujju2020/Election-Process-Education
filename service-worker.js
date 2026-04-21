/* 
 * Matdan Sathi - Election Process Education Assistant
 * Developer - Ujjwal Kumar Bhowmick (ujjwalkumarbhowmick30@gmail.com)
 */
const CACHE_NAME = 'matdan-sathi-v1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    'https://unpkg.com/lucide@latest',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@400;500;600&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
