// ============================================================
// 🔔 金運ホロスコープカレンダー Service Worker
// ============================================================
const CACHE_NAME = 'kinunn-v1';
const BASE_URL   = 'https://11th-principality.github.io/kinunn-calendar/';

// インストール時にキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png',
      ]).catch(() => {}); // キャッシュ失敗しても続行
    })
  );
  self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ：キャッシュ優先
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});

// プッシュ通知受信
self.addEventListener('push', event => {
  let data = { title: '✦ 金運ホロスコープカレンダー', body: '今日の金運をチェックしましょう ✨' };
  if (event.data) {
    try { data = event.data.json(); } catch(e) { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    './icon-192.png',
      badge:   './icon-192.png',
      tag:     'kinsei-daily',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open',    title: '今日の金運を見る' },
        { action: 'dismiss', title: '閉じる' },
      ],
      data: { url: BASE_URL },
    })
  );
});

// 通知タップでアプリを開く
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = (event.notification.data && event.notification.data.url) || BASE_URL;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // すでに開いているタブがあればフォーカス
      for (const client of clientList) {
        if (client.url.includes('kinunn-calendar') && 'focus' in client) {
          return client.focus();
        }
      }
      // なければ新しいタブで開く
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
