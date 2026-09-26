/* =========================================================
   NOMAD — HORAIRES D'OUVERTURE : SOURCE UNIQUE
   Utilisée par :
   - le pied de page du site (js/main.js)
   - les créneaux du Click & Collect (server/config.js → server/server.js)
   Modifier ici, puis relancer le serveur pour le Click & Collect.

   Jours : 0 = dimanche … 6 = samedi.
   Chaque jour : liste de plages ['HH:MM', 'HH:MM']. [] = fermé.
   ========================================================= */
var OPENING_HOURS = {
  0: [],                                         // dimanche : fermé
  1: [],                                         // lundi : fermé
  2: [['18:30', '23:00']],                       // mardi : soir uniquement
  3: [['11:30', '15:00'], ['18:30', '23:00']],   // mercredi
  4: [['11:30', '15:00'], ['18:30', '23:00']],   // jeudi
  5: [['11:30', '15:00'], ['18:30', '23:00']],   // vendredi
  6: [['11:30', '15:00'], ['18:30', '23:00']]    // samedi
};

if (typeof module !== 'undefined' && module.exports) module.exports = OPENING_HOURS;
