/* =========================================================
   NOMAD — Contenu du site
   Modifiez ce fichier pour mettre à jour la carte, les prix,
   les avis, les horaires et les photos.
   ========================================================= */

const P = 'Pastrami de bœuf';
const J = 'Jambon supérieur de dinde';
const RED = '#B5121B';
const NAVY = '#0B2F6E';

/* Chaque produit : [nom, prix, piquant (0 à 5), [ingrédients]] */
const MENU = {
  sandwichs: {
    label: 'Sandwichs', title: 'Nos sandwichs maison', color: RED,
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
    label: 'Buns', title: 'Nos buns maison', color: RED,
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
    label: 'Rolls', title: 'Rolls signature', color: NAVY,
    items: [
      ['Poulpe fresh', '8€', 0, ['Poulpe fumé', 'Pickles oignons rouges', 'Oignons frits & cébettes', 'Crudités', 'Sauce fresh']],
      ['Original Reuben', '8€', 0, [P, 'Oignons confits', 'Pickles de cornichons', 'Sauce Cheddar', 'Moutarde au miel']],
      ['Poulpe Sriracha', '8€', 2, ['Poulpe fumé', 'Pickles oignons rouges', 'Crudités & jalapeños', 'Oignons frits & cébettes', 'Sauce mayo sriracha']],
      ['Original spicy', '8€', 2, [P, 'Chou rouge mariné', 'Pickles jalapeños', 'Oignons frits', 'Sauce mayo sriracha']],
      ['American BBQ', '8€', 0, ['Effiloché de bœuf confit', 'Oignons cébettes & oignons frits', 'Crudités', 'Pickles de cornichons', 'Sauce barbecue']]
    ]
  },
  krok: {
    label: 'Krok', title: 'Krok à composer', color: NAVY,
    intro: 'Composez votre Krok selon vos envies : une viande, un fromage et une sauce.',
    price: '5€',
    groups: [
      { name: 'Viandes', items: [P, J] },
      { name: 'Fromages', items: ['Cheddar', 'Mimolette', 'Tartinade de chèvre'] },
      { name: 'Sauces', items: ['Chili', 'Buns', 'Cajun', 'Persillade', 'Mayo sriracha', 'Gribiche'] }
    ]
  },
  boissons: {
    label: 'Boissons', title: 'Boissons', color: NAVY,
    items: [
      ['Soft', '2€', 0, []],
      ['Eau plate', '1,50€', 0, []]
    ]
  }
};

/* Photos : carrousel, page Photos et lightbox (dans cet ordre) */
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

/* À COMPLÉTER */
const HOURS = [
  { day: 'Lundi', time: 'À compléter' },
  { day: 'Mardi – Vendredi', time: 'À compléter' },
  { day: 'Samedi', time: 'À compléter' },
  { day: 'Dimanche', time: 'À compléter' }
];
