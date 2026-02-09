const CACHE_NAME = 'doganci-platform-v1';
const urlsToCache = [
    './',
    './index.html',
    './members.html',
    './news.html',
    './style.css',
    './app.js',
    './manifest.json',
    './members.csv',
    './news.csv',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Install Event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache açıldı');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eski cache siliniyor:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Cache First Strategy
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache'de varsa döndür
                if (response) {
                    return response;
                }
                
                // Cache'de yoksa network'ten getir
                return fetch(event.request)
                    .then(response => {
                        // Geçerli bir response değilse direkt döndür
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Response'u clone'la ve cache'e ekle
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Network hatası - offline ise ana sayfayı döndür
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});