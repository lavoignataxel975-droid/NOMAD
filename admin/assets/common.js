/* NOMAD back-office — outils communs */
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const euro = c => (c / 100).toFixed(2).replace('.', ',') + ' €';
const hh = t => t.replace(':', 'h');
const clock = iso => new Date(iso).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
const longDay = day => new Date(day + 'T12:00:00Z').toLocaleDateString('fr-FR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const STATUS_LABEL = {
  NOUVELLE: 'Nouvelle',
  EN_PREPARATION: 'En préparation',
  PRETE: 'Prête',
  TERMINEE: 'Terminée',
  ARCHIVEE: 'Archivée'
};

/* Appel à l'API : renvoie vers la connexion si la session a expiré */
async function api(url, options = {}) {
  const r = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers: options.body ? { 'Content-Type': 'application/json' } : {}
  });
  if (r.status === 401) { location.replace('/admin/login'); throw new Error('Connexion requise'); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Erreur ' + r.status);
  return data;
}

function toast(text) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* Contenu d'une commande (lignes, options, total) */
function itemsHtml(o) {
  return '<ul class="order-items">' + o.items.map(i => {
    const extra = [...Object.values(i.choices || {}), ...(i.options || []).map(x => x.label)].join(' · ');
    return '<li><span class="qty">' + i.qty + ' ×</span> ' + esc(i.name) + ' <span class="order-times">(' + esc(i.cat) + ')</span>' +
      (extra ? '<small>' + esc(extra) + '</small>' : '') + '</li>';
  }).join('') + '</ul>' +
  '<div class="order-total">Total : ' + euro(o.totalCents) + '</div>';
}

$('#logout') && $('#logout').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  location.replace('/admin/login');
});
