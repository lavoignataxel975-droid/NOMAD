/* NOMAD back-office — CMS des produits (même session que les commandes) */
'use strict';

let categories = [];
let products = [];
let current = null;        // catégorie affichée
let editing = null;        // produit ouvert dans la fiche (null = nouveau)

const dialog = $('#dialog');
const form = $('#form');

async function load() {
  const data = await api('/api/admin/products');
  categories = data.categories;
  products = data.products;
  if (!current || !categories.some(c => c.key === current)) current = categories[0] && categories[0].key;
  render();
}

function render() {
  $('#tabs').innerHTML = categories.map(c => {
    const n = products.filter(p => p.cat === c.key).length;
    return '<button type="button" class="tool" role="tab" data-cat="' + esc(c.key) + '" aria-pressed="' + (c.key === current) + '">' +
      esc(c.label) + ' <span class="pc-n">' + n + '</span></button>';
  }).join('');
  const list = products.filter(p => p.cat === current);
  $('#list').innerHTML = list.length ? list.map(p => {
    const desc = p.lines.join(' · ');
    return '<article class="order pc-card" data-id="' + esc(p.id) + '">' +
      (p.image ? '<img class="pc-thumb" src="/' + esc(p.image) + '" alt="">' : '<span class="pc-thumb pc-thumb--none" aria-hidden="true">' + esc(p.name.charAt(0)) + '</span>') +
      '<div class="pc-body">' +
        '<div class="order-head"><span class="pc-name">' + esc(p.name) + '</span><span class="pc-price">' + euro(p.priceCents) + '</span></div>' +
        (p.spice ? '<span class="order-times">Piquant ' + p.spice + '/5</span>' : '') +
        (desc ? '<p class="pc-desc">' + esc(desc) + '</p>' : '') +
      '</div>' +
      '<button type="button" class="btn" data-edit="' + esc(p.id) + '">Modifier</button>' +
    '</article>';
  }).join('') : '<p class="empty">Aucun produit dans cette catégorie.</p>';
}

/* ---------- Fiche ---------- */
function setImage(p) {
  const has = !!(p && p.image);
  $('#imgPreview').hidden = !has;
  if (has) $('#imgPreview').src = '/' + p.image;
  $('#imgNone').hidden = has;
  $('#imgRemove').hidden = !has;
  $('.pc-file').hidden = !p;
  $('#imgHint').hidden = !!p;
}

function openForm(p) {
  editing = p || null;
  $('#dlgTitle').textContent = p ? 'Modifier « ' + p.name + ' »' : 'Nouveau produit';
  form.cat.innerHTML = categories.map(c => '<option value="' + esc(c.key) + '">' + esc(c.label) + '</option>').join('');
  form.name.value = p ? p.name : '';
  form.cat.value = p ? p.cat : current;
  form.price.value = p ? String(p.priceCents / 100).replace('.', ',') : '';
  form.spice.value = String(p ? p.spice : 0);
  form.description.value = p ? p.lines.join('\n') : '';
  $('#formError').textContent = '';
  $('#deleteBtn').hidden = !p;
  $('#deleteBtn').dataset.armed = '';
  $('#deleteBtn').textContent = 'Supprimer';
  setImage(p);
  dialog.showModal();
  form.name.focus();
}

$('#newBtn').addEventListener('click', () => openForm(null));
$('#cancelBtn').addEventListener('click', () => dialog.close());
$('#list').addEventListener('click', e => {
  const b = e.target.closest('[data-edit]');
  if (b) openForm(products.find(p => p.id === b.dataset.edit));
});
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  current = b.dataset.cat;
  render();
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  const body = JSON.stringify({
    name: form.name.value, cat: form.cat.value, price: form.price.value,
    spice: Number(form.spice.value), description: form.description.value
  });
  const save = form.querySelector('.pc-save');
  save.disabled = true;
  try {
    const { product } = editing
      ? await api('/api/admin/products/' + encodeURIComponent(editing.id), { method: 'PUT', body })
      : await api('/api/admin/products', { method: 'POST', body });
    const wasNew = !editing;
    current = product.cat;
    await load();
    toast(wasNew ? 'Produit ajouté — visible sur le site' : 'Modifications enregistrées — visibles sur le site');
    if (wasNew) openForm(products.find(p => p.id === product.id)); // pour ajouter une image tout de suite
    else dialog.close();
  } catch (err) {
    $('#formError').textContent = err.message;
  } finally {
    save.disabled = false;
  }
});

$('#deleteBtn').addEventListener('click', async () => {
  const b = $('#deleteBtn');
  if (!b.dataset.armed) {
    b.dataset.armed = '1';
    b.textContent = 'Confirmer la suppression';
    return;
  }
  try {
    await api('/api/admin/products/' + encodeURIComponent(editing.id), { method: 'DELETE', body: '{}' });
    dialog.close();
    await load();
    toast('Produit supprimé');
  } catch (err) {
    $('#formError').textContent = err.message;
  }
});

/* ---------- Image ---------- */
$('#imgInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !editing) return;
  $('#formError').textContent = '';
  try {
    const r = await fetch('/api/admin/products/' + encodeURIComponent(editing.id) + '/image', {
      method: 'POST', headers: { 'Content-Type': file.type }, body: file
    });
    if (r.status === 401) return location.replace('/admin/login');
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Erreur ' + r.status);
    editing = data.product;
    setImage(editing);
    await load();
    toast('Image enregistrée');
  } catch (err) {
    $('#formError').textContent = err.message;
  }
});
$('#imgRemove').addEventListener('click', async () => {
  try {
    const { product } = await api('/api/admin/products/' + encodeURIComponent(editing.id) + '/image', { method: 'DELETE', body: '{}' });
    editing = product;
    setImage(editing);
    await load();
    toast('Image retirée');
  } catch (err) {
    $('#formError').textContent = err.message;
  }
});

load().catch(err => { $('#list').innerHTML = '<p class="empty">' + esc(err.message) + '</p>'; });
