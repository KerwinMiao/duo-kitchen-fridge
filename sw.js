const CACHE_NAME = "duo-kitchen-v29";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=29",
  "./app.js?v=29",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/illustrations/fridge-empty-v1.png",
  "./assets/illustrations/fridge-open-mobile.jpg",
  "./assets/illustrations/fridge-closed-mobile.jpg",
  "./assets/food/meat.png",
  "./assets/food/seafood.png",
  "./assets/food/vegetable.png",
  "./assets/food/fruit.png",
  "./assets/food/eggDairy.png",
  "./assets/food/staple.png",
  "./assets/food/drink.png",
  "./assets/food/seasoning.png",
  "./assets/food/frozen.png",
  "./assets/food/leftover.png",
  "./assets/food/snack.png",
  "./assets/food/other.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const isPageRequest = event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html");
  if (isPageRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
