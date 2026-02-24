const CACHE_NAME = 'time-timer-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/timer.svg',
  '/manifest.json'
];

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

const DB_NAME = 'timer-sw-db';
const DB_VERSION = 1;
const STORE_NAME = 'timer-alarms';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function savePendingAlarm(targetMs) {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ targetMs }, 'pending');
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // IndexedDB unavailable
  }
}

async function clearPendingAlarm() {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('pending');
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // IndexedDB unavailable
  }
}

async function getPendingAlarm() {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('pending');
    const result = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}

// ─── Notification helper ──────────────────────────────────────────────────────

async function checkAndFireNotification() {
  try {
    const alarm = await getPendingAlarm();
    if (!alarm || typeof alarm.targetMs !== 'number') return;

    // Fire if we're within 1 second of the target time or past it
    if (Date.now() >= alarm.targetMs - 1000) {
      await clearPendingAlarm();

      // Don't fire if the app is currently visible (the app handles it)
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: false });
      const appVisible = clients.some((c) => c.visibilityState === 'visible');
      if (appVisible) return;

      // Fire the notification
      await self.registration.showNotification('⏰ Timer Done!', {
        body: 'Your timer has finished.',
        icon: '/timer-192.png',
        badge: '/timer-192.png',
        tag: 'timer-complete',
        renotify: true,
        vibrate: [200, 100, 200],
        requireInteraction: false,
      });
    }
  } catch {
    // Notification failed
  }
}

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );

      // Check for any overdue notifications
      await checkAndFireNotification();

      await self.clients.claim();
    })()
  );
});

// ─── Fetch (cache-first, network fallback) ────────────────────────────────────

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Check for overdue notifications on each fetch
  event.waitUntil(checkAndFireNotification());

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Serve from cache, update in background
        event.waitUntil(
          fetch(event.request)
            .then((res) => {
              if (res && res.status === 200) {
                caches.open(CACHE_NAME).then((c) => c.put(event.request, res.clone()));
              }
            })
            .catch(() => {})
        );
        return cached;
      }

      return fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') return caches.match('/');
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// ─── Timer notification scheduling ───────────────────────────────────────────
// The app sends postMessage({ type: 'SCHEDULE_NOTIFICATION', delayMs })
// when a timer starts, and { type: 'CANCEL_NOTIFICATION' } when it stops.
// The SW fires a browser notification after the delay so the user is
// alerted even if the tab is backgrounded or the screen is locked.

let notificationTimer = null;

self.addEventListener('message', (event) => {
  const { type, delayMs } = event.data ?? {};

  if (type === 'SCHEDULE_NOTIFICATION') {
    // Cancel any existing scheduled notification first
    if (notificationTimer !== null) {
      clearTimeout(notificationTimer);
      notificationTimer = null;
    }

    if (typeof delayMs !== 'number' || delayMs <= 0) return;

    // Persist the target time to IndexedDB (survives SW suspension)
    const targetMs = Date.now() + delayMs;
    event.waitUntil(savePendingAlarm(targetMs));

    // Best-effort setTimeout backup (may be killed if SW goes idle)
    notificationTimer = setTimeout(async () => {
      notificationTimer = null;
      await checkAndFireNotification();
    }, delayMs);
  }

  if (type === 'CANCEL_NOTIFICATION') {
    if (notificationTimer !== null) {
      clearTimeout(notificationTimer);
      notificationTimer = null;
    }
    // Clear the persisted alarm
    event.waitUntil(clearPendingAlarm());
  }
});

// Clicking the notification focuses / opens the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.startsWith(self.location.origin));
      if (existing) {
        return existing.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
