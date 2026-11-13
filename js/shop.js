// Витрина: цены, корзина, избранное, карточки, каталог, коллекции, страница товара.
import { products, CATEGORIES, COLLECTIONS, RATE, LANGS, FREE_SHIPPING_FROM, CATALOG_VERSION } from "./data.js";
import { state, setState } from "./store.js";
import { t, pick, NUMBER_LOCALE } from "./i18n.js";
import { productById, totals, applyPromo, removePromo } from "./pricing.js";
import { bumpCount } from "./effects.js";
import { setPageMeta, setJsonLd, productLd, breadcrumbLd } from "./seo.js";

const $ = sel => document.querySelector(sel);
export { productById };
const collectionById = id => COLLECTIONS.find(c => c.id === id);

/* ---------- Цены ---------- */
export function money(usd) {
  if (state.currency === "USD") return "$" + (Number.isInteger(usd) ? usd : usd.toFixed(2));
  return new Intl.NumberFormat(NUMBER_LOCALE[state.lang]).format(usd * RATE) + " " + t("currency.uzs");
}

export function refreshPrices() {
  document.querySelectorAll("[data-price]").forEach(el => { el.textContent = money(Number(el.dataset.price)); });
  document.querySelectorAll("#currencyToggle").forEach(b => {
    b.textContent = state.currency === "USD" ? "USD / UZS" : "UZS / USD";
  });
}

/* ---------- Уведомления и счётчики ---------- */
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
  document.querySelectorAll("#cartCount").forEach(x => { x.textContent = n; x.hidden = n === 0; });
  bumpCount("cartCount", n);
}

/* ---------- Размеры ---------- */
// Размер, которого нет на складе, выбрать нельзя; по умолчанию берём средний из доступных
export const sizeSoldOut = (p, s) => Boolean(p.stockBySize) && (p.stockBySize[s] ?? 0) <= 0;
export const defaultSize = p => {
  const mid = Math.floor(p.sizes.length / 2);
  if (!sizeSoldOut(p, p.sizes[mid])) return p.sizes[mid];
  return p.sizes.find(s => !sizeSoldOut(p, s)) ?? p.sizes[mid];
};
export const sizeLabel = s => (s === "ONE" ? t("size.one") : s);

/* ---------- Операции с корзиной ---------- */
// Позиция корзины однозначно определяется сочетанием «товар + размер + цвет».
export const cartKey = i => `${i.id}|${i.size ?? ""}|${i.color ?? ""}`;

// После добавления в корзину main.js открывает мини-корзину (хук, чтобы shop.js не зависел от ui.js)
let addedHook = null;
export function onAdded(fn) { addedHook = fn; }

export function addToCart(id, size, color) {
  const p = productById(id);
  if (!p || p.stock <= 0) return;
  const item = { id, size: p.sizes.includes(size) ? size : defaultSize(p) };
  if (p.colors.length) item.color = p.colors.includes(color) ? color : p.colors[0];
  const exists = state.cart.some(i => cartKey(i) === cartKey(item));
  const cart = exists
    ? state.cart.map(i => (cartKey(i) === cartKey(item) ? { ...i, qty: i.qty + 1 } : i))
    : [...state.cart, { ...item, qty: 1 }];
  setState({ cart });
  if (addedHook) addedHook(); else toast(t("toast.added"));
}

export function changeQty(key, delta) {
  const cart = state.cart.map(i => (cartKey(i) === key ? { ...i, qty: i.qty + delta } : i)).filter(i => i.qty > 0);
  setState({ cart });
}

export function removeItem(key) {
  setState({ cart: state.cart.filter(i => cartKey(i) !== key) });
}

/* ---------- Избранное ---------- */
export const isWished = id => state.wishlist.includes(id);

export function toggleWish(id) {
  const on = !isWished(id);
  setState({ wishlist: on ? [...state.wishlist, id] : state.wishlist.filter(x => x !== id) });
  toast(t(on ? "toast.wishAdded" : "toast.wishRemoved"));
}

export function renderWishCount() {
  document.querySelectorAll("#wishCount").forEach(x => { x.textContent = state.wishlist.length; x.hidden = state.wishlist.length === 0; });
  bumpCount("wishCount", state.wishlist.length);
}

// Обновляет все сердечки на странице без перерисовки (чтобы не сбивать выбранный размер и т.п.)
export function syncWishButtons() {
  document.querySelectorAll('[data-action="wish"]').forEach(el => {
    const on = isWished(el.dataset.id);
    el.classList.toggle("on", on);
    el.setAttribute("aria-label", t(on ? "wish.remove" : "wish.add"));
    el.textContent = "label" in el.dataset ? `${on ? "♥" : "♡"} ${t(on ? "wish.remove" : "wish.add")}` : (on ? "♥" : "♡");
  });
}

export function renderWishlist() {
  const grid = $("#wishlistGrid");
  if (!grid) return;
  const list = state.wishlist.map(productById).filter(Boolean);
  grid.innerHTML = list.length
    ? list.map(productCard).join("")
    : `<div class="empty">${t("wishlist.empty")}<br><a href="catalog.html" class="btn" style="margin-top:20px">${t("wishlist.browse")}</a></div>`;
  watchImages(grid);
}

/* ---------- Загрузка картинок: скелетон и запасная картинка ---------- */
const PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#ece9e3"/><circle cx="165" cy="215" r="18" fill="#cfcac0"/><path d="M130 340l65-80 45 52 35-38 55 66z" fill="#cfcac0"/></svg>'
);

function markBroken(img) {
  img.classList.remove("contain");
  img.classList.add("broken", "loaded");
  img.src = PLACEHOLDER;
}

export function watchImages(root = document) {
  root.querySelectorAll("img.product-img").forEach(img => {
    if (img.complete) {
      if (img.naturalWidth === 0 && img.src !== PLACEHOLDER) markBroken(img);
      else img.classList.add("loaded");
      return;
    }
    img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
    img.addEventListener("error", () => markBroken(img), { once: true });
  });
}

/* ---------- Новинки, популярное, бейджи ---------- */
const NEW_COUNT = 8; // сколько последних по дате товаров считаются «Новинкой»
const LOW_STOCK = 3; // остаток, с которого показываем «Осталось мало»

const byAddedDesc = (a, b) => b.added.localeCompare(a.added);
const viewsOf = p => p.views + (state.views[p.id] ?? 0);
// «Хит» (флаг popular) идёт первым, дальше по продажам и просмотрам.
const popularScore = p => (p.popular ? 1000 : 0) + p.sales * 3 + viewsOf(p);

// «Новинки» пересчитываются при каждом обновлении каталога (CATALOG_VERSION растёт в applyCatalog)
let newCache = { v: -1, list: [], ids: new Set() };
function newest() {
  if (newCache.v !== CATALOG_VERSION) {
    const list = [...products].sort(byAddedDesc);
    newCache = { v: CATALOG_VERSION, list, ids: new Set(list.slice(0, NEW_COUNT).map(p => p.id)) };
  }
  return newCache;
}

export function newProducts(limit = 99) { return newest().list.slice(0, limit); }
export function popularProducts(limit = 99) { return [...products].sort((a, b) => popularScore(b) - popularScore(a)).slice(0, limit); }

function productTags(p) {
  const tags = [];
  if (p.stock <= 0) tags.push("out");
  else if (p.stock <= LOW_STOCK) tags.push("low");
  if (p.popular) tags.push("hit");
  if (newest().ids.has(p.id)) tags.push("new");
  return tags.slice(0, 2);
}

/* ---------- Карточки и списки ---------- */
function productCard(p) {
  const name = pick(p.name);
  const href = `product.html?id=${p.id}`;
  const imgStyle = p.pos ? ` style="object-position:${p.pos}"` : "";
  const tags = productTags(p).map((k, i) => `<span class="badge tag${i ? " t2" : ""}">${t("badge." + k)}</span>`).join("");
  const on = isWished(p.id);
  return `<article class="product-card" data-cat="${p.cat}" data-href="${href}"><div class="media"><span class="badge">${t("cat." + p.cat)}</span>${tags}<img class="product-img${p.fit === "contain" ? " contain" : ""}"${imgStyle} loading="lazy" src="${p.img}" alt="${name}"><button class="qv-btn" type="button" data-action="quick" data-id="${p.id}">${t("quick.open")}</button><button class="wish-btn${on ? " on" : ""}" type="button" data-action="wish" data-id="${p.id}" aria-label="${t(on ? "wish.remove" : "wish.add")}">${on ? "♥" : "♡"}</button></div><div class="product-info"><div><h3><a href="${href}">${name}</a></h3><p>${pick(p.desc).slice(0, 58)}…</p></div><span class="price" data-price="${p.price}">${money(p.price)}</span></div></article>`;
}

function renderList(target, list) {
  const el = $(target);
  if (!el) return;
  el.innerHTML = list.map(productCard).join("");
  watchImages(el);
}

export function renderNew(target, limit = 6) { renderList(target, newProducts(limit)); }
export function renderPopular(target, limit = 6) { renderList(target, popularProducts(limit)); }

/* ---------- Коллекции ---------- */
const collectionProducts = id => products.filter(p => p.collection === id);

function collectionCard(c) {
  const cover = productById(c.cover) ?? collectionProducts(c.id)[0];
  const name = pick(c.name);
  const href = `collection.html?id=${c.id}`;
  const imgStyle = cover?.pos ? ` style="object-position:${cover.pos}"` : "";
  return `<article class="product-card" data-href="${href}"><div class="media"><span class="badge">${collectionProducts(c.id).length} ${t("home.pieces")}</span>${cover ? `<img class="product-img"${imgStyle} loading="lazy" src="${cover.img}" alt="${name}">` : ""}</div><div class="product-info"><div><h3><a href="${href}">${name}</a></h3><p>${pick(c.desc).slice(0, 70)}…</p></div></div></article>`;
}

export function renderCollections(target, limit = 99) {
  const el = $(target);
  if (!el) return;
  el.innerHTML = COLLECTIONS.filter(c => collectionProducts(c.id).length).slice(0, limit).map(collectionCard).join("");
  watchImages(el);
}

// Шапка страницы одной коллекции (collection.html?id=)
const pageCollectionId = () => new URLSearchParams(location.search).get("id");

export function renderCollectionHead() {
  const el = $("#collectionHead");
  if (!el) return;
  const c = collectionById(pageCollectionId());
  if (!c) {
    document.title = t("meta.collections");
    el.innerHTML = `<div class="eyebrow">${t("collection.eyebrow")}</div><h1>${t("collection.notfound")}</h1><a class="btn" href="collections.html" style="margin-top:20px">${t("collection.all")}</a>`;
    return;
  }
  setPageMeta({ title: `${pick(c.name)} — LEGACY`, description: pick(c.desc), image: productById(c.cover)?.img, path: `/collection.html?id=${c.id}` });
  el.innerHTML = `<div class="eyebrow">${t("collection.eyebrow")}</div><h1>${pick(c.name)}</h1><p style="max-width:640px;color:var(--muted);line-height:1.7">${pick(c.desc)}</p>`;
}

/* ---------- Каталог ---------- */
// Состояние фильтров живёт в URL: ?cat=&collection=&sort=&q=&price=
const SORTS = ["default", "popular", "new", "price-asc", "price-desc", "name"];
const params = new URLSearchParams(location.search);
let activeCat = params.get("cat") || "All";
let activeCol = params.get("collection") || "All";
let activeSort = SORTS.includes(params.get("sort")) ? params.get("sort") : "default";
let activeQuery = params.get("q") || "";
let activePrice = Number(params.get("price")) > 0 ? Number(params.get("price")) : null; // null = без ограничения

export function setFilter(cat) { activeCat = cat; renderCatalog(); }
export function setCollectionFilter(col) { activeCol = col; renderCatalog(); }
export function setSort(sort) { activeSort = sort; renderCatalog(); }
export function setQuery(q) { activeQuery = q.trim(); renderCatalog(); }
export function setPrice(v, max) { activePrice = v >= max ? null : v; renderCatalog(); }

export function renderHomeCount() {
  const el = $("#homeCount");
  if (!el) return;
  const pad = n => String(n).padStart(2, "0");
  el.textContent = `${pad(Math.min(6, products.length))} / ${pad(products.length)} ${t("home.pieces")}`;
}

// Собственное выпадающее меню поверх настоящего <select> (стандартный список не стилизуется).
function buildMenus() {
  document.querySelectorAll(".sel").forEach(box => {
    const select = box.querySelector("select");
    if (!select) return;
    box.querySelector(".sel-btn")?.remove();
    box.querySelector(".sel-menu")?.remove();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sel-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = select.options[select.selectedIndex]?.text ?? "";
    btn.setAttribute("aria-label", `${box.querySelector(":scope > span")?.textContent ?? ""}: ${btn.textContent}`);
    const menu = document.createElement("ul");
    menu.className = "sel-menu";
    menu.setAttribute("role", "listbox");
    [...select.options].forEach(o => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.tabIndex = -1;
      li.setAttribute("aria-selected", String(o.value === select.value));
      li.dataset.value = o.value;
      li.textContent = o.text;
      if (o.value === select.value) li.className = "current";
      menu.append(li);
    });
    box.append(btn, menu);
  });
}

const norm = s => String(s).toLowerCase().replace(/ё/g, "е");

// Всё, по чему ищем: названия на всех языках, категория, коллекция, цвета.
function haystack(p) {
  const col = collectionById(p.collection);
  return norm([
    ...LANGS.map(l => p.name[l]), p.cat, t("cat." + p.cat),
    ...(col ? LANGS.map(l => col.name[l]) : []), ...p.colors.map(c => t("color." + c))
  ].join(" "));
}

const matchesQuery = (p, q) => norm(q).split(/\s+/).filter(Boolean).every(tok => haystack(p).includes(tok));

// Подсказки поиска: товары по названию и категории
export function renderSuggest(q = "") {
  const box = $("#searchSuggest");
  if (!box) return;
  const query = norm(q.trim());
  const host = box.closest(".sel");
  if (!query) { box.innerHTML = ""; host?.classList.remove("open"); return; }
  const cats = CATEGORIES.filter(c => norm(t("cat." + c)).includes(query)).slice(0, 2);
  const prods = products.filter(p => LANGS.some(l => norm(p.name[l]).includes(query))).slice(0, 5);
  const items = [
    ...cats.map(c => `<li data-type="category" data-cat="${c}">${t("cat." + c)}<small>${t("search.category")}</small></li>`),
    ...prods.map(p => `<li data-type="product" data-id="${p.id}">${pick(p.name)}<small>${t("cat." + p.cat)}</small></li>`)
  ];
  box.innerHTML = items.join("");
  host?.classList.toggle("open", items.length > 0);
}

function syncUrl(maxPrice, scope) {
  const p = new URLSearchParams(location.search);
  const set = (k, v, on) => (on ? p.set(k, v) : p.delete(k));
  set("cat", activeCat, activeCat !== "All");
  set("collection", activeCol, !scope && activeCol !== "All");
  set("sort", activeSort, activeSort !== "default");
  set("q", activeQuery, activeQuery !== "");
  set("price", activePrice, activePrice !== null && activePrice < maxPrice);
  const qs = p.toString();
  try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "")); } catch { /* file:// и т.п. */ }
}

export function renderCatalog() {
  const grid = $("#catalogGrid");
  if (!grid) return;

  // Страница коллекции ограничивает товары своей коллекцией, на странице каталога — все товары.
  const scope = $("#collectionHead") ? pageCollectionId() : null;
  const base = scope ? collectionProducts(scope) : products;

  const cats = CATEGORIES.filter(c => base.some(p => p.cat === c));
  if (activeCat !== "All" && !cats.includes(activeCat)) activeCat = "All";
  const cols = COLLECTIONS.filter(c => collectionProducts(c.id).length);
  if (activeCol !== "All" && !cols.some(c => c.id === activeCol)) activeCol = "All";

  // Категория, коллекция и сортировка — компактные выпадающие списки вместо рядов кнопок.
  const catSel = $("#categorySelect");
  if (catSel) {
    catSel.innerHTML = ["All", ...cats].map(c => `<option value="${c}">${t("cat." + c)}</option>`).join("");
    catSel.value = activeCat;
  }
  const colSel = $("#collectionSelect");
  if (colSel) {
    colSel.innerHTML = [`<option value="All">${t("filter.allCollections")}</option>`, ...cols.map(c => `<option value="${c.id}">${pick(c.name)}</option>`)].join("");
    colSel.value = activeCol;
  }
  const sortSel = $("#sortSelect");
  if (sortSel) {
    sortSel.innerHTML = SORTS.map(s => `<option value="${s}">${t("sort." + s)}</option>`).join("");
    sortSel.value = activeSort;
  }

  // Поиск и ползунок цены
  const search = $("#searchInput");
  if (search && search !== document.activeElement) search.value = activeQuery;
  const maxPrice = Math.max(5, Math.ceil(Math.max(...base.map(p => p.price)) / 5) * 5);
  if (activePrice !== null && activePrice >= maxPrice) activePrice = null;
  const range = $("#priceRange");
  if (range) {
    range.min = 0; range.max = maxPrice; range.step = 5;
    range.value = activePrice ?? maxPrice;
    range.dataset.max = maxPrice;
    range.style.setProperty("--p", (Number(range.value) / maxPrice * 100).toFixed(1) + "%"); // заливка пройденной части дорожки
    const label = $("#priceValue");
    if (label) label.textContent = money(Number(range.value));
  }

  // Выбранный (не «по умолчанию») фильтр подсвечиваем тёмным, чтобы было видно, что он включён.
  const on = (el, isOn) => el?.closest(".sel")?.classList.toggle("on", isOn);
  on(catSel, activeCat !== "All");
  on(colSel, activeCol !== "All");
  on(sortSel, activeSort !== "default");
  on(search, activeQuery !== "");
  on(range, activePrice !== null);
  buildMenus();

  let list = base.filter(p =>
    (activeCat === "All" || p.cat === activeCat) &&
    (scope || activeCol === "All" || p.collection === activeCol) &&
    (activePrice === null || p.price <= activePrice) &&
    (!activeQuery || matchesQuery(p, activeQuery)));
  if (activeSort === "popular") list = [...list].sort((a, b) => popularScore(b) - popularScore(a));
  else if (activeSort === "new") list = [...list].sort(byAddedDesc);
  else if (activeSort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  else if (activeSort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  else if (activeSort === "name") list = [...list].sort((a, b) => pick(a.name).localeCompare(pick(b.name), state.lang));

  grid.innerHTML = list.length ? list.map(productCard).join("") : `<p class="empty">${t("catalog.empty")}</p>`;
  watchImages(grid);
  syncUrl(maxPrice, scope);
}

/* ---------- Страница товара ---------- */
// Оттенки для кружков-образцов цвета (названия остаются в подсказке и для скринридеров)
export const COLOR_HEX = { black: "#141414", white: "#ffffff", ivory: "#efe6d0", grey: "#8c8c8c", indigo: "#1f2a47", brown: "#6a4631", taupe: "#a8978a" };

// Выбор цвета: кружки-кнопки, первый цвет выбран по умолчанию, рядом подпись с названием выбранного
export function colorPicker(p) {
  if (!p.colors.length) return "";
  const dots = p.colors.map((c, i) => `<button type="button" class="swatch${i === 0 ? " active" : ""}" data-color="${c}" style="background:${COLOR_HEX[c] ?? "#ccc"}" title="${t("color." + c)}" aria-label="${t("color." + c)}" aria-pressed="${i === 0}"></button>`).join("");
  return `<p class="colors"><span class="eyebrow">${t("product.color")}</span> ${dots} <span class="color-name">${t("color." + p.colors[0])}</span></p>`;
}

let viewTracked = false; // перерисовка при смене языка не должна накручивать просмотры

export function stockKey(p) { return p.stock <= 0 ? "product.out" : p.stock <= LOW_STOCK ? "product.low" : "product.in"; }

export function sizeButtons(p) {
  const chosen = defaultSize(p);
  return p.sizes.map(s => `<button class="size${s === chosen ? " active" : ""}" type="button" data-size="${s}" aria-pressed="${s === chosen}"${sizeSoldOut(p, s) ? " disabled" : ""}>${sizeLabel(s)}</button>`).join("");
}

function renderCrumbs(p) {
  const box = $("#crumbs");
  if (!box) return;
  const sep = `<span class="sep">/</span>`;
  box.innerHTML = [
    `<a href="index.html">${t("nav.home")}</a>`,
    `<a href="catalog.html">${t("nav.collection")}</a>`,
    ...(p ? [`<a href="catalog.html?cat=${p.cat}">${t("cat." + p.cat)}</a>`, `<span>${pick(p.name)}</span>`] : [])
  ].join(sep);
}

function renderRelated(p) {
  const similarSection = $("#similarSection");
  const recentSection = $("#recentSection");
  const fill = (section, grid, list) => {
    if (!section) return;
    section.hidden = !list.length;
    if (list.length) renderList(grid, list);
  };
  if (!p) { fill(similarSection, "#similarGrid", []); fill(recentSection, "#recentGrid", []); return; }
  // Похожие: сначала та же категория, потом та же коллекция
  const score = q => (q.cat === p.cat ? 2 : 0) + (q.collection === p.collection ? 1 : 0);
  const similar = products.filter(q => q.id !== p.id && score(q) > 0).sort((a, b) => score(b) - score(a) || popularScore(b) - popularScore(a)).slice(0, 3);
  const recent = state.recent.filter(id => id !== p.id).map(productById).filter(Boolean).slice(0, 3);
  fill(similarSection, "#similarGrid", similar);
  fill(recentSection, "#recentGrid", recent);
}

export function renderProduct() {
  const el = $("#productDetail");
  if (!el) return;
  const id = new URLSearchParams(location.search).get("id");
  const p = productById(id);

  // Неверный или пустой ?id= — понятная страница вместо чужого товара
  if (!p) {
    document.title = t("meta.product");
    renderCrumbs(null);
    el.innerHTML = `<div class="detail-copy"><div class="eyebrow">${t("product.notfound.eyebrow")}</div><h1>${t("product.notfound")}</h1><a class="btn" href="catalog.html" style="margin-top:20px">${t("product.back")}</a></div>`;
    renderRelated(null);
    return;
  }

  const name = pick(p.name);
  const crumbPath = `product.html?id=${p.id}`;
  setPageMeta({ title: `${name} — LEGACY`, description: pick(p.desc).slice(0, 200), image: p.img, path: "/" + crumbPath });
  setJsonLd("ld-product", productLd(p, { name, description: pick(p.desc), url: location.origin.startsWith("http") ? `${location.origin}/${crumbPath}` : crumbPath, category: t("cat." + p.cat) }));
  setJsonLd("ld-breadcrumbs", breadcrumbLd([
    { name: t("nav.home"), path: "index.html" }, { name: t("nav.collection"), path: "catalog.html" },
    { name: t("cat." + p.cat), path: `catalog.html?cat=${p.cat}` }, { name, path: crumbPath }
  ]));

  if (!viewTracked) {
    viewTracked = true;
    // Просмотры считаем до отрисовки «недавних», сам товар в их список попадает после.
    setState({ views: { ...state.views, [p.id]: (state.views[p.id] ?? 0) + 1 } });
  }

  const col = collectionById(p.collection);
  const meta = [
    col ? `<p><span class="eyebrow">${t("product.collection")}</span> <a href="collection.html?id=${col.id}">${pick(col.name)}</a></p>` : "",
    colorPicker(p),
    `<p><span class="eyebrow">${t("product.availability")}</span> ${t(stockKey(p))}</p>`
  ].join("");
  const guide = p.sizes[0] === "ONE" ? "" : `<button class="link-btn" type="button" data-action="size-guide" data-id="${p.id}">${t("product.sizeGuide")}</button>`;
  const on = isWished(p.id);

  renderCrumbs(p);
  el.innerHTML = `<div class="zoom" role="button" tabindex="0" aria-label="${t("a11y.zoom")}" data-action="lightbox" data-src="${p.img}" data-alt="${name}"><img src="${p.img}" alt="${name}"></div><div class="detail-copy" data-size-scope><div class="eyebrow">${t("cat." + p.cat)}</div><h1>${name}</h1><p>${pick(p.desc)}</p>${meta}<div class="big-price" data-price="${p.price}">${money(p.price)}</div><div class="eyebrow">${t("product.size")}</div><div class="sizes">${sizeButtons(p)}</div>${guide}<button class="btn dark wide" data-action="add" data-id="${p.id}"${p.stock <= 0 ? " disabled" : ""}>${t("product.add")}</button><button class="btn wide wish-wide${on ? " on" : ""}" type="button" data-action="wish" data-id="${p.id}" data-label>${on ? "♥" : "♡"} ${t(on ? "wish.remove" : "wish.add")}</button></div>`;

  renderRelated(p);

  // Запоминаем просмотр после отрисовки «недавних», чтобы текущий товар в них не попал.
  if (state.recent[0] !== p.id) setState({ recent: [p.id, ...state.recent.filter(x => x !== p.id)].slice(0, 8) });
}

/* ---------- Корзина ---------- */
// Размер и цвет позиции текстом (для корзины, мини-корзины, оформления и заказов)
export function variantText(item) {
  const size = item.size ? `${t("cart.size")}: ${sizeLabel(item.size)}` : "";
  const color = item.color ? `${t("product.color")}: <span class="swatch mini" style="background:${COLOR_HEX[item.color] ?? "#ccc"}"></span> ${t("color." + item.color)}` : "";
  return [size, color].filter(Boolean).join(" · ");
}

// Полоса прогресса до бесплатной доставки
export function shipProgressHtml(payable) {
  const left = FREE_SHIPPING_FROM - payable;
  const pct = Math.min(100, Math.max(0, payable / FREE_SHIPPING_FROM * 100));
  const text = left > 0 ? t("ship.left").replace("{sum}", `<b data-price="${left}">${money(left)}</b>`) : t("ship.free");
  return `<div class="ship${left <= 0 ? " done" : ""}"><p>${text}</p><div class="ship-bar"><i style="width:${pct.toFixed(1)}%"></i></div></div>`;
}

// Строки итогов: сумма, скидка, (доставка), итого
export function totalRowsHtml(tt, withShipping = false, shippingLabelKey = "cart.shipping") {
  const row = (label, price, cls = "") => `<div class="sum-row ${cls}"><span>${label}</span><strong data-price="${price}">${money(price)}</strong></div>`;
  const shipping = withShipping
    ? `<div class="sum-row"><span>${t(shippingLabelKey)}</span><strong${tt.shipping ? ` data-price="${tt.shipping}"` : ""}>${tt.shipping ? money(tt.shipping) : t("delivery.free")}</strong></div>`
    : "";
  const promoShip = tt.status?.valid && tt.status.promo.type === "shipping" && !tt.discount;
  return [
    row(t("cart.subtotal"), tt.sub),
    tt.discount ? row(`${t("cart.discount")} · ${tt.status.code}`, -tt.discount, "disc") : "",
    promoShip ? `<div class="sum-row disc"><span>${tt.status.code}</span><strong>${t("promo.freeship")}</strong></div>` : "",
    shipping,
    row(t("cart.total"), tt.total, "grand")
  ].join("");
}

/* Промокод: форма или применённый код */
let promoNote = null; // последняя ошибка ввода { reason, min }

export async function submitPromo(raw) {
  const res = await applyPromo(raw);
  promoNote = res.ok ? null : { reason: res.reason, min: res.min };
  if (!res.ok) renderCart();
  return res.ok;
}

export function dropPromo() { promoNote = null; removePromo(); }

function promoHtml(tt) {
  if (state.promo && tt.status) {
    const s = tt.status;
    const what = !s.valid
      ? `<em class="warn">${t("promo.min").replace("{min}", money(s.min ?? 0))}</em>`
      : s.promo.type === "percent" ? `−${s.promo.value}%` : t("promo.freeship");
    return `<div class="promo-applied"><span><b>${s.code}</b> ${what}</span><button class="link-btn" type="button" data-action="promo-remove">${t("promo.remove")}</button></div>`;
  }
  const err = promoNote
    ? `<p class="promo-msg">${promoNote.reason === "min" ? t("promo.min").replace("{min}", money(promoNote.min)) : t({ empty: "promo.empty", expired: "promo.expired", limit: "promo.limit", rate: "promo.rate" }[promoNote.reason] || "promo.invalid")}</p>`
    : "";
  return `<form class="promo" id="promoForm" autocomplete="off"><input id="promoInput" type="text" placeholder="${t("promo.ph")}" aria-label="${t("promo.label")}"><button class="btn" type="submit">${t("promo.apply")}</button></form>${err}`;
}

export function renderCart() {
  const list = $("#cartList");
  if (!list) return;
  const summary = $("#cartSummary");
  const tt = totals();
  if (!tt.lines.length) {
    list.innerHTML = `<div class="empty">${t("cart.empty")}<br><a href="catalog.html" class="btn" style="margin-top:20px">${t("cart.explore")}</a></div>`;
    if (summary) summary.innerHTML = "";
    return;
  }
  list.innerHTML = tt.lines.map(line => {
    const p = line.product;
    const name = pick(p.name);
    const key = cartKey(line);
    return `<div class="cart-row"><img src="${p.img}" alt="${name}"><div><h3>${name}</h3><p>${t("cat." + p.cat)} · ${variantText(line)}</p></div><div class="qty"><button data-action="qty" data-key="${key}" data-d="-1">−</button><span>${line.qty}</span><button data-action="qty" data-key="${key}" data-d="1">+</button></div><strong data-price="${line.sum}">${money(line.sum)}</strong><button class="remove" data-action="remove" data-key="${key}">${t("cart.remove")}</button></div>`;
  }).join("");
  if (!summary) return;
  // Если пользователь печатает промокод, не сбрасываем поле при перерисовке
  const typing = document.activeElement?.id === "promoInput" ? document.activeElement.value : null;
  summary.innerHTML = `<div class="cart-summary"><div class="cs-left">${shipProgressHtml(tt.payable)}<div class="eyebrow">${t("promo.label")}</div>${promoHtml(tt)}</div><div class="cs-right">${totalRowsHtml(tt)}<p class="note">${t("cart.shipNote")}</p><a class="btn dark wide" href="checkout.html">${t("cart.request")}</a><a class="link-btn" href="orders.html">${t("orders.title")}</a></div></div>`;
  if (typing !== null) { const input = $("#promoInput"); if (input) { input.value = typing; input.focus(); } }
}
