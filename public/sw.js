// Service Worker for Offline Support & Push Notifications
const CACHE_VERSION = 'v2';
const CACHE_NAME = `gms-report-${CACHE_VERSION}`;
const CACHE_STATIC = `gms-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `gms-dynamic-${CACHE_VERSION}`;
const CACHE_IMAGES = `gms-images-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install service worker and cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate service worker and clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_STATIC && 
              cacheName !== CACHE_DYNAMIC && 
              cacheName !== CACHE_IMAGES &&
              cacheName.startsWith('gms-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy: Network first, fallback to cache, then offline page
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and non-http(s) requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // API requests: Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response to cache it
          const responseClone = response.clone();
          caches.open(CACHE_DYNAMIC).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline data indicator
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'You are currently offline. Showing cached data.',
                offline: true 
              }),
              { 
                headers: { 'Content-Type': 'application/json' },
                status: 503 
              }
            );
          });
        })
    );
    return;
  }

  // Images: Cache first
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_IMAGES).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Static assets (JS, CSS, fonts): Cache first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_STATIC).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // HTML pages: Network first, cache fallback, offline page
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_DYNAMIC).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Show offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'GMS Report Notification';
  const options = {
    body: data.message || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/dashboard',
      ...data
    },
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    const urlToOpen = event.notification.data.url || '/dashboard';
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncPendingReports());
  } else if (event.tag === 'sync-reactions') {
    event.waitUntil(syncPendingReactions());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  }
});

async function syncPendingReports() {
  console.log('[SW] Syncing pending reports...');
  
  try {
    const db = await openDB();
    const tx = db.transaction('pendingReports', 'readwrite');
    const store = tx.objectStore('pendingReports');
    const reports = await getAllFromStore(store);

    for (const report of reports) {
      try {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report.data),
        });

        if (response.ok) {
          // Delete from pending queue
          await store.delete(report.id);
          
          // Show success notification
          self.registration.showNotification('Report Synced! ✅', {
            body: 'Your offline report was successfully submitted.',
            icon: '/icon-192x192.png',
            tag: 'sync-success',
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync report:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

async function syncPendingReactions() {
  console.log('[SW] Syncing pending reactions...');
  
  try {
    const db = await openDB();
    const tx = db.transaction('pendingReactions', 'readwrite');
    const store = tx.objectStore('pendingReactions');
    const reactions = await getAllFromStore(store);

    for (const reaction of reactions) {
      try {
        const response = await fetch('/api/reactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reaction.data),
        });

        if (response.ok) {
          await store.delete(reaction.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync reaction:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

async function syncPendingMessages() {
  console.log('[SW] Syncing pending messages...');
  
  try {
    const db = await openDB();
    const tx = db.transaction('pendingMessages', 'readwrite');
    const store = tx.objectStore('pendingMessages');
    const messages = await getAllFromStore(store);

    for (const message of messages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message.data),
        });

        if (response.ok) {
          await store.delete(message.id);
          
          self.registration.showNotification('Message Sent! 📨', {
            body: 'Your offline message was delivered.',
            icon: '/icon-192x192.png',
            tag: 'message-synced',
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gms-offline-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingReports')) {
        db.createObjectStore('pendingReports', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pendingReactions')) {
        db.createObjectStore('pendingReactions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Message handler for clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('gms-')) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
});