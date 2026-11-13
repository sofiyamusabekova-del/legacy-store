// Светлая/тёмная тема. По умолчанию следует настройке системы, выбор покупателя запоминается.
// Атрибут data-theme ставится ещё в <head> (маленький скрипт на каждой странице), чтобы не было вспышки светлой темы.
const KEY = "legacyTheme";
const media = window.matchMedia("(prefers-color-scheme: dark)");

const saved = () => { try { const v = localStorage.getItem(KEY); return v === "dark" || v === "light" ? v : null; } catch { return null; } };
export const currentTheme = () => (saved() ?? (media.matches ? "dark" : "light"));

function apply() {
  document.documentElement.dataset.theme = currentTheme();
}

export function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  try { localStorage.setItem(KEY, next); } catch { /* приватный режим: тема сменится до перезагрузки */ }
  document.documentElement.dataset.theme = next;
}

export function initTheme() {
  apply();
  // Пока пользователь сам ничего не выбрал, тема следует за системной
  media.addEventListener?.("change", () => { if (!saved()) apply(); });
}
