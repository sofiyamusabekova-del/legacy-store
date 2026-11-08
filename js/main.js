import { LANGS } from "./data.js";
import { state, setState, subscribe } from "./store.js";
import { applyI18n, t } from "./i18n.js";
import {
  addToCart, changeQty, removeItem, renderCount, renderProducts,
  renderCatalog, renderHomeCount, renderProduct, renderCart, refreshPrices, setFilter, toast
} from "./shop.js";

function render() {
  renderProducts("#featuredGrid", 6);
  renderHomeCount();
  renderCatalog();
  renderProduct();
  renderCart();
  applyI18n();
  renderCount();
  refreshPrices();
}

// Реакция на изменение состояния: язык/валюта — полная перерисовка, корзина — точечно.
subscribe(patch => {
  if ("lang" in patch || "currency" in patch) render();
  else if ("cart" in patch) { renderCount(); renderCart(); refreshPrices(); }
});

// Все клики — через делегирование (без inline onclick).
document.addEventListener("click", e => {
  const el = e.target;

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
  const filter = el.closest(".filter");
  if (filter) { setFilter(filter.dataset.cat); return; }

  const action = el.closest("[data-action]");
  if (action) {
    const { id } = action.dataset;
    if (action.dataset.action === "add") addToCart(id);
    else if (action.dataset.action === "qty") changeQty(id, Number(action.dataset.d));
    else if (action.dataset.action === "remove") removeItem(id);
    return;
  }

  const card = el.closest("[data-href]");
  if (card && !el.closest("a")) location.href = card.dataset.href;
});

document.querySelector("#contactForm")?.addEventListener("submit", e => {
  e.preventDefault();
  toast(t("contact.thanks"));
  e.target.reset();
});

render();
