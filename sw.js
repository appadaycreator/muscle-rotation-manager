// Service Worker for Muscle Rotation Manager
// Version: 1.0.0

const CACHE_NAME = 'muscle-rotation-v1.0.0';
const STATIC_CACHE = 'muscle-rotation-static-v1.0.0';
const DYNAMIC_CACHE = 'muscle-rotation-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/lp.html',
    '/manifest.json',
    '/css/style.css',
    '/js/app.js',
    '/js/muscle-data.js',
    '/js/i18n.js',
    '/js/offline.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/offline.html'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
    /^https:\/\/.*\.supabase\.co\/auth\/v1\//
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('[SW] Static files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content with network fallback
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different types of requests
    if (isStaticFile(request.url)) {
    // Static files: Cache First strategy
        event.respondWith(cacheFirst(request));
    } else if (isAPIRequest(request.url)) {
    // API requests: Network First strategy
        event.respondWith(networkFirst(request));
    } else if (isNavigationRequest(request)) {
    // Navigation requests: Network First with offline fallback
        event.respondWith(navigationHandler(request));
    } else {
    // Other requests: Stale While Revalidate
        event.respondWith(staleWhileRevalidate(request));
    }
});

// Cache First Strategy (for static files)
async function cacheFirst(request) {
    try {
        // chrome-extension スキームはサポートされていないため、スキップ
        const url = new URL(request.url);
        if (url.protocol === 'chrome-extension:') {
            console.log('[SW] Skipping chrome-extension request:', request.url);
            return fetch(request);
        }

        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[SW] Serving from cache:', request.url);
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            // レスポンスが有効かチェック
            if (networkResponse.headers.get('content-type')) {
                await cache.put(request, networkResponse.clone());
                console.log('[SW] Cached new static file:', request.url);
            }
        }
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache First failed:', error);
        // 適切な Response オブジェクトを返す
        return new Response('Offline - File not available', { 
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Network First Strategy (for API requests)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            console.log('[SW] Cached API response:', request.url);
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response(JSON.stringify({ error: 'Offline - Data not available' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Navigation Handler (for page requests)
async function navigationHandler(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('[SW] Navigation offline, serving cached page');
        const cachedResponse = await caches.match('/index.html');
        return cachedResponse || new Response('Offline', { status: 503 });
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
    try {
        // chrome-extension スキームはサポートされていないため、スキップ
        const url = new URL(request.url);
        if (url.protocol === 'chrome-extension:') {
            console.log('[SW] Skipping chrome-extension request:', request.url);
            return fetch(request);
        }

        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
                // レスポンスが有効かチェック
                if (networkResponse.headers.get('content-type')) {
                    cache.put(request, networkResponse.clone());
                }
            }
            return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
    } catch (error) {
        console.error('[SW] Stale While Revalidate failed:', error);
        return new Response('Service temporarily unavailable', { 
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Helper functions
function isStaticFile(url) {
    return STATIC_FILES.some(file => url.endsWith(file)) ||
         url.includes('/css/') ||
         url.includes('/js/') ||
         url.includes('/icons/') ||
         url.includes('/images/');
}

function isAPIRequest(url) {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

function isNavigationRequest(request) {
    return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Background Sync for offline data
self.addEventListener('sync', event => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'workout-sync') {
        event.waitUntil(syncWorkoutData());
    } else if (event.tag === 'settings-sync') {
        event.waitUntil(syncSettingsData());
    }
});

// Sync workout data when back online
async function syncWorkoutData() {
    try {
        console.log('[SW] Syncing workout data...');

        // Get offline data from IndexedDB
        const offlineData = await getOfflineWorkoutData();

        if (offlineData.length > 0) {
            // Send to Supabase
            const response = await fetch('/api/sync-workouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workouts: offlineData })
            });

            if (response.ok) {
                await clearOfflineWorkoutData();
                console.log('[SW] Workout data synced successfully');

                // Notify all clients
                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                    client.postMessage({ type: 'SYNC_COMPLETE', data: 'workouts' });
                });
            }
        }
    } catch (error) {
        console.error('[SW] Workout sync failed:', error);
    }
}

// Sync settings data when back online
async function syncSettingsData() {
    try {
        console.log('[SW] Syncing settings data...');

        const offlineSettings = await getOfflineSettingsData();

        if (offlineSettings) {
            const response = await fetch('/api/sync-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(offlineSettings)
            });

            if (response.ok) {
                await clearOfflineSettingsData();
                console.log('[SW] Settings synced successfully');

                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                    client.postMessage({ type: 'SYNC_COMPLETE', data: 'settings' });
                });
            }
        }
    } catch (error) {
        console.error('[SW] Settings sync failed:', error);
    }
}

// IndexedDB helper functions (simplified)
async function getOfflineWorkoutData() {
    // This would interact with IndexedDB to get offline workout data
    return [];
}

async function clearOfflineWorkoutData() {
    // This would clear synced workout data from IndexedDB
}

async function getOfflineSettingsData() {
    // This would get offline settings from IndexedDB
    return null;
}

async function clearOfflineSettingsData() {
    // This would clear synced settings from IndexedDB
}

// Push notification handler
self.addEventListener('push', event => {
    console.log('[SW] Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'トレーニング時間です！',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'start-workout',
                title: 'トレーニング開始',
                icon: '/icons/action-start.png'
            },
            {
                action: 'view-recommendations',
                title: 'おすすめ確認',
                icon: '/icons/action-view.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('筋トレ部位ローテーション管理', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification clicked:', event.action);

    event.notification.close();

    let url = '/';
    if (event.action === 'start-workout') {
        url = '/?action=new-workout';
    } else if (event.action === 'view-recommendations') {
        url = '/?action=recommendations';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Message handler for communication with main thread
self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    } else if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }).then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});

console.log('[SW] Service Worker script loaded');