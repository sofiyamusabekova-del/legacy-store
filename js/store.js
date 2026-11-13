// Единое хранилище состояния (localStorage) с подпиской на изменения.
import { LANGS, DEFAULT_LANG } from "./data.js";

export const KEYS = {
  cart: "legacyCart", currency: "legacyCurrency", lang: "legacyLang",
  views: "legacyViews", wishlist: "legacyWishlist", recent: "legacyRecent",
  promo: "legacyPromo", promoInfo: "legacyPromoInfo", checkout: "legacyCheckout", orders: "legacyOrders"
};

// Черновик оформления заказа: шаг и введённые поля (сохраняется, чтобы не терять данные при обновлении страницы)
export const DEFAULT_CHECKOUT = {
  step: 1, name: "", phone: "", email: "",
  delivery: "courier", city: "", address: "", payment: "cash", comment: ""
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try { return JSON.parse(raw); } catch { return raw; } // старые значения хранились строкой без JSON
  } catch { return fallback; }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* приватный режим и т.п. */ }
}

const asArray = v => (Array.isArray(v) ? v : []);
const isObject = v => v && typeof v === "object" && !Array.isArray(v);
const savedLang = load(KEYS.lang, DEFAULT_LANG);
const savedCurrency = load(KEYS.currency, "UZS");
const savedViews = load(KEYS.views, {});
const savedPromo = load(KEYS.promo, null);
const savedCheckout = load(KEYS.checkout, {});
const savedPromoInfo = load(KEYS.promoInfo, null);

export const state = {
  lang: LANGS.includes(savedLang) ? savedLang : DEFAULT_LANG,
  currency: savedCurrency === "USD" ? "USD" : "UZS",
  // Позиция корзины: { id, size, color, qty }. Размер и цвет — часть ключа позиции.
  cart: asArray(load(KEYS.cart, [])),
  views: isObject(savedViews) ? savedViews : {}, // { id: число просмотров }
  wishlist: asArray(load(KEYS.wishlist, [])).filter(x => typeof x === "string"), // id избранных товаров
  recent: asArray(load(KEYS.recent, [])).filter(x => typeof x === "string"), // недавно просмотренные, новые первыми
  promo: typeof savedPromo === "string" && savedPromo ? savedPromo : null, // применённый промокод
  promoInfo: isObject(savedPromoInfo) ? savedPromoInfo : null, // условия промокода, которые подтвердил сервер { code, type, value, min }
  checkout: { ...DEFAULT_CHECKOUT, ...(isObject(savedCheckout) ? savedCheckout : {}) },
  orders: asArray(load(KEYS.orders, [])).filter(isObject) // история заказов, новые первыми
};

const subscribers = new Set();
export function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }

export function setState(patch) {
  Object.assign(state, patch);
  for (const key of Object.keys(patch)) save(KEYS[key], state[key]);
  subscribers.forEach(fn => fn(patch));
}
