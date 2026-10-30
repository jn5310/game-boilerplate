// 서비스 워커 원본. `npm run build` 때 scripts/build-sw.mjs가 아래 두 값을 채워서 dist/sw.js로 만듭니다.
// 직접 dist/sw.js를 수정하지 마세요 (빌드할 때마다 덮어씀).
const BUILD_ID = '__BUILD_ID__';
const PRECACHE_URLS = /*__PRECACHE_URLS__*/ [];

// 같은 주소(예: 아이디.github.io)에 여러 게임을 올려도 캐시가 섞이지 않게 경로를 이름에 포함
const CACHE_PREFIX = `game-cache:${self.registration.scope}:`;
const CACHE_NAME = CACHE_PREFIX + BUILD_ID;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 페이지(HTML): 인터넷 우선 → 새 버전을 바로 받음. 오프라인이면 저장된 것 사용
  // cache: 'no-cache' = 브라우저 캐시가 있어도 서버에 바뀌었는지 꼭 확인 (배포 직후에도 새 버전)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .catch(() => fetch(request))
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.match('./index.html').then((cached) => cached || cache.match('./')))
            .then((cached) => cached || Response.error()),
        ),
    );
    return;
  }

  // 나머지(JS·CSS·아이콘): 저장된 것 우선 → 빠르고 오프라인에서도 동작
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
