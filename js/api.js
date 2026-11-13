// Загрузка актуального каталога с сервера. Если сервера нет (обычный http.server, офлайн) — остаются исходные данные из data.js.
import { applyCatalog } from "./data.js";
import { extendDict } from "./i18n.js";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export async function loadCatalog() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch("/api/catalog", { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) return false;
    const c = await res.json();
    if (!Array.isArray(c?.products)) return false;
    applyCatalog(c);
    // Названия новых/переименованных категорий приходят с сервера
    for (const cat of c.categories) for (const lang of ["ru", "en", "uz"]) extendDict(lang, "cat." + cat.id, cat.name[lang]);
    renderContacts(c.settings.contacts);
    return true;
  } catch {
    return false;
  }
}

// Контакты магазина в подвале (редактируются в админке: «Настройки»)
function renderContacts(c) {
  const link = (text, href) => `<a href="${esc(href)}"${href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(text)}</a>`;
  const handle = (v, base) => (/^https?:/.test(v) ? v : base + v.replace(/^@/, ""));
  const parts = [
    c.instagram && link("Instagram", handle(c.instagram, "https://instagram.com/")),
    c.telegram && link("Telegram", handle(c.telegram, "https://t.me/")),
    c.phone && link(c.phone, "tel:" + c.phone.replace(/[^\d+]/g, "")),
    c.email && link(c.email, "mailto:" + c.email)
  ].filter(Boolean);
  if (!parts.length) return;
  document.querySelectorAll(".footer > div:last-child > p:first-child").forEach(p => { p.innerHTML = parts.join(" · "); });
}
