// Отправка заказов и сообщений владельцу магазина (через серверные функции /api/*, токен Telegram в браузер не попадает).
// Заказ сначала кладётся в очередь (localStorage), поэтому не теряется, даже если сеть или сервер недоступны:
// отправка повторяется при каждой загрузке страницы, при возвращении сети и по кнопке «Отправить сейчас».
import { RATE } from "./data.js";
import { state, setState } from "./store.js";

const KEY = "legacyOutbox";
const RETRY_AFTER = 20000; // мс: не долбим сервер чаще, чем раз в 20 секунд

const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch { return []; } };
const write = q => { try { localStorage.setItem(KEY, JSON.stringify(q)); } catch { /* приватный режим */ } };

let sending = false;
export const isSending = () => sending;
export const isPending = id => read().some(i => i.id === id);

// Заказ → то, что нужно серверу (названия на русском сервер берёт сам)
function orderPayload(o) {
  return {
    id: o.id, createdAt: o.createdAt, customer: o.customer, delivery: o.delivery, payment: o.payment,
    comment: o.comment, promo: o.promo, totals: o.totals, rate: RATE, lang: state.lang,
    items: o.items.map(i => ({ id: i.id, size: i.size, color: i.color, qty: i.qty }))
  };
}

// Отправка заказа сразу, пока покупатель на странице оформления. Сервер проверяет цены и наличие.
//   ok — принят, rejected — отклонён (нет товара и т. п.), retry — сервер недоступен (заказ уйдёт из очереди позже)
export async function sendOrderNow(order) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderPayload(order)), signal: ctrl.signal });
    clearTimeout(timer);
    const json = await res.json().catch(() => ({}));
    if (res.ok) return { status: "ok", server: json };
    if (res.status === 400 || res.status === 409) return { status: "rejected", error: json.error, problems: json.problems };
    return { status: "retry" };
  } catch {
    return { status: "retry" };
  }
}

export function queueOrder(order) {
  const queue = read().filter(i => i.id !== order.id);
  queue.push({ id: order.id, payload: orderPayload(order), tries: 0, lastTry: 0 });
  write(queue);
}

async function post(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("http_" + res.status);
}

// Пытается отправить всё из очереди. force — игнорировать паузу между попытками.
export async function flushOutbox({ force = false } = {}) {
  if (sending) return;
  const queue = read();
  if (!queue.length) return;
  sending = true;
  try {
    for (const item of queue) {
      if (!force && Date.now() - item.lastTry < RETRY_AFTER) continue;
      try {
        await post("/api/order", item.payload);
        write(read().filter(i => i.id !== item.id));
        setState({ orders: state.orders.map(o => (o.id === item.id ? { ...o, notified: true } : o)) });
      } catch (e) {
        const status = Number(String(e.message).replace("http_", ""));
        if (status === 400 || status === 409) {
          // Сервер заказ отклонил (например, товара уже нет): повторять бессмысленно, помечаем заказ
          write(read().filter(i => i.id !== item.id));
          setState({ orders: state.orders.map(o => (o.id === item.id ? { ...o, rejected: status === 409 ? "unavailable" : "invalid" } : o)) });
        } else {
          write(read().map(i => (i.id === item.id ? { ...i, tries: i.tries + 1, lastTry: Date.now() } : i)));
        }
      }
    }
  } finally {
    sending = false;
  }
}

// Сообщение из формы обратной связи. Возвращает true/false, ошибку показывает вызывающий код.
export async function sendContact(data) {
  try { await post("/api/contact", data); return true; } catch { return false; }
}
