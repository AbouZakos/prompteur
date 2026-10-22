// Tests du prompteur (WebKit = moteur de Safari, iPad en paysage).
const { test, expect } = require('@playwright/test');
const path = require('path');
const { creerServeur } = require('./serve');

// Sans compte à rebours pour les tests (sauf réglage explicite), seulement au tout premier chargement.
const INIT = () => {
  if (!localStorage.getItem('prompteur.reglages')) {
    localStorage.setItem('prompteur.reglages', JSON.stringify({ decompte: false }));
  }
};

const TEXTE_TEST = [
  "Les 5 raisons qui rendent l'arabe facile pour les Français",
  'HOOK (0:00 à 0:10)',
  '[Option A (retournement)]',
  "L'arabe n'est pas la montagne qu'on t'a décrite. Et si tu parles français, tu pars même avec une longueur d'avance : cinq avantages, exactement.",
  'INTRO (0:10 à 1:30)',
  "As-salamou 'alaykoum wa rahmatoullahi wa barakatouh.",
  'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
  'Bismi Llahi r-Rahmani r-Rahim',
  "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux."
].join('\n\n');

// Colle le texte de test comme le ferait l'utilisateur (l'application démarre sans script).
async function collerTexteTest(page) {
  await page.click('#btn-scripts');
  await page.click('#btn-nouveau');
  await page.fill('#import-texte', TEXTE_TEST);
  await page.click('#btn-enregistrer');
  await expect(page.locator('#panneau-import')).toBeHidden();
}

async function ouvrir(page, url) {
  await page.addInitScript(INIT);
  await page.goto(url || '/');
  await page.waitForSelector('html[data-pret]');
  await page.click('#accueil');
  await expect(page.locator('#accueil')).toBeHidden();
  await collerTexteTest(page);
}

const etat = (page) => page.evaluate(() => window.Prompteur.etat());
const attendre = (page, ms) => page.waitForTimeout(ms);

test.beforeEach(({ page }) => {
  // L'application ne doit jamais utiliser confirm() / alert().
  page.on('dialog', (d) => { throw new Error('Boîte de dialogue native interdite : ' + d.message()); });
});

test('premier lancement : aucun script, l’application invite à en ajouter un', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('html[data-pret]');
  await page.click('#accueil');
  await expect(page.locator('#texte p.vide')).toHaveText('Aucun script ouvert. Touche « Scripts » pour en ajouter un.');
  await page.click('#btn-scripts');
  await expect(page.locator('#liste-scripts li')).toHaveCount(0);
  await expect(page.locator('#scripts-vide')).toBeVisible();
});

test('mise en forme : titre, intertitres, options', async ({ page }) => {
  await ouvrir(page);
  await expect(page.locator('#texte p.titre')).toHaveText("Les 5 raisons qui rendent l'arabe facile pour les Français");
  await expect(page.locator('#texte p.intertitre').first()).toHaveText('HOOK (0:00 à 0:10)');
  await expect(page.locator('#texte p.option')).toHaveText('[Option A (retournement)]');
  await expect(page.locator('#voyant')).toHaveClass('pause');
});

test('Espace démarre puis arrête le défilement', async ({ page }) => {
  await ouvrir(page);
  await page.keyboard.press('Space');
  await expect.poll(async () => (await etat(page)).lecture).toBe(true);
  await expect(page.locator('#voyant')).toHaveClass('lecture');
  await attendre(page, 700);
  expect((await etat(page)).pos).toBeGreaterThan(5);

  await page.keyboard.press('Space');
  await expect.poll(async () => (await etat(page)).lecture).toBe(false);
  const arret = (await etat(page)).pos;
  await attendre(page, 500);
  expect((await etat(page)).pos).toBe(arret);
  await expect(page.locator('#voyant')).toHaveClass('pause');
});

test('anti-rebond : un 2e appui à moins de 300 ms est ignoré', async ({ page }) => {
  await ouvrir(page);
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');            // double envoi d'une pédale
  await attendre(page, 100);
  expect((await etat(page)).lecture).toBe(true);
  await attendre(page, 300);
  await page.keyboard.press('Space');
  expect((await etat(page)).lecture).toBe(false);
});

test('les autres touches de pédale (Entrée, flèches, pages) fonctionnent par défaut', async ({ page }) => {
  await ouvrir(page);
  for (const touche of ['Enter', 'ArrowDown', 'PageDown', 'PageUp']) {
    const avant = (await etat(page)).lecture;
    await page.keyboard.press(touche);
    expect((await etat(page)).lecture).toBe(!avant);
    await attendre(page, 350);
  }
  // Une lettre ne fait rien.
  await page.keyboard.press('a');
  expect((await etat(page)).lecture).toBe(false);
});

test('« Apprendre ma pédale » : seule la touche apprise réagit', async ({ page }) => {
  await ouvrir(page);
  await page.click('#btn-reglages');
  await page.click('#btn-apprendre');
  await expect(page.locator('#pedale-etat')).toContainText('Appuie maintenant');
  await page.keyboard.press('PageDown');
  await expect(page.locator('#pedale-etat')).toContainText('Page suivante');
  // L'appui d'apprentissage ne lance pas la lecture.
  expect((await etat(page)).lecture).toBe(false);
  await page.locator('#panneau-reglages [data-fermer]').click();
  await attendre(page, 350);

  await page.keyboard.press('Space');
  expect((await etat(page)).lecture).toBe(false);
  await attendre(page, 350);
  await page.keyboard.press('PageDown');
  expect((await etat(page)).lecture).toBe(true);
  await attendre(page, 350);
  await page.keyboard.press('PageDown');
  expect((await etat(page)).lecture).toBe(false);

  // La touche apprise est mémorisée.
  await page.reload();
  await page.waitForSelector('html[data-pret]');
  await page.click('#accueil');
  await page.keyboard.press('Space');
  expect((await etat(page)).lecture).toBe(false);
  await page.keyboard.press('PageDown');      // > 300 ms après le précédent appui
  expect((await etat(page)).lecture).toBe(true);
});

test('miroir horizontal par défaut, vertical en option, réglages jamais inversés', async ({ page }) => {
  await ouvrir(page);
  const transform = (sel) => page.$eval(sel, (e) => getComputedStyle(e).transform);
  expect(await transform('#miroir')).toBe('matrix(-1, 0, 0, 1, 0, 0)');

  await page.click('#btn-reglages');
  expect(await transform('#panneau-reglages')).toBe('none');
  await page.click('label:has(#r-miroirV)');
  expect(await transform('#miroir')).toBe('matrix(-1, 0, 0, -1, 0, 0)');
  await page.click('label:has(#r-miroirH)');
  expect(await transform('#miroir')).toBe('matrix(1, 0, 0, -1, 0, 0)');
  await page.click('label:has(#r-miroirV)');
  expect(await transform('#miroir')).toBe('none');
  // La barre de commandes n'est jamais inversée (seulement centrée).
  expect(await transform('#commandes')).toMatch(/^matrix\(1, 0, 0, 1, /);
});

test('paragraphe arabe : droite à gauche, police Amiri chargée, 1,3 × plus grand', async ({ page }) => {
  await ouvrir(page);
  const ar = page.locator('#texte p.ar');
  await expect(ar).toHaveCount(1);
  await expect(ar).toHaveAttribute('dir', 'auto');
  const infos = await ar.evaluate(async (p) => {
    await document.fonts.ready;
    const fr = document.querySelector('#texte p.texte');
    const s = getComputedStyle(p);
    const amiri = [];
    document.fonts.forEach((f) => { if (f.family.replace(/["']/g, '') === 'Amiri') amiri.push(f.status); });
    return {
      direction: s.direction,
      alignement: s.textAlign,
      police: s.fontFamily,
      rapport: parseFloat(s.fontSize) / parseFloat(getComputedStyle(fr).fontSize),
      amiriChargee: amiri.indexOf('loaded') >= 0,
      check: document.fonts.check('56px Amiri', 'بِسْمِ')
    };
  });
  expect(infos.direction).toBe('rtl');
  expect(infos.alignement).toBe('right');
  expect(infos.police).toMatch(/^"?Amiri/);
  expect(infos.rapport).toBeCloseTo(1.3, 2);
  expect(infos.amiriChargee).toBe(true);
  expect(infos.check).toBe(true);
  // Le français reste de gauche à droite.
  expect(await page.$eval('#texte p.texte', (p) => getComputedStyle(p).direction)).toBe('ltr');
});

// Sur l'iPad, ce champ ouvre l'app Fichiers, où se trouve iCloud Drive.
const txt = (nom, texte) => ({ name: nom, mimeType: 'text/plain', buffer: Buffer.from(texte, 'utf8') });

test('import iCloud d’un fichier .txt : enregistré et ouvert directement', async ({ page }) => {
  await ouvrir(page);
  await page.click('#btn-scripts');
  await page.setInputFiles('#icloud-fichier',
    txt('mon-script.txt', 'Ma vidéo sur les lettres solaires\n\nINTRO (0:00 à 1:00)\n\nBonjour à tous !\n\nٱلشَّمْسُ\n'));
  await expect(page.locator('#panneau-scripts')).toBeHidden();
  await expect(page.locator('#texte p.titre')).toHaveText('Ma vidéo sur les lettres solaires');
  await expect(page.locator('#texte p.ar')).toHaveText('ٱلشَّمْسُ');
  await expect(page.locator('#message')).toHaveText('Script importé');

  await page.click('#btn-scripts');
  await expect(page.locator('#liste-scripts li')).toHaveCount(2);
});

test('import iCloud d’un fichier Word .docx (mammoth en local)', async ({ page }) => {
  await ouvrir(page);
  await page.click('#btn-scripts');
  await page.setInputFiles('#icloud-fichier', path.join(__dirname, 'fixtures', 'exemple.docx'));
  await expect(page.locator('#texte p.titre')).toHaveText('Script Word de test');
  await expect(page.locator('#texte p.intertitre')).toHaveText('INTRO (0:00 à 1:00)');
  await expect(page.locator('#texte p.ar')).toHaveCount(1);
});

test('import iCloud d’un fichier TextEdit .rtf (accents et arabe)', async ({ page }) => {
  await ouvrir(page);
  await page.click('#btn-scripts');
  await page.setInputFiles('#icloud-fichier', path.join(__dirname, 'fixtures', 'textedit.rtf'));
  await expect(page.locator('#texte p.titre')).toHaveText('Script TextEdit de test');
  await expect(page.locator('#texte p.intertitre')).toHaveText('RAISON 1 : LES LETTRES');
  await expect(page.locator('#texte p.texte').first())
    .toHaveText('Voilà un texte « accentué » écrit dans TextEdit — avec des guillemets.');
  await expect(page.locator('#texte p.ar')).toHaveText('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ');
  await expect(page.locator('#texte')).not.toContainText('Helvetica');
  await expect(page.locator('#texte')).not.toContainText('rtf');
});

test('réimporter un script corrigé le met à jour, sans doublon', async ({ page }) => {
  await ouvrir(page);
  await page.click('#btn-scripts');
  await page.setInputFiles('#icloud-fichier', txt('video-12.txt', 'Vidéo 12\n\nPremière version.'));
  await expect(page.locator('#texte')).toContainText('Première version.');

  await page.click('#btn-scripts');
  await page.locator('#liste-scripts li', { hasText: 'Vidéo 12' }).getByRole('button', { name: 'Renommer' }).click();
  await page.locator('input.renommer').fill('Vidéo 12 — tournage');
  await page.getByRole('button', { name: 'Valider' }).click();

  await page.setInputFiles('#icloud-fichier', txt('video-12.txt', 'Vidéo 12\n\nVersion corrigée.'));
  await expect(page.locator('#message')).toHaveText('Script mis à jour');
  await expect(page.locator('#texte')).toContainText('Version corrigée.');
  await expect(page.locator('#texte')).not.toContainText('Première version.');

  await page.click('#btn-scripts');
  await expect(page.locator('#liste-scripts li')).toHaveCount(2);        // exemple + vidéo 12
  await expect(page.locator('#liste-scripts li', { hasText: 'Vidéo 12 — tournage' })).toHaveCount(1);
});

test('import iCloud de plusieurs fichiers, et message clair pour un fichier Pages', async ({ page }) => {
  await ouvrir(page);
  await page.click('#btn-scripts');
  await page.setInputFiles('#icloud-fichier', [
    txt('a.txt', 'Script A\n\nTexte A.'),
    txt('b.md', '# Script B\n\nTexte **important** B.'),
    { name: 'brouillon.pages', mimeType: 'application/zip', buffer: Buffer.from('PK') }
  ]);
  await expect(page.locator('#scripts-message')).toContainText('2 script(s) importé(s)');
  await expect(page.locator('#scripts-message')).toContainText('brouillon.pages');
  await expect(page.locator('#scripts-message')).toContainText('Exporter vers > Word');
  await expect(page.locator('#liste-scripts li')).toHaveCount(3);
  await page.locator('#liste-scripts li', { hasText: 'Script B' }).getByRole('button', { name: 'Ouvrir' }).click();
  await expect(page.locator('#texte p.titre')).toHaveText('Script B');
  await expect(page.locator('#texte p.texte')).toHaveText('Texte important B.');
});

test('import par copier-coller', async ({ page }) => {
  await ouvrir(page);
  await page.click('#btn-scripts');
  await page.click('#btn-nouveau');
  await page.fill('#import-texte', 'Titre collé\n\nRAISON 1 : LE VOCABULAIRE\n\nTexte collé à lire.');
  await page.click('#btn-enregistrer');
  await expect(page.locator('#texte p.intertitre')).toHaveText('RAISON 1 : LE VOCABULAIRE');
});

test('les réglages sont mémorisés après rechargement', async ({ page }) => {
  await ouvrir(page);
  await page.click('#btn-reglages');
  await page.locator('#r-taille').fill('80');
  await page.locator('#r-vitesse').fill('120');
  await page.locator('#r-marges').fill('15');
  await page.click('button[data-theme=clair]');
  await page.click('label:has(#r-ligne)');
  await page.click('label:has(#r-miroirV)');
  await expect(page.locator('#r-taille-val')).toHaveText('80 px');

  await page.reload();
  await page.waitForSelector('html[data-pret]');
  expect(await page.$eval('#texte', (e) => getComputedStyle(e).fontSize)).toBe('80px');
  await expect(page.locator('#vitesse-valeur')).toHaveText('120');
  await expect(page.locator('body')).toHaveClass(/theme-clair/);
  await expect(page.locator('body')).toHaveClass(/sans-ligne/);
  expect(await page.$eval('body', (e) => getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');
  expect(await page.$eval('#miroir', (e) => getComputedStyle(e).transform)).toBe('matrix(-1, 0, 0, -1, 0, 0)');
  await expect(page.locator('#r-marges')).toHaveValue('15');
});

test('vitesse réglable pendant la lecture avec − et +', async ({ page }) => {
  await ouvrir(page);
  await page.keyboard.press('Space');
  await expect(page.locator('#btn-plus')).toBeVisible();
  await expect(page.locator('#btn-reglages')).toBeHidden();       // réglages masqués pendant la lecture
  await page.click('#btn-plus');
  await page.click('#btn-plus');
  await expect(page.locator('#vitesse-valeur')).toHaveText('70');
  expect((await etat(page)).lecture).toBe(true);                  // le bouton n'a pas mis en pause
  await page.click('#btn-moins');
  await expect(page.locator('#vitesse-valeur')).toHaveText('65');
});

test('toucher l’écran = pause / reprise ; glisser en pause déplace le texte', async ({ page }) => {
  await ouvrir(page);
  await page.mouse.click(500, 300);
  expect((await etat(page)).lecture).toBe(true);
  await page.mouse.click(500, 300);
  expect((await etat(page)).lecture).toBe(false);

  const avant = (await etat(page)).pos;
  await page.mouse.move(500, 500);
  await page.mouse.down();
  await page.mouse.move(500, 400, { steps: 5 });
  await page.mouse.move(500, 300, { steps: 5 });
  await page.mouse.up();
  const apres = await etat(page);
  expect(apres.lecture).toBe(false);
  expect(apres.pos).toBeGreaterThan(avant + 150);
});

test('compte à rebours de 3 s, puis « Revenir au début »', async ({ page }) => {
  await ouvrir(page);
  await page.click('#btn-reglages');
  await page.click('label:has(#r-decompte)');
  await page.locator('#panneau-reglages [data-fermer]').click();
  await page.keyboard.press('Space');
  await expect(page.locator('#decompte')).toHaveText('3');
  expect((await etat(page)).lecture).toBe(false);
  await expect(page.locator('#decompte')).toHaveText('1', { timeout: 3000 });
  await expect.poll(async () => (await etat(page)).lecture, { timeout: 3000 }).toBe(true);
  await expect(page.locator('#decompte')).toBeHidden();

  await attendre(page, 500);
  await page.keyboard.press('Space');
  expect((await etat(page)).pos).toBeGreaterThan(0);
  await page.click('#btn-debut');
  expect((await etat(page)).pos).toBe(0);
});

test('bibliothèque : renommer et supprimer avec confirmation dans la page', async ({ page }) => {
  await ouvrir(page);
  await page.click('#btn-scripts');
  const item = page.locator('#liste-scripts li').first();
  await item.getByRole('button', { name: 'Renommer' }).click();
  await item.locator('input.renommer').fill('Vidéo 12 — les lettres');
  await item.getByRole('button', { name: 'Valider' }).click();
  await expect(item.locator('strong')).toHaveText('Vidéo 12 — les lettres');

  await item.getByRole('button', { name: 'Supprimer' }).click();
  await expect(item).toContainText('Supprimer définitivement ?');
  await item.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.locator('#liste-scripts li')).toHaveCount(1);

  await item.getByRole('button', { name: 'Supprimer' }).click();
  await item.getByRole('button', { name: 'Oui, supprimer' }).click();
  await expect(page.locator('#liste-scripts li')).toHaveCount(0);
  await expect(page.locator('#scripts-vide')).toBeVisible();

  // Le script supprimé ne revient pas au rechargement.
  await page.reload();
  await page.waitForSelector('html[data-pret]');
  await expect(page.locator('#texte p.vide')).toBeVisible();
});

test('le dernier script et la position de lecture sont retrouvés', async ({ page }) => {
  await ouvrir(page);
  await page.click('#btn-scripts');
  await page.click('#btn-nouveau');
  const long = ['Script long', ''].concat(Array.from({ length: 60 }, (_, i) => `Paragraphe numéro ${i + 1} du script.`)).join('\n\n');
  await page.fill('#import-texte', long);
  await page.click('#btn-enregistrer');
  await page.keyboard.press('Space');
  await attendre(page, 1500);
  await page.keyboard.press('Space');
  const { pos, max } = await etat(page);
  expect(pos).toBeGreaterThan(0);

  await page.reload();
  await page.waitForSelector('html[data-pret]');
  await expect(page.locator('#texte p.titre')).toHaveText('Script long');
  const apres = await etat(page);
  expect(apres.pos / apres.max).toBeCloseTo(pos / max, 2);
});

test('fonctionne hors ligne après le premier chargement', async ({ browser }, testInfo) => {
  // Serveur dédié, qu'on arrête pour simuler la coupure d'Internet.
  const serveur = creerServeur();
  await new Promise((ok) => serveur.listen(0, '127.0.0.1', ok));
  const url = `http://127.0.0.1:${serveur.address().port}/`;
  const contexte = await browser.newContext({ viewport: testInfo.project.use.viewport });
  const page = await contexte.newPage();
  await page.goto(url);
  await page.waitForSelector('html[data-pret]');
  await page.click('#accueil');
  await collerTexteTest(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForSelector('html[data-pret]');
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  serveur.closeAllConnections();
  await new Promise((ok) => serveur.close(ok));
  const coupe = await page.request.get(url).then(() => false, () => true);
  expect(coupe).toBe(true);   // le serveur ne répond vraiment plus

  await page.reload();
  await page.waitForSelector('html[data-pret]');
  await expect(page.locator('#texte p.ar')).toBeVisible();
  const horsLigne = await page.evaluate(async () => {
    await document.fonts.ready;
    const css = getComputedStyle(document.querySelector('#texte')).fontFamily;
    await new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = 'vendor/mammoth.browser.min.js';
      s.onload = ok; s.onerror = ko;
      document.head.appendChild(s);
    });
    return { css, amiri: document.fonts.check('56px Amiri', 'بِسْمِ'), mammoth: typeof window.mammoth };
  });
  expect(horsLigne.css).toMatch(/Amiri/);
  expect(horsLigne.amiri).toBe(true);
  expect(horsLigne.mammoth).toBe('object');
  await contexte.close();
});
