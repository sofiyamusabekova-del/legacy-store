// POST /api/order-status {id} — статус заказа и оплаты для страницы «Заказ оформлен» (в том числе после возврата из Stripe).
// Статус берётся прямо у Stripe по сохранённой сессии оплаты, поэтому вебхук для тестовой оплаты не нужен.
const { route, sendTelegram } = require("./_telegram");
const { read, update } = require("./_db");
const { orderMessage } = require("./_core");
const stripe = require("./_stripe");

// Сверяет заказ со Stripe: если оплата прошла, помечает заказ оплаченным (один раз) и пишет в Telegram.
// Возвращает ссылку на оплату, если заказ всё ещё ждёт денег.
async function syncStripe(order, req, lang) {
  let url;
  const s = order.payment.sessionId ? await stripe.getSession(order.payment.sessionId) : null;
  if (s?.paid) {
    const r = await update(db => {
      const o = db.orders.find(x => x.id === order.id);
      if (o.payment.status === "paid") return {}; // уже отмечен (например, параллельным запросом)
      o.payment.status = "paid"; o.payment.paidAt = new Date().toISOString();
      return { paid: structuredClone(o), rate: db.settings.rate, notify: db.settings.telegramNotify };
    });
    if (r.paid && r.notify) {
      try { await sendTelegram(orderMessage(r.paid, r.rate, "Оплачен заказ")); } catch (e) { console.error("[stripe] telegram:", e.message); }
    }
    return { status: "paid" };
  }
  if (order.payment.status === "awaiting" && order.status !== "cancelled") {
    if (s?.open) url = s.url;
    else {
      // Сессия истекла или не создавалась (Stripe был недоступен при заказе): открываем новую
      const fresh = await stripe.createSession(order, req, lang);
      await update(db => { db.orders.find(x => x.id === order.id).payment.sessionId = fresh.id; });
      url = fresh.url;
    }
  }
  return { url };
}

module.exports = route(async (b, req) => {
  const id = String(b.id || "");
  const lang = ["ru", "uz", "en"].includes(b.lang) ? b.lang : "ru";
  let order = (await read()).orders.find(o => o.id === id);
  if (!order) return { status: 404, body: { ok: false, error: "not_found" } };

  let link;
  if (order.payment.method === "stripe" && stripe.enabled()) {
    const r = await syncStripe(order, req, lang);
    link = r.url;
    order = (await read()).orders.find(o => o.id === id);
  }
  return { body: { ok: true, status: order.status, payment: { method: order.payment.method, status: order.payment.status }, payUrl: link } };
}, { rate: 40 });
