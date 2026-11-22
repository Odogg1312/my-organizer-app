const CACHE_NAME = "my-organizer-shell-v6";
const APP_SHELL = [
  new URL("./index.html", self.registration.scope).href,
  new URL("./supabase-config.js", self.registration.scope).href,
  new URL("./manifest.webmanifest", self.registration.scope).href,
  new URL("./icon.svg", self.registration.scope).href,
  new URL("./icon-192.png", self.registration.scope).href,
  new URL("./icon-512.png", self.registration.scope).href,
  new URL("./apple-touch-icon.png", self.registration.scope).href
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith("my-organizer-shell-") && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith("/supabase-config.js")) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return await caches.match(request);
      }
    })());
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(APP_SHELL[0], response.clone());
        }
        return response;
      } catch {
        return await caches.match(request) || await caches.match(APP_SHELL[0]);
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      if ("focus" in client) return client.focus();
    }
    return self.clients.openWindow(new URL("./", self.registration.scope).href);
  })());
});
