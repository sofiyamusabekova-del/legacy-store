// Stripe Checkout (тестовый режим): создание страницы оплаты и проверка её статуса. Без SDK, только fetch к REST API.
// Переменная окружения: STRIPE_SECRET_KEY (тестовый ключ sk_test_… из https://dashboard.stripe.com/test/apikeys).
// Боевые ключи (sk_live_…) намеренно не принимаются: интеграция сделана для тестовой оплаты.
// STRIPE_API_BASE нужен только тестам, чтобы направить запросы на локальную заглушку вместо api.stripe.com.
const { originOf } = require("./_core");

const key = () => process.env.STRIPE_SECRET_KEY || "";
const enabled = () => /^(sk|rk)_test_/.test(key());
const base = () => (process.env.STRIPE_API_BASE || "https://api.stripe.com").replace(/\/$/, "");

async function call(method, path, form) {
  const res = await fetch(base() + path, {
    method,
    headers: { Authorization: `Bearer ${key()}`, ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: form ? new URLSearchParams(form).toString() : undefined
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Текст ошибки Stripe пишем только в лог, ключа в нём нет
    throw Object.assign(new Error(`Stripe вернул ошибку ${res.status}: ${json.error?.message || "без описания"}`), { code: "stripe_error" });
  }
  return json;
}

// Сумма хранится в центах USD (в магазине все цены в долларах)
const cents = usd => Math.round(usd * 100);

// Страница оплаты Stripe для заказа. Возвращает { id, url }.
async function createSession(order, req, lang = "ru") {
  const origin = originOf(req);
  const form = {
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(order.payment.amount),
    "line_items[0][price_data][product_data][name]": `LEGACY — ${order.id}`,
    "metadata[order_id]": order.id,
    client_reference_id: order.id,
    locale: ["ru", "en"].includes(lang) ? lang : "auto", // у Stripe нет узбекского интерфейса для Checkout
    success_url: `${origin}/order.html?id=${encodeURIComponent(order.id)}&pay=1`,
    cancel_url: `${origin}/order.html?id=${encodeURIComponent(order.id)}&pay=cancel`
  };
  if (order.customer.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customer.email)) form.customer_email = order.customer.email;
  const s = await call("POST", "/v1/checkout/sessions", form);
  return { id: s.id, url: s.url };
}

// Состояние страницы оплаты: { paid, open, url }
async function getSession(id) {
  const s = await call("GET", `/v1/checkout/sessions/${encodeURIComponent(id)}`);
  return { paid: s.payment_status === "paid", open: s.status === "open", url: s.url };
}

module.exports = { enabled, cents, createSession, getSession };
