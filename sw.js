/* ============================================
   sw.js — 離線快取「自我解除」版本
   目前階段：網站還在頻繁修改中，離線快取機制反而容易造成
   「手機一直卡在舊版本」的困擾，所以先完全停用。

   這個版本的唯一工作：
   1. 清空所有先前留下的快取
   2. 把自己（這個 Service Worker）卸載掉
   3. 讓頁面重新整理一次，確保之後每次都直接讀網路最新版本

   等網站內容全部確定、婚禮前如果想重新啟用離線保護，
   再另外處理，屆時會是全新的版本，不會用回這份。
   ============================================ */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
  );
});
