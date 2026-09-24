/* =========================================================
   NOMAD V2 — Interactions
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icon = (id, cls = 'ico') => '<svg class="' + cls + '" aria-hidden="true"><use href="#' + id + '"/></svg>';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Coordonnées ---------- */
  $$('[data-address]').forEach(el => { el.textContent = INFO.address + ', ' + INFO.city; });
  $$('[data-address-short]').forEach(el => { el.textContent = INFO.address + ' · Montpellier'; });
  $$('[data-address-full]').forEach(el => { el.innerHTML = esc(INFO.address) + '<span>' + esc(INFO.city) + '</span>'; });
  $$('[data-maps]').forEach(el => { el.href = INFO.maps; });
  $$('[data-insta]').forEach(el => { el.href = INFO.instagram; });
  $$('[data-rating]').forEach(el => { el.textContent = INFO.rating; });
  $$('[data-reviews-count]').forEach(el => { el.textContent = INFO.reviewsCount; });
  $('#phone').innerHTML = INFO.phone
    ? '<a href="tel:' + esc(INFO.phone.replace(/\s/g, '')) + '">' + esc(INFO.phone) + '</a>'
    : 'À compléter';

  /* ---------- Prix ---------- */
  const priceNum = p => parseFloat(String(p).replace(',', '.'));
  const fmt = n => (Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')) + '€';
  function range(key) {
    const cat = MENU[key];
    if (cat.price) return cat.price;
    const nums = cat.items.map(i => priceNum(i[1]));
    const lo = Math.min(...nums), hi = Math.max(...nums);
    return lo === hi ? fmt(lo) : fmt(lo).replace('€', '') + '–' + fmt(hi);
  }
  $$('[data-range]').forEach(el => { el.textContent = range(el.dataset.range); });

  /* ---------- Bandeau ---------- */
  const tickWords = ['Sandwichs', 'Buns', 'Rolls', 'Krok'];
  const tickGroup = '<div class="ticker-group">' +
    tickWords.map(w => '<span class="ticker-word">' + w + '</span><span class="ticker-dot"></span>').join('') +
    '<span class="ticker-serif">pastrami maison</span><span class="ticker-dot"></span></div>';
  $('#ticker').innerHTML = tickGroup + tickGroup;

  /* ---------- Formats ---------- */
  $('#formats').innerHTML = FORMATS.map(f =>
    '<a class="format reveal" href="#carte" data-go="' + f.cat + '">' +
      '<div class="format-img"><img src="' + f.img + '" alt="" loading="lazy"></div>' +
      '<div class="format-body">' +
        '<div class="format-top"><h3 class="format-name">' + esc(f.name) + '</h3><span class="format-price">' + esc(range(f.cat)) + '</span></div>' +
        '<p class="format-desc">' + esc(f.desc) + '</p>' +
        '<span class="format-go">Voir les ' + esc(MENU[f.cat].label.toLowerCase()) + icon('i-arrow') + '</span>' +
      '</div>' +
    '</a>'
  ).join('');

  /* =========================================================
     LA CARTE
     ========================================================= */
  const tabsEl = $('#tabs');
  const panel = $('#menuPanel');
  const keys = Object.keys(MENU);
  let current = 'sandwichs';
  let heat = 'all';

  function spiceHtml(level) {
    if (!level) return '';
    let s = '';
    for (let i = 0; i < 5; i++) s += '<svg class="' + (i < level ? 'on' : 'off') + '" viewBox="0 0 16 22"><use href="#i-chili"/></svg>';
    return '<span class="spice" role="img" aria-label="Piquant ' + level + ' sur 5">' + s + '<span class="spice-label" aria-hidden="true">' + level + '/5</span></span>';
  }

  /* Même recette dans l'autre format (sandwich ⇄ bun) */
  const twinOf = { sandwichs: 'buns', buns: 'sandwichs' };
  function twin(key, name) {
    const other = twinOf[key];
    if (!other) return null;
    const hit = MENU[other].items.find(i => i[0] === name);
    return hit ? { key: other, price: hit[1] } : null;
  }

  const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
  const passes = lvl => heat === 'all' || (heat === 'hot' ? lvl > 0 : lvl === 0);

  function dishHtml(key, cat, [name, price, hot, lines]) {
    const base = cat.base || [];
    const ing = lines.filter(l => !base.includes(l));
    const t = twin(key, name);
    return '<article class="dish" id="dish-' + key + '-' + slug(name) + '"' + (passes(hot) ? '' : ' hidden') + '>' +
      '<div class="dish-head"><h4 class="dish-name">' + esc(name) + '</h4><span class="dish-lead" aria-hidden="true"></span><span class="dish-price">' + esc(price) + '</span></div>' +
      (ing.length ? '<p class="dish-ing">' + ing.map(l => /^supp/i.test(l) ? '<span class="extra">' + esc(l) + '</span>' : esc(l)).join(' · ') + '</p>' : '') +
      ((hot || t) ? '<div class="dish-meta">' + spiceHtml(hot) +
        (t ? '<button type="button" class="also" data-twin="' + t.key + '" data-name="' + esc(name) + '">Aussi en ' + (t.key === 'buns' ? 'bun' : 'sandwich') + ' · ' + esc(t.price) + '</button>' : '') +
      '</div>' : '') +
    '</article>';
  }

  function krokHtml(cat) {
    return '<div class="krok">' +
      '<div class="krok-steps">' +
        '<p class="krok-intro">' + esc(cat.intro) + '</p>' +
        cat.groups.map((g, gi) =>
          '<fieldset><legend><span class="n">' + (gi + 1) + '</span>' + esc(g.name) + '</legend>' +
          '<div class="krok-opts">' + g.items.map((x, xi) =>
            '<label><input type="radio" name="krok-' + gi + '" value="' + esc(x) + '"><span class="chip">' + esc(x) + '</span></label>'
          ).join('') + '</div></fieldset>'
        ).join('') +
      '</div>' +
      '<aside class="krok-sum" aria-live="polite">' +
        '<h4>Votre Krok</h4>' +
        '<ul>' + cat.groups.map((g, gi) => '<li class="is-empty" data-sum="' + gi + '"><span>' + esc(g.name) + '</span><span>À choisir</span></li>').join('') + '</ul>' +
        '<div class="krok-total"><span>Prix unique</span><strong>' + esc(cat.price) + '</strong></div>' +
        '<p class="krok-note">À commander au comptoir.</p>' +
      '</aside>' +
    '</div>';
  }

  function blockHtml(key, inAll) {
    const cat = MENU[key];
    const navy = cat.tone === 'navy';
    let body, visible = true;
    if (cat.groups) {
      body = krokHtml(cat);
      if (inAll && heat !== 'all') visible = false;
    } else {
      const shown = cat.items.filter(i => passes(i[2])).length;
      if (!shown) {
        if (inAll) visible = false;
        body = '<p class="menu-empty">Aucun produit ' + (heat === 'hot' ? 'piquant' : 'doux') + ' dans cette catégorie.</p>';
      } else {
        body = '<div class="menu-list">' + cat.items.map(i => dishHtml(key, cat, i)).join('') + '</div>';
      }
    }
    if (!visible) return '';
    const base = cat.base && cat.base.length
      ? '<p class="cat-base">Dans chaque recette&nbsp;: ' + cat.base.map(b => '<span class="pill">' + esc(b) + '</span>').join(' + ') + '</p>'
      : '';
    return '<div class="cat-block' + (navy ? ' cat-block--navy' : '') + '" aria-label="' + esc(cat.title) + '">' +
      '<div class="cat-head"><h3 class="cat-title' + (navy ? ' cat-title--navy' : '') + '">' + esc(cat.title) + '</h3>' + base + '</div>' +
      body + '</div>';
  }

  function countFor(key) {
    const cat = MENU[key];
    return cat.groups ? '' : cat.items.filter(i => passes(i[2])).length;
  }

  function renderTabs() {
    tabsEl.innerHTML = keys.concat('all').map(k => {
      const label = k === 'all' ? 'Toute la carte' : MENU[k].label;
      const n = k === 'all' ? '' : countFor(k);
      return '<button type="button" class="chip" role="tab" id="tab-' + k + '" aria-controls="menuPanel" data-cat="' + k + '" aria-selected="' + (k === current) + '" tabindex="' + (k === current ? 0 : -1) + '">' +
        esc(label) + (n !== '' ? '<span class="count">' + n + '</span>' : '') + '</button>';
    }).join('');
  }

  function renderPanel(animate) {
    panel.setAttribute('aria-labelledby', 'tab-' + current);
    panel.innerHTML = current === 'all'
      ? keys.map(k => blockHtml(k, true)).join('') || '<p class="menu-empty">Aucun produit ne correspond.</p>'
      : blockHtml(current, false);
    if (animate && !reduceMotion) {
      panel.classList.remove('is-swapping');
      void panel.offsetWidth;
      panel.classList.add('is-swapping');
    }
  }

  function select(key, opts = {}) {
    current = key;
    renderTabs();
    renderPanel(true);
    const tab = $('#tab-' + key);
    if (tab) {
      if (opts.focus) tab.focus();
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  tabsEl.addEventListener('click', e => {
    const t = e.target.closest('[data-cat]');
    if (t) select(t.dataset.cat);
  });
  tabsEl.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const all = keys.concat('all');
    const i = all.indexOf(current);
    select(all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length], { focus: true });
  });

  $$('[data-heat]').forEach(b => b.addEventListener('click', () => {
    heat = b.dataset.heat;
    $$('[data-heat]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderTabs();
    renderPanel(true);
  }));

  /* Aller à la même recette dans l'autre format */
  panel.addEventListener('click', e => {
    const b = e.target.closest('[data-twin]');
    if (!b) return;
    if (heat !== 'all') $('[data-heat="all"]').click();
    select(b.dataset.twin);
    const target = $('#dish-' + b.dataset.twin + '-' + slug(b.dataset.name));
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      target.classList.add('is-flash');
    }
  });

  /* Composeur Krok */
  panel.addEventListener('change', e => {
    const r = e.target;
    if (!r.name || !r.name.startsWith('krok-')) return;
    const li = $('[data-sum="' + r.name.slice(5) + '"]', panel);
    if (li) { li.lastElementChild.textContent = r.value; li.classList.remove('is-empty'); }
  });

  /* Cartes format → onglet */
  $('#formats').addEventListener('click', e => {
    const a = e.target.closest('[data-go]');
    if (a) select(a.dataset.go);
  });

  renderTabs();
  renderPanel(false);

  /* ---------- Fait maison ---------- */
  $('#homemade').innerHTML = HOMEMADE.map(h =>
    '<li><strong>' + esc(h.name) + '</strong><span>' + esc(h.text) + '</span></li>'
  ).join('');

  /* ---------- Photos ---------- */
  $('#bento').innerHTML = PHOTOS.map((p, i) =>
    '<button type="button" class="shot reveal" data-lb="' + i + '" data-cap="' + esc(p.alt) + '" aria-label="Agrandir : ' + esc(p.alt) + '">' +
      '<img src="' + p.src + '" alt="' + esc(p.alt) + '" loading="lazy">' +
    '</button>'
  ).join('');

  /* ---------- Avis ---------- */
  const stars = '<span class="stars" role="img" aria-label="5 étoiles sur 5">' + icon('i-star').repeat(5) + '</span>';
  $$('.score .stars').forEach(el => { el.innerHTML = icon('i-star').repeat(5); });
  $('#reviews').innerHTML = REVIEWS.map(r =>
    '<figure class="review reveal">' + stars +
      '<blockquote>« ' + esc(r.text) + ' »</blockquote>' +
      '<figcaption><span class="avatar" aria-hidden="true">' + esc(r.name.charAt(0)) + '</span>' + esc(r.name) + '</figcaption>' +
    '</figure>'
  ).join('');

  /* ---------- Horaires + statut ouvert / fermé ---------- */
  const today = new Date().getDay();
  $('#hours').innerHTML = HOURS.map(h =>
    '<li' + ((h.days || []).includes(today) ? ' class="is-today"' : '') + '><span>' + esc(h.day) + '</span><span>' + esc(h.time) + '</span></li>'
  ).join('');

  (function status() {
    const el = $('#status');
    const h = HOURS.find(x => (x.days || []).includes(today));
    if (!h) return;
    if (/ferm/i.test(h.time)) { el.textContent = 'Fermé aujourd’hui'; el.className = 'status is-closed'; el.hidden = false; return; }
    const re = /(\d{1,2})h(\d{2})?\s*[–-]\s*(\d{1,2})h(\d{2})?/g;
    const ranges = [];
    let m;
    while ((m = re.exec(h.time))) ranges.push([+m[1] * 60 + +(m[2] || 0), +m[3] * 60 + +(m[4] || 0)]);
    if (!ranges.length) return; // horaires pas encore renseignés : on n'affiche rien
    const d = new Date(), now = d.getHours() * 60 + d.getMinutes();
    const open = ranges.find(([a, b]) => now >= a && now < b);
    const pad = n => String(n % 60).padStart(2, '0');
    const hm = n => Math.floor(n / 60) + 'h' + pad(n);
    if (open) { el.textContent = 'Ouvert · jusqu’à ' + hm(open[1]); el.className = 'status is-open'; }
    else {
      const next = ranges.find(([a]) => a > now);
      el.textContent = next ? 'Fermé · ouvre à ' + hm(next[0]) : 'Fermé';
      el.className = 'status is-closed';
    }
    el.hidden = false;
  })();

  /* ---------- Carte Google (chargée à la demande) ---------- */
  $('#mapLoad').addEventListener('click', () => {
    $('#map').innerHTML = '<iframe src="' + INFO.mapEmbed + '" title="Plan d’accès à NOMAD" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
  });

  /* =========================================================
     Header, menu plein écran, scrollspy, dock
     ========================================================= */
  const hdr = $('#hdr');
  const menuBtn = $('#menuBtn');
  const sheet = $('#sheet');
  const dock = $('#dock');

  function setSheet(open) {
    sheet.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menuBtn.innerHTML = icon(open ? 'i-x' : 'i-menu');
    document.body.classList.toggle('is-locked', open);
  }
  menuBtn.addEventListener('click', () => setSheet(sheet.hidden));
  $$('a', sheet).forEach(a => a.addEventListener('click', () => setSheet(false)));
  window.matchMedia('(min-width: 1024px)').addEventListener('change', e => { if (e.matches) setSheet(false); });

  const onScroll = () => hdr.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    const links = $$('.hdr-nav a');
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.dataset.spy === en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['carte', 'maison', 'photos', 'avis', 'infos'].forEach(id => spy.observe(document.getElementById(id)));

    /* Dock mobile : visible après le hero, masqué sur la section Infos (doublon) */
    const seen = { iris: true, hero: true, infos: false };
    const dockIo = new IntersectionObserver(entries => {
      entries.forEach(en => { seen[en.target.dataset.dock] = en.isIntersecting; });
      dock.classList.toggle('is-on', !seen.iris && !seen.hero && !seen.infos);
    });
    const heroEl = $('.hero'), infosEl = $('#infos');
    heroEl.dataset.dock = 'hero'; infosEl.dataset.dock = 'infos';
    dockIo.observe(heroEl); dockIo.observe(infosEl);
    const irisEl = $('#iris'); irisEl.dataset.dock = 'iris'; dockIo.observe(irisEl);

    /* Apparitions */
    if (!reduceMotion) {
      $$('.sec-head, .maison-inner, .info-card, .map').forEach(el => el.classList.add('reveal'));
      const rev = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); rev.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      $$('.reveal').forEach(el => rev.observe(el));
    } else {
      $$('.reveal').forEach(el => el.classList.add('is-in'));
    }
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-in'));
    dock.classList.add('is-on');
  }

  /* =========================================================
     Hero V1 : fermeture optique sur le « NOMAD » du milieu
     ========================================================= */
  (function irisHero() {
    const iris = $('#iris');
    if (!iris || reduceMotion) return;
    const sticky = $('.iris-sticky', iris);
    const panel = $('#irisPanel');
    const ring = $('#irisRing');
    const top = $('[data-iris="top"]'), mid = $('[data-iris="mid"]'), bot = $('[data-iris="bot"]');
    const behind = $('.iris-behind', iris), hint = $('.iris-hint', iris);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    let W, H, midW, gapTop, gapBot;

    function measure() {
      W = sticky.clientWidth; H = sticky.clientHeight;
      midW = mid.offsetWidth;
      const c = el => el.offsetTop + el.offsetHeight / 2;
      gapTop = c(mid) - c(top);
      gapBot = c(bot) - c(mid);
    }

    function frame() {
      const total = iris.offsetHeight - sticky.offsetHeight;
      const p = clamp((hdr.offsetHeight - iris.getBoundingClientRect().top) / total, 0, 1);
      const e = ease(clamp(p / .86, 0, 1)); // diaphragme fermé à 86 %, puis le texte apparaît
      const rMax = Math.hypot(W / 2, H / 2) + 4;
      const R = rMax * (1 - e);

      panel.style.clipPath = 'circle(' + R.toFixed(1) + 'px at 50% 50%)';
      panel.style.setProperty('--vig', clamp(p * 1.6, 0, 1).toFixed(3));

      /* Le « NOMAD » du milieu rétrécit pour rester dans l'ouverture */
      const s = Math.min(1, (2 * R * .82) / midW);
      mid.style.transform = 'scale(' + s.toFixed(4) + ')';

      /* Les deux autres glissent vers le centre et s'effacent */
      const f = clamp(p * 3, 0, 1);
      top.style.transform = 'translateY(' + (gapTop * ease(f)).toFixed(1) + 'px) scale(' + (1 - .3 * f).toFixed(3) + ')';
      bot.style.transform = 'translateY(' + (-gapBot * ease(f)).toFixed(1) + 'px) scale(' + (1 - .3 * f).toFixed(3) + ')';
      top.style.opacity = bot.style.opacity = (1 - f).toFixed(3);

      /* Bague du diaphragme */
      ring.style.width = ring.style.height = (2 * R).toFixed(1) + 'px';
      ring.style.opacity = (p > .02 && R > 1 && R < Math.max(W, H) / 2 + 40) ? '1' : '0';

      behind.style.opacity = clamp((p - .86) / .12, 0, 1).toFixed(3);
      hint.style.opacity = p > .03 ? '0' : '1';
    }

    let queued = false;
    const request = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; frame(); }); } };
    const remeasure = () => { measure(); frame(); };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', remeasure);
    document.fonts && document.fonts.ready.then(remeasure);
    remeasure();
  })();

  /* =========================================================
     Lightbox (clavier, boutons, glisser au doigt)
     ========================================================= */
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCount = $('#lbCount');
  let idx = null, opener = null;

  function show(i) {
    idx = (i + PHOTOS.length) % PHOTOS.length;
    lbImg.src = PHOTOS[idx].src;
    lbImg.alt = PHOTOS[idx].alt;
    lbCap.textContent = PHOTOS[idx].alt;
    lbCount.textContent = (idx + 1) + ' / ' + PHOTOS.length;
  }
  function openLb(i, from) {
    opener = from;
    show(i);
    lb.hidden = false;
    document.body.classList.add('is-locked');
    $('#lbClose').focus();
  }
  function closeLb() {
    idx = null;
    lb.hidden = true;
    document.body.classList.remove('is-locked');
    if (opener) opener.focus();
  }

  $('#bento').addEventListener('click', e => {
    const b = e.target.closest('[data-lb]');
    if (b) openLb(Number(b.dataset.lb), b);
  });
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => show(idx - 1));
  $('#lbNext').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });

  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  document.addEventListener('keydown', e => {
    if (idx !== null) {
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'Tab') {
        const f = $$('.lb-btn', lb);
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    } else if (e.key === 'Escape' && !sheet.hidden) {
      setSheet(false);
      menuBtn.focus();
    }
  });
})();
