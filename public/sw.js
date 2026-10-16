/*
 * 아주 얇은 서비스워커.
 * 역할 둘뿐입니다.
 *  1) 홈 화면에 설치할 수 있게 만든다 (Android 는 fetch 핸들러를 요구합니다)
 *  2) 껍데기(아이콘·폰트)를 캐시해 두 번째 실행부터 즉시 뜨게 한다
 * 체크 내용은 절대 캐시하지 않습니다. 현장에서는 늘 최신이어야 하니까요.
 */
const SHELL = 'sc-shell-v1';
const KEEP = [
  '/icon-192.png', '/icon-512.png', '/icon-maskable.png',
  '/apple-touch-icon.png', '/favicon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(KEEP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;       // 외부(Supabase·폰트)는 건드리지 않음
  if (url.pathname.startsWith('/api/')) return;          // PIN 검증은 늘 서버로

  // 아이콘만 캐시 우선, 나머지는 네트워크 우선
  if (KEEP.includes(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
    return;
  }
  e.respondWith(
    fetch(req).catch(() => caches.match(req).then(hit => hit || Response.error())),
  );
});
