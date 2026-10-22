// Génère icons/icon-180.png et icons/icon-512.png (fond noir) : node outils/icones.mjs
import { webkit } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const html = (t) => `<!doctype html><html><body style="margin:0;background:#000">
<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${t}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#000"/>
  <rect x="96" y="150" width="320" height="34" rx="17" fill="#fff"/>
  <rect x="96" y="222" width="250" height="34" rx="17" fill="#f3d98b"/>
  <rect x="96" y="294" width="300" height="34" rx="17" fill="#fff"/>
  <rect x="96" y="366" width="190" height="34" rx="17" fill="#fff" opacity="0.55"/>
  <rect x="60" y="212" width="392" height="54" rx="8" fill="none" stroke="#f3d98b" stroke-width="6" opacity="0.6"/>
</svg></body></html>`;

const navigateur = await webkit.launch();
for (const t of [180, 512]) {
  const page = await navigateur.newPage({ viewport: { width: t, height: t } });
  await page.setContent(html(t));
  await page.screenshot({ path: path.join(racine, 'icons', `icon-${t}.png`) });
  await page.close();
}
await navigateur.close();
console.log('Icônes générées');
