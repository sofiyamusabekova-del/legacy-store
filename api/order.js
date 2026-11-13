// POST /api/order — принимает заказ: пересчитывает по ценам из базы, проверяет наличие, сохраняет, списывает остатки,
// считает использование промокода и присылает владельцу сообщение в Telegram.
const { sendTelegram, route } = require("./_telegram");
const { read, update } = require("./_db");
const { priceOrder, orderMessage } = require("./_core");
const stripe = require("./_stripe");

const str = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.trim().length <= max;

function validate(o) {
  if (!o || typeof o !== "object") return false;
  const c = o.customer, d = o.delivery;
  if (!str(o.id, 4, 30) || !/^[A-Z0-9-]+$/.test(o.id)) return false;
  if (!c || !str(c.name, 2, 80) || !/^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(c.phone || "")) return false;
  if (c.email && !str(c.email, 3, 120)) return false;
  if (!d || typeof d.method !== "string" || !["cash", "card", "stripe"].includes(o.payment)) return false;
  if (d.method !== "pickup" && !str(d.address, 3, 200)) return false;
  if (d.method === "regions" && !str(d.city, 2, 80)) return false;
  if (!Array.isArray(o.items) || o.items.length < 1 || o.items.length > 50) return false;
  return o.items.every(i => i && typeof i.id === "string" && i.id.length < 80 && Number.isInteger(i.qty) && i.qty >= 1 && i.qty <= 99);
}

module.exports = route(async (o, req) => {
  if (!validate(o)) return { status: 400, body: { ok: false, error: "invalid" } };
  if (o.payment === "stripe" && !stripe.enabled()) return { status: 400, body: { ok: false, error: "invalid" } };

  // Повторная отправка того же заказа (очередь на клиенте) не создаёт дубль
  const existing = (await read()).orders.find(x => x.id === o.id);
  if (existing) return { body: { ok: true, duplicate: true, id: existing.id } };

  const result = await update(db => {
    const priced = priceOrder(db, { items: o.items, promo: o.promo, delivery: o.delivery });
    if (priced.problems.length) return { problems: priced.problems };
    const order = {
      id: o.id, createdAt: new Date().toISOString(), status: "new",
      customer: { name: o.customer.name.trim(), phone: o.customer.phone, email: (o.customer.email || "").trim() },
      delivery: { method: o.delivery.method, city: o.delivery.method === "regions" ? o.delivery.city.trim() : "", address: o.delivery.method === "pickup" ? "" : o.delivery.address.trim() },
      // Для Stripe сумма в центах USD (валюта магазина), Stripe возьмёт ровно её
      payment: o.payment === "stripe"
        ? { method: "stripe", status: "awaiting", amount: stripe.cents(priced.totals.total), currency: "usd" }
        : { method: o.payment, status: "unpaid" },
      comment: typeof o.comment === "string" ? o.comment.trim().slice(0, 500) : "",
      promo: priced.promo ? priced.promo.code : null,
      items: priced.lines, totals: priced.totals, notes: []
    };
    for (const l of priced.lines) db.products.find(p => p.id === l.id).stockBySize[l.size] -= l.qty;
    if (priced.promo) db.promos.find(p => p.code === priced.promo.code).used += 1;
    db.orders.unshift(order);
    return { order, rate: db.settings.rate, notify: db.settings.telegramNotify };
  });

  if (result.problems) return { status: 409, body: { ok: false, error: "unavailable", problems: result.problems } };

  // Заказ уже сохранён; если Telegram недоступен, покупателю это не мешает (заказ виден в админке)
  // Заказы с онлайн-оплатой уходят в Telegram только после оплаты
  if (result.notify && result.order.payment.method !== "stripe") {
    try { await sendTelegram(orderMessage(result.order, result.rate)); } catch (e) { console.error("[api] telegram:", e.message); }
  }
  let payUrl;
  if (result.order.payment.method === "stripe") {
    // Если Stripe недоступен, заказ уже сохранён: ссылку на оплату можно получить позже на странице заказа
    try {
      const session = await stripe.createSession(result.order, req, o.lang);
      payUrl = session.url;
      await update(db => { db.orders.find(x => x.id === result.order.id).payment.sessionId = session.id; });
    } catch (e) { console.error("[api] stripe:", e.message); }
  }
  return { body: { ok: true, id: result.order.id, totals: result.order.totals, payment: result.order.payment, payUrl } };
}, { maxBody: 30000 });
