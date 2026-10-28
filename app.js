/*
 * Prompteur L'Arabe Facile
 * JavaScript « classique » (ES2017) pour Safari 15 / iPadOS 15 :
 * pas de module, pas d'étape de build, pas de ?. ni ??, pas de navigator.wakeLock.
 */
(function () {
  'use strict';

  // ---------- Constantes ----------

  var CLE_REGLAGES = 'prompteur.reglages';
  var CLE_DERNIER = 'prompteur.dernier';
  var CLE_POSITIONS = 'prompteur.positions';
  var CLE_SCRIPTS_LS = 'prompteur.scripts';

  var ANTI_REBOND_MS = 300;
  var SEUIL_GLISSE_PX = 12;
  var VITESSE_MIN = 10;
  var VITESSE_MAX = 400;
  var PAS_VITESSE = 5;
  var DELAI_BARRE_MS = 3000;  // la barre de commandes disparaît 3 s après le départ
  var DUREE_SAUT_RECUL_S = 0.3;       // un appui sur « retour » remonte en 0,3 s
  var DELAI_MAINTIEN_RECUL_MS = 500;  // au-delà, bouton maintenu : on remonte en continu
  var LIGNES_PAR_S_MAINTIEN = 8;

  // Touches envoyées par les pédales « page turner » (elles se comportent comme un clavier).
  var TOUCHES_DEFAUT = [' ', 'Spacebar', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Up', 'Down', 'Left', 'Right', 'PageUp', 'PageDown'];
  var CODES_DEFAUT = [13, 32, 33, 34, 37, 38, 39, 40];
  var MODIFICATEURS = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn', 'OS'];

  var DEFAUTS = {
    vitesse: 60,          // pixels par seconde
    taille: 56,           // px
    tailleArabe: 1.3,     // multiple de la taille du français
    interligne: 1.5,
    marges: 8,            // % de chaque côté
    miroirH: true,
    miroirV: false,
    theme: 'sombre',
    ligneLecture: true,
    decompte: true,
    pedale: null,         // bouton pause / reprise : { key, code, keyCode } une fois appris
    pedaleRecul: null,    // bouton retour en arrière (2e bouton de la pédale, facultatif)
    reculLignes: 3        // lignes remontées à chaque appui sur « retour »
  };

  // Vidéo MP4 muette de 2 s (16×16 px), jouée en boucle : empêche la mise en veille (méthode NoSleep.js).
  var VIDEO_VEILLE = 'data:video/mp4;base64,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X21lPTEgdHJlbGxpcz0xIDh4OGRjdD0wIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTAgd2VpZ2h0cD0wIGtleWludD0yNTAga2V5aW50X21pbj0xIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAADmWIhAW///8PRQABT3+AARggBwEYIAcBGCAHARggBwEYIAcBGCAHARggBwEYIAcAAAAGQZo4CvqAARggBwEYIAcBGCAHARggBwEYIAcBGCAHARggBwEYIAc=';

  // ---------- Petits utilitaires ----------

  function $(id) { return document.getElementById(id); }

  function lireJSON(cle, defaut) {
    try {
      var brut = localStorage.getItem(cle);
      return brut ? JSON.parse(brut) : defaut;
    } catch (e) { return defaut; }
  }
  function ecrireJSON(cle, valeur) {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); return true; } catch (e) { return false; }
  }
  function borner(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function virgule(n, decimales) { return n.toFixed(decimales).replace('.', ','); }

  var minuterieMessage = null;
  function afficherMessage(texte, duree) {
    var m = $('message');
    m.textContent = texte;
    m.hidden = false;
    clearTimeout(minuterieMessage);
    minuterieMessage = setTimeout(function () { m.hidden = true; }, duree || 2500);
  }

  // ---------- Stockage des scripts : IndexedDB, repli localStorage ----------

  var Stock = (function () {
    var base = null;

    // Certaines versions de Safari laissent parfois indexedDB.open() sans réponse : délai de 4 s.
    var pret = new Promise(function (ok) {
      var fini = false;
      function terminer(resultat) { if (!fini) { fini = true; ok(resultat); } }
      setTimeout(function () { terminer(false); }, 4000);
      try {
        if (!window.indexedDB) return terminer(false);
        var req = indexedDB.open('prompteur', 1);
        req.onupgradeneeded = function () {
          if (!req.result.objectStoreNames.contains('scripts')) {
            req.result.createObjectStore('scripts', { keyPath: 'id' });
          }
        };
        req.onsuccess = function () { base = req.result; terminer(true); };
        req.onerror = function () { terminer(false); };
      } catch (e) { terminer(false); }
    });

    function transaction(mode, action) {
      return new Promise(function (ok, ko) {
        var t = base.transaction('scripts', mode);
        var requete = action(t.objectStore('scripts'));
        t.oncomplete = function () { ok(requete.result); };
        t.onerror = function () { ko(t.error); };
        t.onabort = function () { ko(t.error); };
      });
    }

    function lsTous() { return lireJSON(CLE_SCRIPTS_LS, []); }
    function lsMettre(script) {
      var liste = lsTous().filter(function (s) { return s.id !== script.id; });
      liste.push(script);
      if (!ecrireJSON(CLE_SCRIPTS_LS, liste)) throw new Error('Mémoire pleine');
    }
    function lsSupprimer(id) {
      ecrireJSON(CLE_SCRIPTS_LS, lsTous().filter(function (s) { return s.id !== id; }));
    }

    return {
      pret: pret,
      tous: function () {
        return pret.then(function (idb) {
          return idb ? transaction('readonly', function (s) { return s.getAll(); }) : lsTous();
        });
      },
      lire: function (id) {
        return pret.then(function (idb) {
          if (idb) return transaction('readonly', function (s) { return s.get(id); });
          return lsTous().filter(function (s) { return s.id === id; })[0];
        });
      },
      mettre: function (script) {
        return pret.then(function (idb) {
          if (idb) return transaction('readwrite', function (s) { return s.put(script); });
          lsMettre(script);
        });
      },
      supprimer: function (id) {
        return pret.then(function (idb) {
          if (idb) return transaction('readwrite', function (s) { return s.delete(id); });
          lsSupprimer(id);
        });
      }
    };
  })();

  // ---------- Analyse et affichage du texte ----------

  var RE_ARABE = /[؀-ۿݐ-ݿࡰ-ࣿﭐ-﷿ﹰ-﻿]/g;
  var RE_LATIN = /[A-Za-zÀ-ÖØ-öø-ÿ]/g;

  function compter(texte, re) {
    var m = texte.match(re);
    return m ? m.length : 0;
  }

  function estIntertitre(ligne) {
    if (ligne.length > 120 || compter(ligne, RE_ARABE) > 0) return false;
    // « HOOK (0:00 à 0:10) » : on ignore ce qui est entre parenthèses (le « à » est en minuscule).
    var lettres = ligne.replace(/\([^)]*\)/g, '').match(RE_LATIN);
    if (!lettres || lettres.length < 2) return false;
    var majuscules = 0;
    for (var i = 0; i < lettres.length; i++) {
      if (lettres[i] !== lettres[i].toLowerCase()) majuscules++;
    }
    return majuscules / lettres.length >= 0.85;
  }

  function analyser(texte) {
    var lignes = texte.replace(/\r\n?/g, '\n').split('\n');
    var blocs = [];
    var videAvant = false;
    for (var i = 0; i < lignes.length; i++) {
      var ligne = lignes[i].replace(/\s+$/, '').replace(/^\s+/, '');
      if (!ligne) { videAvant = blocs.length > 0; continue; }
      var type;
      if (/^\[.*\]$/.test(ligne)) type = 'option';
      else if (estIntertitre(ligne)) type = 'intertitre';
      else if (compter(ligne, RE_ARABE) > compter(ligne, RE_LATIN)) type = 'ar';
      else if (blocs.length === 0) type = 'titre';
      else type = 'texte';
      blocs.push({ type: type, texte: ligne, espace: videAvant });
      videAvant = false;
    }
    return blocs;
  }

  function afficherTexte(texte) {
    var conteneur = el.texte;
    conteneur.innerHTML = '';
    var fragment = document.createDocumentFragment();
    analyser(texte).forEach(function (bloc) {
      var p = document.createElement('p');
      p.className = bloc.type + (bloc.espace ? ' espace' : '');
      p.setAttribute('dir', 'auto');
      if (bloc.type === 'ar') p.setAttribute('lang', 'ar');
      p.textContent = bloc.texte;
      fragment.appendChild(p);
    });
    conteneur.appendChild(fragment);
  }

  function afficherVide() {
    el.texte.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'vide';
    p.textContent = 'Aucun script ouvert. Touche « Scripts » pour en ajouter un.';
    el.texte.appendChild(p);
  }

  function premiereLigne(texte) {
    var lignes = texte.split('\n');
    for (var i = 0; i < lignes.length; i++) {
      var l = lignes[i].trim();
      if (l) return l.length > 80 ? l.slice(0, 80) + '…' : l;
    }
    return 'Script sans titre';
  }

  // ---------- État ----------

  var el = {};
  var reglages = Object.assign({}, DEFAUTS, lireJSON(CLE_REGLAGES, {}));
  var etat = {
    lecture: false,
    pos: 0,
    max: 0,
    dernierT: 0,
    raf: 0,
    decompte: null,        // minuteries du compte à rebours en cours
    dernierAppui: 0,
    derniereSauvegarde: 0,
    apprentissage: false,
    minuterieApprentissage: null,
    finEtape1: 0,
    dernierRecul: 0,
    minuterieBarre: null,
    scriptId: null,
    accueil: true
  };

  function sauverReglages() { ecrireJSON(CLE_REGLAGES, reglages); }

  // ---------- Défilement ----------

  function mesurer() {
    var ratio = etat.max > 0 ? etat.pos / etat.max : 0;
    etat.max = Math.max(0, el.texte.offsetHeight - el.fenetre.clientHeight);
    etat.pos = ratio * etat.max;
    appliquerPosition();
  }

  function formaterDuree(secondes) {
    secondes = Math.max(0, Math.round(secondes));
    var m = Math.floor(secondes / 60);
    var s = secondes % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function appliquerPosition() {
    var t = 'translate3d(0,' + (-etat.pos).toFixed(2) + 'px,0)';
    el.texte.style.webkitTransform = t;
    el.texte.style.transform = t;
    var avance = etat.max > 0 ? etat.pos / etat.max : 0;
    el.barre.style.width = (avance * 100).toFixed(2) + '%';
    var restant = 'reste ' + formaterDuree((etat.max - etat.pos) / reglages.vitesse);
    if (el.restant.textContent !== restant) el.restant.textContent = restant;
  }

  function boucle(t) {
    if (!etat.lecture) return;
    var dt = etat.dernierT ? Math.min((t - etat.dernierT) / 1000, 0.1) : 0;
    etat.dernierT = t;
    if (!recul.raf) etat.pos += reglages.vitesse * dt;
    if (etat.pos >= etat.max) {
      etat.pos = etat.max;
      appliquerPosition();
      pause();
      afficherBarre(false);   // fin du script : on montre la barre
      return;
    }
    appliquerPosition();
    if (t - etat.derniereSauvegarde > 1000) {
      etat.derniereSauvegarde = t;
      memoriserPosition();
    }
    etat.raf = requestAnimationFrame(boucle);
  }

  function demarrerDefilement() {
    annulerDecompte();
    if (etat.lecture) return;
    etat.lecture = true;
    etat.dernierT = 0;
    cancelAnimationFrame(etat.raf);
    etat.raf = requestAnimationFrame(boucle);
    majInterfaceLecture();
  }

  function pause() {
    annulerDecompte();
    etat.lecture = false;
    cancelAnimationFrame(etat.raf);
    memoriserPosition();
    majInterfaceLecture();
  }

  function lancer() {
    if (!etat.scriptId) { afficherMessage('Ouvre d’abord un script (bouton « Scripts »).'); return; }
    if (etat.max <= 0) mesurer();
    if (etat.pos >= etat.max - 1) { etat.pos = 0; appliquerPosition(); }
    if (reglages.decompte && etat.pos < 1) lancerDecompte();
    else demarrerDefilement();
    if (barreVisible()) afficherBarre(true);
  }

  // ---------- Barre de commandes ----------
  // Elle disparaît d'elle-même après le départ, et ne revient qu'en touchant l'écran :
  // la pédale met seulement en pause / relance, sans jamais la faire apparaître.

  function barreVisible() { return !document.body.classList.contains('barre-cachee'); }

  function afficherBarre(masquerEnsuite) {
    clearTimeout(etat.minuterieBarre);
    document.body.classList.remove('barre-cachee');
    if (masquerEnsuite) etat.minuterieBarre = setTimeout(masquerBarre, DELAI_BARRE_MS);
  }

  function masquerBarre() {
    clearTimeout(etat.minuterieBarre);
    document.body.classList.add('barre-cachee');
  }

  function basculer() {
    if (etat.decompte) { pause(); return; }
    if (etat.lecture) pause();
    else lancer();
  }

  function lancerDecompte() {
    var n = 3;
    etat.decompte = [];
    el.decompte.textContent = String(n);
    el.decompte.hidden = false;
    for (var i = 1; i <= 3; i++) {
      (function (i) {
        etat.decompte.push(setTimeout(function () {
          if (i < 3) el.decompte.textContent = String(n - i);
          else demarrerDefilement();
        }, i * 1000));
      })(i);
    }
    majInterfaceLecture();
  }

  function annulerDecompte() {
    if (!etat.decompte) return;
    etat.decompte.forEach(clearTimeout);
    etat.decompte = null;
    el.decompte.hidden = true;
  }

  function revenirAuDebut() {
    pause();
    etat.pos = 0;
    appliquerPosition();
    memoriserPosition();
  }

  // ---------- Retour en arrière (2e bouton de la pédale) ----------
  // Chaque appui remonte de quelques lignes ; un appui maintenu remonte en continu.
  // La lecture continue (ou reste en pause) comme avant l'appui.

  var recul = { raf: 0, restant: 0, vitesseSaut: 0, maintenu: false, debut: 0, dernierT: 0 };

  function hauteurLigne() { return reglages.taille * reglages.interligne; }

  function commencerRecul() {
    if (!etat.scriptId) return;
    recul.restant += hauteurLigne() * reglages.reculLignes;
    recul.vitesseSaut = recul.restant / DUREE_SAUT_RECUL_S;
    recul.maintenu = true;
    recul.debut = performance.now();
    if (!recul.raf) {
      recul.dernierT = 0;
      recul.raf = requestAnimationFrame(boucleRecul);
    }
  }

  function arreterRecul() { recul.maintenu = false; }

  function annulerRecul() {
    cancelAnimationFrame(recul.raf);
    recul.raf = 0;
    recul.restant = 0;
    recul.maintenu = false;
  }

  function boucleRecul(t) {
    var dt = recul.dernierT ? Math.min((t - recul.dernierT) / 1000, 0.1) : 0;
    recul.dernierT = t;
    var pas = Math.min(recul.restant, recul.vitesseSaut * dt);
    recul.restant -= pas;
    var maintien = performance.now() - recul.debut;
    if (maintien > 15000) recul.maintenu = false;   // sécurité si le relâchement n'arrive jamais
    if (recul.maintenu && maintien > DELAI_MAINTIEN_RECUL_MS) pas += hauteurLigne() * LIGNES_PAR_S_MAINTIEN * dt;
    etat.pos = Math.max(0, etat.pos - pas);
    if (etat.pos === 0) { recul.restant = 0; recul.maintenu = false; }
    appliquerPosition();
    if (recul.restant > 0.5 || recul.maintenu) {
      recul.raf = requestAnimationFrame(boucleRecul);
      return;
    }
    recul.raf = 0;
    recul.restant = 0;
    memoriserPosition();
  }

  function changerVitesse(delta) {
    reglages.vitesse = borner(reglages.vitesse + delta, VITESSE_MIN, VITESSE_MAX);
    sauverReglages();
    majAffichageReglages();
    appliquerPosition();
  }

  function majInterfaceLecture() {
    var actif = etat.lecture || !!etat.decompte;
    el.voyant.className = etat.decompte ? 'decompte' : (etat.lecture ? 'lecture' : 'pause');
    el.btnLecture.textContent = actif ? '❚❚ Pause' : '▶︎ Lire';
  }

  // ---------- Position de lecture mémorisée ----------

  function memoriserPosition() {
    if (!etat.scriptId) return;
    var positions = lireJSON(CLE_POSITIONS, {});
    positions[etat.scriptId] = etat.max > 0 ? etat.pos / etat.max : 0;
    ecrireJSON(CLE_POSITIONS, positions);
  }

  // ---------- Réglages ----------

  var CURSEURS = [
    { id: 'r-vitesse', cle: 'vitesse', format: function (v) { return String(v); } },
    { id: 'r-taille', cle: 'taille', format: function (v) { return v + ' px'; } },
    { id: 'r-arabe', cle: 'tailleArabe', format: function (v) { return '× ' + virgule(v, 2); } },
    { id: 'r-interligne', cle: 'interligne', format: function (v) { return virgule(v, 2); } },
    { id: 'r-marges', cle: 'marges', format: function (v) { return v + ' %'; } },
    { id: 'r-recul', cle: 'reculLignes', format: function (v) { return v + (v > 1 ? ' lignes' : ' ligne'); } }
  ];
  var INTERRUPTEURS = [
    { id: 'r-decompte', cle: 'decompte' },
    { id: 'r-ligne', cle: 'ligneLecture' },
    { id: 'r-miroirH', cle: 'miroirH' },
    { id: 'r-miroirV', cle: 'miroirV' }
  ];

  function appliquerReglages() {
    var racine = document.documentElement.style;
    racine.setProperty('--taille', reglages.taille + 'px');
    racine.setProperty('--taille-arabe', String(reglages.tailleArabe));
    racine.setProperty('--interligne', String(reglages.interligne));
    racine.setProperty('--marge', reglages.marges + '%');

    var miroir = (reglages.miroirH || reglages.miroirV)
      ? 'scale(' + (reglages.miroirH ? -1 : 1) + ',' + (reglages.miroirV ? -1 : 1) + ')'
      : 'none';
    el.miroir.style.webkitTransform = miroir;
    el.miroir.style.transform = miroir;

    document.body.classList.toggle('theme-clair', reglages.theme === 'clair');
    document.body.classList.toggle('sans-ligne', !reglages.ligneLecture);
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', reglages.theme === 'clair' ? '#ffffff' : '#000000');

    mesurer();
    majAffichageReglages();
  }

  function majAffichageReglages() {
    CURSEURS.forEach(function (c) {
      var champ = $(c.id);
      if (String(champ.value) !== String(reglages[c.cle])) champ.value = reglages[c.cle];
      $(c.id + '-val').textContent = c.format(reglages[c.cle]);
    });
    INTERRUPTEURS.forEach(function (i) { $(i.id).checked = !!reglages[i.cle]; });
    Array.prototype.forEach.call(document.querySelectorAll('.theme'), function (b) {
      b.classList.toggle('actif', b.getAttribute('data-theme') === reglages.theme);
    });
    el.vitesseValeur.textContent = String(reglages.vitesse);
    majEtatPedale();
  }

  // ---------- Pédale (clavier Bluetooth) ----------

  var NOMS_TOUCHES = {
    ' ': 'Espace', 'Spacebar': 'Espace', 'Enter': 'Entrée',
    'ArrowUp': 'Flèche haut', 'ArrowDown': 'Flèche bas', 'ArrowLeft': 'Flèche gauche', 'ArrowRight': 'Flèche droite',
    'Up': 'Flèche haut', 'Down': 'Flèche bas', 'Left': 'Flèche gauche', 'Right': 'Flèche droite',
    'PageUp': 'Page précédente', 'PageDown': 'Page suivante'
  };

  function nomTouche(p) {
    if (p.key && p.key !== 'Unidentified') return NOMS_TOUCHES[p.key] || p.key;
    return 'code ' + p.keyCode;
  }

  function correspond(e, p) {
    if (p.key && p.key !== 'Unidentified') return e.key === p.key && (!p.code || !e.code || e.code === p.code);
    return e.keyCode === p.keyCode;
  }

  function estToucheRecul(e) {
    return !!reglages.pedaleRecul && correspond(e, reglages.pedaleRecul);
  }

  function estTouchePedale(e) {
    if (estToucheRecul(e)) return false;
    if (reglages.pedale) return correspond(e, reglages.pedale);
    if (TOUCHES_DEFAUT.indexOf(e.key) >= 0) return true;
    return (!e.key || e.key === 'Unidentified') && CODES_DEFAUT.indexOf(e.keyCode) >= 0;
  }

  function majEtatPedale() {
    el.btnApprendre.classList.toggle('actif', !!etat.apprentissage);
    if (etat.apprentissage === 'pause') {
      el.pedaleEtat.textContent = '1/2 — Appuie sur le bouton de la pédale qui doit faire PAUSE / REPRISE…';
      el.btnApprendre.textContent = 'Annuler';
      return;
    }
    if (etat.apprentissage === 'recul') {
      el.pedaleEtat.textContent = '2/2 — Appuie maintenant sur le bouton qui doit faire RETOUR EN ARRIÈRE…';
      el.btnApprendre.textContent = 'Pas de 2e bouton';
      return;
    }
    el.btnApprendre.textContent = 'Apprendre ma pédale';
    el.pedaleEtat.textContent = (reglages.pedale
      ? 'Pause / reprise : « ' + nomTouche(reglages.pedale) + ' ».'
      : 'Pause / reprise : Espace, Entrée, flèches, Page précédente ou Page suivante.') +
      (reglages.pedaleRecul
        ? ' Retour en arrière : « ' + nomTouche(reglages.pedaleRecul) + ' ».'
        : ' Retour en arrière : aucun bouton réglé.');
  }

  function relancerMinuterieApprentissage() {
    clearTimeout(etat.minuterieApprentissage);
    etat.minuterieApprentissage = setTimeout(arreterApprentissage, 20000);
  }

  function commencerApprentissage() {
    etat.apprentissage = 'pause';
    relancerMinuterieApprentissage();
    majEtatPedale();
    // Le bouton garde le focus, sinon : le clavier d'iPad pourrait viser un curseur.
    el.btnApprendre.blur();
    el.scene.focus();
  }

  function arreterApprentissage() {
    etat.apprentissage = false;
    clearTimeout(etat.minuterieApprentissage);
    majEtatPedale();
  }

  function toucheDe(e) { return { key: e.key || '', code: e.code || '', keyCode: e.keyCode || 0 }; }

  // Étape 1 : bouton pause / reprise. Étape 2 : bouton retour en arrière (facultatif).
  function apprendreTouche(e) {
    var maintenant = Date.now();
    if (etat.apprentissage === 'pause') {
      reglages.pedale = toucheDe(e);
      reglages.pedaleRecul = null;
      sauverReglages();
      etat.apprentissage = 'recul';
      etat.finEtape1 = maintenant;
      relancerMinuterieApprentissage();
      majEtatPedale();
      return;
    }
    // Certaines pédales envoient deux touches par appui : on ignore ce qui suit de trop près.
    if (maintenant - etat.finEtape1 < 400) return;
    if (correspond(e, reglages.pedale)) {
      el.pedaleEtat.textContent = 'Ça, c’est le bouton pause. Appuie sur l’AUTRE bouton de la pédale…';
      return;
    }
    reglages.pedaleRecul = toucheDe(e);
    sauverReglages();
    etat.dernierAppui = maintenant;
    arreterApprentissage();
    afficherMessage('Pédale enregistrée : pause « ' + nomTouche(reglages.pedale) +
      ' », retour « ' + nomTouche(reglages.pedaleRecul) + ' »');
  }

  function terminerSansRecul() {
    // Le 2e bouton n'est pas réglé : ce premier appui ne doit pas lancer la lecture.
    etat.dernierAppui = Date.now();
    arreterApprentissage();
    afficherMessage('Pédale enregistrée : « ' + nomTouche(reglages.pedale) + ' »');
  }

  function estChampSaisie(cible) {
    if (!cible || !cible.tagName) return false;
    var tag = cible.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT') return ['checkbox', 'button', 'submit', 'file'].indexOf(cible.type) < 0;
    return !!cible.isContentEditable;
  }

  function surToucheEnfoncee(e) {
    if (etat.apprentissage) {
      if (e.key === 'Escape') {
        if (etat.apprentissage === 'recul') terminerSansRecul();
        else arreterApprentissage();
        return;
      }
      if (MODIFICATEURS.indexOf(e.key) >= 0) return;
      e.preventDefault();
      if (!e.repeat) apprendreTouche(e);
      return;
    }
    if (estChampSaisie(e.target)) return;
    if (e.key === 'Escape') { fermerPanneaux(); return; }

    if (estToucheRecul(e)) {
      e.preventDefault();
      if (e.repeat) return;
      var instant = Date.now();
      if (instant - etat.dernierRecul < 150) return;   // double envoi de certaines pédales
      etat.dernierRecul = instant;
      if (etat.accueil) masquerAccueil();
      if (panneauOuvert()) { fermerPanneaux(); return; }
      commencerRecul();
      return;
    }
    if (!estTouchePedale(e)) return;

    e.preventDefault();   // Espace ne doit ni faire défiler la page ni « cliquer » un bouton
    if (e.repeat) return;
    var maintenant = Date.now();
    if (maintenant - etat.dernierAppui < ANTI_REBOND_MS) return;
    etat.dernierAppui = maintenant;

    if (etat.accueil) masquerAccueil();
    if (panneauOuvert()) { fermerPanneaux(); return; }
    basculer();
  }

  function surToucheRelachee(e) {
    if (etat.apprentissage || estChampSaisie(e.target)) return;
    if (estToucheRecul(e)) { e.preventDefault(); arreterRecul(); return; }
    if (estTouchePedale(e)) e.preventDefault();
  }

  // ---------- Toucher : tap = afficher / masquer la barre, glisser = se déplacer (en pause) ----------

  var geste = null;

  function surPointeurBas(e) {
    if (e.isPrimary === false) return;
    geste = { id: e.pointerId, x: e.clientX, y: e.clientY, pos: etat.pos, glisse: false };
    try { el.scene.setPointerCapture(e.pointerId); } catch (err) { /* sans importance */ }
  }

  function surPointeurDeplace(e) {
    if (!geste || e.pointerId !== geste.id) return;
    var dy = e.clientY - geste.y;
    if (!geste.glisse) {
      if (Math.abs(dy) < SEUIL_GLISSE_PX || etat.lecture || etat.decompte || panneauOuvert()) return;
      geste.glisse = true;
      geste.y = e.clientY;
      dy = 0;
    }
    // Le texte suit le doigt ; en miroir vertical, le sens est inversé à l'écran.
    var sens = reglages.miroirV ? -1 : 1;
    etat.pos = borner(geste.pos - dy * sens, 0, etat.max);
    appliquerPosition();
  }

  function surPointeurHaut(e) {
    if (!geste || e.pointerId !== geste.id) return;
    var g = geste;
    geste = null;
    activerEcran();
    if (g.glisse) { memoriserPosition(); return; }
    if (Math.abs(e.clientX - g.x) > SEUIL_GLISSE_PX || Math.abs(e.clientY - g.y) > SEUIL_GLISSE_PX) return;
    if (panneauOuvert()) { fermerPanneaux(); return; }
    if (barreVisible()) masquerBarre();
    else afficherBarre(etat.lecture || !!etat.decompte);
  }

  // ---------- Garder l'écran allumé (iPadOS 15 n'a pas Wake Lock) ----------

  var videoVeille = null;

  function activerEcran() {
    if (!videoVeille) {
      videoVeille = document.createElement('video');
      videoVeille.setAttribute('playsinline', '');
      videoVeille.setAttribute('webkit-playsinline', '');
      videoVeille.setAttribute('muted', '');
      videoVeille.setAttribute('title', 'Prompteur');
      videoVeille.setAttribute('aria-hidden', 'true');
      videoVeille.muted = true;
      videoVeille.loop = true;
      videoVeille.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none;';
      videoVeille.src = VIDEO_VEILLE;
      document.body.appendChild(videoVeille);
    }
    if (videoVeille.paused) {
      var promesse = videoVeille.play();
      if (promesse && promesse.catch) promesse.catch(function () { /* réessayé au prochain toucher */ });
    }
  }

  // ---------- Accueil, panneaux ----------

  function masquerAccueil() {
    etat.accueil = false;
    el.accueil.hidden = true;
    el.scene.focus();
  }

  function panneauOuvert() {
    return !el.panneauReglages.hidden || !el.panneauScripts.hidden || !el.panneauImport.hidden;
  }

  function ouvrirPanneau(panneau) {
    if (etat.lecture || etat.decompte) pause();
    fermerPanneaux();
    panneau.hidden = false;
    if (panneau === el.panneauScripts) {
      el.scriptsMessage.hidden = true;
      afficherBibliotheque();
    }
  }

  function fermerPanneaux() {
    if (etat.apprentissage) arreterApprentissage();
    el.panneauReglages.hidden = true;
    el.panneauScripts.hidden = true;
    el.panneauImport.hidden = true;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    el.scene.focus();
  }

  // ---------- Scripts : ouverture, bibliothèque, import ----------

  function chargerScript(script) {
    pause();
    annulerRecul();
    etat.scriptId = script.id;
    try { localStorage.setItem(CLE_DERNIER, script.id); } catch (e) { /* stockage plein ou bloqué */ }
    afficherTexte(script.texte);
    etat.max = 0;
    etat.pos = 0;
    mesurer();
    var ratio = lireJSON(CLE_POSITIONS, {})[script.id] || 0;
    etat.pos = ratio * etat.max;
    appliquerPosition();
    document.title = 'Prompteur — ' + script.titre;
  }

  // Bouton « Fermer » de la barre : ferme le texte et affiche la liste des scripts.
  function fermerScript() {
    pause();
    annulerRecul();
    memoriserPosition();
    etat.scriptId = null;
    // Chaîne vide = fermé exprès : au prochain lancement, aucun script ne se rouvre seul.
    try { localStorage.setItem(CLE_DERNIER, ''); } catch (e) { /* stockage bloqué */ }
    afficherVide();
    etat.pos = 0;
    mesurer();
    document.title = 'Prompteur';
    ouvrirPanneau(el.panneauScripts);
  }

  function ouvrirScript(id) {
    return Stock.lire(id).then(function (script) {
      if (!script) return;
      chargerScript(script);
      fermerPanneaux();
    });
  }

  function formaterDate(ms) {
    try {
      return new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) +
        ' à ' + new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return new Date(ms).toISOString().slice(0, 10); }
  }

  function bouton(texte, classe, action) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cmd ' + (classe || '');
    b.textContent = texte;
    b.addEventListener('click', action);
    return b;
  }

  function afficherBibliotheque() {
    return Stock.tous().then(function (liste) {
      liste.sort(function (a, b) { return b.maj - a.maj; });
      el.listeScripts.innerHTML = '';
      el.scriptsVide.hidden = liste.length > 0;
      liste.forEach(function (s) { el.listeScripts.appendChild(elementScript(s)); });
    });
  }

  function elementScript(script) {
    var li = document.createElement('li');
    li.setAttribute('data-id', script.id);

    function vueNormale() {
      li.innerHTML = '';
      var infos = document.createElement('div');
      infos.className = 'infos';
      var titre = document.createElement('strong');
      titre.textContent = script.titre;
      var date = document.createElement('small');
      date.textContent = 'Ajouté le ' + formaterDate(script.date);
      infos.appendChild(titre);
      infos.appendChild(date);
      if (script.id === etat.scriptId) {
        var enCours = document.createElement('small');
        enCours.className = 'en-cours';
        enCours.textContent = '  • ouvert';
        infos.appendChild(enCours);
      }
      var actions = document.createElement('div');
      actions.className = 'actions';
      actions.appendChild(bouton('Ouvrir', 'principal', function () { ouvrirScript(script.id); }));
      actions.appendChild(bouton('Renommer', '', vueRenommer));
      actions.appendChild(bouton('Supprimer', '', vueSupprimer));
      li.appendChild(infos);
      li.appendChild(actions);
    }

    function vueRenommer() {
      li.innerHTML = '';
      var champ = document.createElement('input');
      champ.type = 'text';
      champ.value = script.titre;
      champ.className = 'renommer';
      var infos = document.createElement('div');
      infos.className = 'infos';
      infos.appendChild(champ);
      var actions = document.createElement('div');
      actions.className = 'actions';
      function valider() {
        var nouveau = champ.value.trim();
        if (!nouveau) return;
        script.titre = nouveau;
        script.maj = Date.now();
        Stock.mettre(script).then(function () {
          if (script.id === etat.scriptId) document.title = 'Prompteur — ' + nouveau;
          vueNormale();
        });
      }
      champ.addEventListener('keydown', function (e) { if (e.key === 'Enter') valider(); });
      actions.appendChild(bouton('Valider', 'principal', valider));
      actions.appendChild(bouton('Annuler', '', vueNormale));
      li.appendChild(infos);
      li.appendChild(actions);
      champ.focus();
    }

    function vueSupprimer() {
      var actions = li.querySelector('.actions');
      actions.innerHTML = '';
      var question = document.createElement('span');
      question.className = 'question';
      question.textContent = 'Supprimer définitivement ?';
      actions.appendChild(question);
      actions.appendChild(bouton('Oui, supprimer', 'danger', function () {
        Stock.supprimer(script.id).then(function () {
          var positions = lireJSON(CLE_POSITIONS, {});
          delete positions[script.id];
          ecrireJSON(CLE_POSITIONS, positions);
          if (script.id === etat.scriptId) {
            pause();
            etat.scriptId = null;
            try { localStorage.removeItem(CLE_DERNIER); } catch (e) { /* rien */ }
            afficherVide();
            etat.pos = 0;
            mesurer();
          }
          afficherBibliotheque();
        });
      }));
      actions.appendChild(bouton('Annuler', '', vueNormale));
    }

    vueNormale();
    return li;
  }

  function lireFichier(fichier, mode, encodage) {
    return new Promise(function (ok, ko) {
      var lecteur = new FileReader();
      lecteur.onload = function () { ok(lecteur.result); };
      lecteur.onerror = function () { ko(lecteur.error); };
      if (mode === 'buffer') lecteur.readAsArrayBuffer(fichier);
      else lecteur.readAsText(fichier, encodage || 'utf-8');
    });
  }

  var promesseMammoth = null;
  function chargerMammoth() {
    if (window.mammoth) return Promise.resolve(window.mammoth);
    if (!promesseMammoth) {
      promesseMammoth = new Promise(function (ok, ko) {
        var s = document.createElement('script');
        s.src = 'vendor/mammoth.browser.min.js';
        s.onload = function () { ok(window.mammoth); };
        s.onerror = function () { promesseMammoth = null; ko(new Error('mammoth introuvable')); };
        document.head.appendChild(s);
      });
    }
    return promesseMammoth;
  }

  // Caractères 0x80–0x9F de Windows-1252 (les autres octets valent leur code Latin-1).
  var CP1252 = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F\u0090‘’“”•–—˜™š›œ\u009DžŸ';
  var RTF_GROUPES_IGNORES = /^(fonttbl|colortbl|stylesheet|info|pict|header|headerl|headerr|footer|footerl|footerr|listtable|listoverridetable|rsidtbl|generator|xmlnstbl|themedata|colorschememapping|latentstyles|datastore|fldinst|object)$/;
  var RTF_SYMBOLES = { emdash: '—', endash: '–', lquote: '‘', rquote: '’', ldblquote: '“', rdblquote: '”', bullet: '•', tab: '\t' };

  // RTF (format par défaut de TextEdit sur Mac) → texte brut. L'arabe y est codé en \uNNNN.
  function rtfEnTexte(rtf) {
    var sortie = '';
    var pile = [];
    var ignorer = false;
    var uc = 1;          // nombre de caractères de repli qui suivent un \uNNNN
    var sauter = 0;
    var motCle = /\\([a-zA-Z]+)(-?\d+)? ?/y;
    var i = 0;

    function ecrire(c) {
      if (sauter > 0) { sauter--; return; }
      if (!ignorer) sortie += c;
    }

    while (i < rtf.length) {
      var c = rtf.charAt(i);
      if (c === '{') { pile.push({ ignorer: ignorer, uc: uc }); i++; continue; }
      if (c === '}') {
        var precedent = pile.pop();
        if (precedent) { ignorer = precedent.ignorer; uc = precedent.uc; }
        i++;
        continue;
      }
      if (c === '\r' || c === '\n') { i++; continue; }
      if (c !== '\\') { ecrire(c); i++; continue; }

      var d = rtf.charAt(i + 1);
      if (d === '\\' || d === '{' || d === '}') { ecrire(d); i += 2; continue; }
      if (d === '\n' || d === '\r') { ecrire('\n'); i += 2; continue; }  // TextEdit : « \ » + retour = paragraphe
      if (d === '~') { ecrire(' '); i += 2; continue; }
      if (d === '*') { ignorer = true; i += 2; continue; }
      if (d === '\'') {
        var octet = parseInt(rtf.substr(i + 2, 2), 16);
        ecrire(octet >= 0x80 && octet <= 0x9F ? CP1252.charAt(octet - 0x80) : String.fromCharCode(octet));
        i += 4;
        continue;
      }
      motCle.lastIndex = i;
      var m = motCle.exec(rtf);
      if (!m) { i += 2; continue; }
      i = motCle.lastIndex;
      var mot = m[1];
      if (RTF_GROUPES_IGNORES.test(mot)) ignorer = true;
      else if (mot === 'par' || mot === 'line' || mot === 'sect' || mot === 'page') ecrire('\n');
      else if (mot === 'uc') uc = parseInt(m[2], 10) || 0;
      else if (mot === 'u') {
        var code = parseInt(m[2], 10);
        if (code < 0) code += 65536;
        ecrire(String.fromCharCode(code));
        sauter = uc;
      } else if (RTF_SYMBOLES[mot]) ecrire(RTF_SYMBOLES[mot]);
    }
    return sortie;
  }

  // Markdown : on retire les # des titres et les ** / __ de mise en gras.
  function markdownEnTexte(md) {
    return md.replace(/^\s{0,3}#{1,6}\s+/gm, '').replace(/(\*\*|__)(.+?)\1/g, '$2');
  }

  function lireContenuFichier(fichier) {
    var nom = fichier.name || '';
    var lecture;
    if (/\.docx$/i.test(nom)) {
      lecture = Promise.all([chargerMammoth(), lireFichier(fichier, 'buffer')]).then(function (r) {
        return r[0].extractRawText({ arrayBuffer: r[1] });
      }).then(function (resultat) { return resultat.value; });
    } else if (/\.pages$/i.test(nom)) {
      lecture = Promise.reject(new Error('Fichier Pages : sur le Mac, dans Pages, fais Fichier > Exporter vers > Word, puis enregistre le .docx dans iCloud Drive.'));
    } else if (/\.doc$/i.test(nom)) {
      lecture = Promise.reject(new Error('Ancien format Word (.doc) : enregistre-le en .docx dans Word, ou copie-colle le texte.'));
    } else {
      lecture = lireFichier(fichier, 'texte').then(function (texte) {
        // Fichier enregistré sous Windows (pas en UTF-8) : on relit en Windows-1252.
        return texte.indexOf('�') >= 0 ? lireFichier(fichier, 'texte', 'windows-1252') : texte;
      }).then(function (texte) {
        if (/\.rtf$/i.test(nom) || /^\{\\rtf/.test(texte)) return rtfEnTexte(texte);
        if (/\.(md|markdown)$/i.test(nom)) return markdownEnTexte(texte);
        return texte;
      });
    }
    return lecture.then(function (texte) {
      texte = texte.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      if (!texte) throw new Error('Le fichier est vide.');
      return texte;
    });
  }

  // Import depuis iCloud Drive (ou tout l'app Fichiers) : enregistre directement. Un fichier déjà
  // importé sous le même nom est mis à jour (script corrigé sur le Mac) au lieu d'être dupliqué.
  function importerFichiers(fichiers) {
    var bilan = { importes: [], majs: 0, erreurs: [] };
    el.scriptsMessage.hidden = false;
    el.scriptsMessage.textContent = 'Import en cours…';

    var suite = Stock.tous();
    fichiers.forEach(function (fichier) {
      suite = suite.then(function (existants) {
        return lireContenuFichier(fichier).then(function (texte) {
          var maintenant = Date.now();
          var ancien = existants.filter(function (s) { return s.fichier === fichier.name; })[0];
          var script = ancien
            ? Object.assign({}, ancien, { texte: texte, maj: maintenant })
            : {
              id: 's' + maintenant.toString(36) + Math.random().toString(36).slice(2, 7),
              titre: premiereLigne(texte),
              texte: texte,
              fichier: fichier.name,
              date: maintenant,
              maj: maintenant
            };
          return Stock.mettre(script).then(function () {
            if (ancien) {
              // Le texte a changé : on repart du début.
              bilan.majs++;
              var positions = lireJSON(CLE_POSITIONS, {});
              delete positions[script.id];
              ecrireJSON(CLE_POSITIONS, positions);
            } else {
              existants.push(script);
            }
            bilan.importes.push(script);
            return existants;
          });
        }).catch(function (err) {
          bilan.erreurs.push('« ' + fichier.name + ' » : ' + (err && err.message ? err.message : 'illisible'));
          return existants;
        });
      });
    });

    return suite.then(function () {
      var texte = bilan.erreurs.length ? 'Impossible de lire ' + bilan.erreurs.join(' — ') : '';
      if (bilan.importes.length === 1 && !bilan.erreurs.length) {
        el.scriptsMessage.hidden = true;
        chargerScript(bilan.importes[0]);
        fermerPanneaux();
        afficherMessage(bilan.majs ? 'Script mis à jour' : 'Script importé');
        return;
      }
      if (bilan.importes.length) {
        texte = bilan.importes.length + ' script(s) importé(s)' +
          (bilan.majs ? ', dont ' + bilan.majs + ' mis à jour' : '') + '. ' + texte;
      }
      el.scriptsMessage.textContent = texte;
      return afficherBibliotheque();
    });
  }

  function enregistrerImport() {
    var texte = el.importTexte.value.replace(/\r\n?/g, '\n').trim();
    if (!texte) { el.importMessage.textContent = 'Colle d’abord un texte (ou ouvre un fichier).'; return; }
    var maintenant = Date.now();
    var script = {
      id: 's' + maintenant.toString(36) + Math.random().toString(36).slice(2, 7),
      titre: el.importTitre.value.trim() || premiereLigne(texte),
      texte: texte,
      date: maintenant,
      maj: maintenant
    };
    Stock.mettre(script).then(function () {
      el.importTexte.value = '';
      el.importTitre.value = '';
      el.importMessage.textContent = '';
      chargerScript(script);
      fermerPanneaux();
      afficherMessage('Script enregistré');
    }).catch(function () {
      el.importMessage.textContent = 'Enregistrement impossible : la mémoire de l’iPad est peut-être pleine.';
    });
  }

  // ---------- Plein écran (hors mode « écran d'accueil ») ----------

  function preparerPleinEcran() {
    var doc = document.documentElement;
    var demande = doc.requestFullscreen || doc.webkitRequestFullscreen;
    var installee = window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches);
    if (!demande || installee) return;
    $('bloc-plein-ecran').hidden = false;
    $('btn-plein-ecran').addEventListener('click', function () {
      try { demande.call(doc); } catch (e) { /* refusé */ }
    });
  }

  // ---------- Démarrage ----------

  function lierInterface() {
    el.btnLecture.addEventListener('click', function () { activerEcran(); basculer(); });
    $('btn-debut').addEventListener('click', revenirAuDebut);
    $('btn-moins').addEventListener('click', function () { changerVitesse(-PAS_VITESSE); });
    $('btn-plus').addEventListener('click', function () { changerVitesse(PAS_VITESSE); });
    $('btn-reglages').addEventListener('click', function () { ouvrirPanneau(el.panneauReglages); });
    $('btn-scripts').addEventListener('click', function () { ouvrirPanneau(el.panneauScripts); });
    $('btn-fermer').addEventListener('click', fermerScript);
    $('btn-nouveau').addEventListener('click', function () { ouvrirPanneau(el.panneauImport); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-fermer]'), function (b) {
      b.addEventListener('click', fermerPanneaux);
    });
    // Après un bouton de la barre, le focus revient au prompteur (pour la pédale), et si le texte
    // défile, la barre repart 3 s plus tard.
    $('commandes').addEventListener('click', function () {
      el.scene.focus();
      if (barreVisible()) afficherBarre(etat.lecture || !!etat.decompte);
    });

    CURSEURS.forEach(function (c) {
      $(c.id).addEventListener('input', function (e) {
        reglages[c.cle] = parseFloat(e.target.value);
        sauverReglages();
        appliquerReglages();
      });
    });
    INTERRUPTEURS.forEach(function (i) {
      $(i.id).addEventListener('change', function (e) {
        reglages[i.cle] = e.target.checked;
        sauverReglages();
        appliquerReglages();
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.theme'), function (b) {
      b.addEventListener('click', function () {
        reglages.theme = b.getAttribute('data-theme');
        sauverReglages();
        appliquerReglages();
      });
    });

    el.btnApprendre.addEventListener('click', function () {
      if (etat.apprentissage === 'recul') terminerSansRecul();
      else if (etat.apprentissage) arreterApprentissage();
      else commencerApprentissage();
    });
    $('btn-oublier').addEventListener('click', function () {
      reglages.pedale = null;
      reglages.pedaleRecul = null;
      sauverReglages();
      arreterApprentissage();
      afficherMessage('Réglage par défaut : toutes les touches usuelles font pause / reprise');
    });

    $('icloud-fichier').addEventListener('change', function (e) {
      var fichiers = Array.prototype.slice.call(e.target.files || []);
      if (fichiers.length) importerFichiers(fichiers).then(function () { e.target.value = ''; });
    });
    $('btn-enregistrer').addEventListener('click', enregistrerImport);

    el.accueil.addEventListener('click', function () { activerEcran(); masquerAccueil(); });

    document.addEventListener('keydown', surToucheEnfoncee, true);
    document.addEventListener('keyup', surToucheRelachee, true);

    el.scene.addEventListener('pointerdown', surPointeurBas);
    el.scene.addEventListener('pointermove', surPointeurDeplace);
    el.scene.addEventListener('pointerup', surPointeurHaut);
    el.scene.addEventListener('pointercancel', function () { geste = null; });
    // Pas de menu « copier » ni de loupe sur un appui long.
    el.scene.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    window.addEventListener('resize', mesurer);
    window.addEventListener('orientationchange', function () { setTimeout(mesurer, 300); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (etat.lecture || etat.decompte) pause(); annulerRecul(); memoriserPosition(); }
      else if (videoVeille) activerEcran();
    });
    window.addEventListener('pagehide', memoriserPosition);

    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(mesurer);
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', mesurer);
    }
  }

  function chargerDernierScript() {
    return Stock.tous().then(function (liste) {
      var dernier = null;
      try { dernier = localStorage.getItem(CLE_DERNIER); } catch (e) { /* rien */ }
      if (dernier === '') { afficherVide(); return; }   // fermé avec le bouton « Fermer »
      var script = liste.filter(function (s) { return s.id === dernier; })[0];
      if (!script && liste.length) {
        liste.sort(function (a, b) { return b.maj - a.maj; });
        script = liste[0];
      }
      if (script) { chargerScript(script); return; }
      afficherVide();
    }).catch(function () { afficherVide(); });
  }

  function initialiser() {
    el.scene = $('scene');
    el.miroir = $('miroir');
    el.fenetre = $('fenetre');
    el.texte = $('texte');
    el.barre = $('progression-barre');
    el.restant = $('restant');
    el.voyant = $('voyant');
    el.decompte = $('decompte');
    el.btnLecture = $('btn-lecture');
    el.vitesseValeur = $('vitesse-valeur');
    el.panneauReglages = $('panneau-reglages');
    el.panneauScripts = $('panneau-scripts');
    el.panneauImport = $('panneau-import');
    el.listeScripts = $('liste-scripts');
    el.scriptsVide = $('scripts-vide');
    el.scriptsMessage = $('scripts-message');
    el.importTexte = $('import-texte');
    el.importTitre = $('import-titre');
    el.importMessage = $('import-message');
    el.pedaleEtat = $('pedale-etat');
    el.btnApprendre = $('btn-apprendre');
    el.accueil = $('accueil');

    lierInterface();
    appliquerReglages();
    majInterfaceLecture();
    preparerPleinEcran();
    el.scene.focus();
    chargerDernierScript().then(function () { document.documentElement.setAttribute('data-pret', '1'); });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* hors HTTPS : pas de mode hors ligne */ });
    }
  }

  // Accès en lecture seule pour les tests automatisés.
  window.Prompteur = {
    etat: function () {
      return { lecture: etat.lecture, pos: etat.pos, max: etat.max, decompte: !!etat.decompte, scriptId: etat.scriptId };
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiser);
  else initialiser();
})();
