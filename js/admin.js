// Админ-панель LEGACY: вход, дашборд, товары, категории, коллекции, заказы, оплаты, промокоды, доставка, клиенты, сообщения, переводы, настройки, журнал.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = n => new Intl.NumberFormat("ru-RU").format(Math.round(n));
const COLORS = { black: "#141414", white: "#ffffff", ivory: "#efe6d0", grey: "#8c8c8c", indigo: "#1f2a47", brown: "#6a4631", taupe: "#a8978a" };
const COLOR_RU = { black: "чёрный", white: "белый", ivory: "слоновая кость", grey: "серый", indigo: "индиго", brown: "коричневый", taupe: "тауп" };
const STATUS = { new: "Новый", confirmed: "Подтверждён", shipped: "Отправлен", delivered: "Доставлен", cancelled: "Отменён" };
const PAY_STATUS = { unpaid: "Не оплачен", awaiting: "Ожидает оплаты", paid: "Оплачен", cancelled: "Отменён", refunded: "Возврат" };
const PAY_METHOD = { cash: "Наличными", card: "Картой при получении", stripe: "Stripe", payme: "Payme" }; // payme: только подпись у старых заказов
const DELIVERY_RU = { pickup: "Самовывоз", courier: "Курьер по Ташкенту", regions: "По Узбекистану" };
const ERRORS = { invalid: "Проверьте поля формы", unauthorized: "Сессия закончилась, войдите снова", in_use: "Нельзя удалить: есть связанные товары", too_large: "Файл больше 3 МБ", upload_unavailable: "Загрузка файлов здесь недоступна", rate_limited: "Слишком много запросов, подождите минуту", server_error: "Ошибка сервера", storage_not_configured: "База данных не настроена" };

let D = null;      // данные магазина
let me = null;     // { user, dev }
let view = "dashboard";
const F = { orders: { status: "", from: "", to: "", q: "" }, products: { q: "", cat: "" }, translations: { q: "" } };

/* ---------- Запросы ---------- */
async function api(action, body = {}) {
  try {
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "legacy-admin" }, body: JSON.stringify({ action, ...body }) });
    const json = await res.json().catch(() => ({ ok: false, error: "server_error" }));
    if (res.status === 401 && action !== "login") { me = null; D = null; renderApp(); }
    return json;
  } catch { return { ok: false, error: "network" }; }
}

let toastTimer;
function toast(msg, bad = false) {
  const el = $("#adminToast");
  el.textContent = msg; el.className = "a-toast show" + (bad ? " bad" : "");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
const errText = r => ERRORS[r.error] || (r.error === "network" ? "Нет связи с сервером" : r.error || "Ошибка");

// Выполняет мутацию, обновляет данные и перерисовывает экран
async function mutate(action, body, okMsg = "Сохранено") {
  const r = await api(action, body);
  if (!r.ok) { toast(errText(r), true); return r; }
  D = r.data; render(); if (okMsg) toast(okMsg);
  return r;
}

const usd = n => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
const money = n => `${usd(n)} <span class="mut">· ${fmt(n * D.settings.rate)} сум</span>`;
const dt = iso => new Date(iso).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
const stockOf = p => Object.values(p.stockBySize || {}).reduce((s, n) => s + n, 0);
const chip = (cls, text) => `<span class="chip ${cls}">${esc(text)}</span>`;

/* ---------- Каркас ---------- */
const VIEWS = [
  ["dashboard", "Дашборд"], ["orders", "Заказы"], ["products", "Товары"], ["categories", "Категории"], ["collections", "Коллекции"],
  ["payments", "Оплаты"], ["promos", "Промокоды"], ["delivery", "Доставка"], ["customers", "Клиенты"], ["messages", "Сообщения"],
  ["translations", "Переводы"], ["settings", "Настройки"], ["audit", "Журнал"]
];

function renderApp() {
  const app = $("#app");
  if (!me?.user) {
    app.innerHTML = `<form class="a-login" data-form="login"><h1>LEGACY</h1><p>Админ-панель</p>${me?.dev ? `<div class="warn">Пароль администратора ещё не задан, включён временный вход для разработки (данные в консоли сервера). Задайте свой: <code>node make-admin.js "пароль"</code> и впишите результат в .env.</div>` : ""}<label class="fld"><span>Логин</span><input name="login" autocomplete="username" required autofocus></label><label class="fld" style="margin-top:14px"><span>Пароль</span><input name="password" type="password" autocomplete="current-password" required></label><p id="loginErr" style="color:#c0392b;font-size:12px;margin:14px 0 0" hidden></p><button class="abtn dark" style="margin-top:20px;width:100%" type="submit">Войти</button></form>`;
    return;
  }
  app.innerHTML = `<div class="adm"><aside><a class="logo" href="index.html">LEGACY<span>®</span></a><nav id="nav"></nav><div class="side-foot">Вы вошли как <b>${esc(me.user)}</b><br><button class="aside-btn" data-act="logout">Выйти</button> <a class="aside-btn" href="index.html" style="display:inline-block;text-decoration:none">На сайт</a></div></aside><main id="view"></main></div>`;
  if (!D) { loadData(); return; }
  render();
}

async function loadData() {
  const r = await api("data");
  if (!r.ok) { toast(errText(r), true); return; }
  D = r.data; render();
}

function render() {
  if (!D) return;
  const newOrders = D.orders.filter(o => o.status === "new").length, unread = D.messages.filter(m => !m.read).length;
  const badge = { orders: newOrders, messages: unread };
  $("#nav").innerHTML = VIEWS.map(([id, label]) => `<a data-act="nav" data-view="${id}" class="${id === view ? "on" : ""}">${label}${badge[id] ? `<b>${badge[id]}</b>` : ""}</a>`).join("");
  const host = $("#view");
  host.innerHTML = `<h1>${VIEWS.find(v => v[0] === view)[1]}</h1><div id="body"></div>`;
  const body = $("#body");
  ({ dashboard: viewDashboard, orders: viewOrders, products: viewProducts, categories: viewCategories, collections: viewCollections, payments: viewPayments, promos: viewPromos, delivery: viewDelivery, customers: viewCustomers, messages: viewMessages, translations: viewTranslations, settings: viewSettings, audit: viewAudit })[view](body);
}

/* ---------- Дашборд ---------- */
async function viewDashboard(body) {
  body.innerHTML = '<div class="empty-a">Загрузка…</div>';
  const r = await api("dashboard");
  if (!r.ok) { body.innerHTML = `<div class="empty-a">${errText(r)}</div>`; return; }
  const d = r.dashboard, max = Math.max(1, ...d.series.map(s => s.revenue));
  body.innerHTML = `<div class="cards">
    <div class="stat"><small>Выручка</small><b>${usd(d.revenue)}</b><span>${fmt(d.revenue * D.settings.rate)} сум</span></div>
    <div class="stat"><small>Заказы</small><b>${d.orders}</b><span>без отменённых</span></div>
    <div class="stat"><small>Средний чек</small><b>${usd(d.avg)}</b><span>${fmt(d.avg * D.settings.rate)} сум</span></div>
    <div class="stat"><small>Новых заказов</small><b>${d.byStatus.new}</b><span>ждут подтверждения</span></div></div>
    <div class="panel"><h2 style="margin-top:0">Выручка по дням, 30 дней</h2><div class="chart">${d.series.map(s => `<i style="height:${Math.max(2, s.revenue / max * 100)}%" data-tip="${s.date}: ${usd(s.revenue)}, заказов ${s.orders}"></i>`).join("")}</div><div class="chart-axis"><span>${d.series[0].date}</span><span>${d.series.at(-1).date}</span></div></div>
    <div class="two"><div class="panel"><h2 style="margin-top:0">Топ товаров</h2>${d.top.length ? `<table class="tbl"><tbody>${d.top.map(t => `<tr><td>${esc(t.name.ru)}</td><td class="num">${t.qty} шт.</td><td class="num">${usd(t.revenue)}</td></tr>`).join("")}</tbody></table>` : '<p class="hint">Пока нет заказов.</p>'}</div>
    <div class="panel"><h2 style="margin-top:0">Статусы заказов</h2>${Object.entries(d.byStatus).map(([s, n]) => `<p style="display:flex;justify-content:space-between;margin:8px 0">${chip(s, STATUS[s])}<b>${n}</b></p>`).join("")}<h2>Заканчивается товар</h2>${d.lowStock.length ? d.lowStock.map(p => `<p style="margin:6px 0;font-size:13px">${esc(p.name.ru)} <b>— ${p.stock} шт.</b></p>`).join("") : '<p class="hint">Всё в наличии.</p>'}</div></div>`;
}

/* ---------- Заказы ---------- */
function viewOrders(body) {
  const f = F.orders, q = f.q.trim().toLowerCase();
  const list = D.orders.filter(o => (!f.status || o.status === f.status) && (!f.from || o.createdAt.slice(0, 10) >= f.from) && (!f.to || o.createdAt.slice(0, 10) <= f.to) &&
    (!q || [o.id, o.customer.name, o.customer.phone].join(" ").toLowerCase().includes(q)));
  body.innerHTML = `<div class="bar"><input data-filter="orders.q" placeholder="Поиск: номер, имя, телефон" value="${esc(f.q)}"><select data-filter="orders.status"><option value="">Все статусы</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${f.status === k ? " selected" : ""}>${v}</option>`).join("")}</select>
    <input type="date" data-filter="orders.from" value="${f.from}" title="С даты"><input type="date" data-filter="orders.to" value="${f.to}" title="По дату"><span class="grow"></span><button class="abtn" data-act="export">Экспорт CSV</button></div>
    ${list.length ? `<table class="tbl"><thead><tr><th>Номер</th><th>Дата</th><th>Клиент</th><th>Доставка</th><th>Оплата</th><th>Статус</th><th class="num">Итого</th></tr></thead><tbody>${list.map(o => `<tr class="click" data-act="order" data-id="${esc(o.id)}"><td><b>${esc(o.id)}</b></td><td>${dt(o.createdAt)}</td><td>${esc(o.customer.name)}<br><small class="mut">${esc(o.customer.phone)}</small></td><td>${DELIVERY_RU[o.delivery.method] || o.delivery.method}</td><td>${PAY_METHOD[o.payment.method]} ${chip(o.payment.status, PAY_STATUS[o.payment.status])}</td><td>${chip(o.status, STATUS[o.status])}</td><td class="num">${usd(o.totals.total)}</td></tr>`).join("")}</tbody></table>` : '<div class="empty-a">Заказов нет.</div>'}`;
}

function orderModal(id) {
  const o = D.orders.find(x => x.id === id);
  if (!o) return;
  const where = o.delivery.method === "pickup" ? "Пункт выдачи LEGACY" : [o.delivery.city || "Ташкент", o.delivery.address].filter(Boolean).join(", ");
  openModal(`<h3>Заказ ${esc(o.id)}</h3><p class="hint">${dt(o.createdAt)} · ${chip(o.status, STATUS[o.status])} · ${PAY_METHOD[o.payment.method]} ${chip(o.payment.status, PAY_STATUS[o.payment.status])}</p>
    <div class="two"><div><h2 style="margin-top:0">Клиент</h2><p>${esc(o.customer.name)}<br>${esc(o.customer.phone)}${o.customer.email ? "<br>" + esc(o.customer.email) : ""}</p></div><div><h2 style="margin-top:0">Доставка</h2><p>${DELIVERY_RU[o.delivery.method]}<br>${esc(where)}</p></div></div>
    ${o.comment ? `<p><b>Комментарий:</b> ${esc(o.comment)}</p>` : ""}
    <table class="tbl"><tbody>${o.items.map(i => `<tr><td><img src="${esc(i.img)}" alt=""></td><td>${esc(i.name.ru)}<br><small class="mut">${esc([i.size, COLOR_RU[i.color] || i.color].filter(Boolean).join(", "))}</small></td><td class="num">${i.qty} × ${usd(i.price)}</td><td class="num">${usd(i.price * i.qty)}</td></tr>`).join("")}</tbody></table>
    <p style="text-align:right;line-height:1.8">Сумма: ${usd(o.totals.sub)}${o.totals.discount ? `<br>Скидка (${esc(o.promo)}): −${usd(o.totals.discount)}` : ""}<br>Доставка: ${o.totals.shipping ? usd(o.totals.shipping) : "бесплатно"}<br><b>Итого: ${money(o.totals.total)}</b></p>
    <h2>Статус заказа</h2><div class="bar"><select id="ordStatus">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${o.status === k ? " selected" : ""}>${v}</option>`).join("")}</select><button class="abtn dark" data-act="order-status" data-id="${esc(o.id)}">Сохранить статус</button></div>
    <h2>Оплата</h2><div class="bar"><button class="abtn" data-act="order-pay" data-id="${esc(o.id)}" data-pay="mark_paid">Отметить оплаченным</button><button class="abtn" data-act="order-pay" data-id="${esc(o.id)}" data-pay="cancel">Отменить оплату</button><button class="abtn red" data-act="order-pay" data-id="${esc(o.id)}" data-pay="refund">Возврат</button></div>
    ${o.payment.method === "stripe" ? '<p class="hint">Оплата через Stripe (тестовый режим): возврат делается в <a href="https://dashboard.stripe.com/test/payments" target="_blank" rel="noopener">кабинете Stripe</a>, здесь только отметка.</p>' : ""}
    <h2>Заметки</h2><div class="notes">${o.notes.map(n => `<p>${esc(n.text)}<small>${esc(n.user)}, ${dt(n.at)}</small></p>`).join("") || '<p class="hint">Заметок нет.</p>'}</div>
    <div class="bar"><input id="ordNote" class="grow" placeholder="Новая заметка (видна только вам)"><button class="abtn" data-act="order-note" data-id="${esc(o.id)}">Добавить</button></div>`);
}

/* ---------- Товары ---------- */
function viewProducts(body) {
  const f = F.products, q = f.q.trim().toLowerCase();
  const list = D.products.filter(p => (!f.cat || p.cat === f.cat) && (!q || (p.id + " " + p.name.ru + " " + p.name.en).toLowerCase().includes(q)));
  const catName = id => D.categories.find(c => c.id === id)?.name.ru || id;
  body.innerHTML = `<div class="bar"><input data-filter="products.q" placeholder="Поиск по названию" value="${esc(f.q)}"><select data-filter="products.cat"><option value="">Все категории</option>${D.categories.map(c => `<option value="${esc(c.id)}"${f.cat === c.id ? " selected" : ""}>${esc(c.name.ru)}</option>`).join("")}</select><span class="grow"></span><button class="abtn dark" data-act="product-new">+ Новый товар</button></div>
    <table class="tbl"><thead><tr><th></th><th>Название</th><th>Категория</th><th class="num">Цена</th><th class="num">Остаток</th><th>Показ</th><th></th></tr></thead><tbody>${list.map(p => `<tr><td><img src="${esc(p.img)}" alt=""></td><td><b>${esc(p.name.ru)}</b><br><small class="mut">${esc(p.id)}${p.popular ? " · хит" : ""}</small></td><td>${esc(catName(p.cat))}</td><td class="num">${usd(p.price)}</td><td class="num">${stockOf(p)}</td><td><input type="checkbox" data-act="product-vis" data-id="${esc(p.id)}" ${p.hidden ? "" : "checked"} title="Показывать на сайте"></td><td class="acts"><button class="abtn small" data-act="product-edit" data-id="${esc(p.id)}">Изменить</button><button class="abtn small red" data-act="product-del" data-id="${esc(p.id)}">Удалить</button></td></tr>`).join("")}</tbody></table>`;
}

const fld = (label, inner, cls = "", f = "") => `<label class="fld ${cls}" ${f ? `data-f="${f}"` : ""}><span>${label}</span>${inner}</label>`;

function productModal(id) {
  const p = D.products.find(x => x.id === id) || { id: "", cat: D.categories[0]?.id, price: 50, img: "", name: { ru: "", en: "", uz: "" }, desc: { ru: "", en: "", uz: "" }, collection: D.collections[0]?.id || "", colors: [], sizes: ["XS", "S", "M", "L", "XL"], stockBySize: { XS: 0, S: 0, M: 0, L: 0, XL: 0 }, popular: false, hidden: false, added: new Date().toISOString().slice(0, 10), pos: "", fit: "" };
  const isNew = !D.products.some(x => x.id === id);
  openModal(`<h3>${isNew ? "Новый товар" : "Товар: " + esc(p.name.ru)}</h3><form data-form="product" data-new="${isNew}">
    <div class="flds">${fld("Артикул (латиница, цифры, дефис)", `<input name="id" value="${esc(p.id)}" ${isNew ? "" : "readonly"} required pattern="[a-z0-9-]+">`, "", "id")}
    ${fld("Цена, USD", `<input name="price" type="number" min="0" step="0.5" value="${p.price}" required>`, "", "price")}
    ${fld("Категория", `<select name="cat">${D.categories.map(c => `<option value="${esc(c.id)}"${p.cat === c.id ? " selected" : ""}>${esc(c.name.ru)}</option>`).join("")}</select>`, "", "cat")}
    ${fld("Коллекция", `<select name="collection"><option value="">—</option>${D.collections.map(c => `<option value="${esc(c.id)}"${p.collection === c.id ? " selected" : ""}>${esc(c.name.ru)}</option>`).join("")}</select>`, "", "collection")}</div>
    <h2>Название и описание</h2>${["ru", "en", "uz"].map(l => `<div class="flds" style="margin-bottom:12px">${fld("Название " + l.toUpperCase(), `<input name="name.${l}" value="${esc(p.name[l])}" ${l === "ru" ? "required" : ""}>`, "", "name." + l)}${fld("Описание " + l.toUpperCase(), `<textarea name="desc.${l}" rows="2">${esc(p.desc[l])}</textarea>`, "", "desc." + l)}</div>`).join("")}
    <h2>Фото</h2><div class="flds">${fld("Файл в папке images/", `<input name="img" id="imgPath" value="${esc(p.img)}" required placeholder="images/name.jpg">`, "", "img")}<div class="fld"><span>Загрузить новое фото</span><input type="file" id="imgFile" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG или WebP, до 3 МБ</small></div></div>
    <div class="flds" style="margin-top:12px"><div class="fld"><span>Предпросмотр</span><img id="imgPrev" src="${esc(p.img)}" alt="" style="width:90px;height:112px;object-fit:cover;background:#eee"></div><div>${fld("Позиция кадра (например center 20%)", `<input name="pos" value="${esc(p.pos || "")}">`)}<label class="checks" style="margin-top:12px"><span><input type="checkbox" name="fit" ${p.fit === "contain" ? "checked" : ""}> Показывать фото целиком (без обрезки)</span></label></div></div>
    <h2>Цвета</h2><div class="checks">${Object.entries(COLORS).map(([k, hex]) => `<label><input type="checkbox" name="color" value="${k}" ${p.colors.includes(k) ? "checked" : ""}><span class="dot" style="background:${hex}"></span>${COLOR_RU[k]}</label>`).join("")}</div>
    <h2>Размеры и остатки</h2>${fld("Размеры через запятую", `<input name="sizes" id="sizesInput" value="${esc(p.sizes.join(", "))}" required><small>Для обуви, например: 36, 37, 38, 39, 40. Для аксессуаров: ONE</small>`, "", "sizes")}
    <div class="flds three" id="stockGrid" style="margin-top:12px"></div>
    <h2>Показ на сайте</h2><div class="flds">${fld("Дата добавления (влияет на «Новинки»)", `<input name="added" type="date" value="${esc(p.added)}">`, "", "added")}<div class="checks" style="align-self:end"><label><input type="checkbox" name="popular" ${p.popular ? "checked" : ""}> Хит (популярное)</label><label><input type="checkbox" name="hidden" ${p.hidden ? "checked" : ""}> Скрыть с сайта</label></div></div>
    <div class="foot"><button type="button" class="abtn" data-act="close">Отмена</button><button class="abtn dark" type="submit">Сохранить</button></div></form>`);
  renderStockGrid(p.stockBySize);
}

function renderStockGrid(known = {}) {
  const sizes = $("#sizesInput").value.split(",").map(s => s.trim()).filter(Boolean);
  const current = Object.fromEntries($$("#stockGrid input").map(i => [i.dataset.size, i.value]));
  $("#stockGrid").innerHTML = sizes.map(s => fld(`Остаток ${esc(s)}`, `<input type="number" min="0" step="1" data-size="${esc(s)}" value="${current[s] ?? known[s] ?? 0}">`)).join("");
}

// Уменьшаем большое фото перед загрузкой (до 1600 px, JPEG), чтобы уложиться в лимиты и не грузить сайт
function shrink(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => reject(new Error("bad image"));
    img.src = url;
  });
}

function readProductForm(form) {
  const v = n => form.elements[n]?.value ?? "";
  const stockBySize = Object.fromEntries($$("#stockGrid input", form).map(i => [i.dataset.size, Number(i.value || 0)]));
  return {
    id: v("id").trim(), cat: v("cat"), price: Number(v("price")), img: v("img").trim(), pos: v("pos").trim(), fit: form.elements.fit.checked ? "contain" : "",
    collection: v("collection"), colors: $$("input[name=color]:checked", form).map(i => i.value),
    name: { ru: v("name.ru"), en: v("name.en") || v("name.ru"), uz: v("name.uz") || v("name.ru") },
    desc: { ru: v("desc.ru"), en: v("desc.en") || v("desc.ru"), uz: v("desc.uz") || v("desc.ru") },
    sizes: v("sizes").split(",").map(s => s.trim()).filter(Boolean), stockBySize, added: v("added"),
    popular: form.elements.popular.checked, hidden: form.elements.hidden.checked
  };
}

/* ---------- Категории и коллекции ---------- */
function viewCategories(body) {
  const count = id => D.products.filter(p => p.cat === id).length;
  body.innerHTML = `<p class="hint">Порядок здесь — порядок категорий в каталоге на сайте. Название меняется сразу на трёх языках.</p><div class="bar"><button class="abtn dark" data-act="cat-new">+ Новая категория</button></div>
    <table class="tbl"><thead><tr><th>Порядок</th><th>Код</th><th>RU</th><th>EN</th><th>UZ</th><th class="num">Товаров</th><th></th></tr></thead><tbody>${D.categories.map((c, i) => `<tr><td><button class="abtn small" data-act="cat-up" data-id="${esc(c.id)}" ${i === 0 ? "disabled" : ""}>↑</button> <button class="abtn small" data-act="cat-down" data-id="${esc(c.id)}" ${i === D.categories.length - 1 ? "disabled" : ""}>↓</button></td><td>${esc(c.id)}</td><td>${esc(c.name.ru)}</td><td>${esc(c.name.en)}</td><td>${esc(c.name.uz)}</td><td class="num">${count(c.id)}</td><td class="acts"><button class="abtn small" data-act="cat-edit" data-id="${esc(c.id)}">Изменить</button><button class="abtn small red" data-act="cat-del" data-id="${esc(c.id)}">Удалить</button></td></tr>`).join("")}</tbody></table>`;
}

function categoryModal(id) {
  const c = D.categories.find(x => x.id === id) || { id: "", name: { ru: "", en: "", uz: "" } };
  const isNew = !D.categories.some(x => x.id === id);
  openModal(`<h3>${isNew ? "Новая категория" : "Категория " + esc(c.id)}</h3><form data-form="category"><div class="flds">${fld("Код (латиница, например Jackets)", `<input name="id" value="${esc(c.id)}" ${isNew ? "" : "readonly"} required pattern="[A-Za-z0-9-]+">`, "full", "id")}${["ru", "en", "uz"].map(l => fld("Название " + l.toUpperCase(), `<input name="name.${l}" value="${esc(c.name[l])}" required>`, "", "name." + l)).join("")}</div><div class="foot"><button type="button" class="abtn" data-act="close">Отмена</button><button class="abtn dark" type="submit">Сохранить</button></div></form>`);
}

function viewCollections(body) {
  body.innerHTML = `<div class="bar"><button class="abtn dark" data-act="col-new">+ Новая коллекция</button></div><table class="tbl"><thead><tr><th>Код</th><th>Название</th><th>Обложка</th><th class="num">Товаров</th><th></th></tr></thead><tbody>${D.collections.map(c => `<tr><td>${esc(c.id)}</td><td><b>${esc(c.name.ru)}</b><br><small class="mut">${esc(c.desc.ru.slice(0, 80))}…</small></td><td>${esc(c.cover || "—")}</td><td class="num">${D.products.filter(p => p.collection === c.id).length}</td><td class="acts"><button class="abtn small" data-act="col-edit" data-id="${esc(c.id)}">Изменить</button><button class="abtn small red" data-act="col-del" data-id="${esc(c.id)}">Удалить</button></td></tr>`).join("")}</tbody></table><p class="hint" style="margin-top:14px">Хит и дату добавления («Новинки») задают в карточке товара, раздел «Товары».</p>`;
}

function collectionModal(id) {
  const c = D.collections.find(x => x.id === id) || { id: "", cover: "", name: { ru: "", en: "", uz: "" }, desc: { ru: "", en: "", uz: "" } };
  const isNew = !D.collections.some(x => x.id === id);
  openModal(`<h3>${isNew ? "Новая коллекция" : "Коллекция " + esc(c.name.ru)}</h3><form data-form="collection"><div class="flds">${fld("Код (латиница, дефис)", `<input name="id" value="${esc(c.id)}" ${isNew ? "" : "readonly"} required pattern="[a-z0-9-]+">`, "", "id")}${fld("Товар для обложки", `<select name="cover"><option value="">— первый в коллекции —</option>${D.products.map(p => `<option value="${esc(p.id)}"${c.cover === p.id ? " selected" : ""}>${esc(p.name.ru)}</option>`).join("")}</select>`)}</div>${["ru", "en", "uz"].map(l => `<div class="flds" style="margin-top:12px">${fld("Название " + l.toUpperCase(), `<input name="name.${l}" value="${esc(c.name[l])}" required>`, "", "name." + l)}${fld("Описание " + l.toUpperCase(), `<textarea name="desc.${l}" rows="2" required>${esc(c.desc[l])}</textarea>`, "", "desc." + l)}</div>`).join("")}<div class="foot"><button type="button" class="abtn" data-act="close">Отмена</button><button class="abtn dark" type="submit">Сохранить</button></div></form>`);
}

/* ---------- Оплаты ---------- */
function viewPayments(body) {
  const orders = D.orders.filter(o => o.payment.status !== "unpaid" || o.payment.method === "stripe");
  body.innerHTML = `<h2 style="margin-top:0">Заказы и оплата</h2>${orders.length ? `<table class="tbl"><thead><tr><th>Заказ</th><th>Способ</th><th>Статус оплаты</th><th class="num">Итого</th><th></th></tr></thead><tbody>${orders.map(o => `<tr><td>${esc(o.id)}</td><td>${PAY_METHOD[o.payment.method]}</td><td>${chip(o.payment.status, PAY_STATUS[o.payment.status])}</td><td class="num">${usd(o.totals.total)}</td><td class="acts"><button class="abtn small" data-act="order" data-id="${esc(o.id)}">Открыть</button></td></tr>`).join("")}</tbody></table>` : '<div class="empty-a">Оплаченных и ожидающих оплаты заказов нет.</div>'}`;
}

/* ---------- Промокоды ---------- */
function viewPromos(body) {
  body.innerHTML = `<div class="bar"><button class="abtn dark" data-act="promo-new">+ Новый промокод</button></div><table class="tbl"><thead><tr><th>Код</th><th>Скидка</th><th class="num">От суммы</th><th>Срок</th><th class="num">Использован</th><th>Статус</th><th></th></tr></thead><tbody>${D.promos.map(p => `<tr><td><b>${esc(p.code)}</b></td><td>${p.type === "percent" ? p.value + "%" : "бесплатная доставка"}</td><td class="num">${p.min ? usd(p.min) : "—"}</td><td>${p.from || p.to ? `${p.from || "…"} — ${p.to || "…"}` : "без срока"}</td><td class="num">${p.used}${p.limit ? " / " + p.limit : ""}</td><td>${chip(p.active ? "paid" : "cancelled", p.active ? "Активен" : "Выключен")}</td><td class="acts"><button class="abtn small" data-act="promo-edit" data-code="${esc(p.code)}">Изменить</button><button class="abtn small red" data-act="promo-del" data-code="${esc(p.code)}">Удалить</button></td></tr>`).join("")}</tbody></table>`;
}

function promoModal(code) {
  const p = D.promos.find(x => x.code === code) || { code: "", type: "percent", value: 10, min: 0, from: "", to: "", limit: 0, active: true };
  const isNew = !D.promos.some(x => x.code === code);
  openModal(`<h3>${isNew ? "Новый промокод" : "Промокод " + esc(p.code)}</h3><form data-form="promo"><div class="flds">${fld("Код (A–Z, 0–9)", `<input name="code" value="${esc(p.code)}" ${isNew ? "" : "readonly"} required pattern="[A-Za-z0-9]{3,20}" style="text-transform:uppercase">`, "", "code")}${fld("Тип", `<select name="type"><option value="percent"${p.type === "percent" ? " selected" : ""}>Скидка в процентах</option><option value="shipping"${p.type === "shipping" ? " selected" : ""}>Бесплатная доставка</option></select>`, "", "type")}${fld("Процент скидки", `<input name="value" type="number" min="1" max="90" value="${p.value || 10}">`, "", "value")}${fld("Минимальная сумма заказа, USD", `<input name="min" type="number" min="0" value="${p.min || 0}">`, "", "min")}${fld("Действует с", `<input name="from" type="date" value="${esc(p.from)}">`, "", "from")}${fld("Действует по", `<input name="to" type="date" value="${esc(p.to)}">`, "", "to")}${fld("Лимит использований (0 = без лимита)", `<input name="limit" type="number" min="0" value="${p.limit || 0}">`, "", "limit")}<label class="checks" style="align-self:end"><span><input type="checkbox" name="active" ${p.active ? "checked" : ""}> Активен</span></label></div><div class="foot"><button type="button" class="abtn" data-act="close">Отмена</button><button class="abtn dark" type="submit">Сохранить</button></div></form>`);
}

/* ---------- Доставка, клиенты, сообщения ---------- */
function viewDelivery(body) {
  body.innerHTML = `<p class="hint">Бесплатная доставка от суммы и курс валюты меняются в разделе «Настройки» (сейчас порог ${usd(D.settings.freeShippingFrom)}).</p><table class="tbl in"><thead><tr><th>Способ</th><th>Цена, USD</th><th>Включён</th><th></th></tr></thead><tbody>${D.delivery.map(d => `<tr><td><b>${DELIVERY_RU[d.id] || d.id}</b></td><td><input class="tin" type="number" min="0" step="0.5" value="${d.price}" data-dprice="${d.id}"></td><td><input type="checkbox" data-dactive="${d.id}" ${d.active ? "checked" : ""}></td><td class="acts"><button class="abtn small dark" data-act="delivery-save" data-id="${d.id}">Сохранить</button></td></tr>`).join("")}</tbody></table>`;
}

function customers() {
  const map = new Map();
  for (const o of D.orders) {
    const c = map.get(o.customer.phone) || { name: o.customer.name, phone: o.customer.phone, email: o.customer.email, count: 0, spent: 0, last: o.createdAt, orders: [] };
    c.orders.push(o); c.count += 1; if (o.status !== "cancelled") c.spent += o.totals.total;
    if (o.createdAt > c.last) { c.last = o.createdAt; c.name = o.customer.name; c.email = o.customer.email || c.email; }
    map.set(o.customer.phone, c);
  }
  return [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
}

function viewCustomers(body) {
  const list = customers();
  body.innerHTML = list.length ? `<table class="tbl"><thead><tr><th>Клиент</th><th>Телефон</th><th>Email</th><th class="num">Заказов</th><th class="num">Потрачено</th><th>Последний заказ</th></tr></thead><tbody>${list.map(c => `<tr class="click" data-act="customer" data-phone="${esc(c.phone)}"><td><b>${esc(c.name)}</b></td><td>${esc(c.phone)}</td><td>${esc(c.email || "—")}</td><td class="num">${c.count}</td><td class="num">${usd(c.spent)}</td><td>${dt(c.last)}</td></tr>`).join("")}</tbody></table>` : '<div class="empty-a">Клиентов пока нет, они появятся после первых заказов.</div>';
}

function customerModal(phone) {
  const c = customers().find(x => x.phone === phone);
  if (!c) return;
  openModal(`<h3>${esc(c.name)}</h3><p class="hint">${esc(c.phone)}${c.email ? " · " + esc(c.email) : ""} · заказов: ${c.count}, потрачено ${usd(c.spent)}</p><table class="tbl"><tbody>${c.orders.map(o => `<tr class="click" data-act="order" data-id="${esc(o.id)}"><td><b>${esc(o.id)}</b></td><td>${dt(o.createdAt)}</td><td>${chip(o.status, STATUS[o.status])}</td><td class="num">${usd(o.totals.total)}</td></tr>`).join("")}</tbody></table>`);
}

function viewMessages(body) {
  body.innerHTML = D.messages.length ? D.messages.map(m => `<div class="msg ${m.read ? "" : "unread"}"><header><span><b>${esc(m.name)}</b> · <a href="mailto:${esc(m.email)}" style="text-decoration:underline">${esc(m.email)}</a></span><span>${dt(m.createdAt)}</span></header><p>${esc(m.message)}</p><button class="abtn small" data-act="msg-read" data-id="${esc(m.id)}" data-read="${!m.read}">${m.read ? "Отметить непрочитанным" : "Отметить прочитанным"}</button> <button class="abtn small red" data-act="msg-del" data-id="${esc(m.id)}">Удалить</button></div>`).join("") : '<div class="empty-a">Сообщений нет.</div>';
}

/* ---------- Переводы, настройки, журнал ---------- */
function viewTranslations(body) {
  const q = F.translations.q.trim().toLowerCase();
  const list = D.products.filter(p => !q || (p.id + p.name.ru + p.name.en + p.name.uz).toLowerCase().includes(q));
  body.innerHTML = `<p class="hint">Названия и описания товаров на трёх языках. Изменения сохраняются по кнопке в конце строки.</p><div class="bar"><input data-filter="translations.q" placeholder="Поиск" value="${esc(F.translations.q)}"></div><table class="tbl in"><thead><tr><th>Товар</th><th>RU</th><th>EN</th><th>UZ</th><th></th></tr></thead><tbody>${list.map(p => `<tr data-tr="${esc(p.id)}"><td><b>${esc(p.id)}</b></td>${["ru", "en", "uz"].map(l => `<td><input data-tn="${l}" value="${esc(p.name[l])}" style="margin-bottom:6px"><textarea data-td="${l}" rows="3" style="width:100%">${esc(p.desc[l])}</textarea></td>`).join("")}<td class="acts"><button class="abtn small dark" data-act="tr-save" data-id="${esc(p.id)}">Сохранить</button></td></tr>`).join("")}</tbody></table>`;
}

function viewSettings(body) {
  const s = D.settings, c = s.contacts;
  body.innerHTML = `<form class="panel" data-form="settings" style="max-width:640px"><div class="flds">${fld("Курс: сум за 1 USD", `<input name="rate" type="number" min="1000" max="100000" value="${s.rate}" required>`, "", "rate")}${fld("Бесплатная доставка от, USD", `<input name="freeShippingFrom" type="number" min="0" value="${s.freeShippingFrom}" required>`, "", "freeShippingFrom")}${fld("Телефон магазина", `<input name="phone" value="${esc(c.phone)}">`)}${fld("Email магазина", `<input name="email" value="${esc(c.email)}">`)}${fld("Telegram (ссылка или @имя)", `<input name="telegram" value="${esc(c.telegram)}">`)}${fld("Instagram (ссылка или @имя)", `<input name="instagram" value="${esc(c.instagram)}">`)}</div><div class="checks" style="margin-top:16px"><label><input type="checkbox" name="telegramNotify" ${s.telegramNotify ? "checked" : ""}> Присылать заказы и сообщения в Telegram</label></div><div class="foot"><button class="abtn dark" type="submit">Сохранить настройки</button></div><p class="hint" style="margin-top:14px">Контакты показываются в подвале сайта. Токен Telegram хранится в .env на сервере и здесь не отображается.</p></form>`;
}

function viewAudit(body) {
  body.innerHTML = D.audit.length ? `<table class="tbl"><thead><tr><th>Когда</th><th>Кто</th><th>Действие</th><th>Детали</th></tr></thead><tbody>${D.audit.map(a => `<tr><td>${dt(a.at)}</td><td>${esc(a.user)}</td><td>${esc(a.action)}</td><td>${esc(a.details)}</td></tr>`).join("")}</tbody></table>` : '<div class="empty-a">Журнал пуст.</div>';
}

/* ---------- Окна ---------- */
function openModal(html) {
  closeModal();
  const m = document.createElement("div");
  m.className = "amodal"; m.id = "amodal";
  m.innerHTML = `<div class="box"><button class="x" data-act="close" aria-label="Закрыть">×</button>${html}</div>`;
  document.body.append(m);
}
const closeModal = () => $("#amodal")?.remove();
const reopen = fn => { const had = $("#amodal"); if (had) fn(); };

function markErrors(form, r) {
  $$(".fld.err", form).forEach(e => e.classList.remove("err"));
  $$(`[data-f="${r.field}"]`, form).forEach(e => e.classList.add("err"));
  toast(`${errText(r)}${r.field ? ` (поле: ${r.field})` : ""}`, true);
}

/* ---------- События ---------- */
document.addEventListener("click", async e => {
  const el = e.target.closest("[data-act]");
  if (!el) { if (e.target.id === "amodal") closeModal(); return; }
  const { act, id, code } = el.dataset;
  const confirmDel = msg => window.confirm(msg);
  switch (act) {
    case "nav": view = el.dataset.view; render(); break;
    case "close": closeModal(); break;
    case "logout": await api("logout"); me = { user: null }; D = null; renderApp(); break;
    case "order": closeModal(); orderModal(id); break;
    case "customer": customerModal(el.dataset.phone); break;
    case "order-status": { const r = await mutate("order.update", { id, status: $("#ordStatus").value }, "Статус обновлён"); if (r.ok) orderModal(id); break; }
    case "order-pay": { if (el.dataset.pay === "refund" && !confirmDel("Отметить возврат по заказу? Деньги нужно вернуть клиенту отдельно.")) break; const r = await mutate("order.payment", { id, pay: el.dataset.pay }, "Оплата обновлена"); if (r.ok) orderModal(id); break; }
    case "order-note": { const text = $("#ordNote").value.trim(); if (!text) break; const r = await mutate("order.update", { id, note: text }, "Заметка добавлена"); if (r.ok) orderModal(id); break; }
    case "export": { const r = await api("export"); if (!r.ok) { toast(errText(r), true); break; } const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([r.csv], { type: "text/csv;charset=utf-8" })); a.download = r.name; a.click(); URL.revokeObjectURL(a.href); toast("Файл скачан"); break; }
    case "product-new": productModal(""); break;
    case "product-edit": productModal(id); break;
    case "product-del": if (confirmDel("Удалить товар навсегда? Это нельзя отменить (можно просто скрыть товар).")) mutate("product.delete", { id }, "Товар удалён"); break;
    case "product-vis": mutate("product.visibility", { id, hidden: !el.checked }, el.checked ? "Товар показан" : "Товар скрыт"); break;
    case "cat-new": categoryModal(""); break;
    case "cat-edit": categoryModal(id); break;
    case "cat-del": if (confirmDel("Удалить категорию?")) mutate("category.delete", { id }, "Категория удалена"); break;
    case "cat-up": case "cat-down": { const ids = D.categories.map(c => c.id), i = ids.indexOf(id), j = act === "cat-up" ? i - 1 : i + 1; [ids[i], ids[j]] = [ids[j], ids[i]]; mutate("category.reorder", { ids }, "Порядок сохранён"); break; }
    case "col-new": collectionModal(""); break;
    case "col-edit": collectionModal(id); break;
    case "col-del": if (confirmDel("Удалить коллекцию?")) mutate("collection.delete", { id }, "Коллекция удалена"); break;
    case "promo-new": promoModal(""); break;
    case "promo-edit": promoModal(code); break;
    case "promo-del": if (confirmDel("Удалить промокод?")) mutate("promo.delete", { code }, "Промокод удалён"); break;
    case "delivery-save": mutate("delivery.save", { id, price: Number($(`[data-dprice="${id}"]`).value), active: $(`[data-dactive="${id}"]`).checked }); break;
    case "msg-read": mutate("message.read", { id, read: el.dataset.read === "true" }, ""); break;
    case "msg-del": if (confirmDel("Удалить сообщение?")) mutate("message.delete", { id }, "Сообщение удалено"); break;
    case "tr-save": {
      const row = el.closest("tr"), p = structuredClone(D.products.find(x => x.id === id));
      for (const l of ["ru", "en", "uz"]) { p.name[l] = $(`[data-tn=${l}]`, row).value; p.desc[l] = $(`[data-td=${l}]`, row).value; }
      mutate("product.save", { product: p }, "Перевод сохранён"); break;
    }
  }
});

// Фильтры списков (заказы, товары, переводы)
document.addEventListener("input", e => {
  const key = e.target.dataset?.filter;
  if (key) { const [area, name] = key.split("."); F[area][name] = e.target.value; const pos = e.target.selectionStart; render(); const again = $(`[data-filter="${key}"]`); if (again && again.type === "text") { again.focus(); again.setSelectionRange(pos, pos); } }
  if (e.target.id === "sizesInput") renderStockGrid();
});

document.addEventListener("change", async e => {
  if (e.target.id === "imgFile" && e.target.files[0]) {
    try {
      const dataUrl = await shrink(e.target.files[0]);
      const r = await api("upload", { name: e.target.files[0].name, dataUrl });
      if (!r.ok) return toast(errText(r), true);
      $("#imgPath").value = r.img; $("#imgPrev").src = r.img; toast("Фото загружено");
    } catch { toast("Не удалось прочитать файл", true); }
  }
});

document.addEventListener("submit", async e => {
  const form = e.target, kind = form.dataset.form;
  if (!kind) return;
  e.preventDefault();
  if (kind === "login") {
    const r = await api("login", { login: form.login.value, password: form.password.value });
    if (!r.ok) {
      const err = $("#loginErr");
      err.hidden = false;
      err.textContent = r.error === "locked" ? `Слишком много попыток. Повторите через ${r.retryIn} мин.` : r.error === "not_configured" ? "Пароль администратора не настроен на сервере." : "Неверный логин или пароль.";
      return;
    }
    me = await api("me"); D = null; renderApp(); return;
  }
  if (kind === "product") {
    const r = await mutate("product.save", { product: readProductForm(form) }, "Товар сохранён");
    if (r.ok) closeModal(); else markErrors(form, r);
  } else if (kind === "category") {
    const f = form.elements;
    const r = await mutate("category.save", { category: { id: f.id.value.trim(), name: { ru: f["name.ru"].value, en: f["name.en"].value, uz: f["name.uz"].value } } }, "Категория сохранена");
    if (r.ok) closeModal(); else markErrors(form, r);
  } else if (kind === "collection") {
    const f = form.elements;
    const r = await mutate("collection.save", { collection: { id: f.id.value.trim(), cover: f.cover.value, name: { ru: f["name.ru"].value, en: f["name.en"].value, uz: f["name.uz"].value }, desc: { ru: f["desc.ru"].value, en: f["desc.en"].value, uz: f["desc.uz"].value } } }, "Коллекция сохранена");
    if (r.ok) closeModal(); else markErrors(form, r);
  } else if (kind === "promo") {
    const f = form.elements;
    const r = await mutate("promo.save", { promo: { code: f.code.value, type: f.type.value, value: Number(f.value.value), min: Number(f.min.value), from: f.from.value, to: f.to.value, limit: Number(f.limit.value), active: f.active.checked } }, "Промокод сохранён");
    if (r.ok) closeModal(); else markErrors(form, r);
  } else if (kind === "settings") {
    const f = form.elements;
    const r = await mutate("settings.save", { settings: { rate: Number(f.rate.value), freeShippingFrom: Number(f.freeShippingFrom.value), telegramNotify: f.telegramNotify.checked, contacts: { phone: f.phone.value, email: f.email.value, telegram: f.telegram.value, instagram: f.instagram.value } } }, "Настройки сохранены");
    if (!r.ok) markErrors(form, r);
  }
});

document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

/* ---------- Старт ---------- */
(async () => {
  me = await api("me");
  if (!me.ok) me = { user: null };
  renderApp();
})();
