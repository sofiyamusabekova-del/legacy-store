// Расчёт сумм: позиции корзины, промокод, скидка, доставка, итог. Все суммы в USD.
// Сервер пересчитывает заказ по своим ценам (api/_core.js), здесь расчёт нужен для показа покупателю.
import { products, PROMOS, DELIVERY, FREE_SHIPPING_FROM } from "./data.js";
import { state, setState } from "./store.js";

export const productById = id => products.find(p => p.id === id);
const round2 = n => Math.round(n * 100) / 100;

export function cartLines(cart = state.cart) {
  return cart
    .map(item => { const p = productById(item.id); return p ? { ...item, product: p, sum: p.price * item.qty } : null; })
    .filter(Boolean);
}

// Условия промокода: подтверждённые сервером или (если сервера нет) исходные из data.js
const promoOf = code => (state.promoInfo?.code === code ? state.promoInfo : PROMOS[code]);

// Состояние промокода относительно текущей суммы: действует / не существует / сумма меньше минимальной
export function promoStatus(code, sub) {
  if (!code) return null;
  const promo = promoOf(code);
  if (!promo) return { code, valid: false, reason: "invalid" };
  if (promo.min && sub < promo.min) return { code, valid: false, reason: "min", min: promo.min, promo };
  return { code, valid: true, promo };
}

export function shippingCost(methodId, payable, status) {
  const method = DELIVERY.find(d => d.id === methodId);
  if (!method || method.price === 0) return 0;
  if (payable >= FREE_SHIPPING_FROM) return 0;
  if (status?.valid && status.promo.type === "shipping") return 0;
  return method.price;
}

// methodId — способ доставки (null, пока он не выбран: доставка в итог не входит)
export function totals(methodId = null, cart = state.cart, code = state.promo) {
  const lines = cartLines(cart);
  const sub = lines.reduce((s, l) => s + l.sum, 0);
  const status = promoStatus(code, sub);
  const discount = status?.valid && status.promo.type === "percent" ? round2(sub * status.promo.value / 100) : 0;
  const payable = round2(sub - discount);
  const shipping = methodId ? shippingCost(methodId, payable, status) : 0;
  return { lines, sub, status, discount, payable, shipping, total: round2(payable + shipping) };
}

// Применяет введённый промокод: сначала спрашиваем сервер (там актуальные коды, сроки и лимиты),
// если сервера нет — проверяем по исходным данным. Возвращает { ok, reason, min }
export async function applyPromo(raw) {
  const code = String(raw ?? "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "empty" };
  const sub = totals(null, state.cart, null).sub;
  try {
    const res = await fetch("/api/promo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, subtotal: sub }) });
    if (res.status === 429) return { ok: false, reason: "rate" };
    if (res.ok) {
      const j = await res.json();
      if (!j.ok) return { ok: false, reason: j.reason, min: j.min };
      setState({ promo: code, promoInfo: j.promo });
      return { ok: true };
    }
  } catch { /* сервера нет — проверяем локально */ }
  const status = promoStatus(code, sub);
  if (!status.valid) return { ok: false, reason: status.reason, min: status.min };
  setState({ promo: code, promoInfo: null });
  return { ok: true };
}

export const removePromo = () => setState({ promo: null, promoInfo: null });
