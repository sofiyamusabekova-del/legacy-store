// POST /api/admin {action, ...} — единая точка входа админ-панели. Все действия, кроме login/me/logout, требуют сессии.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { route } = require("./_telegram");
const { read, update, uid } = require("./_db");
const auth = require("./_auth");
const { round2, stockTotal } = require("./_core");

const fail = (field, message = "invalid") => { throw Object.assign(new Error(message), { code: "invalid", field }); };
const str = (v, min, max, field) => { const s = typeof v === "string" ? v.trim() : ""; if (s.length < min || s.length > max) fail(field); return s; };
const int = (v, min, max, field) => { const n = Number(v); if (!Number.isInteger(n) || n < min || n > max) fail(field); return n; };
const num = (v, min, max, field) => { const n = Number(v); if (!Number.isFinite(n) || n < min || n > max) fail(field); return n; };
const date = (v, field) => { if (v === "" || v == null) return ""; if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) fail(field); return v; };
const tri = (v, max, field, required = true) => {
  if (!v || typeof v !== "object") fail(field);
  const out = {};
  for (const l of ["ru", "en", "uz"]) out[l] = str(v[l] ?? (required ? "" : "x"), required ? 1 : 0, max, field + "." + l);
  return out;
};

const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];
const PAY_ACTIONS = { mark_paid: "paid", cancel: "cancelled", refund: "refunded" };

function audit(db, who, action, details = "") {
  db.audit.unshift({ at: new Date().toISOString(), user: who, action, details: String(details).slice(0, 200) });
  db.audit.length = Math.min(db.audit.length, 500);
}

/* ---------- Мутации (выполняются внутри update, получают копию базы) ---------- */
const mutations = {
  "product.save"(b, db, who) {
    const p = b.product || {};
    const id = str(p.id, 2, 60, "id");
    if (!/^[a-z0-9-]+$/.test(id)) fail("id");
    if (!db.categories.some(c => c.id === p.cat)) fail("cat");
    if (p.collection && !db.collections.some(c => c.id === p.collection)) fail("collection");
    if (!Array.isArray(p.sizes) || !p.sizes.length || p.sizes.length > 12) fail("sizes");
    const sizes = p.sizes.map(s => str(String(s), 1, 8, "sizes"));
    const stockBySize = Object.fromEntries(sizes.map(s => [s, int(p.stockBySize?.[s] ?? 0, 0, 100000, "stock")]));
    const img = str(p.img, 5, 200, "img");
    if (!/^images\/[\w.-]+\.(jpe?g|png|webp)$/i.test(img)) fail("img");
    const prev = db.products.find(x => x.id === id);
    const product = {
      id, cat: p.cat, price: num(p.price, 0, 100000, "price"), img,
      pos: typeof p.pos === "string" && /^[\w% .-]{0,30}$/.test(p.pos) ? p.pos : "",
      fit: p.fit === "contain" ? "contain" : "",
      name: tri(p.name, 120, "name"), desc: tri(p.desc, 600, "desc"),
      collection: p.collection || "", colors: (Array.isArray(p.colors) ? p.colors : []).map(c => str(c, 1, 20, "colors")).slice(0, 8),
      sizes, stockBySize, popular: Boolean(p.popular), hidden: Boolean(p.hidden),
      added: date(p.added, "added") || new Date().toISOString().slice(0, 10),
      sales: prev?.sales ?? 0, views: prev?.views ?? 0
    };
    if (!product.pos) delete product.pos;
    if (!product.fit) delete product.fit;
    const i = db.products.findIndex(x => x.id === id);
    if (i >= 0) db.products[i] = product; else db.products.push(product);
    audit(db, who, i >= 0 ? "Товар изменён" : "Товар создан", id);
  },
  "product.delete"(b, db, who) {
    const i = db.products.findIndex(x => x.id === b.id);
    if (i < 0) fail("id");
    db.products.splice(i, 1);
    audit(db, who, "Товар удалён", b.id);
  },
  "product.visibility"(b, db, who) {
    const p = db.products.find(x => x.id === b.id);
    if (!p) fail("id");
    p.hidden = Boolean(b.hidden);
    audit(db, who, p.hidden ? "Товар скрыт" : "Товар показан", p.id);
  },

  "category.save"(b, db, who) {
    const c = b.category || {};
    const id = str(c.id, 2, 40, "id");
    if (!/^[A-Za-z0-9-]+$/.test(id)) fail("id");
    const name = tri(c.name, 60, "name");
    const prev = db.categories.find(x => x.id === id);
    if (prev) prev.name = name; else db.categories.push({ id, order: db.categories.length, name });
    audit(db, who, prev ? "Категория изменена" : "Категория создана", id);
  },
  "category.delete"(b, db, who) {
    if (db.products.some(p => p.cat === b.id)) fail("id", "in_use");
    db.categories = db.categories.filter(c => c.id !== b.id);
    audit(db, who, "Категория удалена", b.id);
  },
  "category.reorder"(b, db, who) {
    if (!Array.isArray(b.ids)) fail("ids");
    b.ids.forEach((id, order) => { const c = db.categories.find(x => x.id === id); if (c) c.order = order; });
    audit(db, who, "Порядок категорий изменён");
  },

  "collection.save"(b, db, who) {
    const c = b.collection || {};
    const id = str(c.id, 2, 40, "id");
    if (!/^[a-z0-9-]+$/.test(id)) fail("id");
    const next = { id, name: tri(c.name, 60, "name"), desc: tri(c.desc, 400, "desc"), cover: typeof c.cover === "string" ? c.cover : "" };
    const i = db.collections.findIndex(x => x.id === id);
    if (i >= 0) db.collections[i] = next; else db.collections.push(next);
    audit(db, who, i >= 0 ? "Коллекция изменена" : "Коллекция создана", id);
  },
  "collection.delete"(b, db, who) {
    if (db.products.some(p => p.collection === b.id)) fail("id", "in_use");
    db.collections = db.collections.filter(c => c.id !== b.id);
    audit(db, who, "Коллекция удалена", b.id);
  },

  "promo.save"(b, db, who) {
    const p = b.promo || {};
    const code = str(p.code, 3, 20, "code").toUpperCase();
    if (!/^[A-Z0-9]+$/.test(code)) fail("code");
    if (!["percent", "shipping"].includes(p.type)) fail("type");
    const prev = db.promos.find(x => x.code === code);
    const next = {
      code, type: p.type, value: p.type === "percent" ? int(p.value, 1, 90, "value") : 0,
      min: num(p.min || 0, 0, 100000, "min"), from: date(p.from, "from"), to: date(p.to, "to"),
      limit: int(p.limit || 0, 0, 1000000, "limit"), active: Boolean(p.active), used: prev?.used ?? 0
    };
    if (prev) Object.assign(prev, next); else db.promos.push(next);
    audit(db, who, prev ? "Промокод изменён" : "Промокод создан", code);
  },
  "promo.delete"(b, db, who) {
    db.promos = db.promos.filter(p => p.code !== b.code);
    audit(db, who, "Промокод удалён", b.code);
  },

  "delivery.save"(b, db, who) {
    const d = db.delivery.find(x => x.id === b.id);
    if (!d) fail("id");
    d.price = num(b.price, 0, 1000, "price");
    d.active = Boolean(b.active);
    audit(db, who, "Доставка изменена", `${d.id}: $${d.price}${d.active ? "" : " (выключена)"}`);
  },

  "order.update"(b, db, who) {
    const o = db.orders.find(x => x.id === b.id);
    if (!o) fail("id");
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) fail("status");
      if (b.status === "cancelled" && o.status !== "cancelled" && !o.restocked) {
        for (const i of o.items) { const p = db.products.find(x => x.id === i.id); if (p && i.size in p.stockBySize) p.stockBySize[i.size] += i.qty; }
        o.restocked = true; // возвращаем товар на склад один раз
      }
      o.status = b.status;
      audit(db, who, "Статус заказа", `${o.id} → ${b.status}`);
    }
    if (typeof b.note === "string" && b.note.trim()) {
      o.notes.push({ at: new Date().toISOString(), user: who, text: b.note.trim().slice(0, 500) });
      audit(db, who, "Заметка к заказу", o.id);
    }
  },
  "order.payment"(b, db, who) {
    const o = db.orders.find(x => x.id === b.id);
    const next = PAY_ACTIONS[b.pay]; // (поле называется pay, чтобы не совпасть с именем действия action)
    if (!o || !next) fail("id");
    o.payment.status = next;
    if (next === "paid") o.payment.paidAt = new Date().toISOString();
    audit(db, who, "Оплата заказа", `${o.id}: ${next}`);
  },

  "message.read"(b, db) { const m = db.messages.find(x => x.id === b.id); if (m) m.read = Boolean(b.read); },
  "message.delete"(b, db, who) { db.messages = db.messages.filter(m => m.id !== b.id); audit(db, who, "Сообщение удалено"); },

  "settings.save"(b, db, who) {
    const s = b.settings || {}, c = s.contacts || {};
    db.settings.rate = num(s.rate, 1000, 100000, "rate");
    db.settings.freeShippingFrom = num(s.freeShippingFrom, 0, 100000, "freeShippingFrom");
    db.settings.telegramNotify = Boolean(s.telegramNotify);
    db.settings.contacts = Object.fromEntries(["phone", "email", "telegram", "instagram"].map(k => [k, String(c[k] ?? "").trim().slice(0, 100)]));
    audit(db, who, "Настройки изменены");
  }
};

/* ---------- Чтение: дашборд и CSV ---------- */
function dashboard(db, days = 30) {
  const live = db.orders.filter(o => o.status !== "cancelled");
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    const day = live.filter(o => o.createdAt.slice(0, 10) === d);
    series.push({ date: d, orders: day.length, revenue: round2(day.reduce((s, o) => s + o.totals.total, 0)) });
  }
  const top = {};
  for (const o of live) for (const i of o.items) {
    const t = (top[i.id] ??= { id: i.id, name: i.name, qty: 0, revenue: 0 });
    t.qty += i.qty; t.revenue = round2(t.revenue + i.price * i.qty);
  }
  const revenue = round2(live.reduce((s, o) => s + o.totals.total, 0));
  return {
    revenue, orders: live.length, avg: live.length ? round2(revenue / live.length) : 0, series,
    top: Object.values(top).sort((a, b) => b.qty - a.qty).slice(0, 5),
    byStatus: Object.fromEntries(STATUSES.map(s => [s, db.orders.filter(o => o.status === s).length])),
    lowStock: db.products.filter(p => !p.hidden && stockTotal(p) <= 3).map(p => ({ id: p.id, name: p.name, stock: stockTotal(p) }))
  };
}

// Защита от «формул» в Excel: значения, начинающиеся с = + - @, получают апостроф
const cell = v => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
function ordersCsv(db) {
  const head = ["Номер", "Дата", "Статус", "Оплата", "Статус оплаты", "Имя", "Телефон", "Email", "Доставка", "Город", "Адрес", "Промокод", "Состав", "Сумма USD", "Скидка USD", "Доставка USD", "Итого USD", "Итого сум"];
  const rows = db.orders.map(o => [
    o.id, o.createdAt, o.status, o.payment.method, o.payment.status, o.customer.name, o.customer.phone, o.customer.email,
    o.delivery.method, o.delivery.city, o.delivery.address, o.promo || "",
    o.items.map(i => `${i.name.ru} (${[i.size, i.color].filter(Boolean).join(", ")}) x${i.qty}`).join("; "),
    o.totals.sub, o.totals.discount, o.totals.shipping, o.totals.total, Math.round(o.totals.total * db.settings.rate)
  ]);
  return "﻿" + [head, ...rows].map(r => r.map(cell).join(",")).join("\r\n");
}

const clientData = (db, extra = {}) => ({
  products: db.products, categories: [...db.categories].sort((a, b) => a.order - b.order), collections: db.collections,
  promos: db.promos, delivery: db.delivery, settings: db.settings, orders: db.orders, messages: db.messages,
  audit: db.audit.slice(0, 200), ...extra
});

/* ---------- Загрузка фото (локально: папка images/) ---------- */
function saveImage(name, dataUrl) {
  if (process.env.VERCEL) throw Object.assign(new Error("Загрузка файлов на Vercel требует облачного хранилища"), { code: "upload_unavailable" });
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl));
  if (!m) fail("file");
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > 3 * 1024 * 1024) fail("file", "too_large");
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const base = String(name || "photo").replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "photo";
  const file = `${base}-${crypto.randomBytes(3).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(__dirname, "..", "images", file), buf);
  return "images/" + file;
}

/* ---------- Обработчик ---------- */
module.exports = route(async (b, req) => {
  const action = String(b.action || "");

  if (action === "login") {
    const r = await auth.login(req, b.login, b.password);
    if (!r.ok) return { status: r.error === "locked" ? 429 : 401, body: { ok: false, error: r.error, retryIn: r.retryIn } };
    return { headers: { "Set-Cookie": auth.cookieHeader(req, r.token, 8 * 3600) }, body: { ok: true, dev: r.dev } };
  }
  if (action === "logout") return { headers: { "Set-Cookie": auth.cookieHeader(req, "", 0) }, body: { ok: true } };

  const s = auth.session(req);
  if (action === "me") return { body: { ok: true, user: s ? s.u : null, dev: auth.credentials()?.dev ?? false } };
  if (!s) return { status: 401, body: { ok: false, error: "unauthorized" } };
  // Дополнительная защита от CSRF: запрос должен прийти с нашего скрипта
  if (req.headers["x-requested-with"] !== "legacy-admin") return { status: 403, body: { ok: false, error: "forbidden" } };

  try {
    if (action === "data") return { body: { ok: true, data: clientData(await read()) } };
    if (action === "dashboard") return { body: { ok: true, dashboard: dashboard(await read(), 30) } };
    if (action === "export") return { body: { ok: true, csv: ordersCsv(await read()), name: `orders-${new Date().toISOString().slice(0, 10)}.csv` } };
    if (action === "upload") {
      const img = saveImage(b.name, b.dataUrl);
      await update(db => audit(db, s.u, "Фото загружено", img));
      return { body: { ok: true, img } };
    }
    if (mutations[action]) {
      const data = await update(db => { mutations[action](b, db, s.u); return clientData(db); });
      return { body: { ok: true, data } };
    }
    return { status: 400, body: { ok: false, error: "unknown_action" } };
  } catch (e) {
    if (e.code === "invalid") return { status: 400, body: { ok: false, error: e.message === "invalid" ? "invalid" : e.message, field: e.field } };
    throw e;
  }
}, { maxBody: 6 * 1024 * 1024, rate: 240 });
