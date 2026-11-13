// Мелкие эффекты: появление блоков при прокрутке, «подпрыгивание» счётчиков, индикатор прокрутки и кнопка «наверх».
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Появление при прокрутке ---------- */
let observer = null;
const TARGETS = ".product-card, .section-head, .feature, .split-copy, .split-img, .stat, .co-aside, .order-card, .order-row, .page-title";

// Вызывается после каждой отрисовки: помечает новые элементы и следит за их появлением на экране
export function watchReveal() {
  if (reduce || !("IntersectionObserver" in window)) return;
  observer ??= new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); observer.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  document.querySelectorAll(TARGETS).forEach(el => {
    if (el.dataset.rv) return;
    el.dataset.rv = "1";
    const r = el.getBoundingClientRect();
    // Блоки, которые уже на экране при первой отрисовке, не анимируем (иначе страница «мигает»)
    if (r.top < innerHeight * 0.92 && r.bottom > 0 && !document.body.dataset.rvReady) return;
    el.style.setProperty("--d", (Math.min([...el.parentElement.children].indexOf(el), 5) % 3) * 0.08 + "s");
    el.classList.add("reveal");
    observer.observe(el);
  });
  document.body.dataset.rvReady = "1";
}

/* ---------- Счётчики корзины и избранного ---------- */
const last = {};
export function bumpCount(id, n) {
  const prev = last[id];
  last[id] = n;
  if (reduce || prev === undefined || n <= prev) return; // анимируем только рост (товар добавлен)
  document.querySelectorAll("#" + id).forEach(el => {
    el.classList.remove("bump");
    void el.offsetWidth; // перезапуск анимации
    el.classList.add("bump");
    el.closest(".icon-btn")?.classList.add("bump-icon");
    setTimeout(() => el.closest(".icon-btn")?.classList.remove("bump-icon"), 600);
  });
}

/* ---------- Индикатор прокрутки и «наверх» ---------- */
export function initScrollUi(label) {
  const bar = document.createElement("div");
  bar.className = "scroll-bar";
  bar.innerHTML = "<i></i>";
  const top = document.createElement("button");
  top.className = "to-top";
  top.type = "button";
  top.setAttribute("aria-label", label);
  top.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg>';
  top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
  document.body.append(bar, top);

  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.firstChild.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    top.classList.toggle("show", scrollY > 700);
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
  return top;
}
