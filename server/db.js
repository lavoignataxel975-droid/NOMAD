/* NOMAD — Base de données SQLite (fichier data/nomad.db) */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DIR, { recursive: true });
const db = new DatabaseSync(process.env.NOMAD_DB || path.join(DIR, 'nomad.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    day          TEXT NOT NULL,               -- jour de retrait AAAA-MM-JJ (heure de Paris)
    number       INTEGER NOT NULL,            -- numéro du jour : #001, #002…
    created_at   TEXT NOT NULL,               -- date/heure de commande (ISO, UTC)
    first_name   TEXT NOT NULL,
    last_name    TEXT NOT NULL,
    phone        TEXT NOT NULL,
    items        TEXT NOT NULL,               -- JSON : lignes, quantités, options, prix
    total_cents  INTEGER NOT NULL,
    pickup_time  TEXT NOT NULL,               -- HH:MM
    status       TEXT NOT NULL DEFAULT 'NOUVELLE',
    updated_at   TEXT NOT NULL,
    archived_at  TEXT,
    UNIQUE (day, number)
  );
  CREATE INDEX IF NOT EXISTS orders_day ON orders (day, pickup_time);
  CREATE INDEX IF NOT EXISTS orders_status ON orders (status);
  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
  );
`);

const STATUSES = ['NOUVELLE', 'EN_PREPARATION', 'PRETE', 'TERMINEE', 'ARCHIVEE'];

const parse = row => row && {
  id: row.id,
  day: row.day,
  number: row.number,
  ref: String(row.number).padStart(3, '0'),
  createdAt: row.created_at,
  firstName: row.first_name,
  lastName: row.last_name,
  phone: row.phone,
  items: JSON.parse(row.items),
  totalCents: row.total_cents,
  pickupTime: row.pickup_time,
  status: row.status,
  updatedAt: row.updated_at,
  archivedAt: row.archived_at
};

const q = {
  countSlot: db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE day = ? AND pickup_time = ?`),
  slotCounts: db.prepare(`SELECT pickup_time AS t, COUNT(*) AS n FROM orders WHERE day = ? GROUP BY pickup_time`),
  nextNumber: db.prepare(`SELECT COALESCE(MAX(number), 0) + 1 AS n FROM orders WHERE day = ?`),
  insert: db.prepare(`INSERT INTO orders (day, number, created_at, first_name, last_name, phone, items, total_cents, pickup_time, status, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOUVELLE', ?)`),
  byId: db.prepare(`SELECT * FROM orders WHERE id = ?`),
  today: db.prepare(`SELECT * FROM orders WHERE day = ? AND status <> 'ARCHIVEE' ORDER BY pickup_time, number`),
  olderOpen: db.prepare(`SELECT * FROM orders WHERE day < ? AND status <> 'ARCHIVEE' ORDER BY day, pickup_time, number`),
  setStatus: db.prepare(`UPDATE orders SET status = ?, updated_at = ?, archived_at = ? WHERE id = ?`),
  del: db.prepare(`DELETE FROM orders WHERE id = ? AND status = 'ARCHIVEE'`),
  sessionAdd: db.prepare(`INSERT INTO sessions (token, expires_at) VALUES (?, ?)`),
  sessionGet: db.prepare(`SELECT expires_at FROM sessions WHERE token = ?`),
  sessionDel: db.prepare(`DELETE FROM sessions WHERE token = ?`),
  sessionPurge: db.prepare(`DELETE FROM sessions WHERE expires_at < ?`)
};

module.exports = {
  STATUSES,

  slotCounts(day) {
    const m = {};
    for (const r of q.slotCounts.all(day)) m[r.t] = r.n;
    return m;
  },

  /* Création atomique : vérifie la place dans le créneau et attribue le numéro du jour */
  createOrder(o, maxPerSlot) {
    db.exec('BEGIN IMMEDIATE');
    try {
      if (q.countSlot.get(o.day, o.pickupTime).n >= maxPerSlot) {
        db.exec('ROLLBACK');
        return null;
      }
      const number = q.nextNumber.get(o.day).n;
      const now = new Date().toISOString();
      const r = q.insert.run(o.day, number, now, o.firstName, o.lastName, o.phone,
        JSON.stringify(o.items), o.totalCents, o.pickupTime, now);
      db.exec('COMMIT');
      return parse(q.byId.get(r.lastInsertRowid));
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  },

  get: id => parse(q.byId.get(id)),
  today: day => q.today.all(day).map(parse),
  olderOpen: day => q.olderOpen.all(day).map(parse),

  setStatus(id, status) {
    const now = new Date().toISOString();
    q.setStatus.run(status, now, status === 'ARCHIVEE' ? now : null, id);
    return parse(q.byId.get(id));
  },

  deleteArchived: id => q.del.run(id).changes > 0,

  /* Archives : recherche par numéro, nom, prénom ou téléphone, et/ou par jour */
  archive({ search = '', day = '', limit = 200 }) {
    const where = [`status = 'ARCHIVEE'`];
    const args = [];
    if (day) { where.push('day = ?'); args.push(day); }
    const s = search.trim().replace(/^#/, '');
    if (s) {
      const digits = s.replace(/\D/g, '');
      const ors = ['first_name LIKE ?', 'last_name LIKE ?', `(first_name || ' ' || last_name) LIKE ?`];
      args.push('%' + s + '%', '%' + s + '%', '%' + s + '%');
      if (digits) {
        ors.push(`REPLACE(phone, ' ', '') LIKE ?`, 'number = ?');
        args.push('%' + digits + '%', Number(digits));
      }
      where.push('(' + ors.join(' OR ') + ')');
    }
    args.push(limit);
    return db.prepare(`SELECT * FROM orders WHERE ${where.join(' AND ')} ORDER BY day DESC, pickup_time DESC, number DESC LIMIT ?`)
      .all(...args).map(parse);
  },

  sessions: {
    add: (token, expiresAt) => q.sessionAdd.run(token, expiresAt),
    valid(token) {
      const r = token && q.sessionGet.get(token);
      return !!r && r.expires_at > Date.now();
    },
    remove: token => q.sessionDel.run(token),
    purge: () => q.sessionPurge.run(Date.now())
  }
};
