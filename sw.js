/*
 * Service worker du Prompteur : met tous les fichiers en cache pour un usage hors connexion.
 * Stratégie : on répond depuis le cache (instantané, marche sans Internet) et on met
 * le cache à jour en arrière-plan ; une nouvelle version apparaît donc au lancement suivant.
 */
var CACHE = 'prompteur-v2';
var FICHIERS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.webmanifest',
  'fonts/amiri-arabic-400.woff2',
  'fonts/amiri-arabic-700.woff2',
  'vendor/mammoth.browser.min.js',
  'icons/icon-180.png',
  'icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) { return cache.addAll(FICHIERS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (noms) {
      return Promise.all(noms.filter(function (n) { return n !== CACHE; })
        .map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var requete = event.request;
  if (requete.method !== 'GET') return;
  if (new URL(requete.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(requete, { ignoreSearch: true }).then(function (enCache) {
        var reseau = fetch(requete).then(function (reponse) {
          if (reponse && reponse.ok && reponse.type === 'basic') cache.put(requete, reponse.clone());
          return reponse;
        });
        if (enCache) {
          reseau.catch(function () { /* hors ligne : la version en cache suffit */ });
          return enCache;
        }
        return reseau.catch(function () {
          if (requete.mode === 'navigate') return cache.match('./');
          throw new Error('Hors ligne et absent du cache : ' + requete.url);
        });
      });
    })
  );
});
