# NOMAD — Pastrami maison · Montpellier

Site vitrine de **NOMAD**, 7 Rue du Puits du Temple, 34000 Montpellier.
Site statique (HTML / CSS / JavaScript), sans build ni dépendance : il se publie tel quel sur GitHub Pages.

## Structure

```
index.html          Page unique (hero, intro, bandeau, carte, photos, avis, footer + pages Carte / Photos)
css/style.css       Styles (couleurs et polices en haut du fichier)
js/data.js          CONTENU : carte & prix, photos, avis  ← à modifier ici
js/horaires.js      HORAIRES d'ouverture (footer + Click & Collect)
js/main.js          Interactions (onglets, header dynamique, pages, lightbox, menu mobile)
assets/             Photos et favicon
demo-iphone.html    Aperçu du site dans un cadre d'iPhone (présentation client)
```

## Modifier le contenu

Tout se passe dans `js/data.js` :

- **Carte** : chaque produit = `['Nom', 'Prix', piquant 0–5, ['ingrédient', ...]]`
- **Photos** : liste `PHOTOS` (carrousel, page Photos, lightbox)
- **Avis** : liste `REVIEWS`
- **Horaires** : `js/horaires.js` (source unique : pied de page + créneaux du Click & Collect)

Téléphone, note Google et adresse sont dans `index.html`.

## À compléter

- [ ] Téléphone (`index.html`, lien `tel:`)
- [ ] Vrais avis Google + note et nombre d'avis (`js/data.js` et `index.html`)
- [ ] Page Mentions légales
- [ ] Vérifier la composition du bun « Loubes »

## Voir le site en local

Ouvrir `index.html` dans un navigateur suffit.

## Mettre en ligne avec GitHub Pages

1. Créer un dépôt sur GitHub (ex. `nomad-site`) et y envoyer le contenu de ce dossier.
2. Dans le dépôt : **Settings → Pages → Source : Deploy from a branch → `main` / `(root)`**.
3. Le site est en ligne à `https://<votre-compte>.github.io/nomad-site/` après une minute.

## Click & Collect + back-office

Le site tourne désormais avec un petit serveur Node (aucune dépendance, Node 22.5+ requis pour SQLite) :

```
./lancer-commandes.command      → http://localhost:3000 (site + Click & Collect + back-office)
node server/server.js           (équivalent)
```

- Page client : `/click-and-collect.html`
- Back-office : `/admin/orders` (commandes du jour) et `/admin/orders/archive` (archives)
- Horaires : `js/horaires.js` ; réglages (préparation, créneaux, max par créneau, mot de passe) : `server/config.js`
- Base de données : `data/nomad.db` (non versionnée, à sauvegarder)
- Identifiants du back-office : variables `NOMAD_ADMIN_USER` / `NOMAD_ADMIN_PASSWORD` (défaut `nomad` / `nomad2026`, à changer)
- Test à une heure donnée : `NOMAD_FAKE_NOW=2026-09-26T11:42 node server/server.js`

GitHub Pages ne peut pas faire tourner ce serveur : pour que les commandes fonctionnent en ligne,
il faut un hébergement Node (VPS, Render, Railway, Fly.io…) en HTTPS (`NOMAD_SECURE_COOKIE=1`).
