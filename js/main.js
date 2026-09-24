/* =========================================================
   NOMAD — Interactions
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const header = $('#siteHeader');
  const burger = $('#burger');
  const carteOverlay = $('#carteOverlay');
  const galleryOverlay = $('#galleryOverlay');
  const lightbox = $('#lightbox');
  const lbImg = $('#lbImg');

  /* ---------- Rendu : piments ---------- */
  function chili(fill, stroke) {
    return '<svg width="16" height="22" viewBox="0 0 16 22" aria-hidden="true">' +
      '<path d="M9 2.5 C9 1.5 10 1 11 1.3" fill="none" stroke="#2E7D32" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M6.5 4.5 C8 3.4 11 3.6 11.6 5.8 C12.4 9 11 14 7.8 18 C6.6 19.5 4.6 20.8 3.2 20.6 C4.8 18.6 5.6 16 5.5 12.5 C5.4 9.5 5.2 5.6 6.5 4.5 Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M6.8 4.6 C8 3.2 10.4 3.4 11.4 4.9" fill="none" stroke="#2E7D32" stroke-width="1.8" stroke-linecap="round"/>' +
      '</svg>';
  }

  function spiceHtml(level, color) {
    if (!level) return '';
    let s = '';
    for (let i = 0; i < 5; i++) s += chili(i < level ? color : 'transparent', color);
    return '<span class="spice" title="Niveau de piquant : ' + level + '/5" role="img" aria-label="Piquant ' + level + ' sur 5">' + s + '</span>';
  }

  /* ---------- Rendu : catégorie de la carte ---------- */
  function categoryBody(cat) {
    if (cat.groups) {
      return '<div class="krok">' +
        '<p class="krok-intro">' + esc(cat.intro) + ' <strong>' + esc(cat.price) + '</strong></p>' +
        '<div class="krok-grid">' +
        cat.groups.map(g =>
          '<div class="krok-group"><span class="krok-name">' + esc(g.name) + '</span>' +
          '<ul class="krok-list">' + g.items.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>'
        ).join('') +
        '</div></div>';
    }
    return '<div class="menu-grid">' +
      cat.items.map(([name, price, hot, lines]) =>
        '<article class="menu-item">' +
          '<div class="menu-item-head">' +
            '<h3 class="menu-name" style="margin:0">' + esc(name) + '</h3>' +
            spiceHtml(hot, cat.color) +
            '<span class="menu-price">' + esc(price) + '</span>' +
          '</div>' +
          (lines.length ? '<ul class="menu-lines">' + lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' : '') +
        '</article>'
      ).join('') +
      '</div>';
  }

  /* ---------- 4. Carte à onglets ---------- */
  const carteSection = $('#carte');
  const tabsEl = $('#carteTabs');
  const titleEl = $('#carteTitle');
  const bodyEl = $('#carteBody');

  tabsEl.innerHTML = Object.entries(MENU).map(([key, cat]) =>
    '<button type="button" class="tab" role="tab" data-cat="' + key + '" style="--c:' + cat.color + '" aria-selected="false">' + esc(cat.label) + '</button>'
  ).join('');

  function selectCat(key) {
    const cat = MENU[key];
    carteSection.style.setProperty('--accent', cat.color);
    titleEl.textContent = cat.title;
    bodyEl.innerHTML = categoryBody(cat);
    $$('.tab', tabsEl).forEach(t => t.setAttribute('aria-selected', String(t.dataset.cat === key)));
  }
  tabsEl.addEventListener('click', e => {
    const t = e.target.closest('.tab');
    if (t) selectCat(t.dataset.cat);
  });
  tabsEl.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = $$('.tab', tabsEl);
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.focus();
    selectCat(next.dataset.cat);
  });
  selectCat('sandwichs');

  /* ---------- Page Carte (toutes catégories) ---------- */
  $('#carteAll').innerHTML = Object.values(MENU).map(cat =>
    '<section class="carte-cat" style="--accent:' + cat.color + '">' +
      '<div class="title-block"><h2 class="section-title">' + esc(cat.title) + '</h2><div class="rule"></div></div>' +
      categoryBody(cat) +
    '</section>'
  ).join('');

  /* ---------- 3. Bandeau défilant ---------- */
  const words = ['Sandwichs', 'Buns', 'Rolls', 'Krok à composer'];
  const marqueeGroup = '<div class="marquee-group">' +
    words.map(w => '<span class="marquee-word">' + esc(w) + '</span><span class="marquee-pill">Pastrami maison</span>').join('') +
    '</div>';
  $('#marqueeTrack').innerHTML = marqueeGroup + marqueeGroup;

  /* ---------- 5. Carrousel photos ---------- */
  const photoGroup = hidden => '<div class="photo-group"' + (hidden ? ' aria-hidden="true"' : '') + '>' +
    PHOTOS.map(p => '<img src="' + p.src + '" alt="' + (hidden ? '' : esc(p.alt)) + '" loading="lazy" width="600" height="800">').join('') +
    '</div>';
  $('#photoTrack').innerHTML = photoGroup(false) + photoGroup(true);

  /* ---------- 6. Avis ---------- */
  $('#avisGrid').innerHTML = REVIEWS.map(r =>
    '<figure class="review">' +
      '<span class="stars" aria-label="5 étoiles sur 5">★★★★★</span>' +
      '<blockquote>« ' + esc(r.text) + ' »</blockquote>' +
      '<figcaption>' + esc(r.name) + '</figcaption>' +
    '</figure>'
  ).join('');

  /* ---------- 7. Horaires ---------- */
  $('#hours').innerHTML = HOURS.map(h =>
    '<div class="hours-row"><span>' + esc(h.day) + '</span><span>' + esc(h.time) + '</span></div>'
  ).join('');

  /* ---------- Page Photos (quinconce) ---------- */
  const ratios = ['4/5', '3/4', '5/4', '4/5', '1/1'];
  const galleryItem = (p, i) =>
    '<button type="button" data-lb="' + i + '" aria-label="Agrandir : ' + esc(p.alt) + '">' +
      '<img src="' + p.src + '" alt="' + esc(p.alt) + '" loading="lazy" style="aspect-ratio:' + ratios[i % ratios.length] + '">' +
    '</button>';
  $('#galleryLeft').innerHTML = PHOTOS.map((p, i) => i % 2 === 0 ? galleryItem(p, i) : '').join('');
  $('#galleryRight').innerHTML = PHOTOS.map((p, i) => i % 2 === 1 ? galleryItem(p, i) : '').join('');

  /* =========================================================
     Header : couleur dynamique + hauteur
     ========================================================= */
  let page = null; // null | 'carte' | 'gallery'

  function updateHeader() {
    const hh = header.offsetHeight;
    document.documentElement.style.setProperty('--hdr-h', hh + 'px');

    let light;
    if (page === 'carte') light = false;
    else if (page === 'gallery') light = true;
    else {
      const y = hh + 1;
      light = $$('[data-hdr="red"]').some(el => {
        const r = el.getBoundingClientRect();
        return r.top <= y && r.bottom > y;
      });
    }
    header.classList.toggle('is-light', light);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; updateHeader(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if ('ResizeObserver' in window) new ResizeObserver(onScroll).observe(header);
  document.fonts && document.fonts.ready.then(updateHeader);
  updateHeader();

  /* ---------- Menu burger (mobile) ---------- */
  function setMenu(open) {
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }
  burger.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));

  /* =========================================================
     Pages overlay (Carte / Photos) — mutuellement exclusives
     ========================================================= */
  function openPage(name) {
    page = name;
    carteOverlay.hidden = name !== 'carte';
    galleryOverlay.hidden = name !== 'gallery';
    (name === 'carte' ? carteOverlay : galleryOverlay).scrollTop = 0;
    document.body.classList.add('is-locked');
    closeLightbox();
    setMenu(false);
    updateHeader();
  }
  function closePages() {
    if (!page) return;
    page = null;
    carteOverlay.hidden = true;
    galleryOverlay.hidden = true;
    document.body.classList.remove('is-locked');
    closeLightbox();
    updateHeader();
  }

  $$('[data-open]').forEach(b => b.addEventListener('click', () => openPage(b.dataset.open)));
  $$('[data-close-pages]').forEach(a => a.addEventListener('click', () => { closePages(); setMenu(false); }));

  /* =========================================================
     Lightbox
     ========================================================= */
  let lb = null;
  function showPhoto(i) {
    lb = (i + PHOTOS.length) % PHOTOS.length;
    lbImg.src = PHOTOS[lb].src;
    lbImg.alt = PHOTOS[lb].alt;
    lightbox.hidden = false;
  }
  function closeLightbox() {
    lb = null;
    lightbox.hidden = true;
  }

  galleryOverlay.addEventListener('click', e => {
    const b = e.target.closest('[data-lb]');
    if (b) showPhoto(Number(b.dataset.lb));
  });
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  $('#lbPrev').addEventListener('click', () => showPhoto(lb - 1));
  $('#lbNext').addEventListener('click', () => showPhoto(lb + 1));

  document.addEventListener('keydown', e => {
    if (lb !== null) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showPhoto(lb - 1);
      else if (e.key === 'ArrowRight') showPhoto(lb + 1);
    } else if (e.key === 'Escape') {
      if (page) closePages();
      else setMenu(false);
    }
  });
})();
