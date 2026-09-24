# NOMAD — V2 (version expérimentale)

V2 est une réinterprétation indépendante de la V1 (dossier parent).
Elle a ses propres fichiers : `index.html`, `css/`, `js/`, `assets/`, `demo-iphone.html`.
Modifier la V2 ne touche jamais la V1, et inversement.

- **V1** → http://localhost:3000 (site actuel)
- **V2** → http://localhost:3001 (cette version)

Lancer les deux : double-cliquer `../lancer-v1-v2.command`.

## Idées à piocher pour la V1

| # | Idée V2 | Où dans la V2 |
|---|---------|---------------|
| 1 | Hero informatif : titre, adresse, 2 CTA, fourchettes de prix, note Google, photo + carte produit | `.hero` |
| 2 | Cartes « Quel format ? » (Sandwich / Bun / Roll / Krok) qui ouvrent le bon onglet | `.formats` |
| 3 | Carte façon menu de deli : nom ····· prix, ingrédients sur une ligne | `.dish` |
| 4 | « Dans chaque recette : pastrami + jambon » affiché une seule fois par catégorie | `.cat-base` |
| 5 | Filtre Tout / Doux / Ça pique + compteur par onglet | `.filter`, `.chip .count` |
| 6 | Lien « Aussi en bun · 7€ » entre sandwich et bun de même nom | `.also` |
| 7 | Onglet « Toute la carte » (remplace la page overlay Carte) | `#tab-all` |
| 8 | Composeur de Krok interactif avec récap | `.krok` |
| 9 | Section « Fait maison » (pastrami, sauces, pickles, oignons confits) | `.maison` |
| 10 | Galerie en mosaïque (desktop) / carrousel à glisser (mobile), lightbox avec compteur et swipe | `.bento`, `.lb` |
| 11 | Avis : un avis mis en avant + carrousel mobile | `.avis` |
| 12 | Bloc Infos : horaires avec « Aujourd'hui », Google Maps chargée à la demande | `.infos` |
| 13 | Statut Ouvert / Fermé dans l'en-tête (s'active dès que les horaires sont remplis) | `#status` |
| 14 | Barre d'actions mobile en bas (Carte / Itinéraire / Horaires) | `.dock` |
| 15 | Menu mobile plein écran, navigation qui suit la section active | `.sheet`, `.hdr-nav` |

## À compléter / vérifier

- Horaires dans `js/data.js` au format `11h30 – 15h00` (active le statut Ouvert/Fermé)
- Téléphone, note et nombre d'avis Google : objet `INFO` dans `js/data.js`
- Phrase « Dans l'Écusson, centre historique de Montpellier » (`index.html`) à confirmer
