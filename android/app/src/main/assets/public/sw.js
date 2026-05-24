const CACHE_NAME = "tax-comply-v1";
const OFFLINE_URL = "/index.html";

// Assets to cache immediately on SW install phase
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css",
  "/src/taxData.ts",
  "/src/types.ts",
  "/icon.svg",
  "/manifest.json"
];

// Installation: cache core resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell and offline routes");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activation: clean up older outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cached assets:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch interception with a hybrid Cache-First/Network-First behavior
self.addEventListener("fetch", (event) => {
  // Skip cross-origin API calls (like live AI endpoints) to execute directly over network
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle standard navigation requests or internal assets elegantly
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch from network in the background to refresh local caches (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => { /* Clean fail if network is inactive */ });

        return cachedResponse;
      }

      // If not in cache, fallback to live network response
      return fetch(event.request).catch(() => {
        // If query fails offline, return index.html shell for correct routing
        if (event.request.mode === "navigate") {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
