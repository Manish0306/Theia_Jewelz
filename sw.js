// Service Worker for PWA functionality
const CACHE_NAME = 'theia-jewelz-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const CACHE_FILES = [
    '/',
    '/index.html',
    '/src/styles.css',
    '/src/app.js',
    '/src/database.js',
    '/src/firebase-config.js',
    '/src/ui-components.js',
    '/src/analytics.js',
    '/src/pdf-generator.js',
    '/src/excel-handler.js',
    '/manifest.json',
    // External libraries
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Install event - cache files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Install event');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(CACHE_FILES);
            })
            .catch((error) => {
                console.error('Service Worker: Cache installation failed', error);
            })
    );
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activate event');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Ensure the service worker takes control of all pages immediately
    self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip Firebase and other external API requests
    if (event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('firebase') ||
        event.request.url.includes('googleapis.com')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Don't cache if not a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Clone the response
                        const responseToCache = networkResponse.clone();
                        
                        // Add to cache for future use
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return networkResponse;
                    })
                    .catch(() => {
                        // If both cache and network fail, show offline page for navigations
                        if (event.request.destination === 'document') {
                            return caches.match(OFFLINE_URL);
                        }
                        
                        // For other resources, return a basic offline response
                        return new Response(
                            JSON.stringify({ 
                                error: 'Offline',
                                message: 'You are currently offline. Some features may not be available.'
                            }),
                            {
                                headers: { 'Content-Type': 'application/json' },
                                status: 503,
                                statusText: 'Service Unavailable'
                            }
                        );
                    });
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync', event.tag);
    
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Sync offline data when connection is restored
            syncOfflineData()
        );
    }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from Theia Jewelz',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open App',
                icon: '/icons/icon-96x96.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/icon-96x96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Theia Jewelz', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            type: 'VERSION',
            version: CACHE_NAME
        });
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then((cache) => {
                    return cache.addAll(event.data.urls);
                })
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync', event.tag);
    
    if (event.tag === 'sync-data') {
        event.waitUntil(syncOfflineData());
    }
});

// Utility function to sync offline data
async function syncOfflineData() {
    try {
        console.log('Service Worker: Syncing offline data');
        
        // Get all clients
        const clients = await self.clients.matchAll();
        
        // Send message to all clients to sync data
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_OFFLINE_DATA'
            });
        });
        
        return Promise.resolve();
    } catch (error) {
        console.error('Service Worker: Error syncing offline data', error);
        return Promise.reject(error);
    }
}

// Handle offline/online status
self.addEventListener('online', () => {
    console.log('Service Worker: Browser is online');
    // Trigger background sync
    self.registration.sync.register('sync-data').catch(console.error);
});

self.addEventListener('offline', () => {
    console.log('Service Worker: Browser is offline');
});

// Cache management utilities
const cleanOldCaches = async () => {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);
    
    return Promise.all(
        oldCaches.map(name => caches.delete(name))
    );
};

const updateCache = async (urls) => {
    const cache = await caches.open(CACHE_NAME);
    return cache.addAll(urls);
};

// Export utilities for use in main thread
self.cleanOldCaches = cleanOldCaches;
self.updateCache = updateCache;

console.log('Service Worker: Registered successfully');