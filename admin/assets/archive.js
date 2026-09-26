/* NOMAD back-office — archives (recherche, restauration, suppression définitive) */
'use strict';

const form = $('#searchForm');
let orders = [];

function card(o) {
  return '<article class="order" data-status="ARCHIVEE">' +
    '<div class="order-head"><span class="order-ref">#' + o.ref + '</span><span class="badge">Archivée</span></div>' +
    '<div class="order-times"><b>' + esc(longDay(o.day)) + '</b></div>' +
    '<div class="order-who">' + esc(o.firstName) + ' ' + esc(o.lastName) + '</div>' +
    '<a class="order-phone" href="tel:' + esc(o.phone.replace(/\s/g, '')) + '">' + esc(o.phone) + '</a>' +
    '<div class="order-times">Retrait : <b>' + hh(o.pickupTime) + '</b> · commandée à ' + clock(o.createdAt) +
      (o.archivedAt ? ' · archivée à ' + clock(o.archivedAt) : '') + '</div>' +
    itemsHtml(o) +
    '<div class="archive-actions">' +
      '<button type="button" class="btn" data-restore="' + o.id + '">Restaurer (terminée)</button>' +
      '<button type="button" class="btn btn--danger" data-delete="' + o.id + '">Supprimer définitivement</button>' +
    '</div>' +
  '</article>';
}

async function load() {
  const params = new URLSearchParams(new FormData(form));
  try {
    const data = await api('/api/admin/archive?' + params);
    orders = data.orders;
    $('#count').textContent = orders.length
      ? orders.length + (orders.length > 1 ? ' commandes archivées' : ' commande archivée') + (orders.length >= 200 ? ' (200 plus récentes, affinez la recherche)' : '')
      : 'Aucune commande archivée ne correspond.';
    $('#list').innerHTML = orders.map(card).join('');
  } catch (e) {
    $('#count').textContent = e.message;
  }
}

form.addEventListener('submit', e => { e.preventDefault(); load(); });
let t;
form.addEventListener('input', () => { clearTimeout(t); t = setTimeout(load, 300); });

$('#list').addEventListener('click', async e => {
  const restore = e.target.closest('[data-restore]');
  const del = e.target.closest('[data-delete]');
  if (restore) {
    try {
      await api('/api/admin/orders/' + restore.dataset.restore + '/status', { method: 'POST', body: JSON.stringify({ status: 'TERMINEE' }) });
      toast('Commande restaurée dans les commandes (terminée)');
    } catch (err) { toast(err.message); }
    return load();
  }
  if (del) {
    const o = orders.find(x => String(x.id) === del.dataset.delete);
    const typed = prompt(
      'Suppression DÉFINITIVE de la commande #' + o.ref + ' du ' + longDay(o.day) + ' (' + o.firstName + ' ' + o.lastName + ').\n' +
      'Cette action est irréversible.\n\nPour confirmer, tapez le numéro de la commande : ' + o.ref
    );
    if (typed === null) return;
    try {
      await api('/api/admin/orders/' + o.id, { method: 'DELETE', body: JSON.stringify({ confirm: typed.trim() }) });
      toast('Commande #' + o.ref + ' supprimée définitivement');
    } catch (err) { toast(err.message); }
    return load();
  }
});

load();
