const CACHE_NAME = 'moneyplan-v5';

const CDN_ORIGINS = [
  'https://cdn.jsdelivr.net',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// インストール：即座にアクティベート
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

// アクティベート：古いキャッシュを全削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// フェッチ戦略
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isCDN = CDN_ORIGINS.some(o => event.request.url.startsWith(o));

  if (isCDN) {
    // CDN: Cache First（フォント・ライブラリは変わらないため）
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 自サイトのアセット: Network First
  // → 常にネットワークから最新版を取得。オフライン時のみキャッシュにフォールバック
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
