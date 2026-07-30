/* ============================================
   sw.js — 離線快取 Service Worker
   策略（已修正）：
   1. 每次讀取檔案，優先嘗試連網路拿「最新版本」，並順便更新快取備份。
   2. 只有在網路真的連不上時，才使用先前存的快取版本。
   這樣不管你在 GitHub 上更新幾次，只要有網路都會立刻看到最新內容；
   只有婚禮現場網路真的不穩時，才會退回使用離線備份。

   CACHE_NAME 這次改成 v2，是為了強制清掉舊版本卡住的快取
   （舊版策略是「快取優先」，某些檔案可能被永久卡在很早期的版本）。
   如果之後你更改了歌曲數量或檔名，記得同步更新下面的 ASSET_LIST。
   ============================================ */

const CACHE_NAME = "wedding-album-v2";

const ASSET_LIST = [
  "./",
  "index.html",
  "style.css",
  "fonts.css",
  "config.js",
  "coverflow.js",
  "audio.js",
  "player.js",
  "lyrics.js",
  "wedding-bg.jpg",
  "covers/01.jpg", "covers/02.jpg", "covers/03.jpg", "covers/04.jpg",
  "covers/05.jpg", "covers/06.jpg", "covers/07.jpg",
  "songs/01.mp3", "songs/02.mp3", "songs/03.mp3", "songs/04.mp3",
  "songs/05.mp3", "songs/06.mp3", "songs/07.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // 個別檔案快取失敗（例如某首歌還沒上傳）不應該讓整個安裝失敗
      Promise.allSettled(ASSET_LIST.map((url) => cache.add(url)))
    )
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
    fetch(event.request)
      .then((response) => {
        // 拿到最新版本，順便更新快取備份，下次離線時可以用
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        // 網路連不上時，才退回使用快取備份
        caches.match(event.request)
      )
  );
});
