// Витрина: цены, корзина, карточки, каталог, страница товара.
import { products, CATEGORIES, RATE } from "./data.js";
import { state, setState } from "./store.js";
import { t, pick, NUMBER_LOCALE } from "./i18n.js";

const $ = sel => document.querySelector(sel);
const productById = id => products.find(p => p.id === id);

/* ---------- Цены ---------- */
export function money(usd) {
  if (state.currency === "USD") return "$" + usd.toFixed(0);
  return new Intl.NumberFormat(NUMBER_LOCALE[state.lang]).format(usd * RATE) + " " + t("currency.uzs");
}

export function refreshPrices() {
  document.querySelectorAll("[data-price]").forEach(el => { el.textContent = money(Number(el.dataset.price)); });
  document.querySelectorAll("#currencyToggle").forEach(b => {
    b.textContent = state.currency === "USD" ? "USD / UZS" : "UZS / USD";
  });
}

/* ---------- Уведомления и счётчик ---------- */
let toastTimer;
export function toast(msg) {
  const el = $(".toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

export function renderCount() {
  const n = state.cart.reduce((s, x) => s + x.qty, 0);
  document.querySelectorAll("#cartCount").forEach(x => { x.textContent = n; });
}

/* ---------- Операции с корзиной ---------- */
export function addToCart(id) {
  const exists = state.cart.some(i => i.id === id);
  const cart = exists
    ? state.cart.map(i => (i.id === id ? { ...i, qty: i.qty + 1 } : i))
    : [...state.cart, { id, qty: 1 }];
  setState({ cart });
  toast(t("toast.added"));
}

export function changeQty(id, delta) {
  const cart = state.cart.map(i => (i.id === id ? { ...i, qty: i.qty + delta } : i)).filter(i => i.qty > 0);
  setState({ cart });
}

export function removeItem(id) {
  setState({ cart: state.cart.filter(i => i.id !== id) });
}

/* ---------- Карточки и списки ---------- */
function productCard(p) {
  const name = pick(p.name);
  const href = `product.html?id=${p.id}`;
  const imgStyle = p.pos ? ` style="object-position:${p.pos}"` : "";
  return `<article class="product-card" data-cat="${p.cat}" data-href="${href}"><span class="badge">${t("cat." + p.cat)}</span><img class="product-img${p.fit === "contain" ? " contain" : ""}"${imgStyle} loading="lazy" src="${p.img}" alt="${name}"><div class="product-info"><div><h3><a href="${href}">${name}</a></h3><p>${pick(p.desc).slice(0, 58)}…</p></div><span class="price" data-price="${p.price}">${money(p.price)}</span></div></article>`;
}

export function renderProducts(target, limit = 99) {
  const el = $(target);
  if (!el) return;
  el.innerHTML = products.slice(0, limit).map(productCard).join("");
}

/* ---------- Каталог ---------- */
let activeCat = "All";

export function setFilter(cat) {
  activeCat = cat;
  document.querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b.dataset.cat === cat));
  document.querySelectorAll("#catalogGrid .product-card").forEach(c => {
    c.style.display = (cat === "All" || c.dataset.cat === cat) ? "" : "none";
  });
}

export function renderHomeCount() {
  const el = $("#homeCount");
  if (!el) return;
  const pad = n => String(n).padStart(2, "0");
  el.textContent = `${pad(Math.min(6, products.length))} / ${pad(products.length)} ${t("home.pieces")}`;
}

function renderFilters() {
  const box = $("#filters");
  if (!box) return;
  const cats = ["All", ...CATEGORIES.filter(c => products.some(p => p.cat === c))];
  box.innerHTML = cats.map(c => `<button class="filter" data-cat="${c}">${t("cat." + c)}</button>`).join("");
}

export function renderCatalog() {
  if (!$("#catalogGrid")) return;
  renderFilters();
  renderProducts("#catalogGrid");
  setFilter(activeCat);
}

/* ---------- Страница товара ---------- */
export function renderProduct() {
  const el = $("#productDetail");
  if (!el) return;
  const id = new URLSearchParams(location.search).get("id") || "blazer-noir";
  const p = productById(id) || products[0];
  const name = pick(p.name);
  el.innerHTML = `<div><img src="${p.img}" alt="${name}"></div><div class="detail-copy"><div class="eyebrow">${t("cat." + p.cat)}</div><h1>${name}</h1><p>${pick(p.desc)}</p><div class="big-price" data-price="${p.price}">${money(p.price)}</div><div class="eyebrow">${t("product.size")}</div><div class="sizes">${["XS", "S", "M", "L", "XL"].map((s, i) => `<button class="size ${i === 2 ? "active" : ""}">${s}</button>`).join("")}</div><button class="btn dark wide" data-action="add" data-id="${p.id}">${t("product.add")}</button></div>`;
}

/* ---------- Корзина ---------- */
export function renderCart() {
  const list = $("#cartList");
  if (!list) return;
  const totalEl = $("#cartTotal");
  if (!state.cart.length) {
    list.innerHTML = `<div class="empty">${t("cart.empty")}<br><a href="catalog.html" class="btn" style="margin-top:20px">${t("cart.explore")}</a></div>`;
    delete totalEl.dataset.price;
    totalEl.textContent = "";
    return;
  }
  list.innerHTML = state.cart.map(item => {
    const p = productById(item.id);
    if (!p) return "";
    const name = pick(p.name);
    const sum = p.price * item.qty;
    return `<div class="cart-row"><img src="${p.img}" alt="${name}"><div><h3>${name}</h3><p>${t("cat." + p.cat)}</p></div><div class="qty"><button data-action="qty" data-id="${p.id}" data-d="-1">−</button><span>${item.qty}</span><button data-action="qty" data-id="${p.id}" data-d="1">+</button></div><strong data-price="${sum}">${money(sum)}</strong><button class="remove" data-action="remove" data-id="${p.id}">${t("cart.remove")}</button></div>`;
  }).join("");
  const total = state.cart.reduce((s, x) => s + (productById(x.id)?.price ?? 0) * x.qty, 0);
  totalEl.dataset.price = total;
}
