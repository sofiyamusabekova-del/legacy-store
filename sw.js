// Service worker LEGACY: сайт открывается и без интернета (ранее открытые страницы, каталог, картинки).
// Стратегии: страницы и скрипты — сначала сеть (чтобы после правок всегда была свежая версия), при отсутствии сети — из кэша;
// картинки и шрифты — из кэша с фоновым обновлением; /api/catalog — сеть, при отказе последний сохранённый каталог.
// Заказы, оплата, админка и любые POST-запросы никогда не кэшируются. Чтобы сбросить кэши, увеличьте VERSION.
const VERSION = "legacy-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const IMAGE_CACHE = `${VERSION}-images`;
const FONT_CACHE = `${VERSION}-fonts`;
const API_CACHE = `${VERSION}-api`;
const MAX_IMAGES = 160;

const SHELL = [
  "./", "index.html", "catalog.html", "collections.html", "collection.html", "product.html", "cart.html", "checkout.html",
  "order.html", "orders.html", "wishlist.html", "about.html", "contact.html", "offline.html", "style.css", "manifest.webmanifest",
  "js/main.js", "js/data.js", "js/store.js", "js/i18n.js", "js/shop.js", "js/ui.js", "js/pricing.js", "js/checkout.js",
  "js/notify.js", "js/api.js", "js/theme.js", "js/effects.js", "js/seo.js", "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => {})))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName, { ignoreSearch = false } = {}) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch });
    if (cached) return cached;
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(async response => {
    if (response.ok || response.type === "opaque") {
      await cache.put(request, response.clone());
      if (limit) trim(cache, limit);
    }
    return response;
  }).catch(() => cached);
  return cached || refresh;
}

async function trim(cache, max) {
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Шрифты Google: кэшируем, чтобы оформление не ломалось без сети
  if (url.origin !== location.origin) {
    if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  // API: только каталог, и только как запасной вариант без сети. Остальное (заказы, оплата, админка) идёт напрямую.
  if (url.pathname.startsWith("/api/")) {
    if (url.pathname === "/api/catalog") event.respondWith(networkFirst(request, API_CACHE));
    return;
  }
  // Админка всегда онлайн
  if (/\/admin(\.html|\.css)$|\/js\/admin\.js$/.test(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, SHELL_CACHE, { ignoreSearch: true }).catch(() => caches.match("offline.html"))
    );
    return;
  }

  if (/\/(images|icons)\//.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, MAX_IMAGES));
    return;
  }

  event.respondWith(networkFirst(request, SHELL_CACHE));
});
