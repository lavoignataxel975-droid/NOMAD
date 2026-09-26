/* =========================================================
   NOMAD — Réglages du Click & Collect
   Modifiez ce fichier puis relancez le serveur.
   ========================================================= */

module.exports = {
  port: Number(process.env.PORT) || 3000,
  timezone: 'Europe/Paris',

  /* Horaires d'ouverture : source unique partagée avec le pied de page du site */
  hours: require('../js/horaires.js'),

  prepMinutes: 20,        // délai minimal entre la commande et le retrait
  slotMinutes: 15,        // intervalle entre deux créneaux (calés sur l'heure d'ouverture)
  maxPerSlot: 4,          // nombre maximal de commandes par créneau
  lastSlotBeforeClose: 15, // dernier créneau : X minutes avant la fermeture

  soonMinutes: 15,        // back-office : retrait « imminent » en dessous de ce délai
  pollSeconds: 5,         // back-office : fréquence de mise à jour automatique

  /* Identifiants du back-office. À CHANGER avant la mise en ligne :
     de préférence via les variables d'environnement NOMAD_ADMIN_USER et NOMAD_ADMIN_PASSWORD. */
  adminUser: process.env.NOMAD_ADMIN_USER || 'nomad',
  adminPassword: process.env.NOMAD_ADMIN_PASSWORD || 'nomad2026',
  sessionDays: 14,
  secureCookie: process.env.NOMAD_SECURE_COOKIE === '1'   // à activer en HTTPS
};
