// Модальные окна: быстрый просмотр, лайтбокс фото, таблица размеров.
import { COLLECTIONS, CATEGORIES, products } from "./data.js";
import { t, pick } from "./i18n.js";
import { money, productById, sizeButtons, stockKey, isWished, colorPicker, cartKey, variantText, shipProgressHtml, totalRowsHtml } from "./shop.js";
import { totals } from "./pricing.js";
import { state } from "./store.js";

let render = null; // функция, которая строит содержимое открытого окна (нужна для смены языка)

function ensureModal() {
  let m = document.querySelector("#modal");
  if (!m) {
    m = document.createElement("div");
    m.id = "modal";
    m.className = "modal";
    m.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true"><button class="modal-close" type="button" data-action="close-modal">×</button><div class="modal-body"></div></div>';
    document.body.append(m);
  }
  return m;
}

let lastFocus = null; // куда вернуть фокус после закрытия окна или панели

function open(fn, cls = "") {
  render = fn;
  const m = ensureModal();
  if (!m.classList.contains("open")) lastFocus = document.activeElement;
  m.className = `modal open ${cls}`.trim();
  paint();
  document.body.classList.add("no-scroll");
  // Фокус внутрь окна: на поле ввода, если оно есть, иначе на первую кнопку/ссылку
  const box = m.querySelector(".modal-box");
  const first = box.querySelector("input:not([type=hidden]), button:not(.modal-close), a[href], select, textarea") || m.querySelector(".modal-close");
  first?.focus({ preventScroll: true });
}

function paint() {
  const m = document.querySelector("#modal");
  if (!m || !render) return;
  m.querySelector(".modal-body").innerHTML = render();
  m.querySelector(".modal-close").setAttribute("aria-label", t("modal.close"));
  // Читалка экрана называет окно по его заголовку (или по подсказке поля поиска)
  const heading = m.querySelector("h2, h3, #palInput");
  m.querySelector(".modal-box").setAttribute("aria-label", heading?.textContent || heading?.getAttribute("aria-label") || t("modal.close"));
}

export function closeModal() {
  const m = document.querySelector("#modal");
  const wasOpen = m?.classList.contains("open");
  if (m) m.classList.remove("open");
  if (!drawerOpen) document.body.classList.remove("no-scroll");
  render = null;
  if (wasOpen && lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  lastFocus = null;
}

export const isModalOpen = () => document.querySelector("#modal")?.classList.contains("open");

// После смены языка/валюты содержимое открытого окна перерисовывается
export function refreshModal() { if (isModalOpen()) paint(); }

/* ---------- Быстрый просмотр ---------- */
export function openQuickView(id) {
  const p = productById(id);
  if (!p) return;
  open(() => {
    const name = pick(p.name);
    const on = isWished(p.id);
    const col = COLLECTIONS.find(c => c.id === p.collection);
    return `<div class="qv"><img src="${p.img}" alt="${name}"${p.pos ? ` style="object-position:${p.pos}"` : ""}><div class="detail-copy" data-size-scope><div class="eyebrow">${t("cat." + p.cat)}${col ? " · " + pick(col.name) : ""}</div><h2>${name}</h2><p>${pick(p.desc)}</p><p><span class="eyebrow">${t("product.availability")}</span> ${t(stockKey(p))}</p>${colorPicker(p)}<div class="big-price" data-price="${p.price}">${money(p.price)}</div><div class="eyebrow">${t("product.size")}</div><div class="sizes">${sizeButtons(p)}</div><button class="btn dark wide" data-action="add" data-id="${p.id}"${p.stock <= 0 ? " disabled" : ""}>${t("product.add")}</button><button class="btn wide wish-wide${on ? " on" : ""}" type="button" data-action="wish" data-id="${p.id}" data-label>${on ? "♥" : "♡"} ${t(on ? "wish.remove" : "wish.add")}</button><a class="link-btn" href="product.html?id=${p.id}">${t("quick.full")}</a></div></div>`;
  }, "quick");
}

/* ---------- Лайтбокс ---------- */
export function openLightbox(src, alt = "") {
  open(() => `<img src="${src}" alt="${alt}" data-action="close-modal">`, "lightbox");
}

/* ---------- Таблица размеров ---------- */
const CLOTHES = [["XS", 80, 62, 86], ["S", 84, 66, 90], ["M", 88, 70, 94], ["L", 92, 74, 98], ["XL", 96, 78, 102]];
const SHOES = [["36", "23.0"], ["37", "23.5"], ["38", "24.0"], ["39", "24.7"], ["40", "25.3"]];

export function openSizeGuide(id) {
  const p = productById(id);
  if (!p) return;
  open(() => {
    const shoes = p.cat === "Shoes";
    const head = shoes
      ? `<th>${t("sizeguide.size")}</th><th>${t("sizeguide.foot")}</th>`
      : `<th>${t("sizeguide.size")}</th><th>${t("sizeguide.bust")}</th><th>${t("sizeguide.waist")}</th><th>${t("sizeguide.hips")}</th>`;
    const rows = (shoes ? SHOES : CLOTHES).map(r => `<tr>${r.map((c, i) => `<${i ? "td" : "th"}>${c}</${i ? "td" : "th"}>`).join("")}</tr>`).join("");
    return `<div class="size-guide"><div class="eyebrow">${t("cat." + p.cat)}</div><h2>${t("sizeguide.title")}</h2><table class="size-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table><p class="note">${t("sizeguide.note")}</p></div>`;
  }, "guide");
}

/* ---------- Командная палитра (Ctrl+K): быстрый переход к страницам, коллекциям, категориям и товарам ---------- */
let palIdx = 0;
const norm = s => String(s).toLowerCase().replace(/ё/g, "е");
const PAGES = [["nav.home", "index.html"], ["nav.collection", "catalog.html"], ["nav.collections", "collections.html"], ["nav.about", "about.html"], ["nav.contact", "contact.html"], ["nav.bag", "cart.html"], ["nav.wishlist", "wishlist.html"], ["nav.orders", "orders.html"]];

function paletteItems(q) {
  const query = norm(q.trim());
  const pages = PAGES.map(([k, href]) => ({ type: "palette.pages", label: t(k), href }));
  const cols = COLLECTIONS.map(c => ({ type: "palette.collections", label: pick(c.name), href: `collection.html?id=${c.id}`, hay: ["ru", "en", "uz"].map(l => c.name[l]).join(" ") }));
  if (!query) return [...pages, ...cols].slice(0, 9);
  const cats = CATEGORIES.map(c => ({ type: "palette.categories", label: t("cat." + c), href: `catalog.html?cat=${c}` }));
  const prods = products.map(p => ({ type: "palette.products", label: pick(p.name), href: `product.html?id=${p.id}`, hay: ["ru", "en", "uz"].map(l => p.name[l]).join(" ") }));
  return [...pages, ...cols, ...cats, ...prods].filter(it => norm(it.hay ?? it.label).includes(query)).slice(0, 9);
}

function paletteList(q) {
  const items = paletteItems(q);
  palIdx = 0;
  return items.length
    ? items.map((it, i) => `<li data-href="${it.href}" class="${i === 0 ? "on" : ""}"><span>${it.label}</span><small>${t(it.type)}</small></li>`).join("")
    : `<li class="none">${t("palette.none")}</li>`;
}

export function openPalette() {
  open(() => `<div class="pal"><input id="palInput" type="text" autocomplete="off" placeholder="${t("palette.ph")}" aria-label="${t("palette.open")}"><ul id="palList">${paletteList("")}</ul><div class="hint-bar">${t("palette.hint")}</div></div>`, "palette");
  document.querySelector("#palInput")?.focus();
}

export const isPaletteOpen = () => Boolean(document.querySelector("#modal.open.palette"));
export function updatePalette(q) { const ul = document.querySelector("#palList"); if (ul) ul.innerHTML = paletteList(q); }
export function movePalette(d) {
  const items = [...document.querySelectorAll("#palList li[data-href]")];
  if (!items.length) return;
  palIdx = (palIdx + d + items.length) % items.length;
  items.forEach((li, i) => li.classList.toggle("on", i === palIdx));
  items[palIdx].scrollIntoView({ block: "nearest" });
}
export function choosePalette() { const li = document.querySelectorAll("#palList li[data-href]")[palIdx]; if (li) location.href = li.dataset.href; }

/* ---------- Мини-корзина (выезжает справа при добавлении товара) ---------- */
let drawerOpen = false;

function ensureDrawer() {
  let d = document.querySelector("#drawer");
  if (!d) {
    d = document.createElement("div");
    d.id = "drawer";
    d.className = "drawer";
    d.innerHTML = `<div class="drawer-overlay" data-action="close-drawer"></div><aside class="drawer-panel" role="dialog" aria-modal="true" aria-label="${t("nav.bag")}"></aside>`;
    document.body.append(d);
  }
  return d;
}

function paintDrawer() {
  const panel = ensureDrawer().querySelector(".drawer-panel");
  const tt = totals();
  const count = state.cart.reduce((s, x) => s + x.qty, 0);
  const head = `<div class="dr-head"><h3>${t("nav.bag")}${count ? ` (${count})` : ""}</h3><button class="modal-close" type="button" data-action="close-drawer" aria-label="${t("modal.close")}">×</button></div>`;
  if (!tt.lines.length) {
    panel.innerHTML = `${head}<div class="dr-body"><div class="empty">${t("cart.empty")}<br><button class="btn" type="button" data-action="close-drawer" style="margin-top:20px">${t("cart.explore")}</button></div></div>`;
    return;
  }
  const rows = tt.lines.map(l => {
    const p = l.product;
    const name = pick(p.name);
    const key = cartKey(l);
    return `<div class="dr-row"><img src="${p.img}" alt="${name}"><div><h4>${name}</h4><p>${variantText(l)}</p><div class="qty"><button data-action="qty" data-key="${key}" data-d="-1">−</button><span>${l.qty}</span><button data-action="qty" data-key="${key}" data-d="1">+</button></div></div><div class="dr-side"><strong data-price="${l.sum}">${money(l.sum)}</strong><button class="remove" data-action="remove" data-key="${key}">${t("cart.remove")}</button></div></div>`;
  }).join("");
  panel.innerHTML = `${head}<div class="dr-body">${rows}</div><div class="dr-foot">${shipProgressHtml(tt.payable)}${totalRowsHtml(tt)}<a class="btn dark wide" href="checkout.html">${t("cart.request")}</a><a class="btn wide" href="cart.html">${t("cart.toCart")}</a></div>`;
}

let drawerReturn = null;

export function openDrawer() {
  if (!drawerOpen) drawerReturn = document.activeElement;
  drawerOpen = true;
  paintDrawer();
  const d = ensureDrawer();
  // Класс ставим на следующем кадре, чтобы сработала анимация выезда
  requestAnimationFrame(() => { d.classList.add("open"); d.querySelector(".modal-close")?.focus({ preventScroll: true }); });
  document.body.classList.add("no-scroll");
}

export function closeDrawer() {
  const was = drawerOpen;
  drawerOpen = false;
  document.querySelector("#drawer")?.classList.remove("open");
  if (!isModalOpen()) document.body.classList.remove("no-scroll");
  if (was && drawerReturn?.isConnected) drawerReturn.focus({ preventScroll: true });
  drawerReturn = null;
}

// Не даём Tab уходить за пределы открытого окна или панели
export function trapTab(e) {
  const box = document.querySelector("#modal.open .modal-box") || (drawerOpen && document.querySelector("#drawer.open .drawer-panel"));
  if (!box) return;
  const items = [...box.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items.at(-1);
  if (e.shiftKey && (document.activeElement === first || !box.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (document.activeElement === last || !box.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
}

export const isDrawerOpen = () => drawerOpen;
export function refreshDrawer() { if (drawerOpen) paintDrawer(); }
