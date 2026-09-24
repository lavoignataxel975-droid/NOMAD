# NOMAD — Pastrami maison · Montpellier

Site vitrine de **NOMAD**, 7 Rue du Puits du Temple, 34000 Montpellier.
Site statique (HTML / CSS / JavaScript), sans build ni dépendance : il se publie tel quel sur GitHub Pages.

## Structure

```
index.html          Page unique (hero, intro, bandeau, carte, photos, avis, footer + pages Carte / Photos)
css/style.css       Styles (couleurs et polices en haut du fichier)
js/data.js          CONTENU : carte & prix, photos, avis, horaires  ← à modifier ici
js/main.js          Interactions (onglets, header dynamique, pages, lightbox, menu mobile)
assets/             Photos et favicon
demo-iphone.html    Aperçu du site dans un cadre d'iPhone (présentation client)
```

## Modifier le contenu

Tout se passe dans `js/data.js` :

- **Carte** : chaque produit = `['Nom', 'Prix', piquant 0–5, ['ingrédient', ...]]`
- **Photos** : liste `PHOTOS` (carrousel, page Photos, lightbox)
- **Avis** : liste `REVIEWS`
- **Horaires** : liste `HOURS`

Téléphone, note Google et adresse sont dans `index.html`.

## À compléter

- [ ] Téléphone (`index.html`, lien `tel:`)
- [ ] Horaires (`js/data.js`)
- [ ] Vrais avis Google + note et nombre d'avis (`js/data.js` et `index.html`)
- [ ] Page Mentions légales
- [ ] Vérifier la composition du bun « Loubes »

## Voir le site en local

Ouvrir `index.html` dans un navigateur suffit.

## Mettre en ligne avec GitHub Pages

1. Créer un dépôt sur GitHub (ex. `nomad-site`) et y envoyer le contenu de ce dossier.
2. Dans le dépôt : **Settings → Pages → Source : Deploy from a branch → `main` / `(root)`**.
3. Le site est en ligne à `https://<votre-compte>.github.io/nomad-site/` après une minute.
