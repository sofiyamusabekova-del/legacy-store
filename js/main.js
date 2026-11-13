import { LANGS } from "./data.js";
import { state, setState, subscribe } from "./store.js";
import { applyI18n, t } from "./i18n.js";
import {
  addToCart, changeQty, removeItem, renderCount, renderNew, renderPopular, renderCollections, renderCollectionHead,
  renderCatalog, renderHomeCount, renderProduct, renderCart, refreshPrices, setFilter, setCollectionFilter, setSort,
  setQuery, setPrice, renderSuggest, toggleWish, renderWishCount, renderWishlist, syncWishButtons, toast,
  onAdded, submitPromo, dropPromo
} from "./shop.js";
import {
  openQuickView, openLightbox, openSizeGuide, closeModal, refreshModal, isModalOpen,
  openDrawer, closeDrawer, refreshDrawer, isDrawerOpen,
  openPalette, isPaletteOpen, updatePalette, movePalette, choosePalette, trapTab
} from "./ui.js";
import { setJsonLd } from "./seo.js";
import { initTheme, toggleTheme } from "./theme.js";
import { watchReveal, initScrollUi } from "./effects.js";
import { renderCheckout, initCheckout, renderOrderPage, renderOrders, refreshPayment } from "./checkout.js";
import { flushOutbox, sendContact } from "./notify.js";
import { loadCatalog } from "./api.js";

// После добавления в корзину выезжает мини-корзина
onAdded(openDrawer);

function render() {
  renderNew("#featuredGrid", 6);
  renderPopular("#popularGrid", 6);
  renderCollections("#homeCollections", 5);
  renderCollections("#collectionsGrid");
  renderCollectionHead();
  renderHomeCount();
  renderCatalog();
  renderProduct();
  renderCart();
  renderWishlist();
  renderCheckout();
  renderOrderPage();
  renderOrders();
  applyI18n();
  renderCount();
  renderWishCount();
  refreshDrawer();
  refreshPrices();
  refreshModal();
  document.querySelector(".to-top")?.setAttribute("aria-label", t("scroll.top"));
  markCurrentNav();
  watchReveal();
}

// Текущая страница в меню помечается для скринридеров (aria-current), у товара подсвечивается «Каталог»
function markCurrentNav() {
  const here = location.pathname.split("/").pop() || "index.html";
  const alias = { "product.html": "catalog.html", "collection.html": "collections.html" };
  document.querySelectorAll(".nav a").forEach(a => {
    if (a.getAttribute("href") === (alias[here] ?? here)) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}

// Реакция на изменение состояния: язык/валюта — полная перерисовка, корзина и избранное — точечно.
subscribe(patch => {
  if ("lang" in patch || "currency" in patch) render();
  else if ("cart" in patch || "promo" in patch) { renderCount(); renderCart(); renderCheckout(); refreshDrawer(); refreshPrices(); }
  else if ("wishlist" in patch) { renderWishCount(); syncWishButtons(); renderWishlist(); }
});

// Открывает/закрывает выпадающий список фильтра и сообщает об этом скринридеру
function setSelOpen(box, open) {
  box.classList.toggle("open", open);
  box.querySelector(".sel-btn")?.setAttribute("aria-expanded", String(open));
}

// Клавиатура в выпадающих списках: стрелки, Enter/пробел, Esc; Tab внутри окон и панелей не выходит наружу
document.addEventListener("keydown", e => {
  if (e.key === "Tab") { trapTab(e); return; }
  if ((e.key === "Enter" || e.key === " ") && e.target.matches?.('[role="button"][data-action]')) { e.preventDefault(); e.target.click(); return; }
  const btn = e.target.closest?.(".sel-btn");
  const li = e.target.closest?.(".sel-menu li[data-value]");
  if (btn && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
    e.preventDefault();
    const box = btn.closest(".sel");
    setSelOpen(box, true);
    (box.querySelector("li.current") || box.querySelector("li"))?.focus();
  } else if (li) {
    const items = [...li.parentElement.children], i = items.indexOf(li);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); li.click(); }
    else if (e.key === "Escape") { e.stopPropagation(); const box = li.closest(".sel"); setSelOpen(box, false); box.querySelector(".sel-btn").focus(); }
    else if (e.key === "Tab") setSelOpen(li.closest(".sel"), false);
  }
});

// Все клики — через делегирование (без inline onclick).
document.addEventListener("click", e => {
  const el = e.target;

  // Закрытие окна по клику на фон
  if (el.id === "modal") { closeModal(); return; }

  // Выпадающие меню фильтров: открыть/закрыть, выбрать пункт, закрыть при клике вне меню.
  const selBtn = el.closest(".sel-btn");
  const selItem = el.closest(".sel-menu li");
  const searchBox = el.closest(".sel.search");
  document.querySelectorAll(".sel.open").forEach(b => { if (b !== selBtn?.closest(".sel") && b !== searchBox) setSelOpen(b, false); });
  if (selBtn) { setSelOpen(selBtn.closest(".sel"), !selBtn.closest(".sel").classList.contains("open")); return; }
  if (selItem) {
    if (selItem.closest(".search")) {
      const { type, id, cat } = selItem.dataset;
      if (type === "product") location.href = `product.html?id=${id}`;
      else if (type === "category") {
        const input = document.querySelector("#searchInput");
        if (input) input.value = "";
        setQuery("");
        setFilter(cat);
        renderSuggest("");
      }
      return;
    }
    const select = selItem.closest(".sel").querySelector("select");
    const wasKeyboard = document.activeElement === selItem; // выбрано с клавиатуры: после перерисовки вернём фокус на кнопку списка
    select.value = selItem.dataset.value;
    select.dispatchEvent(new Event("change"));
    if (wasKeyboard) document.querySelector("#" + select.id)?.closest(".sel")?.querySelector(".sel-btn")?.focus();
    return;
  }

  const langBtn = el.closest("[data-lang]");
  if (langBtn) {
    if (LANGS.includes(langBtn.dataset.lang)) setState({ lang: langBtn.dataset.lang });
    return;
  }
  if (el.closest("#currencyToggle")) {
    setState({ currency: state.currency === "USD" ? "UZS" : "USD" });
    return;
  }
  if (el.closest(".menu-toggle")) {
    document.querySelector(".nav")?.classList.toggle("open");
    return;
  }

  // Выбор размера (на странице товара и в быстром просмотре)
  const sizeBtn = el.closest(".size");
  if (sizeBtn) {
    sizeBtn.parentElement.querySelectorAll(".size").forEach(b => {
      b.classList.toggle("active", b === sizeBtn);
      b.setAttribute("aria-pressed", String(b === sizeBtn));
    });
    return;
  }

  // Выбор цвета: подсвечиваем кружок и обновляем название рядом
  const swatch = el.closest("button.swatch");
  if (swatch) {
    const row = swatch.closest(".colors");
    row.querySelectorAll(".swatch").forEach(b => {
      b.classList.toggle("active", b === swatch);
      b.setAttribute("aria-pressed", String(b === swatch));
    });
    const name = row.querySelector(".color-name");
    if (name) name.textContent = swatch.title;
    return;
  }

  const action = el.closest("[data-action]");
  if (action) {
    const { id, key } = action.dataset;
    switch (action.dataset.action) {
      case "add": {
        const scope = action.closest("[data-size-scope]");
        const size = scope?.querySelector(".size.active")?.dataset.size;
        const color = scope?.querySelector(".swatch.active")?.dataset.color;
        if (isModalOpen()) closeModal(); // сначала закрываем окно, чтобы мини-корзина осталась с блокировкой прокрутки
        addToCart(id, size, color);
        break;
      }
      case "resend-order": retryOutbox(true); break;
      case "palette": openPalette(); break;
      case "theme": toggleTheme(); break;
      case "promo-remove": dropPromo(); break;
      case "close-drawer": closeDrawer(); break;
      case "qty": changeQty(key, Number(action.dataset.d)); break;
      case "remove": removeItem(key); break;
      case "wish": toggleWish(id); break;
      case "quick": openQuickView(id); break;
      case "lightbox": openLightbox(action.dataset.src, action.dataset.alt); break;
      case "size-guide": openSizeGuide(id); break;
      case "close-modal": closeModal(); break;
    }
    return;
  }

  const card = el.closest("[data-href]");
  if (card && !el.closest("a")) location.href = card.dataset.href;
});

// Командная палитра: Ctrl+K (⌘K на Mac), стрелки и Enter
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (isPaletteOpen()) closeModal(); else openPalette(); return; }
  if (!isPaletteOpen()) return;
  if (e.key === "ArrowDown") { e.preventDefault(); movePalette(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); movePalette(-1); }
  else if (e.key === "Enter") { e.preventDefault(); choosePalette(); }
});
document.addEventListener("input", e => { if (e.target.id === "palInput") updatePalette(e.target.value); });

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".sel.open").forEach(b => b.classList.remove("open"));
  if (isModalOpen()) closeModal();
  else if (isDrawerOpen()) closeDrawer();
});

// Форма промокода (в корзине)
document.addEventListener("submit", e => {
  if (e.target.id !== "promoForm") return;
  e.preventDefault();
  submitPromo(e.target.querySelector("#promoInput").value);
});

initCheckout();

document.querySelector("#categorySelect")?.addEventListener("change", e => setFilter(e.target.value));
document.querySelector("#collectionSelect")?.addEventListener("change", e => setCollectionFilter(e.target.value));
document.querySelector("#sortSelect")?.addEventListener("change", e => setSort(e.target.value));

const searchInput = document.querySelector("#searchInput");
searchInput?.addEventListener("input", e => { renderSuggest(e.target.value); setQuery(e.target.value); });
searchInput?.addEventListener("focus", e => renderSuggest(e.target.value));
searchInput?.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); renderSuggest(""); } });
document.querySelector("#priceRange")?.addEventListener("input", e => setPrice(Number(e.target.value), Number(e.target.dataset.max)));

// Форма обратной связи: отправка в Telegram через /api/contact
const contactForm = document.querySelector("#contactForm");
const LAST_CONTACT = "legacyLastContact";
contactForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector("button[type=submit]");
  const error = form.querySelector(".form-error");
  const label = btn.textContent;
  error.hidden = true;

  // Проверка полей на странице (понятные сообщения под каждым полем)
  const v = n => form.elements[n].value.trim();
  const problems = {};
  if (v("name").length < 2) problems.name = t("err.name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) problems.email = t("err.email");
  if (v("message").length < 10) problems.message = t("err.message");
  form.querySelectorAll(".field").forEach(f => {
    const input = f.querySelector("[name]");
    f.classList.toggle("bad", Boolean(problems[input.name]));
    f.querySelector(".err")?.remove();
    if (problems[input.name]) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
    if (problems[input.name]) {
      f.insertAdjacentHTML("beforeend", `<small class="err" id="cf-err-${input.name}">${problems[input.name]}</small>`);
      input.setAttribute("aria-describedby", "cf-err-" + input.name);
    } else input.removeAttribute("aria-describedby");
  });
  if (Object.keys(problems).length) { form.querySelector(".field.bad [name]").focus(); return; }

  // Защита от случайных повторов и спама: не чаще раза в 30 секунд с одного браузера
  let last = 0;
  try { last = Number(localStorage.getItem(LAST_CONTACT)) || 0; } catch { /* приватный режим */ }
  if (Date.now() - last < 30000) { error.textContent = t("contact.wait"); error.hidden = false; return; }
  btn.disabled = true;
  btn.textContent = t("contact.sending");
  const data = Object.fromEntries(new FormData(form));
  const ok = await sendContact({ name: data.name, email: data.email, message: data.message, website: data.website, elapsed: Math.round(performance.now()) });
  btn.disabled = false;
  btn.textContent = label;
  if (ok) {
    try { localStorage.setItem(LAST_CONTACT, String(Date.now())); } catch { /* приватный режим */ }
    toast(t("contact.thanks")); form.reset();
  }
  else { error.textContent = t("contact.error"); error.hidden = false; } // поля не очищаем, чтобы можно было отправить ещё раз
});

// Повторная отправка заказов магазину: при загрузке, при возвращении сети и по кнопке
function retryOutbox(force = false) {
  const done = () => renderOrderPage();
  const p = flushOutbox({ force });
  renderOrderPage(); // показываем «Отправляем…», пока идёт запрос
  p.then(done);
}
window.addEventListener("online", () => retryOutbox(true));

// Сначала подтягиваем актуальный каталог с сервера (до 2,5 с), без сервера остаются исходные данные
initTheme();
initScrollUi(t("scroll.top"));
await loadCatalog();
retryOutbox();
render();
refreshPayment();

// Описание магазина для поисковиков (только на главной)
if (document.querySelector("#featuredGrid")) {
  const origin = location.origin.startsWith("http") ? location.origin : "";
  setJsonLd("ld-site", {
    "@context": "https://schema.org", "@graph": [
      { "@type": "Organization", name: "LEGACY", url: origin + "/", logo: origin + "/icons/icon-512.png" },
      { "@type": "WebSite", name: "LEGACY", url: origin + "/", potentialAction: { "@type": "SearchAction", target: origin + "/catalog.html?q={search_term_string}", "query-input": "required name=search_term_string" } }
    ]
  });
}

// Сообщения о связи и офлайн-режим (service worker отдаёт сохранённые страницы и каталог)
window.addEventListener("offline", () => toast(t("net.offline")));
window.addEventListener("online", () => toast(t("net.online")));
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  const register = () => navigator.serviceWorker.register("sw.js").catch(() => { /* без service worker сайт работает как обычно */ });
  // (модуль с await может доехать до этой строки уже после события load)
  if (document.readyState === "complete") register(); else window.addEventListener("load", register);
}
