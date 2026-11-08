// Единое хранилище состояния (localStorage) с подпиской на изменения.
import { LANGS, DEFAULT_LANG } from "./data.js";

export const KEYS = { cart: "legacyCart", currency: "legacyCurrency", lang: "legacyLang" };

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

const savedLang = load(KEYS.lang, DEFAULT_LANG);
const savedCurrency = load(KEYS.currency, "UZS");
const savedCart = load(KEYS.cart, []);

export const state = {
  lang: LANGS.includes(savedLang) ? savedLang : DEFAULT_LANG,
  currency: savedCurrency === "USD" ? "USD" : "UZS",
  cart: Array.isArray(savedCart) ? savedCart : []
};

const subscribers = new Set();
export function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }

export function setState(patch) {
  Object.assign(state, patch);
  for (const key of Object.keys(patch)) save(KEYS[key], state[key]);
  subscribers.forEach(fn => fn(patch));
}
