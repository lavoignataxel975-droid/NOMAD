/* =========================================================
   NOMAD — Serveur : site public + API Click & Collect + back-office
   Aucune dépendance : node server/server.js
   ========================================================= */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const config = require('./config');
const db = require('./db');

const ROOT = path.join(__dirname, '..');
const ADMIN_DIR = path.join(ROOT, 'admin');

/* ---------- Heure de Paris ----------
   NOMAD_FAKE_NOW="2026-09-26T11:42" simule une heure (tests uniquement). */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fakeStart = Date.now();
const FAKE = process.env.NOMAD_FAKE_NOW && /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(process.env.NOMAD_FAKE_NOW);

function parisNow() {
  if (FAKE) {
    const minutes = +FAKE[2] * 60 + +FAKE[3] + Math.floor((Date.now() - fakeStart) / 60000);
    return { day: FAKE[1], minutes, dow: new Date(FAKE[1] + 'T12:00:00Z').getUTCDay() };
  }
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short'
  }).formatToParts(new Date()).map(p => [p.type, p.value]));
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: +parts.hour * 60 + +parts.minute,
    dow: WEEKDAYS.indexOf(parts.weekday)
  };
}

const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fmtMin = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

/* ---------- Carte : lue depuis js/data.js (même source que le site) ---------- */
const DATA_FILE = path.join(ROOT, 'js', 'data.js');
let catalog = null;
let catalogMtime = 0;

const priceCents = s => Math.round(parseFloat(String(s).replace(/[^\d,.]/g, '').replace(',', '.')) * 100);
const OPTION_RE = /^Supp\.?\s*(.+?)\s*\+\s*(\d+(?:[.,]\d+)?)\s*€$/i;

function loadCatalog() {
  const mtime = fs.statSync(DATA_FILE).mtimeMs;
  if (catalog && mtime === catalogMtime) return catalog;
  const { MENU } = vm.runInNewContext(fs.readFileSync(DATA_FILE, 'utf8') + '\n;({ MENU })', {});
  const categories = [];
  const products = new Map();
  for (const [key, cat] of Object.entries(MENU)) {
    const c = { key, label: cat.label, products: [] };
    if (cat.groups) {
      const p = {
        id: key, cat: cat.label, name: cat.label, priceCents: priceCents(cat.price),
        description: cat.intro || '', options: [],
        choices: cat.groups.map(g => ({ name: g.name, items: g.items.slice() }))
      };
      c.products.push(p);
      products.set(p.id, p);
    } else {
      cat.items.forEach(([name, price, spice, ingredients], i) => {
        const options = [];
        const desc = [];
        for (const ing of ingredients) {
          const m = OPTION_RE.exec(ing);
          if (m) options.push({ id: 'opt' + options.length, label: 'Supp. ' + m[1], cents: priceCents(m[2]) });
          else desc.push(ing);
        }
        const p = { id: key + '-' + i, cat: cat.label, name, priceCents: priceCents(price), spice, description: desc.join(', '), options, choices: [] };
        c.products.push(p);
        products.set(p.id, p);
      });
    }
    categories.push(c);
  }
  catalog = { categories, products };
  catalogMtime = mtime;
  return catalog;
}

/* ---------- Créneaux de retrait ---------- */
function slots(now = parisNow()) {
  const ranges = config.hours[now.dow] || [];
  const earliest = now.minutes + config.prepMinutes;
  const counts = db.slotCounts(now.day);
  const list = [];
  for (const [open, close] of ranges) {
    for (let t = toMin(open); t <= toMin(close) - config.lastSlotBeforeClose; t += config.slotMinutes) {
      if (t < earliest) continue;
      const time = fmtMin(t);
      list.push({ time, left: Math.max(0, config.maxPerSlot - (counts[time] || 0)) });
    }
  }
  let message = '';
  if (!ranges.length) message = 'Le Click & Collect est fermé aujourd’hui.';
  else if (!list.length) message = 'Plus de créneau de retrait disponible aujourd’hui.';
  else if (!list.some(s => s.left > 0)) message = 'Tous les créneaux sont complets pour aujourd’hui.';
  return { day: now.day, slots: list, message };
}

/* ---------- Validation d'une commande ---------- */
const NAME_RE = /^[\p{L}][\p{L}' .-]{0,49}$/u;

function normPhone(raw) {
  let d = String(raw || '').replace(/[\s.\-()]/g, '');
  if (/^\+33[1-9]\d{8}$/.test(d)) d = '0' + d.slice(3);
  if (/^0033[1-9]\d{8}$/.test(d)) d = '0' + d.slice(4);
  if (!/^0[1-9]\d{8}$/.test(d)) return null;
  return d.replace(/(\d{2})(?=\d)/g, '$1 ');
}

function buildOrder(body) {
  const errors = {};
  const firstName = String(body.firstName || '').trim().replace(/\s+/g, ' ');
  const lastName = String(body.lastName || '').trim().replace(/\s+/g, ' ');
  const phone = normPhone(body.phone);
  if (!NAME_RE.test(firstName)) errors.firstName = 'Prénom invalide.';
  if (!NAME_RE.test(lastName)) errors.lastName = 'Nom invalide.';
  if (!phone) errors.phone = 'Numéro de téléphone invalide (ex. 06 12 34 56 78).';

  const { products } = loadCatalog();
  const lines = Array.isArray(body.items) ? body.items : [];
  const items = [];
  let totalCents = 0;
  let totalQty = 0;
  if (!lines.length || lines.length > 30) errors.items = 'Votre panier est vide.';
  for (const l of lines) {
    const p = products.get(l && l.id);
    const qty = Number(l && l.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 20) { errors.items = 'Un article du panier est invalide.'; break; }
    const optIds = Array.isArray(l.options) ? [...new Set(l.options)] : [];
    const options = optIds.map(id => p.options.find(o => o.id === id));
    if (options.some(o => !o)) { errors.items = 'Une option est invalide.'; break; }
    const choices = {};
    for (const g of p.choices) {
      const v = l.choices && l.choices[g.name];
      if (!g.items.includes(v)) { errors.items = 'Composez votre ' + p.name + ' : choisissez ' + g.name.toLowerCase() + '.'; break; }
      choices[g.name] = v;
    }
    if (errors.items) break;
    const unitCents = p.priceCents + options.reduce((s, o) => s + o.cents, 0);
    const lineCents = unitCents * qty;
    items.push({
      id: p.id, cat: p.cat, name: p.name, qty, unitCents, lineCents,
      options: options.map(o => ({ label: o.label, cents: o.cents })), choices
    });
    totalCents += lineCents;
    totalQty += qty;
  }
  if (totalQty > 40) errors.items = 'Pour plus de 40 articles, appelez-nous directement.';

  const now = parisNow();
  const slot = slots(now).slots.find(s => s.time === body.pickupTime);
  if (!slot) errors.pickupTime = 'Choisissez un créneau de retrait disponible.';
  else if (slot.left <= 0) errors.pickupTime = 'Ce créneau est complet, choisissez-en un autre.';

  if (Object.keys(errors).length) return { errors };
  return { order: { day: now.day, firstName, lastName, phone, items, totalCents, pickupTime: slot.time } };
}

/* ---------- Limitation simple des abus (par adresse IP) ---------- */
const hits = new Map();
function tooMany(key, max, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
}
setInterval(() => { hits.clear(); db.sessions.purge(); }, 60 * 60 * 1000).unref();

/* ---------- Authentification du back-office ---------- */
const COOKIE = 'nomad_admin';
const sha = s => crypto.createHash('sha256').update(String(s)).digest();

function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
const isAdmin = req => db.sessions.valid(cookies(req)[COOKIE]);
const cookieAttrs = maxAge => `Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}` + (config.secureCookie ? '; Secure' : '');

/* ---------- Outils HTTP ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8'
};
const PRIVATE_HEADERS = {
  'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow',
  'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(body);
}
const json = (res, status, data, headers = {}) =>
  send(res, status, JSON.stringify(data), { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store', ...headers });
const redirect = (res, to) => send(res, 302, '', { Location: to, 'Cache-Control': 'no-store' });

function readJson(req) {
  return new Promise((resolve, reject) => {
    if (!/^application\/json\b/.test(req.headers['content-type'] || '')) return reject(Object.assign(new Error('JSON attendu'), { status: 415 }));
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > 32 * 1024) { reject(Object.assign(new Error('Requête trop volumineuse'), { status: 413 })); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(Object.assign(new Error('JSON invalide'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

/* Refuse les requêtes d'écriture venant d'un autre site */
function sameOrigin(req) {
  const origin = req.headers.origin;
  return !origin || origin === 'http://' + req.headers.host || origin === 'https://' + req.headers.host;
}

/* Le navigateur revérifie chaque fichier (Cache-Control: no-cache) :
   une modification du site est visible dès le rechargement, sinon réponse 304 légère. */
function serveFile(res, file, headers = {}, req = null) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Page introuvable', { 'Content-Type': MIME['.txt'] });
    const etag = '"' + st.size.toString(36) + '-' + Math.floor(st.mtimeMs).toString(36) + '"';
    const cache = { 'Cache-Control': 'no-cache', ETag: etag, ...headers };
    if (req && req.headers['if-none-match'] === etag) return send(res, 304, '', cache);
    res.writeHead(200, {
      ...cache,
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size, 'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(file).pipe(res);
  });
}

/* Fichiers du site public : jamais le serveur, la base, git ni le back-office */
const BLOCKED = /^\/(server|data|admin|node_modules)(\/|$)|\/\.|\.(command|md|db|sqlite|log)$/i;
function serveStatic(req, res, pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch { return send(res, 400, 'Requête invalide'); }
  if (p.includes('\0') || BLOCKED.test(p)) return send(res, 404, 'Page introuvable', { 'Content-Type': MIME['.txt'] });
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT + path.sep)) return send(res, 404, 'Page introuvable');
  serveFile(res, file, {}, req);
}

/* ---------- API publique ---------- */
async function publicApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/menu') {
    const { categories } = loadCatalog();
    return json(res, 200, { categories });
  }
  if (req.method === 'GET' && pathname === '/api/slots') return json(res, 200, slots());
  if (req.method === 'POST' && pathname === '/api/orders') {
    if (!sameOrigin(req)) return json(res, 403, { error: 'Origine refusée.' });
    const ip = req.socket.remoteAddress;
    if (tooMany('order:' + ip, 5, 15 * 60 * 1000)) return json(res, 429, { error: 'Trop de commandes en peu de temps. Réessayez dans quelques minutes ou appelez-nous.' });
    const body = await readJson(req);
    if (body.website) return json(res, 400, { error: 'Commande refusée.' });   // champ piège anti-robots
    const { errors, order } = buildOrder(body);
    if (errors) return json(res, 422, { error: Object.values(errors)[0], errors });
    const saved = db.createOrder(order, config.maxPerSlot);
    if (!saved) return json(res, 409, { error: 'Ce créneau vient d’être complet, choisissez-en un autre.', errors: { pickupTime: 'complet' } });
    console.log(`[commande] #${saved.ref} — retrait ${saved.pickupTime} — ${(saved.totalCents / 100).toFixed(2)} €`);
    /* Côté public : uniquement le numéro, l'heure de retrait et le total */
    return json(res, 201, { ref: saved.ref, pickupTime: saved.pickupTime, totalCents: saved.totalCents, firstName: saved.firstName });
  }
  return json(res, 404, { error: 'Introuvable' });
}

/* ---------- API du back-office ---------- */
function withFlags(o, now) {
  const delta = o.day === now.day ? toMin(o.pickupTime) - now.minutes : (o.day < now.day ? -Infinity : Infinity);
  const active = ['NOUVELLE', 'EN_PREPARATION', 'PRETE'].includes(o.status);
  return { ...o, minutesLeft: Number.isFinite(delta) ? delta : null, late: active && delta < 0, soon: active && delta >= 0 && delta <= config.soonMinutes };
}

async function adminApi(req, res, pathname, url) {
  if (req.method === 'POST' && pathname === '/api/admin/login') {
    if (!sameOrigin(req)) return json(res, 403, { error: 'Origine refusée.' });
    if (tooMany('login:' + req.socket.remoteAddress, 10, 15 * 60 * 1000)) return json(res, 429, { error: 'Trop de tentatives. Réessayez dans 15 minutes.' });
    const { username, password } = await readJson(req);
    const userOk = crypto.timingSafeEqual(sha(String(username || '').trim().toLowerCase()), sha(config.adminUser.toLowerCase()));
    const passOk = crypto.timingSafeEqual(sha(password || ''), sha(config.adminPassword));
    if (!userOk || !passOk) return json(res, 401, { error: 'Identifiant ou mot de passe incorrect.' });
    const token = crypto.randomBytes(32).toString('hex');
    const maxAge = config.sessionDays * 86400;
    db.sessions.add(token, Date.now() + maxAge * 1000);
    return json(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=${token}; ${cookieAttrs(maxAge)}` });
  }
  if (req.method === 'POST' && pathname === '/api/admin/logout') {
    db.sessions.remove(cookies(req)[COOKIE] || '');
    return json(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; ${cookieAttrs(0)}` });
  }

  if (!isAdmin(req)) return json(res, 401, { error: 'Connexion requise.' }, PRIVATE_HEADERS);
  if (req.method !== 'GET' && !sameOrigin(req)) return json(res, 403, { error: 'Origine refusée.' });

  if (req.method === 'GET' && pathname === '/api/admin/orders') {
    const now = parisNow();
    return json(res, 200, {
      day: now.day, now: fmtMin(now.minutes), soonMinutes: config.soonMinutes, pollSeconds: config.pollSeconds,
      orders: db.today(now.day).map(o => withFlags(o, now)),
      older: db.olderOpen(now.day).map(o => withFlags(o, now))
    }, PRIVATE_HEADERS);
  }
  if (req.method === 'GET' && pathname === '/api/admin/archive') {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('day') || '') ? url.searchParams.get('day') : '';
    return json(res, 200, { orders: db.archive({ search: (url.searchParams.get('q') || '').slice(0, 60), day }) }, PRIVATE_HEADERS);
  }

  let m = /^\/api\/admin\/orders\/(\d+)\/status$/.exec(pathname);
  if (req.method === 'POST' && m) {
    const o = db.get(Number(m[1]));
    if (!o) return json(res, 404, { error: 'Commande introuvable.' }, PRIVATE_HEADERS);
    const { status } = await readJson(req);
    if (!db.STATUSES.includes(status)) return json(res, 400, { error: 'Statut inconnu.' }, PRIVATE_HEADERS);
    if (status === 'ARCHIVEE' && o.status !== 'TERMINEE') return json(res, 409, { error: 'Seule une commande terminée peut être archivée.' }, PRIVATE_HEADERS);
    if (o.status === 'ARCHIVEE' && status !== 'TERMINEE') return json(res, 409, { error: 'Une commande archivée ne peut être que restaurée (terminée).' }, PRIVATE_HEADERS);
    return json(res, 200, { order: withFlags(db.setStatus(o.id, status), parisNow()) }, PRIVATE_HEADERS);
  }

  m = /^\/api\/admin\/orders\/(\d+)$/.exec(pathname);
  if (req.method === 'DELETE' && m) {
    const o = db.get(Number(m[1]));
    if (!o) return json(res, 404, { error: 'Commande introuvable.' }, PRIVATE_HEADERS);
    const { confirm } = await readJson(req);
    if (o.status !== 'ARCHIVEE') return json(res, 409, { error: 'Archivez la commande avant de la supprimer.' }, PRIVATE_HEADERS);
    if (String(confirm || '').replace(/^#/, '') !== o.ref) return json(res, 400, { error: 'Confirmation incorrecte : tapez le numéro exact de la commande.' }, PRIVATE_HEADERS);
    db.deleteArchived(o.id);
    console.log(`[suppression] commande #${o.ref} du ${o.day}`);
    return json(res, 200, { ok: true }, PRIVATE_HEADERS);
  }
  return json(res, 404, { error: 'Introuvable' }, PRIVATE_HEADERS);
}

/* ---------- Pages du back-office ---------- */
const ADMIN_PAGES = {
  '/admin/orders': 'orders.html',
  '/admin/orders/archive': 'archive.html'
};

function adminPage(req, res, pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/admin') return redirect(res, '/admin/orders');
  if (clean === '/admin/login') {
    if (isAdmin(req)) return redirect(res, '/admin/orders');
    return serveFile(res, path.join(ADMIN_DIR, 'login.html'), PRIVATE_HEADERS);
  }
  if (ADMIN_PAGES[clean]) {
    if (!isAdmin(req)) return redirect(res, '/admin/login');
    return serveFile(res, path.join(ADMIN_DIR, ADMIN_PAGES[clean]), PRIVATE_HEADERS);
  }
  /* styles et scripts du back-office (aucune donnée dedans) */
  const asset = /^\/admin\/assets\/([\w-]+\.(css|js))$/.exec(pathname);
  if (asset) return serveFile(res, path.join(ADMIN_DIR, 'assets', asset[1]), PRIVATE_HEADERS);
  return send(res, 404, 'Page introuvable', { 'Content-Type': MIME['.txt'], ...PRIVATE_HEADERS });
}

/* ---------- Routeur ---------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const { pathname } = url;
  try {
    if (pathname.startsWith('/api/admin/')) return await adminApi(req, res, pathname, url);
    if (pathname.startsWith('/api/')) return await publicApi(req, res, pathname);
    if (pathname === '/admin' || pathname.startsWith('/admin/')) return adminPage(req, res, pathname);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Méthode non autorisée');
    return serveStatic(req, res, pathname);
  } catch (e) {
    if (e.status) return json(res, e.status, { error: e.message });
    console.error(e);
    return json(res, 500, { error: 'Erreur du serveur. Réessayez ou appelez-nous.' });
  }
});

server.listen(config.port, () => {
  console.log(`NOMAD → http://localhost:${config.port}`);
  console.log(`Click & Collect → http://localhost:${config.port}/click-and-collect.html`);
  console.log(`Back-office → http://localhost:${config.port}/admin/orders`);
  if (FAKE) console.log(`(heure simulée : ${process.env.NOMAD_FAKE_NOW})`);
  if (!process.env.NOMAD_ADMIN_USER || !process.env.NOMAD_ADMIN_PASSWORD) console.log('⚠ Identifiants du back-office par défaut : à changer avant la mise en ligne (NOMAD_ADMIN_USER / NOMAD_ADMIN_PASSWORD).');
});
