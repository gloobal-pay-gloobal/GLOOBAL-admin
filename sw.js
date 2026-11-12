// Keeps the admin site's own files for a quick open. Never stores anything
// from the API: every number is fetched fresh, and nothing private lands in
// the phone's cache.
const CACHE = "gloobal-admin-v7";
const SHELL = ["/", "/index.html", "/css/admin.css", "/js/config.js", "/js/webauthn.js", "/js/api.js", "/js/app.js", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return; // the API and fonts: straight to the network
  // Network first, so a new deploy shows at once; the cache only when offline.
  e.respondWith(fetch(e.request).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request).then((r) => r || caches.match("/index.html"))));
});

// Desk alerts (0218): a new chat, an answer, a chat passed to you. Tapping
// one opens that chat on the staff site — in a tab already open if there
// is one.
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "GLOOBAL", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "GLOOBAL", { body: d.body || "", tag: d.tag || undefined, renotify: Boolean(d.tag), icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { url: d.url || "/" } }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    const open = list.find((c) => new URL(c.url).origin === self.location.origin);
    if (open) { open.focus(); return open.navigate(url); }
    return self.clients.openWindow(url);
  }));
});
