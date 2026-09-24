/* =========================================================
   NOMAD V2 — Contenu du site
   Copie indépendante des données de la V1 (même format),
   complétée par INFO et FORMATS. Modifier ici n'affecte pas la V1.
   ========================================================= */

const P = 'Pastrami de bœuf';
const J = 'Jambon supérieur de dinde';

/* Coordonnées & liens */
const INFO = {
  address: '7 Rue du Puits du Temple',
  city: '34000 Montpellier',
  phone: '',                 // ex. '04 67 00 00 00' — vide = « à compléter »
  maps: 'https://maps.app.goo.gl/72hZZ28Cx7BQtt2dA',
  mapEmbed: 'https://www.google.com/maps?q=7+Rue+du+Puits+du+Temple,+34000+Montpellier&output=embed',
  instagram: 'https://www.instagram.com/nomad.montpellier?igsh=MTdkYmwycGFkaWI0NA%3D%3D',
  rating: 'X,X',             // note Google
  reviewsCount: 'XX'         // nombre d'avis
};

/* Chaque produit : [nom, prix, piquant (0 à 5), [ingrédients]]
   base : ingrédients communs à toute la catégorie (affichés une seule fois) */
const MENU = {
  sandwichs: {
    label: 'Sandwichs', title: 'Sandwichs', tone: 'red', base: [P, J],
    items: [
      ['Pastracheese', '12€', 0, [P, J, 'Pickles de cornichons', 'Chou rouge mariné', 'Cheddar', 'Oignons frits', 'Sauce Buns']],
      ['Big pastra', '14€', 0, [P, J, 'Mimolette fondue', 'Oignons rouges & oignons frits', 'Pickles de cornichons & carottes', 'Pousses d’épinards', 'Sauce Gribiche']],
      ['Peanuts', '15€', 0, [P, J, 'Rosette de bœuf', 'Tartare d’avocat', 'Chou rouge mariné', 'Pickles de carottes', 'Sauce cajun & praliné cacahuètes']],
      ['Chilicheese', '12€', 2, [P, J, 'Cheddar', 'Pickles de cornichons & oignons frits', 'Chou rouge mariné', 'Sauce spicy']],
      ['Chèvre miel', '12€', 0, [P, J, 'Tartinade de chèvre frais', 'Oignons confits & amandes effilées', 'Pousses d’épinards', 'Miel']],
      ['Spicy', '12€', 4, [P, J, 'Poivrons confits & chou rouge mariné', 'Oignons rouges & oignons frits', 'Tabasco vert', 'Sauce spicy', 'Supp. cheese +2€']],
      ['Essentiel', '10€', 0, [P, J, 'Coleslaw (salade de crudités)', 'Oignons confits & frits', 'Persillade', 'Sauce cajun']],
      ['Korean spicy', '10€', 4, [P, J, 'Oignons rouges & oignons frits', 'Kimchi', 'Mayo sriracha']]
    ]
  },
  buns: {
    label: 'Buns', title: 'Buns', tone: 'red', base: [P, J],
    items: [
      ['Pastracheese', '7€', 0, [P, J, 'Pickles de cornichons & chou rouge', 'Cheddar', 'Oignons frits', 'Sauce Buns']],
      ['Big pastra', '9€', 0, [P, J, 'Mimolette fondue', 'Oignons rouges & oignons frits', 'Pickles de cornichons & carottes', 'Pousses d’épinards', 'Sauce Gribiche']],
      ['Peanuts', '9€', 0, [P, J, 'Rosette de bœuf', 'Tartare d’avocat', 'Chou rouge mariné', 'Pickles de carottes', 'Sauce cajun & praliné cacahuètes']],
      ['Unique', '8€', 1, [P, J, 'Tartare d’avocat', 'Oignons frits & oignons confits', 'Amandes effilées', 'Persillade & Tabasco vert', 'Sauce cajun']],
      ['Chèvre miel', '7€', 0, [P, J, 'Tartinade de chèvre frais', 'Oignons confits & miel', 'Pousses d’épinards', 'Amandes effilées']],
      ['Chilicheese', '7€', 2, [P, J, 'Cheddar', 'Pickles de cornichon & oignons frits', 'Chou rouge mariné', 'Sauce spicy']],
      ['Essentiel', '7€', 0, [P, J, 'Coleslaw (salade de crudités)', 'Oignons confits & frits', 'Persillade', 'Sauce cajun']],
      ['Spicy', '7€', 3, [P, J, 'Poivrons confits & chou rouge mariné', 'Oignons rouges & oignons frits', 'Sauce spicy & tabasco vert', 'Supp. cheese +2€']],
      ['Loubes', '8€', 0, [P, J, 'Cabécou fondu', 'Oignons rouges', 'Pousses d’épinard', 'Persillade']],
      ['Korean spicy', '7€', 4, [P, J, 'Oignons rouges & oignons frits', 'Kimchi', 'Mayo sriracha']]
    ]
  },
  rolls: {
    label: 'Rolls', title: 'Rolls signature', tone: 'navy', base: [],
    items: [
      ['Poulpe fresh', '8€', 0, ['Poulpe fumé', 'Pickles oignons rouges', 'Oignons frits & cébettes', 'Crudités', 'Sauce fresh']],
      ['Original Reuben', '8€', 0, [P, 'Oignons confits', 'Pickles de cornichons', 'Sauce Cheddar', 'Moutarde au miel']],
      ['Poulpe Sriracha', '8€', 2, ['Poulpe fumé', 'Pickles oignons rouges', 'Crudités & jalapeños', 'Oignons frits & cébettes', 'Sauce mayo sriracha']],
      ['Original spicy', '8€', 2, [P, 'Chou rouge mariné', 'Pickles jalapeños', 'Oignons frits', 'Sauce mayo sriracha']],
      ['American BBQ', '8€', 0, ['Effiloché de bœuf confit', 'Oignons cébettes & oignons frits', 'Crudités', 'Pickles de cornichons', 'Sauce barbecue']]
    ]
  },
  krok: {
    label: 'Krok', title: 'Krok à composer', tone: 'navy',
    intro: 'Une viande, un fromage, une sauce : composez votre Krok.',
    price: '5€',
    groups: [
      { name: 'Viande', items: [P, J] },
      { name: 'Fromage', items: ['Cheddar', 'Mimolette', 'Tartinade de chèvre'] },
      { name: 'Sauce', items: ['Chili', 'Buns', 'Cajun', 'Persillade', 'Mayo sriracha', 'Gribiche'] }
    ]
  },
  boissons: {
    label: 'Boissons', title: 'Boissons', tone: 'navy', base: [],
    items: [
      ['Soft', '2€', 0, []],
      ['Eau plate', '1,50€', 0, []]
    ]
  }
};

/* Cartes « Choisis ton format » (section d'accueil de la carte) */
const FORMATS = [
  { cat: 'sandwichs', name: 'Sandwich', desc: 'Le grand format, le plus garni.', img: 'assets/sandwich-chevre.jpg' },
  { cat: 'buns', name: 'Bun', desc: 'Les recettes phares, en format rond.', img: 'assets/bun-avocat.jpg' },
  { cat: 'rolls', name: 'Roll', desc: 'Poulpe fumé, pastrami ou bœuf effiloché.', img: 'assets/roll-poulpe.jpg' },
  { cat: 'krok', name: 'Krok', desc: 'Viande, fromage, sauce : à vous de jouer.', img: 'assets/bun-grill.jpg' }
];

/* Ce qui est fait maison (section « Fait ici ») */
const HOMEMADE = [
  { name: 'Pastrami de bœuf', text: 'Le cœur de la maison, préparé sur place.' },
  { name: 'Sauces', text: 'Buns, cajun, gribiche, spicy… préparées sur place.' },
  { name: 'Pickles', text: 'Cornichons, carottes, oignons rouges, chou rouge mariné.' },
  { name: 'Oignons confits', text: 'Faits maison, comme tout le reste.' }
];

/* Photos : galerie et lightbox (dans cet ordre) */
const PHOTOS = [
  { src: 'assets/bun-grill.jpg', alt: 'Bun au pastrami sous la presse' },
  { src: 'assets/bun-avocat.jpg', alt: 'Bun Unique au tartare d’avocat' },
  { src: 'assets/roll-poulpe.jpg', alt: 'Roll au poulpe' },
  { src: 'assets/sandwich-chevre.jpg', alt: 'Sandwich Chèvre miel' },
  { src: 'assets/roll-terrasse.jpg', alt: 'Roll servi en terrasse' }
];

/* À REMPLACER par de vrais avis Google */
const REVIEWS = [
  { name: 'Prénom N.', text: 'Le pastrami est incroyable, fondant et bien assaisonné. Le Big pastra vaut vraiment le détour.' },
  { name: 'Prénom N.', text: 'Accueil adorable, produits faits maison et des prix corrects. Le roll au poulpe est une vraie surprise.' },
  { name: 'Prénom N.', text: 'Meilleur sandwich de Montpellier. Le Chèvre miel est une tuerie, on reviendra !' }
];

/* À COMPLÉTER — format conseillé : '11h30 – 15h00' ou 'Fermé'
   days : jours concernés (0 = dimanche … 6 = samedi), sert à surligner « aujourd'hui »
   et à afficher « Ouvert / Fermé » dans l'en-tête. */
const HOURS = [
  { day: 'Lundi', days: [1], time: 'À compléter' },
  { day: 'Mardi – Vendredi', days: [2, 3, 4, 5], time: 'À compléter' },
  { day: 'Samedi', days: [6], time: 'À compléter' },
  { day: 'Dimanche', days: [0], time: 'À compléter' }
];
