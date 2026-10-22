// Petit serveur statique pour les tests (et pour essayer l'application en local) :
//   node tests/serve.js 4173   →   http://localhost:4173
const http = require('http');
const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

function creerServeur() {
  return http.createServer((req, res) => {
    let chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (chemin.endsWith('/')) chemin += 'index.html';
    const fichier = path.join(RACINE, chemin);
    if (!fichier.startsWith(RACINE + path.sep) || fichier.includes(`${path.sep}node_modules${path.sep}`)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(fichier, (err, contenu) => {
      if (err) { res.writeHead(404).end('Introuvable'); return; }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(fichier)] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(contenu);
    });
  });
}

module.exports = { creerServeur };

if (require.main === module) {
  const port = Number(process.argv[2]) || 4173;
  creerServeur().listen(port, () => console.log(`Prompteur : http://localhost:${port}`));
}
