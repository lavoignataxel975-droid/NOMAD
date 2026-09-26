/* =========================================================
   NOMAD — Click & Collect : carte, panier et envoi de la commande
   La carte et les créneaux viennent du serveur (/api/menu, /api/slots) ;
   le serveur recalcule toujours les prix.
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const euro = c => (c / 100).toFixed(2).replace('.', ',') + ' €';
  const hh = t => t.replace(':', 'h');

  const CART_KEY = 'nomad-cart';
  let categories = [];
  let products = new Map();
  let cart = [];
  let current = null;

  const form = $('#ccForm');
  const submitBtn = $('#ccSubmit');
  const errorBox = $('#ccError');

  /* ---------- Panier (gardé dans le navigateur si possible) ---------- */
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* stockage indisponible */ }
  }
  function loadCart() {
    try {
      const c = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (Array.isArray(c)) return c.filter(l => products.has(l.id) && l.qty > 0);
    } catch (e) { /* ignore */ }
    return [];
  }

  function unitCents(line) {
    const p = products.get(line.id);
    return p.priceCents + line.options.reduce((s, id) => s + (p.options.find(o => o.id === id) || { cents: 0 }).cents, 0);
  }
  const lineKey = l => l.id + '|' + l.options.slice().sort().join(',') + '|' + JSON.stringify(l.choices || {});

  function addToCart(line) {
    const key = lineKey(line);
    const found = cart.find(l => lineKey(l) === key);
    if (found) found.qty = Math.min(20, found.qty + 1);
    else cart.push({ ...line, qty: 1 });
    saveCart();
    renderCart();
  }

  function renderCart() {
    const lines = $('#ccLines');
    lines.innerHTML = cart.map((l, i) => {
      const p = products.get(l.id);
      const extra = [
        ...Object.values(l.choices || {}),
        ...l.options.map(id => (p.options.find(o => o.id === id) || {}).label)
      ].filter(Boolean).join(' · ');
      return '<li class="cc-line">' +
        '<span class="cc-line-name">' + esc(p.name) + ' <small>(' + esc(p.cat) + ')</small></span>' +
        '<span class="cc-line-price">' + euro(unitCents(l) * l.qty) + '</span>' +
        (extra ? '<span class="cc-line-extra">' + esc(extra) + '</span>' : '') +
        '<span class="cc-qty">' +
          '<button type="button" data-dec="' + i + '" aria-label="Retirer un ' + esc(p.name) + '">−</button>' +
          '<span aria-label="Quantité">' + l.qty + '</span>' +
          '<button type="button" data-inc="' + i + '" aria-label="Ajouter un ' + esc(p.name) + '">+</button>' +
        '</span>' +
      '</li>';
    }).join('');
    const total = cart.reduce((s, l) => s + unitCents(l) * l.qty, 0);
    const count = cart.reduce((s, l) => s + l.qty, 0);
    $('#ccEmpty').hidden = cart.length > 0;
    $('#ccTotal').textContent = euro(total);
    $('#ccBar').hidden = count === 0;
    $('#ccBarCount').textContent = count + (count > 1 ? ' articles' : ' article');
    $('#ccBarTotal').textContent = euro(total);
  }

  $('#ccLines').addEventListener('click', e => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    if (inc) { const l = cart[+inc.dataset.inc]; l.qty = Math.min(20, l.qty + 1); }
    else if (dec) { const i = +dec.dataset.dec; if (--cart[i].qty <= 0) cart.splice(i, 1); }
    else return;
    saveCart();
    renderCart();
  });

  /* ---------- Carte ---------- */
  function renderTabs() {
    $('#ccTabs').innerHTML = categories.map(c =>
      '<button type="button" class="tab" role="tab" data-cat="' + esc(c.key) + '" aria-selected="' + (c.key === current) + '">' + esc(c.label) + '</button>'
    ).join('');
  }

  function renderProducts() {
    const cat = categories.find(c => c.key === current);
    $('#ccProducts').innerHTML = '<div class="cc-products">' + cat.products.map(p => {
      if (p.choices.length) {
        return '<div class="cc-product cc-krok" data-id="' + esc(p.id) + '">' +
          '<h3 class="cc-product-name">' + esc(p.name) + '<span class="cc-product-price">' + euro(p.priceCents) + '</span></h3>' +
          '<p class="cc-product-desc">' + esc(p.description) + '</p>' +
          p.choices.map(g =>
            '<label>' + esc(g.name) + '<select data-choice="' + esc(g.name) + '"><option value="">Choisir…</option>' +
              g.items.map(v => '<option>' + esc(v) + '</option>').join('') +
            '</select></label>'
          ).join('') +
          '<button type="button" class="cc-add" data-add>Ajouter</button>' +
        '</div>';
      }
      return '<div class="cc-product" data-id="' + esc(p.id) + '">' +
        '<h3 class="cc-product-name">' + esc(p.name) + '<span class="cc-product-price">' + euro(p.priceCents) + '</span></h3>' +
        (p.description ? '<p class="cc-product-desc">' + esc(p.description) + '</p>' : '') +
        p.options.map(o =>
          '<label class="cc-product-opt"><input type="checkbox" data-opt="' + esc(o.id) + '">' + esc(o.label) + ' +' + euro(o.cents) + '</label>'
        ).join('') +
        '<button type="button" class="cc-add" data-add aria-label="Ajouter ' + esc(p.name) + '">Ajouter</button>' +
      '</div>';
    }).join('') + '</div>';
  }

  $('#ccTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    current = b.dataset.cat;
    renderTabs();
    renderProducts();
  });

  $('#ccProducts').addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const box = btn.closest('[data-id]');
    const p = products.get(box.dataset.id);
    const choices = {};
    for (const sel of box.querySelectorAll('[data-choice]')) {
      if (!sel.value) {
        sel.setAttribute('aria-invalid', 'true');
        sel.focus();
        return;
      }
      sel.removeAttribute('aria-invalid');
      choices[sel.dataset.choice] = sel.value;
    }
    const options = [...box.querySelectorAll('[data-opt]:checked')].map(i => i.dataset.opt);
    addToCart({ id: p.id, options, choices });
    btn.textContent = 'Ajouté ✓';
    btn.classList.add('is-added');
    setTimeout(() => { btn.textContent = 'Ajouter'; btn.classList.remove('is-added'); }, 900);
  });

  /* ---------- Créneaux ---------- */
  async function loadSlots() {
    const select = $('#ccSlots');
    const msg = $('#ccSlotMsg');
    try {
      const r = await fetch('/api/slots', { cache: 'no-store' });
      const data = await r.json();
      const keep = select.value;
      const free = data.slots.filter(s => s.left > 0);
      select.innerHTML = '<option value="">' + (free.length ? 'Choisir un créneau' : 'Aucun créneau disponible') + '</option>' +
        data.slots.map(s =>
          '<option value="' + s.time + '"' + (s.left > 0 ? '' : ' disabled') + '>' + hh(s.time) + (s.left > 0 ? '' : ' (complet)') + '</option>'
        ).join('');
      if (free.some(s => s.time === keep)) select.value = keep;
      msg.hidden = !data.message;
      msg.textContent = data.message;
      submitBtn.disabled = !free.length;
    } catch (e) {
      select.innerHTML = '<option value="">Créneaux indisponibles</option>';
      msg.hidden = false;
      msg.textContent = 'Impossible de charger les créneaux. Vérifiez votre connexion.';
    }
  }

  /* ---------- Envoi ---------- */
  function showError(text, fields = {}) {
    errorBox.hidden = !text;
    errorBox.textContent = text || '';
    for (const el of form.elements) {
      if (el.name && el.name in fields) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute && el.removeAttribute('aria-invalid');
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    const missing = {};
    if (!f.firstName.trim()) missing.firstName = 1;
    if (!f.lastName.trim()) missing.lastName = 1;
    if (!f.phone.trim()) missing.phone = 1;
    if (!f.pickupTime) missing.pickupTime = 1;
    if (!cart.length) return showError('Ajoute au moins un produit à ta commande.');
    if (Object.keys(missing).length) return showError('Complète les champs en rouge.', missing);

    showError('');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi…';
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, items: cart.map(l => ({ id: l.id, qty: l.qty, options: l.options, choices: l.choices })) })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        showError(data.error || 'La commande n’a pas pu être envoyée. Réessayez.', data.errors || {});
        if (data.errors && data.errors.pickupTime) loadSlots();
        return;
      }
      cart = [];
      saveCart();
      renderCart();
      form.reset();
      $('#doneName').textContent = data.firstName;
      $('#doneRef').textContent = 'Commande #' + data.ref + ' confirmée';
      $('#doneTime').textContent = 'Retrait prévu à ' + hh(data.pickupTime);
      $('#doneTotal').textContent = 'Total : ' + euro(data.totalCents) + ', à régler au comptoir';
      $('#ccOrder').hidden = true;
      $('#ccDone').hidden = false;
      $('#ccDone').scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#ccDone').focus({ preventScroll: true });
    } catch (err) {
      showError('Connexion impossible. Vérifiez votre réseau et réessayez.');
    } finally {
      submitBtn.textContent = 'Valider la commande';
      submitBtn.disabled = false;
      loadSlots();
    }
  });

  $('#ccAgain').addEventListener('click', () => {
    $('#ccDone').hidden = true;
    $('#ccOrder').hidden = false;
    $('#commander').scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- Démarrage ---------- */
  (async function init() {
    try {
      const r = await fetch('/api/menu');
      categories = (await r.json()).categories;
      products = new Map(categories.flatMap(c => c.products.map(p => [p.id, p])));
      current = categories[0].key;
      renderTabs();
      renderProducts();
      cart = loadCart();
      renderCart();
    } catch (e) {
      $('#ccProducts').innerHTML = '<p class="cc-muted">La commande en ligne est momentanément indisponible. Appelez-nous ou passez directement au comptoir.</p>';
      submitBtn.disabled = true;
    }
    loadSlots();
    setInterval(loadSlots, 60000);
    /* la barre mobile s'efface quand le panier est déjà à l'écran */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => $('#ccBar').classList.toggle('is-off', e.isIntersecting))
        .observe($('#ccCart'));
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loadSlots(); });
  })();
})();
