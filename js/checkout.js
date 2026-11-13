// Оформление заказа (4 шага), страница «Заказ оформлен» и история заказов.
import { DELIVERY, PAYMENTS, STRIPE_ENABLED } from "./data.js";
import { state, setState, DEFAULT_CHECKOUT } from "./store.js";
import { t, pick, NUMBER_LOCALE } from "./i18n.js";
import { money, variantText, totalRowsHtml } from "./shop.js";
import { totals, shippingCost } from "./pricing.js";
import { queueOrder, sendOrderNow, isSending, isPending } from "./notify.js";

const $ = sel => document.querySelector(sel);
// способы оплаты через платёжную страницу: после заказа покупателя отправляют на неё
const ONLINE = ["stripe"];
const STEPS = ["contacts", "delivery", "payment", "confirm"];
let errors = {}; // ошибки текущего шага: { поле: ключ перевода }
let placeError = null; // ошибка отправки заказа (ключ перевода), показывается над кнопками

const draft = () => state.checkout;
const patch = p => setState({ checkout: { ...state.checkout, ...p } });

/* ---------- Телефон: маска +998 XX XXX XX XX ---------- */
export function formatPhone(value) {
  let d = String(value).replace(/\D/g, "");
  if ("998".startsWith(d)) d = ""; // пользователь стирает префикс или он только что набран
  else if (d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  const groups = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return "+998" + (groups.length ? " " + groups.join(" ") : "");
}

/* ---------- Валидация ---------- */
function validate(step) {
  const d = draft();
  const e = {};
  if (step === 1) {
    if (d.name.trim().length < 2) e.name = "err.name";
    if (!/^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(d.phone)) e.phone = "err.phone";
    if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = "err.email";
  }
  if (step === 2 && d.delivery !== "pickup") {
    if (d.delivery === "regions" && d.city.trim().length < 2) e.city = "err.city";
    if (d.address.trim().length < 5) e.address = "err.address";
  }
  return e;
}

/* ---------- Разметка ---------- */
const field = (name, label, { type = "text", ph = "", autocomplete = "" } = {}) => {
  const err = errors[name];
  const value = String(draft()[name] ?? "").replace(/"/g, "&quot;");
  return `<label class="field${err ? " bad" : ""}"><span>${label}</span><input data-field="${name}" type="${type}" value="${value}" placeholder="${ph}"${autocomplete ? ` autocomplete="${autocomplete}"` : ""}${err ? ` aria-invalid="true" aria-describedby="err-${name}"` : ""}>${err ? `<small class="err" id="err-${name}">${t(err)}</small>` : ""}</label>`;
};

const radio = (name, value, checked, title, desc, price) =>
  `<label class="opt${checked ? " on" : ""}"><input type="radio" name="${name}" value="${value}"${checked ? " checked" : ""}><span><b>${title}</b>${desc ? `<small>${desc}</small>` : ""}</span>${price !== undefined ? `<em>${price}</em>` : ""}</label>`;

function stepper(step) {
  return `<ol class="stepper">${STEPS.map((s, i) => {
    const n = i + 1;
    const cls = n === step ? " current" : n < step ? " done" : "";
    const inner = `<i>${n < step ? "✓" : n}</i><span>${t("step." + s)}</span>`;
    return `<li class="${cls.trim()}"${n === step ? ' aria-current="step"' : ""}>${n < step ? `<button type="button" data-co="go" data-step="${n}">${inner}</button>` : inner}</li>`;
  }).join("")}</ol>`;
}

function contactsStep() {
  return `<h2>${t("step.contacts")}</h2><div class="fields">${field("name", t("field.name"), { autocomplete: "name" })}${field("phone", t("field.phone"), { type: "tel", ph: "+998 90 123 45 67", autocomplete: "tel" })}${field("email", t("field.email"), { type: "email", autocomplete: "email" })}</div>`;
}

function deliveryStep(tt) {
  const d = draft();
  const cards = DELIVERY.map(m => {
    const cost = shippingCost(m.id, tt.payable, tt.status);
    return radio("delivery", m.id, d.delivery === m.id, t("delivery." + m.id), t("delivery." + m.id + ".d"), cost ? money(cost) : t("delivery.free"));
  }).join("");
  const city = d.delivery === "regions" ? field("city", t("field.city"), { autocomplete: "address-level2" }) : "";
  const address = d.delivery !== "pickup" ? field("address", t("field.address"), { autocomplete: "street-address" }) : "";
  return `<h2>${t("step.delivery")}</h2><div class="opts">${cards}</div>${city || address ? `<div class="fields">${city}${address}</div>` : ""}`;
}

function paymentStep() {
  // Онлайн-оплата Stripe появляется, только если она настроена на сервере (STRIPE_SECRET_KEY в .env)
  const methods = STRIPE_ENABLED ? ["stripe", ...PAYMENTS] : PAYMENTS;
  const current = methods.includes(draft().payment) ? draft().payment : methods[0];
  const cards = methods.map(p => radio("payment", p, current === p, t("payment." + p), t("payment." + p + ".d"))).join("");
  return `<h2>${t("step.payment")}</h2><div class="opts">${cards}</div>`;
}

function reviewBlock(title, body, step) {
  return `<div class="review"><div><span class="eyebrow">${title}</span><p>${body}</p></div><button class="link-btn" type="button" data-co="go" data-step="${step}">${t("checkout.edit")}</button></div>`;
}

function confirmStep() {
  const d = draft();
  const where = d.delivery === "pickup"
    ? t("delivery.pickup.d")
    : [d.delivery === "regions" ? d.city.trim() : t("delivery.courier.city"), d.address.trim()].filter(Boolean).join(", ");
  return `<h2>${t("step.confirm")}</h2>
    ${reviewBlock(t("checkout.contact"), `${esc(d.name.trim())}<br>${esc(d.phone)}${d.email.trim() ? "<br>" + esc(d.email.trim()) : ""}`, 1)}
    ${reviewBlock(t("checkout.deliveryTo"), `${t("delivery." + d.delivery)}<br>${esc(where)}`, 2)}
    ${reviewBlock(t("checkout.pay"), t("payment." + d.payment), 3)}
    <label class="field"><span>${t("field.comment")}</span><textarea data-field="comment" rows="3">${esc(d.comment)}</textarea></label>`;
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function asideHtml(tt) {
  const items = tt.lines.map(l => {
    const name = pick(l.product.name);
    return `<div class="co-item"><img src="${l.product.img}" alt="${name}"><div><b>${name}</b><small>${variantText(l)}</small><small>${l.qty} × <span data-price="${l.product.price}">${money(l.product.price)}</span></small></div><strong data-price="${l.sum}">${money(l.sum)}</strong></div>`;
  }).join("");
  return `<h2>${t("checkout.summary")}</h2>${items}<div class="co-sums">${totalRowsHtml(tt, true, "checkout.shipping")}</div><a class="link-btn" href="cart.html">${t("checkout.editCart")}</a>`;
}

/* ---------- Отрисовка страницы оформления ---------- */
export function renderCheckout() {
  const root = $("#checkout");
  if (!root) return;
  const d = draft();
  const tt = totals(d.delivery);
  if (!tt.lines.length) {
    root.innerHTML = `<div class="empty" style="grid-column:1/-1">${t("checkout.empty")}<br><a href="catalog.html" class="btn" style="margin-top:20px">${t("cart.explore")}</a></div>`;
    return;
  }
  const step = Math.min(Math.max(Number(d.step) || 1, 1), STEPS.length);
  const body = [contactsStep, () => deliveryStep(tt), paymentStep, confirmStep][step - 1]();
  const last = step === STEPS.length;
  root.innerHTML = `<div class="co-main">${stepper(step)}<div class="co-step">${body}</div>${placeError && last ? `<p class="form-error" role="alert">${t(placeError)}</p>` : ""}<div class="co-nav">${step > 1 ? `<button class="btn" type="button" data-co="back">${t("checkout.back")}</button>` : "<span></span>"}<button class="btn dark" type="button" data-co="${last ? "place" : "next"}">${t(last ? "checkout.place" : "checkout.next")}</button></div></div><aside class="co-aside">${asideHtml(tt)}</aside>`;
}

function goTo(step) {
  errors = {};
  placeError = null;
  patch({ step });
  renderCheckout();
  $("#checkout")?.scrollIntoView({ block: "start", behavior: "smooth" });
}

/* ---------- Оформление заказа ---------- */
function makeOrderId() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  let id;
  do { id = `LG-${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`; }
  while (state.orders.some(o => o.id === id));
  return id;
}

async function placeOrder() {
  placeError = null;
  // Перед отправкой перепроверяем все шаги
  for (const step of [1, 2]) {
    const e = validate(step);
    if (Object.keys(e).length) { errors = e; patch({ step }); renderCheckout(); return; }
  }
  const d = draft();
  const tt = totals(d.delivery);
  if (!tt.lines.length) return;
  const order = {
    id: makeOrderId(),
    createdAt: new Date().toISOString(),
    status: "new",
    customer: { name: d.name.trim(), phone: d.phone, email: d.email.trim() },
    delivery: {
      method: d.delivery,
      city: d.delivery === "regions" ? d.city.trim() : "",
      address: d.delivery === "pickup" ? "" : d.address.trim()
    },
    payment: d.payment,
    comment: d.comment.trim(),
    promo: tt.status?.valid ? tt.status.code : null,
    items: tt.lines.map(l => ({ id: l.id, name: l.product.name, img: l.product.img, size: l.size, color: l.color, qty: l.qty, price: l.product.price })),
    totals: { sub: tt.sub, discount: tt.discount, shipping: tt.shipping, total: tt.total }
  };
  // Отправляем заказ на сервер сразу: он проверит цены и наличие. Если сервер недоступен, заказ попадёт в очередь
  // (localStorage) и уйдёт позже, но онлайн-оплата без сервера невозможна.
  const btn = $("[data-co=place]");
  if (btn) { btn.disabled = true; btn.textContent = t("checkout.sending"); }
  const result = await sendOrderNow(order);
  if (result.status === "rejected" || (result.status === "retry" && ONLINE.includes(order.payment))) {
    placeError = result.status === "retry" ? "checkout.offline" : result.error === "invalid" ? "checkout.invalid" : "checkout.unavailable";
    renderCheckout();
    return;
  }
  if (result.status === "ok") order.notified = true; else queueOrder(order);
  // Контакты оставляем в черновике для следующего заказа, остальное сбрасываем
  setState({
    orders: [order, ...state.orders],
    cart: [],
    promo: null,
    promoInfo: null,
    checkout: { ...DEFAULT_CHECKOUT, name: d.name, phone: d.phone, email: d.email }
  });
  // Онлайн-оплата: уходим на страницу оплаты, после неё Stripe вернёт покупателя на страницу заказа
  location.href = result.server?.payUrl || `order.html?id=${order.id}`;
}

/* ---------- События страницы оформления ---------- */
export function initCheckout() {
  const root = $("#checkout");
  if (!root) return;

  root.addEventListener("click", e => {
    const btn = e.target.closest("[data-co]");
    if (!btn) return;
    const step = Number(draft().step) || 1;
    switch (btn.dataset.co) {
      case "next": {
        errors = validate(step);
        if (Object.keys(errors).length) renderCheckout();
        else goTo(step + 1);
        break;
      }
      case "back": goTo(Math.max(1, step - 1)); break;
      case "go": goTo(Number(btn.dataset.step)); break;
      case "place": placeOrder(); break;
    }
  });

  root.addEventListener("input", e => {
    const input = e.target.closest("[data-field]");
    if (!input) return;
    let value = input.value;
    if (input.dataset.field === "phone") { value = formatPhone(value); input.value = value; }
    patch({ [input.dataset.field]: value });
    // Ошибку поля убираем, как только пользователь начал исправлять
    const label = input.closest(".field");
    if (label?.classList.contains("bad")) { label.classList.remove("bad"); label.querySelector(".err")?.remove(); }
  });

  // При входе в поле телефона подставляем префикс
  root.addEventListener("focusin", e => {
    if (e.target.dataset?.field === "phone" && !e.target.value) { e.target.value = "+998 "; patch({ phone: "+998" }); }
  });

  root.addEventListener("change", e => {
    if (e.target.name === "delivery" || e.target.name === "payment") {
      patch({ [e.target.name]: e.target.value });
      renderCheckout();
    }
  });
}

/* ---------- Страница «Заказ оформлен» и история ---------- */
const orderDate = iso => new Date(iso).toLocaleString(NUMBER_LOCALE[state.lang], { dateStyle: "medium", timeStyle: "short" });

function orderItemsHtml(order) {
  return order.items.map(i => `<div class="co-item"><img src="${i.img}" alt=""><div><b>${pick(i.name)}</b><small>${variantText(i)}</small><small>${i.qty} × <span data-price="${i.price}">${money(i.price)}</span></small></div><strong data-price="${i.price * i.qty}">${money(i.price * i.qty)}</strong></div>`).join("");
}

function orderTotalsHtml(order) {
  const o = order.totals;
  const row = (label, price, cls = "") => `<div class="sum-row ${cls}"><span>${label}</span><strong data-price="${price}">${money(price)}</strong></div>`;
  return [
    row(t("cart.subtotal"), o.sub),
    o.discount ? row(`${t("cart.discount")} · ${order.promo}`, -o.discount, "disc") : "",
    `<div class="sum-row"><span>${t("cart.shipping")}</span><strong${o.shipping ? ` data-price="${o.shipping}"` : ""}>${o.shipping ? money(o.shipping) : t("delivery.free")}</strong></div>`,
    row(t("cart.total"), o.total, "grand")
  ].join("");
}

function deliveryText(order) {
  const d = order.delivery;
  if (d.method === "pickup") return `${t("delivery.pickup")} — ${t("delivery.pickup.d")}`;
  return `${t("delivery." + d.method)}: ${[d.method === "regions" ? d.city : t("delivery.courier.city"), d.address].filter(Boolean).join(", ")}`;
}

/* ---------- Онлайн-оплата на странице заказа ---------- */
let payInfo = null; // последний ответ /api/order-status
let payPoll = null;

function payBlock() {
  const s = payInfo?.payment.status;
  if (!s) return `<div class="notify"><span>${t("order.pay.checking")}</span></div>`;
  const cls = s === "paid" ? "ok" : s === "awaiting" ? "" : "fail";
  const action = s === "awaiting" && payInfo.payUrl ? `<a class="btn dark" href="${payInfo.payUrl}">${t("order.pay.now")}</a>` : "";
  return `<div class="notify ${cls}"><span>${t("order.pay." + s)}</span>${action}</div>`;
}

// Запрашивает у сервера статус оплаты (сервер сверяется со Stripe).
export async function refreshPayment() {
  const id = new URLSearchParams(location.search).get("id");
  const order = state.orders.find(o => o.id === id);
  if (!$("#orderPage") || !order || !ONLINE.includes(order.payment)) return;
  try {
    const res = await fetch("/api/order-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, lang: state.lang }) });
    const json = await res.json();
    if (json.ok) payInfo = json;
  } catch { /* сервера нет: покажем «Проверяем оплату…» */ }
  renderOrderPage();
  // После возврата из Stripe статус обновляется с небольшой задержкой, поэтому проверяем несколько раз
  if (payInfo?.payment.status === "awaiting" && /[?&]pay=1/.test(location.search) && !payPoll) {
    let n = 0;
    payPoll = setInterval(async () => {
      n += 1;
      await refreshPayment();
      if (payInfo?.payment.status !== "awaiting" || n >= 10) { clearInterval(payPoll); payPoll = null; }
    }, 3000);
  }
}

export function renderOrderPage() {
  const root = $("#orderPage");
  if (!root) return;
  const order = state.orders.find(o => o.id === new URLSearchParams(location.search).get("id"));
  if (!order) {
    root.innerHTML = `<div class="empty">${t("order.notfound")}<br><a href="catalog.html" class="btn" style="margin-top:20px">${t("order.continue")}</a></div>`;
    return;
  }
  // Статус отправки заказа магазину: получено / отправляем / не удалось (повторим сами или по кнопке)
  // (у старых заказов, оформленных до подключения Telegram, статуса нет — ничего не показываем)
  const notify = order.rejected ? "rejected" : order.notified ? "ok" : isSending() ? "sending" : isPending(order.id) ? "fail" : null;
  const notifyHtml = notify ? `<div class="notify ${notify}"><span>${t("order.notify." + notify)}</span>${notify === "fail" ? `<button class="link-btn" type="button" data-action="resend-order">${t("order.notify.retry")}</button>` : ""}</div>` : "";
  root.innerHTML = `<div class="order-card"><div class="eyebrow">${t("order.number")}</div><div class="order-num">${order.id}</div><p class="note">${t("order.thanks")}</p>${notifyHtml}${ONLINE.includes(order.payment) ? payBlock() : ""}
    <div class="order-grid"><div><span class="eyebrow">${t("checkout.contact")}</span><p>${esc(order.customer.name)}<br>${esc(order.customer.phone)}${order.customer.email ? "<br>" + esc(order.customer.email) : ""}</p></div>
    <div><span class="eyebrow">${t("checkout.deliveryTo")}</span><p>${esc(deliveryText(order))}</p></div>
    <div><span class="eyebrow">${t("checkout.pay")}</span><p>${t("payment." + order.payment)}</p></div>
    <div><span class="eyebrow">${t("order.date")}</span><p>${orderDate(order.createdAt)}<br>${t("status." + order.status)}</p></div></div>
    ${order.comment ? `<p class="note"><b>${t("field.comment")}:</b> ${esc(order.comment)}</p>` : ""}
    <h2>${t("order.items")}</h2>${orderItemsHtml(order)}<div class="co-sums">${orderTotalsHtml(order)}</div>
    <div class="actions" style="margin-top:30px"><a class="btn dark" href="catalog.html">${t("order.continue")}</a><a class="btn" href="orders.html">${t("orders.title")}</a></div></div>`;
}

export function renderOrders() {
  const root = $("#ordersList");
  if (!root) return;
  if (!state.orders.length) {
    root.innerHTML = `<div class="empty">${t("orders.empty")}<br><a href="catalog.html" class="btn" style="margin-top:20px">${t("cart.explore")}</a></div>`;
    return;
  }
  root.innerHTML = state.orders.map(o => {
    const pieces = o.items.reduce((s, i) => s + i.qty, 0);
    const thumbs = o.items.slice(0, 4).map(i => `<img src="${i.img}" alt="">`).join("");
    return `<a class="order-row" href="order.html?id=${o.id}"><div class="thumbs">${thumbs}</div><div><b>${o.id}</b><small>${orderDate(o.createdAt)} · ${pieces} ${t("order.pcs")}</small></div><span class="status">${t("status." + o.status)}</span><strong data-price="${o.totals.total}">${money(o.totals.total)}</strong></a>`;
  }).join("");
}
