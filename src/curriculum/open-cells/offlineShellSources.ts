export const offlineWorkerSource = `const SHELL_VERSION = 'v1';
const SHELL_MANIFEST = self.__WB_MANIFEST;
const CACHE_PREFIX = 'academy-studio-shell-' + encodeURIComponent(self.registration.scope) + '-';
const INDEX_URL = new URL('index.html', self.registration.scope).href;
const SHELL_URLS = new Set(SHELL_MANIFEST.map((entry) => new URL(entry.url, self.registration.scope).href));
const cacheName = crypto.subtle.digest('SHA-256', new TextEncoder().encode(SHELL_VERSION + JSON.stringify(SHELL_MANIFEST)))
  .then((digest) => CACHE_PREFIX + Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(''));

self.addEventListener('install', (event) => {
  event.waitUntil(cacheName.then((name) => caches.open(name)).then((cache) =>
    cache.addAll([...SHELL_URLS].map((url) => new Request(url, { cache: 'reload' })))
  ));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(cacheName.then(async (name) => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== name).map((key) => caches.delete(key)));
    await self.clients.claim();
  }));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'academy:activate-update') event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const isNavigation = request.mode === 'navigate' && url.href.startsWith(self.registration.scope);
  if (!isNavigation && !SHELL_URLS.has(url.href)) return;
  event.respondWith(cacheName.then((name) => caches.open(name)).then(async (cache) =>
    (await cache.match(isNavigation ? INDEX_URL : request)) ?? fetch(request)
  ));
});
`;

export const offlineClientSource = `const supported = window.top === window && globalThis.isSecureContext && 'serviceWorker' in navigator;
let state = Object.freeze({ status: supported ? 'loading' : 'unsupported', online: navigator.onLine, checking: false, updateResult: 'idle', networkResult: 'idle' });
let registration;
let started;
const listeners = new Set();

function publish(patch) {
  state = Object.freeze({ ...state, ...patch });
  listeners.forEach((listener) => listener(state));
}

export function getOfflineState() { return state; }
export function subscribeOfflineState(listener) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

function syncRegistration() {
  publish({ status: registration?.waiting ? 'waiting' : navigator.serviceWorker.controller ? 'ready' : 'loading' });
}

function observeInstalling(worker) {
  if (!worker) return;
  const changed = () => {
    if (worker.state === 'installed') syncRegistration();
    if (worker.state === 'redundant') publish({ updateResult: 'error', status: navigator.serviceWorker.controller ? 'ready' : 'error' });
    if (['installed', 'redundant'].includes(worker.state)) worker.removeEventListener('statechange', changed);
  };
  worker.addEventListener('statechange', changed);
  changed();
}

export function startOfflineShell() {
  if (!supported) return Promise.resolve();
  if (started) return started;
  started = (async () => {
    let controlled = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (controlled) { location.reload(); return; }
      controlled = true;
      syncRegistration();
    });
    window.addEventListener('online', () => publish({ online: true }));
    window.addEventListener('offline', () => publish({ online: false }));
    try {
      registration = await navigator.serviceWorker.register(new URL('sw.js', document.baseURI).href, { updateViaCache: 'none' });
      registration.addEventListener('updatefound', () => observeInstalling(registration.installing));
      observeInstalling(registration.installing);
      syncRegistration();
      await navigator.serviceWorker.ready;
      syncRegistration();
    } catch { publish({ status: 'error' }); }
  })();
  return started;
}

export async function checkOfflineUpdate() {
  if (!registration || state.checking) return;
  publish({ checking: true, updateResult: 'idle' });
  try {
    await registration.update();
    publish({ updateResult: 'checked' });
  } catch { publish({ updateResult: 'error' }); }
  finally { publish({ checking: false }); }
}

export function activateOfflineUpdate() {
  registration?.waiting?.postMessage({ type: 'academy:activate-update' });
}

export async function loadNetworkSample() {
  if (!supported || state.networkResult === 'loading') return;
  publish({ networkResult: 'loading' });
  try {
    const response = await fetch(new URL('resources/live-status.json', document.baseURI), { cache: 'no-store' });
    if (!response.ok) throw new Error('Network response failed');
    const value = await response.json();
    if (typeof value.revision !== 'string') throw new Error('Invalid network data');
    publish({ networkResult: 'success' });
  } catch { publish({ networkResult: 'error' }); }
}
`;
