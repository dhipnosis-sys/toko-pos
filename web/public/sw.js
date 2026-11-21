/* Service worker — Toko Nuhahade PWA
 * Strategi:
 *  - /_next/static  : cache-first (aset ber-hash, immutable)
 *  - navigasi HTML  : network-first → cache → offline.html
 *  - aset lain      : stale-while-revalidate
 *  - /api & RSC     : tidak pernah di-cache (selalu network)
 */

const VERSION = "v1";
const STATIC_CACHE = `toko-static-${VERSION}`;
const PAGES_CACHE = `toko-pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/logo-transparan2.webp",
];

/* ---------------------------------------------------------------- install */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
  );
  // TIDAK skipWaiting di sini: tunggu perintah SKIP_WAITING dari UI
  // supaya pengguna bisa memilih kapan memuat ulang versi baru.
});

/* --------------------------------------------------------------- activate */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("toko-") && !key.endsWith(`-${VERSION}`))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

/* ---------------------------------------------------------------- message */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ------------------------------------------------------------------ fetch */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Hanya tangani same-origin
  if (url.origin !== self.location.origin) return;

  // API route & Server Action tidak boleh di-cache
  if (url.pathname.startsWith("/api/")) return;

  // Payload RSC (soft navigation) jangan di-cache — bervariasi per header
  const accept = request.headers.get("accept") || "";
  if (request.headers.get("RSC") || accept.includes("text/x-component")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event, request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event, request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event, request));
});

/* --------------------------------------------------------------- strategies */
async function networkFirst(event, request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      event.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

async function cacheFirst(event, request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      const cache = await caches.open(STATIC_CACHE);
      event.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  } catch (err) {
    const fallback = await caches.match(request);
    if (fallback) return fallback;
    throw err;
  }
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  const refresh = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    // Sajikan cache segera, perbarui di latar belakang.
    event.waitUntil(refresh);
    return cached;
  }

  const response = await refresh;
  if (response) return response;

  // Offline dan belum pernah ada di cache
  const offline = await caches.match(OFFLINE_URL);
  return offline || new Response("", { status: 504 });
}

/* ------------------------------------------------------------ push & click */
self.addEventListener("push", (event) => {
  let payload = { title: "Toko Nuhahade", body: "" };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Toko Nuhahade", {
      body: payload.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = clients.find((c) => "focus" in c);
      if (existing) {
        try {
          await existing.focus();
          await existing.navigate(target);
          return;
        } catch {
          /* jatuh ke bawah */
        }
      }
      await self.clients.openWindow(target);
    })()
  );
});
