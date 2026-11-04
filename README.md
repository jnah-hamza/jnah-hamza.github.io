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

Astuce : tous les textes provisoires contiennent **`[À COMPLÉTER`**. Cherchez ce mot pour tous les retrouver.
Sur le site, ils sont entourés de pointillés rouges : quand vous les remplacez, les pointillés disparaissent.

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

## 4. Ajouter le portrait

Déposez votre photo **détourée (fond transparent)** sous le nom exact `assets/img/portrait.png`.
Le contour rouge s'ajoute automatiquement. Pour l'aperçu des partages (LinkedIn, WhatsApp),
remplacez aussi `assets/img/og-image.jpg` (1200 × 630 px).

## 5. Ajouter les images et liens des projets

Tout se passe dans `data/site.json`, partie `projects` :
- `"cover"` : image de couverture de la carte, par exemple `"assets/img/projets/projet-aballa-1.webp"` ;
- `"figma"` : lien du prototype Figma (Take & Taste) ;
- `"screens"` : liste des écrans du prototype (images verticales) ;
- `"pages"` : aperçu des pages d'un rapport (images) ;
- `"pdf"` : chemin du PDF (déposez le fichier dans `assets/docs/` avec ce nom exact) ;
- `"gallery"` : photos produits (Aballa) ;
- `"group": true` affiche « Projet de groupe ».

Exemple : `"screens": ["assets/img/projets/projet-take-taste-1.webp", "assets/img/projets/projet-take-taste-2.webp"]`

Les boutons PDF s'activent tout seuls dès que le fichier existe.

**Ajouter un nouveau projet** : copiez un bloc dans `projects` de `data/site.json` en changeant `"id"`
(sans espace ni accent, ex. `"mon-projet"`) et `"type"` (`prototype`, `report`, `video`, `brand`) ;
pour `video`, ajoutez `"youtube": "identifiant"`. Puis copiez un bloc dans `projects` → `items` de
`lang/fr.json` et `lang/en.json` avec le même identifiant.

## 6. Vidéos

Dans `data/site.json`, partie `videos` : mettez l'identifiant YouTube (la partie après `youtu.be/`).
Les titres, phrases, lieux et rôles sont dans `lang/*.json` → `video` → `items`.

## 7. Photos du parascolaire

Dans `data/site.json`, partie `extra` (dans l'ordre : Epik Leaders, AIESEC, Club Génie) :
```json
{ "photos": [
  { "src": "assets/img/parascolaire/parascolaire-aiesec-1.webp", "caption": "Légende FR", "caption_en": "English caption", "alt": "Description", "alt_en": "Description", "w": 600, "h": 800 }
] }
```

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
