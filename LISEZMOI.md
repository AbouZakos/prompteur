# Prompteur L'Arabe Facile — mode d'emploi

Une application de prompteur pour ton **iPad** (iPad Air 2, iPadOS 15). Elle s'installe sur
l'écran d'accueil depuis Safari et **fonctionne sans Internet** après la première ouverture.

- Le texte défile tout seul, **en miroir** pour être lu à l'endroit dans la vitre.
- La **pédale Bluetooth** met en pause et relance le défilement.
- L'**arabe vocalisé** s'affiche de droite à gauche, avec la police Amiri.
- Tes scripts sont **enregistrés sur l'iPad**.

---

## 1. Publier l'application sur Internet (GitHub Pages, gratuit)

L'iPad doit ouvrir l'application depuis une adresse en `https://…`. GitHub Pages en fournit
une gratuitement. Ton compte GitHub : **AbouZakos**.

### Étape 1 — Créer le dépôt

1. Sur ton Mac, va sur https://github.com/new et connecte-toi.
2. **Repository name** : `prompteur`.
3. Choisis **Public** : GitHub Pages n'est gratuit que pour les dépôts publics. Tes scripts,
   eux, ne sont pas en ligne : ils restent sur l'iPad.
4. Clique sur **Create repository**.

### Étape 2 — Envoyer les fichiers

1. Sur la page du nouveau dépôt, clique sur le lien **uploading an existing file**.
2. Ouvre le dossier `Documents/Création site/Teleprompter` dans le Finder.
3. Sélectionne puis **glisse dans la page GitHub** ces éléments :
   - `index.html`, `style.css`, `app.js`, `sw.js`, `manifest.webmanifest`
   - les dossiers `fonts`, `icons`, `vendor`
   - *(facultatif)* `LISEZMOI.md`
   - ⚠️ **ne glisse pas** le dossier `node_modules` : il est très lourd et ne sert qu'aux tests.
4. En bas, clique sur **Commit changes**.

### Étape 3 — Activer GitHub Pages

1. Dans le dépôt, va dans **Settings** (en haut), puis **Pages** (menu de gauche).
2. Sous **Branch**, choisis `main` puis `/ (root)`, et clique sur **Save**.
3. Attends 1 à 2 minutes, puis recharge la page. L'adresse s'affiche en haut :
   **https://abouzakos.github.io/prompteur/**

> 💡 Plus simple : demande à Claude Code « publie le prompteur sur GitHub Pages ».
> Il peut faire ces trois étapes pour toi avec ton compte.

### Autre possibilité : ton propre sous-domaine

Tu peux aussi publier ce dossier sur Vercel ou Netlify, par exemple à l'adresse
`prompteur.larabefacile.fr`. Il n'y a rien à compiler ni à configurer : ce sont de simples
fichiers.

### Mettre à jour l'application plus tard

Remplace les fichiers modifiés dans GitHub (même méthode qu'à l'étape 2). Sur l'iPad, la
nouvelle version apparaît à la **deuxième** ouverture de l'application, avec Internet : la
première ouverture télécharge la mise à jour en arrière-plan.

---

## 2. Installer l'application sur l'iPad

1. Sur l'iPad, ouvre **Safari** (pas Chrome) et va à l'adresse
   **https://abouzakos.github.io/prompteur/**
2. Touche le bouton **Partager** (le carré avec une flèche vers le haut).
3. Choisis **Sur l'écran d'accueil**, puis **Ajouter**.
4. Ouvre l'application **Prompteur** depuis l'écran d'accueil : elle s'affiche en plein écran.

Dès cette première ouverture, tout est enregistré sur l'iPad : l'application marche ensuite
**sans Internet**.

### Empêcher l'écran de s'éteindre

L'application maintient l'écran allumé dès que tu l'as touché une fois. Par sécurité, sur un
tournage long, règle aussi l'iPad :
**Réglages > Luminosité et affichage > Verrouillage automatique > Jamais**.
Remets ce réglage comme avant après le tournage.

---

## 3. Brancher la pédale

### Jumeler la pédale avec l'iPad (une seule fois)

1. Allume la pédale et mets-la en **mode jumelage**. La procédure dépend du modèle (souvent un
   appui long sur un bouton jusqu'à ce qu'une lumière clignote) : regarde sa notice.
2. Sur l'iPad : **Réglages > Bluetooth**. La pédale apparaît dans la liste : touche-la.
3. Elle s'affiche alors comme « Connecté ».

La pédale se présente à l'iPad comme un **clavier**. Tant qu'elle est connectée, le clavier à
l'écran de l'iPad ne s'affiche plus quand tu écris. C'est normal : éteins la pédale pour taper
du texte.

### Apprendre ta pédale à l'application (conseillé)

Par défaut, l'application réagit aux touches Espace, Entrée, flèches, Page précédente et Page
suivante. Ça suffit pour la plupart des pédales. Pour qu'elle ne réagisse **qu'à ta pédale** :

1. Ouvre l'application et touche l'écran une fois.
2. Touche **Réglages**, puis **Apprendre ma pédale**.
3. Appuie sur la pédale. Le message « Pédale enregistrée : … » s'affiche.
4. Touche **Fermer**.

Pour revenir au réglage par défaut : **Réglages > Toutes les touches**.

---

## 4. Ajouter un script

### Depuis iCloud Drive (méthode principale)

**À faire une seule fois :**
- Sur l'iPad : **Réglages > [ton nom] > iCloud > iCloud Drive** doit être **activé**, avec le
  même identifiant Apple que sur le Mac.
- Sur le Mac : dans le Finder, ouvre **iCloud Drive** et crée un dossier **Prompteur**.

**À chaque script :**
1. Sur le Mac, quand le script est fini, enregistre-le dans **iCloud Drive > Prompteur**.
   Formats acceptés :
   - **Word** (`.docx`) ;
   - **TextEdit** (`.rtf` ou `.txt`) ;
   - **texte** (`.txt` ou `.md`).
2. Attends quelques secondes que iCloud l'envoie. Il faut une connexion Internet.
3. Sur l'iPad, dans l'application : **Scripts > ☁️ Importer depuis iCloud**.
4. La fenêtre de l'app Fichiers s'ouvre. Touche **Parcourir** (en bas), puis **iCloud Drive >
   Prompteur**, et touche ton script.
5. Le script est enregistré dans l'application et **s'ouvre aussitôt**.

L'iPad retient d'habitude le dernier dossier ouvert : les fois suivantes, tu tombes directement
dans **Prompteur**.

**Tu as corrigé le script sur le Mac ?** Réimporte-le de la même façon, sans changer le nom du
fichier. L'application **remplace l'ancienne version** au lieu de créer un doublon, puis repart
du début du texte.

**Plusieurs scripts d'un coup :** dans la fenêtre Fichiers, touche **Sélectionner**, coche
plusieurs fichiers, puis **Ouvrir**.

**Fichiers Pages :** l'application ne sait pas les lire. Sur le Mac, dans Pages, fais
**Fichier > Exporter vers > Word…**, puis enregistre le `.docx` dans iCloud Drive > Prompteur.
Un ancien fichier Word `.doc` ne marche pas non plus : réenregistre-le en `.docx`.

Une fois importé, le script est **copié sur l'iPad** : la lecture marche ensuite sans Internet.
Seul l'import a besoin d'iCloud, donc d'une connexion.

### En copier-coller

**Scripts > ＋ Coller un texte** : colle ton script dans la grande zone de texte. Le titre est
facultatif : sans titre, l'application reprend la première ligne. Touche **Enregistrer et
lire**.

### Comment le texte est mis en forme

- La **première ligne** est le titre (en jaune).
- Les lignes **EN MAJUSCULES** (`HOOK (0:00 à 0:10)`, `RAISON 1 : …`) deviennent des repères
  jaunes, plus petits.
- Les lignes **`[Option A …]`** apparaissent en gris, en petit.
- Un paragraphe **en arabe** s'affiche de droite à gauche, aligné à droite, un peu plus grand.

### Gérer les scripts

Dans **Scripts**, tu peux **Ouvrir**, **Renommer** ou **Supprimer** chaque script. La
suppression demande une confirmation.

Dans l'application, les scripts sont copiés **sur l'iPad**. Si tu supprimes l'application de
l'écran d'accueil, ou si tu effaces les données de Safari, ces copies disparaissent. Les
originaux restent dans iCloud Drive : il suffit de les réimporter.

---

## 5. Pendant le tournage

| Action | Effet |
|---|---|
| **Pédale** | Pause / reprise |
| **Toucher l'écran** | Pause / reprise (en secours) |
| **Glisser du doigt** (en pause) | Remonter ou avancer dans le texte |
| **−** et **+** | Ralentir / accélérer, même pendant la lecture |
| **Début** | Revenir au début du script |
| **Point rouge / vert** (en haut) | Rouge : en pause. Vert : le texte défile. Orange : compte à rebours |

En haut s'affiche aussi le **temps restant** à la vitesse actuelle. En bas, une fine barre
montre ta progression dans le script.

Pendant la lecture, les boutons disparaissent : il ne reste que **− vitesse +**, très discret.

L'application retient le **dernier script ouvert** et **l'endroit où tu t'es arrêté**.

### Les réglages (bouton Réglages)

Ils sont tous retenus d'une fois sur l'autre.

- **Vitesse** du défilement.
- **Compte à rebours** de 3 secondes avant de démarrer au début d'un script.
- **Ligne de lecture** : la bande claire qui montre où lire.
- **Taille du texte**, **Taille de l'arabe** (1,3 fois le français par défaut),
  **Interligne** et **Marges latérales**. Les marges servent à garder le texte dans la largeur
  utile de la vitre.
- **Miroir horizontal** (activé par défaut) et **Miroir vertical** (si ta vitre inverse
  aussi le haut et le bas).
- **Couleurs** : fond noir et texte blanc, ou l'inverse.

Le panneau des réglages laisse voir le texte à gauche : chaque changement se voit tout de
suite.

---

## 6. La pédale ne répond pas ?

Essaie dans cet ordre :

1. **Touche l'écran une fois** (au milieu du texte). L'iPad n'envoie les touches de la pédale
   qu'à une page qu'on a touchée.
2. Vérifie qu'**aucun clavier n'est affiché** à l'écran et qu'aucun panneau (Scripts,
   Réglages) n'est ouvert.
3. Vérifie que la pédale est **allumée et connectée** (Réglages > Bluetooth), et que ses piles
   ou sa batterie ne sont pas vides.
4. Refais **Réglages > Apprendre ma pédale**.
5. Si rien n'y fait : **Réglages > Toutes les touches**, puis ferme l'application (balaye-la
   vers le haut dans le sélecteur d'applications) et rouvre-la.

En attendant, **toucher l'écran** fait aussi pause / reprise.

---

## Pour les curieux : contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html`, `style.css`, `app.js` | L'application |
| `sw.js` | Garde l'application en mémoire pour l'usage hors connexion |
| `manifest.webmanifest`, `icons/` | Nom et icône sur l'écran d'accueil |
| `fonts/` | Police arabe **Amiri** (licence libre SIL OFL) |
| `vendor/` | **mammoth.js** (licence BSD), qui lit les fichiers Word |
| `tests/`, `playwright.config.js`, `package.json` | Tests automatiques (inutiles sur l'iPad) |
| `outils/icones.mjs` | Régénère les icônes |

Pour essayer sur le Mac : `npm run serve`, puis ouvre http://localhost:4173.
Pour lancer les tests : `npm install`, `npx playwright install webkit`, puis `npm test`.
