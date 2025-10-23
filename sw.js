// Service Worker for Muscle Rotation Manager
// Version: 2.0.0 - Performance Optimized

const CACHE_VERSION = '2.0.0';
const CACHE_NAME = `muscle-rotation-v${CACHE_VERSION}`;
const STATIC_CACHE = `muscle-rotation-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `muscle-rotation-dynamic-v${CACHE_VERSION}`;
const IMAGE_CACHE = `muscle-rotation-images-v${CACHE_VERSION}`;
const API_CACHE = `muscle-rotation-api-v${CACHE_VERSION}`;

// 最適化されたキャッシュリスト - 優先度別に分類
const CRITICAL_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/style.css',
    '/app-refactored.js'
];

const STATIC_FILES = [
    ...CRITICAL_FILES,
    '/lp.html',
    '/js/utils/lazyLoader.js',
    '/js/modules/pageManager.js',
    '/js/modules/authManager.js',
    '/js/utils/constants.js',
    '/js/utils/helpers.js',
    '/js/utils/errorHandler.js'
];

const IMAGE_FILES = [
    '/assets/default-avatar.png',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/favicon.ico',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

const PARTIAL_FILES = [
    '/partials/header.html',
    '/partials/sidebar.html',
    '/partials/dashboard.html'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
    /^https:\/\/.*\.supabase\.co\/auth\/v1\//
];

// Install event - 段階的キャッシュ戦略
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker v2.0.0...');

    event.waitUntil(
        Promise.all([
            // 1. クリティカルファイルを最優先でキャッシュ
            caches.open(STATIC_CACHE).then(cache => {
                console.log('[SW] Caching critical files');
                return cache.addAll(CRITICAL_FILES);
            }),
            
            // 2. 画像ファイルを並行してキャッシュ
            caches.open(IMAGE_CACHE).then(cache => {
                console.log('[SW] Caching image files');
                return cache.addAll(IMAGE_FILES).catch(error => {
                    console.warn('[SW] Some images failed to cache:', error);
                    // 画像キャッシュ失敗は致命的ではない
                });
            }),
            
            // 3. パーシャルファイルをキャッシュ
            caches.open(STATIC_CACHE).then(cache => {
                console.log('[SW] Caching partial files');
                return Promise.allSettled(
                    PARTIAL_FILES.map(file => cache.add(file))
                ).then(results => {
                    const failed = results.filter(r => r.status === 'rejected');
                    if (failed.length > 0) {
                        console.warn('[SW] Some partials failed to cache:', failed);
                    }
                });
            })
        ])
        .then(() => {
            console.log('[SW] Installation completed successfully');
            return self.skipWaiting();
        })
        .catch(error => {
            console.error('[SW] Installation failed:', error);
            throw error;
        })
    );
});

// Activate event - 改善されたキャッシュクリーンアップ
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker v2.0.0...');

    event.waitUntil(
        Promise.all([
            // 1. 古いキャッシュを削除
            caches.keys().then(cacheNames => {
                const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE];
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (!currentCaches.includes(cacheName)) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // 2. キャッシュサイズを最適化
            optimizeCacheSize(),
            
            // 3. パフォーマンスメトリクスを初期化
            initializePerformanceTracking()
        ])
        .then(() => {
            console.log('[SW] Service Worker activated successfully');
            return self.clients.claim();
        })
        .catch(error => {
            console.error('[SW] Activation failed:', error);
        })
    );
});

// Fetch event - 最適化されたリクエストハンドリング
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and chrome-extension
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }

    // パフォーマンストラッキング開始
    const startTime = performance.now();

    // リクエストタイプに応じた最適化された戦略
    if (isImageRequest(request.url)) {
        // 画像: 専用キャッシュでCache First
        event.respondWith(imageHandler(request, startTime));
    } else if (isStaticFile(request.url)) {
        // 静的ファイル: Cache First
        event.respondWith(cacheFirst(request, startTime));
    } else if (isAPIRequest(request.url)) {
        // API: Network First with intelligent caching
        event.respondWith(apiHandler(request, startTime));
    } else if (isNavigationRequest(request)) {
        // ナビゲーション: Network First with offline fallback
        event.respondWith(navigationHandler(request, startTime));
    } else {
        // その他: Stale While Revalidate
        event.respondWith(staleWhileRevalidate(request, startTime));
    }
});

// Cache First Strategy (for static files) - 最適化版
async function cacheFirst(request, startTime) {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            recordPerformanceMetric('static_cache_hit', request.url, startTime);
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
            // レスポンスが有効かチェック
            if (networkResponse.headers.get('content-type')) {
                const responseClone = networkResponse.clone();
                await cache.put(request, responseClone);
                recordPerformanceMetric('static_network', request.url, startTime);
            }
        }
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache First failed:', error);
        recordPerformanceMetric('static_error', request.url, startTime);
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

// Navigation Handler (for page requests) - 最適化版
async function navigationHandler(request, startTime) {
    try {
        const networkResponse = await fetch(request);
        recordPerformanceMetric('navigation_network', request.url, startTime);
        return networkResponse;
    } catch (error) {
        console.log('[SW] Navigation offline, serving cached page');
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match('/index.html');
        
        if (cachedResponse) {
            recordPerformanceMetric('navigation_cache_fallback', request.url, startTime);
            return cachedResponse;
        }
        
        recordPerformanceMetric('navigation_error', request.url, startTime);
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head><title>オフライン</title></head>
            <body>
                <h1>オフラインモード</h1>
                <p>インターネット接続を確認してください。</p>
                <button onclick="location.reload()">再試行</button>
            </body>
            </html>
        `, { 
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
}

// Stale While Revalidate Strategy - 最適化版
async function staleWhileRevalidate(request, startTime) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
                // レスポンスが有効かチェック
                if (networkResponse.headers.get('content-type')) {
                    const responseClone = networkResponse.clone();
                    cache.put(request, responseClone);
                    recordPerformanceMetric('swr_network_update', request.url, startTime);
                }
            }
            return networkResponse;
        }).catch(() => {
            recordPerformanceMetric('swr_network_failed', request.url, startTime);
            return cachedResponse;
        });

        if (cachedResponse) {
            recordPerformanceMetric('swr_cache_served', request.url, startTime);
            // バックグラウンドで更新
            fetchPromise.catch(() => {}); // エラーを無視
            return cachedResponse;
        }

        return fetchPromise;
    } catch (error) {
        console.error('[SW] Stale While Revalidate failed:', error);
        recordPerformanceMetric('swr_error', request.url, startTime);
        return new Response('Service temporarily unavailable', { 
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// 新しいハンドラー関数

// 画像専用ハンドラー
async function imageHandler(request, startTime) {
    try {
        const cache = await caches.open(IMAGE_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            recordPerformanceMetric('image_cache_hit', request.url, startTime);
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            // 画像は長期キャッシュ
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
            recordPerformanceMetric('image_network', request.url, startTime);
        }
        return networkResponse;
    } catch (error) {
        console.warn('[SW] Image handler failed:', error);
        return new Response('', { status: 404 });
    }
}

// API専用ハンドラー
async function apiHandler(request, startTime) {
    try {
        // Network First with intelligent caching
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE);
            
            // GET リクエストのみキャッシュ（短期間）
            if (request.method === 'GET') {
                const responseClone = networkResponse.clone();
                await cache.put(request, responseClone);
                
                // 5分後に期限切れ
                setTimeout(() => {
                    cache.delete(request);
                }, 5 * 60 * 1000);
            }
            
            recordPerformanceMetric('api_network', request.url, startTime);
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] API network failed, trying cache:', request.url);
        const cache = await caches.open(API_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            recordPerformanceMetric('api_cache_fallback', request.url, startTime);
            return cachedResponse;
        }
        
        return new Response(JSON.stringify({ 
            error: 'Offline - API not available',
            offline: true 
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// キャッシュサイズ最適化
async function optimizeCacheSize() {
    const cacheNames = [DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE];
    const maxSizes = { 
        [DYNAMIC_CACHE]: 50, 
        [API_CACHE]: 30, 
        [IMAGE_CACHE]: 100 
    };

    for (const cacheName of cacheNames) {
        try {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            const maxSize = maxSizes[cacheName];
            
            if (keys.length > maxSize) {
                const keysToDelete = keys.slice(0, keys.length - maxSize);
                await Promise.all(keysToDelete.map(key => cache.delete(key)));
                console.log(`[SW] Optimized ${cacheName}: removed ${keysToDelete.length} entries`);
            }
        } catch (error) {
            console.warn(`[SW] Failed to optimize cache ${cacheName}:`, error);
        }
    }
}

// パフォーマンストラッキング初期化
async function initializePerformanceTracking() {
    // パフォーマンスメトリクスをリセット
    self.performanceMetrics = {
        cacheHits: 0,
        networkRequests: 0,
        totalRequests: 0,
        averageResponseTime: 0
    };
    console.log('[SW] Performance tracking initialized');
}

// パフォーマンスメトリクス記録
function recordPerformanceMetric(type, url, startTime) {
    const duration = performance.now() - startTime;
    
    if (!self.performanceMetrics) {
        self.performanceMetrics = {
            cacheHits: 0,
            networkRequests: 0,
            totalRequests: 0,
            averageResponseTime: 0
        };
    }
    
    self.performanceMetrics.totalRequests++;
    
    if (type.includes('cache')) {
        self.performanceMetrics.cacheHits++;
    } else if (type.includes('network')) {
        self.performanceMetrics.networkRequests++;
    }
    
    // 移動平均でレスポンス時間を更新
    const currentAvg = self.performanceMetrics.averageResponseTime;
    const newAvg = (currentAvg * (self.performanceMetrics.totalRequests - 1) + duration) / self.performanceMetrics.totalRequests;
    self.performanceMetrics.averageResponseTime = newAvg;
    
    // 閾値チェック
    if (duration > 3000) {
        console.warn(`[SW] Slow response: ${type} ${url} took ${duration.toFixed(2)}ms`);
    }
}

// Helper functions
function isImageRequest(url) {
    return /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i.test(url) ||
           url.includes('/assets/') ||
           url.includes('/icons/');
}

function isStaticFile(url) {
    return STATIC_FILES.some(file => url.endsWith(file)) ||
         url.includes('/css/') ||
         url.includes('/js/') ||
         url.includes('/partials/') ||
         url.endsWith('.html');
}

function isAPIRequest(url) {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

function isNavigationRequest(request) {
    return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
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
            const response = await fetch('/api/sync-workout-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workout_sessions: offlineData })
            });

            if (response.ok) {
                await clearOfflineWorkoutData();
                console.log('[SW] Workout session data synced successfully');

                // Notify all clients
                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                    client.postMessage({ type: 'SYNC_COMPLETE', data: 'workout_sessions' });
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

// Message handler for communication with main thread - 拡張版
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
    } else if (event.data && event.data.type === 'GET_PERFORMANCE_STATS') {
        // パフォーマンス統計を返す
        const stats = {
            ...self.performanceMetrics,
            cacheHitRate: self.performanceMetrics.totalRequests > 0 
                ? (self.performanceMetrics.cacheHits / self.performanceMetrics.totalRequests * 100).toFixed(2)
                : 0,
            version: CACHE_VERSION
        };
        event.ports[0].postMessage({ stats });
    } else if (event.data && event.data.type === 'OPTIMIZE_CACHES') {
        // 手動でキャッシュ最適化を実行
        event.waitUntil(
            optimizeCacheSize().then(() => {
                event.ports[0].postMessage({ success: true, message: 'Caches optimized' });
            }).catch(error => {
                event.ports[0].postMessage({ success: false, error: error.message });
            })
        );
    }
});

console.log('[SW] Service Worker script loaded');