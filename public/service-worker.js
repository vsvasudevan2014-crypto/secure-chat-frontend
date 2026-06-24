const CACHE_NAME = "secure-chat-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo192.png",
  "/logo512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName !== CACHE_NAME
          )
          .map((cacheName) =>
            caches.delete(cacheName)
          )
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (
    requestUrl.pathname.startsWith("/api") ||
    requestUrl.pathname.startsWith(
      "/socket.io"
    )
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseCopy = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseCopy);
        });

        return response;
      })
      .catch(() => {
        return caches.match(request).then(
          (cachedResponse) =>
            cachedResponse ||
            caches.match("/index.html")
        );
      })
  );
});