/* NOMAD back-office — commandes du jour (mise à jour automatique) */
'use strict';

const FLOW = ['NOUVELLE', 'EN_PREPARATION', 'PRETE', 'TERMINEE'];
const PREF_KEY = 'nomad-admin-prefs';

let prefs = { hideDone: false, sound: false };
try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }; } catch (e) { /* ignore */ }
const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ } };

let seen = null;           // identifiants déjà affichés (null = premier chargement)
const fresh = new Set();   // commandes arrivées depuis l'ouverture de la page
let lastJson = '';
let pollMs = 5000;
let timer = null;
let busy = false;
let again = false;        // une mise à jour a été demandée pendant un chargement

/* ---------- Son (bip) pour une nouvelle commande ---------- */
let audio = null;
function beep() {
  if (!prefs.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    [0, .22].forEach(t => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(.001, audio.currentTime + t);
      g.gain.exponentialRampToValueAtTime(.35, audio.currentTime + t + .02);
      g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + t + .18);
      o.connect(g).connect(audio.destination);
      o.start(audio.currentTime + t);
      o.stop(audio.currentTime + t + .2);
    });
  } catch (e) { /* audio indisponible */ }
}

/* ---------- Rendu ---------- */
function relative(min) {
  if (min == null) return '';
  if (min === 0) return 'maintenant';
  const a = Math.abs(min);
  const txt = a >= 60 ? Math.floor(a / 60) + ' h ' + String(a % 60).padStart(2, '0') : a + ' min';
  return min > 0 ? 'dans ' + txt : 'il y a ' + txt;
}

function orderCard(o) {
  const flag = o.late
    ? '<span class="badge badge--late">' + (o.status === 'PRETE' ? 'Pas encore récupérée' : 'En retard') + '</span>'
    : o.soon ? '<span class="badge badge--soon">Bientôt</span>' : '';
  const buttons = FLOW.map(s =>
    '<button type="button" data-id="' + o.id + '" data-set="' + s + '" aria-pressed="' + (o.status === s) + '">' + STATUS_LABEL[s].toUpperCase() + '</button>'
  ).join('') +
  '<button type="button" data-id="' + o.id + '" data-set="ARCHIVEE"' + (o.status === 'TERMINEE' ? '' : ' disabled title="Passez d’abord la commande en « Terminée »"') + '>ARCHIVER</button>';

  return '<article class="order' + (o.late ? ' is-late' : o.soon ? ' is-soon' : '') + (fresh.has(o.id) ? ' is-fresh' : '') + '" data-status="' + o.status + '" id="o' + o.id + '">' +
    '<div class="order-head"><span class="order-ref">#' + o.ref + '</span>' + flag +
      '<span class="badge" data-s="' + o.status + '">' + STATUS_LABEL[o.status] + '</span></div>' +
    '<div class="order-who">' + esc(o.firstName) + ' ' + esc(o.lastName) + '</div>' +
    '<a class="order-phone" href="tel:' + esc(o.phone.replace(/\s/g, '')) + '">' + esc(o.phone) + '</a>' +
    '<div class="order-times">Retrait : <b>' + hh(o.pickupTime) + '</b>' + (o.day !== currentDay ? ' (' + esc(o.day) + ')' : '') +
      ' · commandée à ' + clock(o.createdAt) + '</div>' +
    itemsHtml(o) +
    '<div class="status-row">' + buttons + '</div>' +
  '</article>';
}

let currentDay = '';

function render(data) {
  currentDay = data.day;
  $('#day').textContent = longDay(data.day);

  const count = s => data.orders.filter(o => o.status === s).length;
  const late = data.orders.filter(o => o.late).length;
  $('#summary').innerHTML =
    FLOW.map(s => '<span class="pill">' + STATUS_LABEL[s] + ' <b>' + count(s) + '</b></span>').join('') +
    (late ? '<span class="pill pill--late">En retard <b>' + late + '</b></span>' : '') +
    '<div class="summary-tools">' +
      '<button type="button" class="tool" id="toggleDone" aria-pressed="' + prefs.hideDone + '">Masquer les terminées</button>' +
      '<button type="button" class="tool" id="toggleSound" aria-pressed="' + prefs.sound + '">' + (prefs.sound ? '🔔 Son activé' : '🔕 Activer le son') + '</button>' +
    '</div>';

  const list = data.orders.filter(o => !(prefs.hideDone && o.status === 'TERMINEE'));
  if (!list.length) {
    $('#timeline').innerHTML = '<p class="empty">' + (data.orders.length ? 'Toutes les commandes du jour sont terminées.' : 'Aucune commande pour le moment. Les nouvelles commandes s’afficheront ici automatiquement.') + '</p>';
  } else {
    /* regroupement par heure de retrait, dans l'ordre chronologique */
    const groups = new Map();
    for (const o of list) {
      if (!groups.has(o.pickupTime)) groups.set(o.pickupTime, []);
      groups.get(o.pickupTime).push(o);
    }
    $('#timeline').innerHTML = [...groups].map(([time, orders]) => {
      const min = orders[0].minutesLeft;
      const late = orders.some(o => o.late);
      const soon = orders.some(o => o.soon);
      return '<section class="slot' + (late ? ' is-late' : soon ? ' is-soon' : '') + '">' +
        '<div class="slot-time"><strong>' + hh(time) + '</strong><span>' + relative(min) + '</span></div>' +
        '<div class="slot-cards">' + orders.map(orderCard).join('') + '</div>' +
      '</section>';
    }).join('');
  }

  $('#older').hidden = !data.older.length;
  $('#olderList').innerHTML = data.older.map(orderCard).join('');

  const nb = count('NOUVELLE');
  document.title = (nb ? '(' + nb + ') ' : '') + 'Commandes — NOMAD';
}

/* ---------- Chargement + mise à jour automatique ---------- */
async function refresh() {
  if (busy) { again = true; return; }
  busy = true;
  again = false;
  try {
    const data = await api('/api/admin/orders');
    pollMs = (data.pollSeconds || 5) * 1000;
    const all = [...data.orders, ...data.older];
    if (seen) {
      const added = all.filter(o => !seen.has(o.id));
      if (added.length) {
        added.forEach(o => fresh.add(o.id));
        beep();
        toast(added.length > 1 ? added.length + ' nouvelles commandes' : 'Nouvelle commande #' + added[0].ref);
        setTimeout(() => { added.forEach(o => fresh.delete(o.id)); lastJson = ''; }, 6000);
      }
    }
    seen = new Set(all.map(o => o.id));
    const j = JSON.stringify(data) + [...fresh].join(',') + JSON.stringify(prefs);
    if (j !== lastJson) { lastJson = j; render(data); }
    $('#live').className = 'live';
    $('#live').textContent = 'À jour · ' + hh(data.now);
  } catch (e) {
    $('#live').className = 'live is-down';
    $('#live').textContent = 'Connexion perdue, nouvel essai…';
  } finally {
    busy = false;
    clearTimeout(timer);
    timer = setTimeout(refresh, again ? 0 : pollMs);
  }
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-set]');
  if (b && !b.disabled) {
    if (b.getAttribute('aria-pressed') === 'true') return;
    b.disabled = true;
    try {
      await api('/api/admin/orders/' + b.dataset.id + '/status', { method: 'POST', body: JSON.stringify({ status: b.dataset.set }) });
      if (b.dataset.set === 'ARCHIVEE') toast('Commande archivée');
    } catch (err) {
      toast(err.message);
    }
    lastJson = '';
    return refresh();
  }
  if (e.target.id === 'toggleDone') { prefs.hideDone = !prefs.hideDone; savePrefs(); lastJson = ''; refresh(); }
  if (e.target.id === 'toggleSound') { prefs.sound = !prefs.sound; savePrefs(); if (prefs.sound) beep(); lastJson = ''; refresh(); }
});

document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
refresh();
