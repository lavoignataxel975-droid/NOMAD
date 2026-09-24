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
  /* =========================================================
     Hero : fermeture optique qui dévoile l'intro + le bandeau
     ========================================================= */
  (function irisHero() {
    const iris = $('#iris');
    if (!iris || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('iris-on');

    const stage = $('#irisStage');
    const hero = $('.hero', stage);
    const next = $('#irisNext');
    const ring = $('#irisRing');
    const intro = $('.intro', next);
    const photo = $('.intro-photo', next);
    const marquee = $('.marquee', next);
    const [top, mid, bot] = $$('.hero-line', hero);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    /* Étapes (part du défilement de la section) */
    const CLOSE_END = .9;    // diaphragme fermé : intro + bandeau entièrement visibles

    let W, H, midW, exitTop, exitBot;

    /* L'intro + le bandeau doivent tenir dans un écran : on ajuste la photo */
    function fitNext() {
      photo.style.height = '';
      photo.style.display = '';
      next.classList.add('is-measuring');
      const avail = stage.clientHeight - marquee.offsetHeight;
      const over = intro.offsetHeight - avail;
      if (over > 0) {
        const h = photo.offsetHeight - over;
        if (h < 140) photo.style.display = 'none';
        else photo.style.height = h + 'px';
      }
      next.classList.remove('is-measuring');
    }

    function measure() {
      W = stage.clientWidth;
      H = stage.clientHeight;
      midW = mid.offsetWidth;
      const c = el => el.offsetTop + el.offsetHeight / 2;
      /* distance pour que les lignes du haut / du bas sortent du cadre */
      exitTop = top.offsetTop + top.offsetHeight;
      exitBot = H - bot.offsetTop;
      fitNext();
    }

    function frame() {
      const total = iris.offsetHeight - stage.offsetHeight;
      const hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h')) || 64;
      const p = clamp((hh - iris.getBoundingClientRect().top) / total, 0, 1);
      const rMax = Math.hypot(W / 2, H / 2) + 4;

      /* 1. Fermeture du hero rouge */
      const c = ease(clamp(p / CLOSE_END, 0, 1));
      const R1 = rMax * (1 - c);
      hero.style.clipPath = 'circle(' + R1.toFixed(1) + 'px at 50% 50%)';
      hero.style.setProperty('--vig', clamp(p / CLOSE_END * 1.4, 0, 1).toFixed(3));
      mid.style.transform = 'scale(' + Math.min(1, (2 * R1 * .82) / midW).toFixed(4) + ')';
      const f = clamp(p / (CLOSE_END * .5), 0, 1); // effacées à mi-course
      /* Celui du dessus part vers le haut, celui du dessous vers le bas */
      top.style.transform = 'translateY(' + (-exitTop * ease(f)).toFixed(1) + 'px)';
      bot.style.transform = 'translateY(' + (exitBot * ease(f)).toFixed(1) + 'px)';
      top.style.opacity = bot.style.opacity = (1 - f * f).toFixed(3);

      /* 2. L'intro + le bandeau, déjà derrière, arrivent de l'extérieur vers l'intérieur */
      next.style.transform = c >= 1 ? '' : 'scale(' + (1.12 - .12 * c).toFixed(4) + ')';

      /* Bague du diaphragme */
      const R = R1;
      ring.style.width = ring.style.height = (2 * R).toFixed(1) + 'px';
      ring.style.opacity = (p > .02 && R > 1 && R < rMax - 2) ? '1' : '0';
    }

    let queued = false;
    const request = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; frame(); });
    };
    const remeasure = () => { measure(); frame(); };
    /* Le hero est épinglé : « #top » ne suffit plus pour remonter tout en haut */
    $$('a[href="#top"]').forEach(link => link.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', remeasure);
    document.fonts && document.fonts.ready.then(remeasure);
    window.addEventListener('load', remeasure);
    remeasure();
  })();
})();
