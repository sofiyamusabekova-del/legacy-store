// Бизнес-логика магазина на сервере: каталог для витрины, проверка промокода, расчёт заказа по ценам из базы, текст для Telegram.
const { esc } = require("./_telegram");

const round2 = n => Math.round(n * 100) / 100;
const stockTotal = p => Object.values(p.stockBySize || {}).reduce((s, n) => s + (Number(n) || 0), 0);

// То, что видит покупатель: только открытые товары, без служебных полей
function publicCatalog(db) {
  const products = db.products.filter(p => !p.hidden).map(p => ({ ...p, stock: stockTotal(p) }));
  return {
    settings: { rate: db.settings.rate, freeShippingFrom: db.settings.freeShippingFrom, contacts: db.settings.contacts, stripeEnabled: require("./_stripe").enabled() },
    categories: [...db.categories].sort((a, b) => a.order - b.order),
    collections: db.collections,
    products,
    delivery: db.delivery.filter(d => d.active)
  };
}

const today = () => new Date().toISOString().slice(0, 10);

// Проверка промокода: действует ли он сейчас и подходит ли под сумму
function promoCheck(db, rawCode, subtotal) {
  const code = String(rawCode || "").trim().toUpperCase();
  const promo = db.promos.find(p => p.code === code);
  if (!code) return { ok: false, reason: "empty" };
  if (!promo || !promo.active) return { ok: false, reason: "invalid" };
  if ((promo.from && today() < promo.from) || (promo.to && today() > promo.to)) return { ok: false, reason: "expired" };
  if (promo.limit && promo.used >= promo.limit) return { ok: false, reason: "limit" };
  if (promo.min && subtotal < promo.min) return { ok: false, reason: "min", min: promo.min };
  return { ok: true, promo };
}

// Считает заказ по ценам из базы (цены с клиента не принимаются) и проверяет наличие
function priceOrder(db, input) {
  const lines = [], problems = [];
  for (const it of input.items) {
    const p = db.products.find(x => x.id === it.id && !x.hidden);
    if (!p) { problems.push({ id: it.id, reason: "unknown" }); continue; }
    const size = p.sizes.includes(it.size) ? it.size : p.sizes[Math.floor(p.sizes.length / 2)];
    const color = p.colors.length ? (p.colors.includes(it.color) ? it.color : p.colors[0]) : undefined;
    if ((p.stockBySize?.[size] ?? 0) < it.qty) { problems.push({ id: p.id, size, reason: "out_of_stock" }); continue; }
    lines.push({ id: p.id, name: p.name, img: p.img, size, color, qty: it.qty, price: p.price });
  }
  const sub = round2(lines.reduce((s, l) => s + l.price * l.qty, 0));
  const check = input.promo ? promoCheck(db, input.promo, sub) : null;
  const promo = check?.ok ? check.promo : null;
  const discount = promo?.type === "percent" ? round2(sub * promo.value / 100) : 0;
  const payable = round2(sub - discount);
  const method = db.delivery.find(d => d.id === input.delivery.method && d.active);
  if (!method) problems.push({ reason: "delivery" });
  const free = payable >= db.settings.freeShippingFrom || promo?.type === "shipping";
  const shipping = !method || method.price === 0 || free ? 0 : method.price;
  return { lines, problems, promo, totals: { sub, discount, shipping, total: round2(payable + shipping) } };
}

const DELIVERY = { pickup: "Самовывоз", courier: "Курьер по Ташкенту", regions: "Доставка по Узбекистану" };
const PAYMENT = { cash: "Наличными при получении", card: "Картой при получении", stripe: "Онлайн через Stripe" };
const COLORS = { black: "чёрный", white: "белый", ivory: "слоновая кость", grey: "серый", indigo: "индиго", brown: "коричневый", taupe: "тауп" };
const fmt = n => new Intl.NumberFormat("ru-RU").format(Math.round(n));

// Текст заказа для Telegram (HTML). title — заголовок сообщения.
function orderMessage(order, rate, title = "Новый заказ") {
  const money = usd => `$${Number.isInteger(usd) ? usd : usd.toFixed(2)} (${fmt(usd * rate)} сум)`;
  const c = order.customer, d = order.delivery, t = order.totals;
  const items = order.items.map((i, n) => {
    const opts = [i.size ? `размер ${i.size === "ONE" ? "универсальный" : i.size}` : "", i.color ? COLORS[i.color] || i.color : ""].filter(Boolean).join(", ");
    return `${n + 1}. ${esc(i.name.ru)}${opts ? ` — ${esc(opts)}` : ""} × ${i.qty} = ${money(i.price * i.qty)}`;
  }).join("\n");
  const where = d.method === "pickup" ? "пункт выдачи LEGACY, Ташкент" : [d.method === "regions" ? d.city : "Ташкент", d.address].filter(Boolean).join(", ");
  const pay = order.payment.status === "paid" ? " ✅ оплачено" : order.payment.method === "stripe" ? " (ожидает оплаты)" : "";
  return [
    `🛍 <b>${title} ${esc(order.id)}</b>`, "",
    `👤 ${esc(c.name)}`, `📞 ${esc(c.phone)}`, c.email ? `✉️ ${esc(c.email)}` : "", "",
    `🚚 ${DELIVERY[d.method] || d.method}: ${esc(where)}`,
    `💳 ${PAYMENT[order.payment.method] || order.payment.method}${pay}`,
    order.promo ? `🎟 Промокод: ${esc(order.promo)}` : "", "",
    items, "",
    `Сумма: ${money(t.sub)}`,
    t.discount ? `Скидка: −${money(t.discount)}` : "",
    `Доставка: ${t.shipping ? money(t.shipping) : "бесплатно"}`,
    `<b>Итого: ${money(t.total)}</b>`,
    order.comment ? `\n💬 ${esc(order.comment.slice(0, 500))}` : ""
  ].filter((l, i, a) => l !== "" || (a[i - 1] !== "" && i > 0)).join("\n");
}

// Адрес сайта по запросу: на любом домене (localhost, Vercel, свой) ссылки получаются правильными
const originOf = req => {
  const proto = String(req.headers["x-forwarded-proto"] || (req.socket?.encrypted ? "https" : "http")).split(",")[0];
  return `${proto}://${req.headers["x-forwarded-host"] || req.headers.host}`;
};

module.exports = { originOf, publicCatalog, promoCheck, priceOrder, orderMessage, stockTotal, round2 };
