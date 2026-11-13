// Самопроверка оплаты Stripe без настоящего Stripe: поднимает заглушку API Stripe и прогоняет через неё заказ.
// Запуск (сервер — на временной базе, чтобы не трогать data/store.json):
//   STORE_FILE=$TEMP/test-store.json STRIPE_SECRET_KEY=sk_test_fake STRIPE_API_BASE=http://localhost:8010 node dev-server.js --mock --port=8003
//   node tools/stripe-selftest.js http://localhost:8003
const http = require("http");
const BASE = process.argv[2] || "http://localhost:8003";
const FAKE_PORT = Number(process.env.STRIPE_FAKE_PORT) || 8010;
let pass = 0, fail = 0;
const check = (name, ok, extra = "") => { ok ? pass++ : fail++; console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : "  → " + extra}`); };

// Заглушка Stripe: хранит сессии в памяти, статус оплаты меняет сам тест
const sessions = new Map();
let seq = 0;
const fake = http.createServer((req, res) => {
  let raw = "";
  req.on("data", c => raw += c);
  req.on("end", () => {
    const send = (code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
    if (req.headers.authorization !== "Bearer sk_test_fake") return send(401, { error: { message: "Invalid API Key" } });
    if (req.method === "POST" && req.url === "/v1/checkout/sessions") {
      const form = Object.fromEntries(new URLSearchParams(raw));
      const id = "cs_test_" + (++seq);
      const s = { id, url: `https://checkout.stripe.com/c/pay/${id}`, status: "open", payment_status: "unpaid", form };
      sessions.set(id, s);
      return send(200, s);
    }
    const m = req.url.match(/^\/v1\/checkout\/sessions\/([\w]+)$/);
    if (req.method === "GET" && m && sessions.has(m[1])) return send(200, sessions.get(m[1]));
    send(404, { error: { message: "No such session" } });
  });
});

const post = async (url, body) => { const r = await fetch(BASE + url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { s: r.status, j: await r.json() }; };
const status = id => post("/api/order-status", { id, lang: "ru" });
const newOrder = (suffix, extra = {}) => post("/api/order", {
  id: "LG-ST-" + suffix + "-" + Date.now().toString().slice(-5), customer: { name: "Stripe Тест", phone: "+998 90 123 45 67", email: "test@example.com" },
  delivery: { method: "pickup" }, payment: "stripe", comment: "", lang: "ru", items: [{ id: "grill-graphic-tee", size: "M", color: "black", qty: 1 }], ...extra
});

(async () => {
  await new Promise(r => fake.listen(FAKE_PORT, r));
  try {
    const cat = await (await fetch(BASE + "/api/catalog")).json();
    check("каталог сообщает, что Stripe включён", cat.settings?.stripeEnabled === true, JSON.stringify(cat.settings));

    const o = await newOrder("A");
    check("заказ со Stripe создан, пришла ссылка на оплату", o.j.ok && /^https:\/\/checkout\.stripe\.com\/c\/pay\/cs_test_\d+$/.test(o.j.payUrl || ""), JSON.stringify(o.j));
    check("оплата: метод stripe, статус «ожидает», сумма в центах USD", o.j.payment?.method === "stripe" && o.j.payment.status === "awaiting" && o.j.payment.currency === "usd" && o.j.payment.amount === Math.round(o.j.totals.total * 100), JSON.stringify(o.j.payment));
    const s1 = sessions.get((o.j.payUrl || "").split("/").pop());
    check("Stripe получил сумму, валюту и номер заказа", s1 && s1.form["line_items[0][price_data][unit_amount]"] === String(o.j.payment.amount) && s1.form["line_items[0][price_data][currency]"] === "usd" && s1.form["metadata[order_id]"] === o.j.id && s1.form.client_reference_id === o.j.id, JSON.stringify(s1?.form));
    check("success_url ведёт на страницу заказа, cancel_url тоже", s1 && /order\.html\?id=LG-ST-A-\d+&pay=1$/.test(s1.form.success_url) && /pay=cancel$/.test(s1.form.cancel_url), JSON.stringify(s1?.form));
    check("email покупателя передан в Stripe", s1?.form.customer_email === "test@example.com");

    const a = await status(o.j.id);
    check("до оплаты статус «ожидает», ссылка на оплату та же", a.j.payment?.status === "awaiting" && a.j.payUrl === o.j.payUrl, JSON.stringify(a.j));

    // Покупатель вернулся без оплаты: заказ остаётся ждать оплаты
    const back = await status(o.j.id);
    check("после отмены на странице Stripe заказ всё ещё ждёт оплаты", back.j.payment?.status === "awaiting" && Boolean(back.j.payUrl));

    // Покупатель оплатил
    s1.status = "complete"; s1.payment_status = "paid";
    const p = await status(o.j.id);
    check("после оплаты статус «оплачен», ссылки на оплату нет", p.j.payment?.status === "paid" && !p.j.payUrl, JSON.stringify(p.j));
    const p2 = await status(o.j.id);
    check("повторная проверка ничего не ломает (идемпотентно)", p2.j.payment?.status === "paid");

    // Сессия истекла до оплаты: сервер открывает новую
    const e = await newOrder("B");
    const s2 = sessions.get(e.j.payUrl.split("/").pop());
    s2.status = "expired";
    const ex = await status(e.j.id);
    check("истёкшая сессия заменяется новой", ex.j.payment?.status === "awaiting" && ex.j.payUrl && ex.j.payUrl !== e.j.payUrl, JSON.stringify(ex.j));

    // Обычные способы оплаты не затронуты
    const cash = await newOrder("C", { payment: "cash" });
    check("заказ с оплатой наличными работает как раньше", cash.j.ok && !cash.j.payUrl && cash.j.payment.status === "unpaid", JSON.stringify(cash.j));

    const bad = await newOrder("D", { payment: "bitcoin" });
    check("неизвестный способ оплаты отклоняется", bad.s === 400, JSON.stringify(bad));
  } finally {
    fake.close();
  }
  console.log(`\nИтого: ${pass} успешно, ${fail} с ошибками`);
  process.exit(fail ? 1 : 0);
})();
