# Portfolio de Hamza Jnah

Site en ligne : **https://jnah-hamza.github.io**

Le site fonctionne tel quel, sans installation ni compilation : ce sont de simples fichiers HTML, CSS et JavaScript.
Chaque modification que vous enregistrez sur la branche `main` de GitHub est en ligne 1 à 2 minutes plus tard.

---

## 1. Où se trouve quoi ?

| Dossier / fichier | Contenu |
|---|---|
| `index.html` | La page principale (toutes les sections) |
| `projet.html` | La page détail des projets (une seule page qui s'adapte à chaque projet) |
| `404.html` | La page « page introuvable » |
| `lang/fr.json` | **Tous les textes en français** |
| `lang/en.json` | **Tous les textes en anglais** |
| `data/site.json` | Les liens, les vidéos YouTube, les images des projets, l'identifiant Formspree |
| `data/photos.json` | Les lieux du globe et la liste des photos |
| `assets/img/photos/` | Les photos (grande taille) + `thumbs/` (miniatures) |
| `assets/img/projets/` | Les images des projets |
| `assets/img/parascolaire/` | Les photos du parascolaire |
| `assets/docs/` | Le CV et les PDF (rapports, Rebirth…) |
| `_sources/` | Vos fichiers d'origine (PDF Behance, photos-infos.txt). **Ce dossier n'est pas publié** sur le site. |

## 2. Modifier un texte

1. Sur GitHub, ouvrez `lang/fr.json` (et `lang/en.json` pour l'anglais).
2. Cliquez sur le crayon ✏️ (« Edit this file »).
3. Cherchez le texte avec Ctrl + F, modifiez **seulement ce qui est entre guillemets** après les deux-points.
4. En bas, cliquez sur **Commit changes**.

⚠️ Règles à respecter dans les fichiers `.json` :
- garder les guillemets `"` autour des textes ;
- ne pas supprimer les virgules à la fin des lignes ;
- pour écrire un guillemet dans un texte, utilisez les guillemets français « » ou l'apostrophe '.

Un texte vide ("") est simplement masqué sur le site : rien d'incomplet n'apparaît aux visiteurs.

**Surligner un mot** (trait rouge façon marqueur, qui se dessine à l'écran) : entourez-le de deux signes égal,
par exemple `"Analyse de ==plus de 200 commentaires== clients"`. Deux ou trois mots maximum par paragraphe.

## 3. Ajouter / changer une photo du globe

1. Préparez la photo en **WebP**, 1600 px de large maximum (par exemple avec https://squoosh.app),
   et une miniature de 600 px de large.
2. Déposez la grande dans `assets/img/photos/` et la miniature dans `assets/img/photos/thumbs/`
   (même nom de fichier, par exemple `photo-76-lyon-fourviere.webp`).
3. Dans `data/photos.json`, ajoutez une ligne dans le lieu concerné :
   `{ "file": "photo-76-lyon-fourviere", "star": false, "w": 1600, "h": 1200 }`
   (`w` = largeur, `h` = hauteur ; `"star": true` pour la mettre en avant).
4. Dans `lang/fr.json` et `lang/en.json`, ajoutez la phrase poétique dans `photo` → `captions`
   et la description dans `photo` → `alts`.

Le compteur « photos · lieux · pays » se met à jour tout seul.

**Photo 11 (Ifrane, l'homme sous la neige)** : elle est cachée pour l'instant, car vous aviez noté
« à publier seulement si la personne est d'accord ». Si elle est d'accord, dans `data/photos.json`,
supprimez `"consent": false` sur la ligne `photo-11-…`.

## 4. Photos de profil

- **Accueil** : `assets/img/portrait.webp` (détouré, fond transparent, environ 1000 px de haut).
  Le contour rouge s'ajoute automatiquement. L'image de partage (`assets/img/og-image.jpg`) l'utilise aussi.
- **Section Hello** : `assets/img/portrait-hello.webp` (présentée comme un tirage argentique dans une pellicule).
Pour les changer, remplacez ces fichiers en gardant le même nom.

## 4 bis. Logos des outils

Les logos sont dans `data/site.json` → `tools` (champ `svg`), groupés par usage :
`analysis` (Analyse), `creation` (Création), `creativity` (Créativité), `communication` (Communication).
Un outil sans champ `svg` s'affiche avec son nom seul (c'est le cas de Sphinx, faute de logo officiel téléchargeable).

## 5. Projets : images, liens et PDF

Les projets s'ouvrent dans une fenêtre pop-up (et aussi sur `projet.html?id=…`). Tout se passe dans `data/site.json`, partie `projects` :
- `"canva"` (911 Sellier) : lien de **vue publique** de la présentation Canva
  (bouton « Partager » → « Lien de vue publique », jamais un lien qui finit par `/edit`).
  Le bouton apparaît dès que le lien est collé.
- `"youtube"` (Sephora) : identifiant YouTube de la vidéo d'introduction. Le lecteur apparaît dès qu'il est rempli.
- `"pdf"`, `"pdfs"` : chemins des PDF dans `assets/docs/`. Un bouton n'apparaît que si le fichier existe.
- `"gallery"` (Aballa) : photos produits, par exemple `"assets/img/projets/projet-aballa-1.webp"`.
- `"group": true` affiche « Projet de groupe ».

Take & Taste est dans la partie `take_taste` (lien du prototype et photos) : il s'affiche dans la section Parascolaire.

Les textes (rôle, résultat, chiffres…) sont dans `lang/fr.json` et `lang/en.json` → `projects` → `items`.
Un texte laissé vide ("") ou contenant `[À COMPLÉTER]` n'est jamais affiché sur le site.

## 6. Vidéos

Dans `data/site.json`, partie `videos` : l'identifiant YouTube (la partie après `youtu.be/`), dans l'ordre d'affichage.
Les titres et phrases sont dans `lang/*.json` → `video` → `items`.

## 7. Parascolaire, prix et logos

Dans `data/site.json` :
- `clubs` : un bloc par club (Club Génie, AIESEC, Green Invest, Epik Leaders) avec son logo et ses photos.
  Le Club Génie contient aussi Take & Taste (`take_taste`) et Rebirth (`rebirth`, lien du plan d'action).
- `distinctions` : logo et photos du hackathon ACCEDE.
- `club_logos` : la bande de logos en haut de la section.
- `experience`, `education`, `jobs` : logos des entreprises, écoles et employeurs.

Une photo s'écrit `{ "folder": "parascolaire", "file": "nom-du-fichier", "w": 1600, "h": 1200 }`
(fichier WebP dans `assets/img/parascolaire/` + miniature dans `assets/img/parascolaire/thumbs/`).
Sa légende va dans `lang/*.json` → `extra` → `captions`, avec le même nom de fichier.
Les textes des clubs sont dans `lang/*.json` → `extra` → `clubs`, et les prix dans `extra` → `awards`.

## 7 bis. Jobs étudiants

Textes dans `lang/*.json` → `jobs`, logos dans `data/site.json` → `jobs`.

## 8. Activer le formulaire de contact (Formspree, gratuit)

1. Créez un compte sur https://formspree.io (bouton **Get Started**, avec jnah.hamza.pro@gmail.com).
2. Cliquez sur **+ New Form**, donnez-lui un nom (ex. « Portfolio ») et l'e-mail de réception.
3. Formspree affiche une adresse du type `https://formspree.io/f/abcdwxyz`.
   Votre identifiant est la fin : **`abcdwxyz`**.
4. Dans `data/site.json`, remplacez `"VOTRE_ID_FORMSPREE"` par votre identifiant, puis **Commit changes**.
5. Envoyez-vous un message de test depuis le site : le premier message demande une confirmation par e-mail.

Tant que l'identifiant n'est pas collé, le formulaire affiche un message invitant à écrire directement par e-mail.

## 9. Bon à savoir

- La 3D (intro « HJ » et globe) utilise Three.js 0.160.0, chargé depuis le CDN jsDelivr.
  Si la 3D ne peut pas se charger, ou si le visiteur a activé « réduire les animations »,
  une carte plate s'affiche à la place, avec les mêmes photos.
- La langue est détectée automatiquement au premier passage puis mémorisée.
- L'intro s'affiche une fois par visite (pas à chaque rechargement).
