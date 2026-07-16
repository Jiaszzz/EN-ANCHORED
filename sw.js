/* ============================================
   sw.js — 離線快取 Service Worker
   策略：
   1. 第一次載入網站時，把網站本身的檔案（HTML/CSS/JS）
      跟 7 首歌 + 7 張封面全部快取起來。
   2. 之後不管網路好不好，這些檔案都優先從快取讀取，
      讀不到才向網路要，確保現場網路不穩也不會卡住。

   如果之後你更改了歌曲數量或檔名，記得同步更新下面的
   ASSET_LIST，否則新檔案不會被預先快取（仍可正常播放，
   只是第一次需要網路）。
   ============================================ */

const CACHE_NAME = "wedding-album-v1";

const ASSET_LIST = [
  "./",
  "index.html",
  "style.css",
  "fonts.css",
  "config.js",
  "coverflow.js",
  "audio.js",
  "player.js",
  "wedding-bg.jpg",
  "covers/01.jpg", "covers/02.jpg", "covers/03.jpg", "covers/04.jpg",
  "covers/05.jpg", "covers/06.jpg", "covers/07.jpg",
  "songs/01.mp3", "songs/02.mp3", "songs/03.mp3", "songs/04.mp3",
  "songs/05.mp3", "songs/06.mp3", "songs/07.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSET_LIST))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // 順便把新請求到的檔案也存進快取，下次離線也能用
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
