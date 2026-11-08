// Интернационализация: RU (по умолчанию) / EN / UZ. Название «LEGACY» не переводится.
import { state } from "./store.js";

const dict = {
  ru: {
    "meta.home": "LEGACY — Вне времени. Минимализм",
    "meta.catalog": "Коллекция — LEGACY",
    "meta.about": "О нас — LEGACY",
    "meta.contact": "Контакты — LEGACY",
    "meta.cart": "Корзина — LEGACY",
    "meta.product": "Товар — LEGACY",
    "menu.open": "Открыть меню",
    "nav.home": "Главная", "nav.collection": "Коллекция", "nav.about": "О нас", "nav.contact": "Контакты", "nav.bag": "Корзина",
    "hero.eyebrow": "Нью-Йорк · Ташкент · По всему миру",
    "hero.text": "Современная база, созданная со спокойной уверенностью. Продуманный гардероб для тех, кто выбирает присутствие, а не шум.",
    "hero.shop": "Купить", "hero.discover": "Узнать больше",
    "home.new": "Новинки", "home.pieces": "изделий",
    "story.eyebrow": "Подход LEGACY", "story.title": "Меньше, но лучше.",
    "story.text": "Мы создаём вещи, которые держат форму, характер и своё место в вашем гардеробе. Классический крой встречается со streetwear через сдержанную палитру и выразительные силуэты.",
    "story.btn": "Наша история",
    "feat.1.t": "01 / Ткань", "feat.1.p": "Отборные текстуры с премиальной фактурой.",
    "feat.2.t": "02 / Крой", "feat.2.p": "Свободные пропорции и чистая конструкция.",
    "feat.3.t": "03 / Доставка", "feat.3.p": "Доставка по всему миру с отслеживанием.",
    "feat.4.t": "04 / Сервис", "feat.4.p": "Личная поддержка до и после покупки.",
    "footer.tagline": "Спокойная уверенность. Создано надолго.",
    "footer.rights": "© 2026 LEGACY. Все права защищены.",
    "catalog.eyebrow": "LEGACY / КОЛЛЕКЦИЯ", "catalog.title": "Коллекция",
    "cat.All": "Все", "cat.Blazers": "Блейзеры", "cat.Tops": "Топы", "cat.Denim": "Деним",
    "cat.Suits": "Костюмы", "cat.Sets": "Комплекты", "cat.Accessories": "Аксессуары",
    "cat.Dresses": "Платья", "cat.Skirts": "Юбки", "cat.Outerwear": "Верхняя одежда", "cat.Knitwear": "Трикотаж", "cat.Trousers": "Брюки", "cat.Shoes": "Обувь",
    "product.size": "Выберите размер", "product.add": "В корзину",
    "about.title": "Наша история", "about.eyebrow": "Гардероб, а не тренд.", "about.h2": "Создано надолго.",
    "about.text": "LEGACY начался с простой идеи: одежда может быть выразительной, не будучи громкой. Мы соединяем классический крой, объёмные городские силуэты и монохромную палитру, чтобы создавать вещи, уместные и в повседневной жизни, и в особых случаях.",
    "contact.eyebrow": "LEGACY / КОНТАКТЫ", "contact.title": "Давайте поговорим.",
    "contact.name": "Имя", "contact.name.ph": "Ваше имя",
    "contact.email": "Эл. почта", "contact.message": "Сообщение", "contact.message.ph": "Расскажите, что вам нужно...",
    "contact.send": "Отправить запрос", "contact.thanks": "Спасибо — мы скоро свяжемся с вами.",
    "cart.eyebrow": "LEGACY / КОРЗИНА", "cart.title": "Корзина покупок",
    "cart.total": "Итого", "cart.request": "Оформить заказ", "cart.empty": "Ваша корзина пуста.",
    "cart.explore": "Смотреть коллекцию", "cart.remove": "Удалить",
    "toast.added": "Добавлено в корзину",
    "currency.uzs": "сум"
  },
  en: {
    "meta.home": "LEGACY — Timeless Minimalism",
    "meta.catalog": "Collection — LEGACY",
    "meta.about": "About — LEGACY",
    "meta.contact": "Contact — LEGACY",
    "meta.cart": "Bag — LEGACY",
    "meta.product": "Product — LEGACY",
    "menu.open": "Open menu",
    "nav.home": "Home", "nav.collection": "Collection", "nav.about": "About", "nav.contact": "Contact", "nav.bag": "Bag",
    "hero.eyebrow": "New York · Tashkent · Worldwide",
    "hero.text": "Modern essentials shaped by quiet confidence. A considered wardrobe for people who prefer presence over noise.",
    "hero.shop": "Shop Now", "hero.discover": "Discover",
    "home.new": "New arrivals", "home.pieces": "pieces",
    "story.eyebrow": "The LEGACY approach", "story.title": "Less, but better.",
    "story.text": "We design pieces that hold their shape, their character and their place in your wardrobe. Tailoring meets streetwear through a restrained palette and strong silhouettes.",
    "story.btn": "Our story",
    "feat.1.t": "01 / Fabric", "feat.1.p": "Selected textures with a premium hand feel.",
    "feat.2.t": "02 / Cut", "feat.2.p": "Relaxed proportions and clean construction.",
    "feat.3.t": "03 / Delivery", "feat.3.p": "Worldwide shipping with tracked service.",
    "feat.4.t": "04 / Service", "feat.4.p": "Personal support before and after purchase.",
    "footer.tagline": "Quiet confidence. Designed to last.",
    "footer.rights": "© 2026 LEGACY. All rights reserved.",
    "catalog.eyebrow": "LEGACY / COLLECTION", "catalog.title": "Collection",
    "cat.All": "All", "cat.Blazers": "Blazers", "cat.Tops": "Tops", "cat.Denim": "Denim",
    "cat.Suits": "Suits", "cat.Sets": "Sets", "cat.Accessories": "Accessories",
    "cat.Dresses": "Dresses", "cat.Skirts": "Skirts", "cat.Outerwear": "Outerwear", "cat.Knitwear": "Knitwear", "cat.Trousers": "Trousers", "cat.Shoes": "Shoes",
    "product.size": "Select size", "product.add": "Add to bag",
    "about.title": "Our story", "about.eyebrow": "A wardrobe, not a trend.", "about.h2": "Designed for the long run.",
    "about.text": "LEGACY started with a simple idea: clothes can be expressive without being loud. We combine classic tailoring, oversized urban silhouettes and a monochrome palette to create pieces that move between everyday life and special occasions.",
    "contact.eyebrow": "LEGACY / CONTACT", "contact.title": "Let's talk.",
    "contact.name": "Name", "contact.name.ph": "Your name",
    "contact.email": "Email", "contact.message": "Message", "contact.message.ph": "Tell us what you need...",
    "contact.send": "Send request", "contact.thanks": "Thank you — we will contact you soon.",
    "cart.eyebrow": "LEGACY / BAG", "cart.title": "Shopping bag",
    "cart.total": "Total", "cart.request": "Request order", "cart.empty": "Your bag is empty.",
    "cart.explore": "Explore collection", "cart.remove": "Remove",
    "toast.added": "Added to bag",
    "currency.uzs": "UZS"
  },
  uz: {
    "meta.home": "LEGACY — Zamondan tashqari minimalizm",
    "meta.catalog": "Kolleksiya — LEGACY",
    "meta.about": "Biz haqimizda — LEGACY",
    "meta.contact": "Aloqa — LEGACY",
    "meta.cart": "Savat — LEGACY",
    "meta.product": "Mahsulot — LEGACY",
    "menu.open": "Menyuni ochish",
    "nav.home": "Bosh sahifa", "nav.collection": "Kolleksiya", "nav.about": "Biz haqimizda", "nav.contact": "Aloqa", "nav.bag": "Savat",
    "hero.eyebrow": "Nyu-York · Toshkent · Butun dunyo bo'ylab",
    "hero.text": "Sokin ishonchdan tug'ilgan zamonaviy bazaviy kiyimlar. Shovqinni emas, mavjudlikni tanlaydiganlar uchun puxta o'ylangan garderob.",
    "hero.shop": "Xarid qilish", "hero.discover": "Batafsil",
    "home.new": "Yangiliklar", "home.pieces": "ta mahsulot",
    "story.eyebrow": "LEGACY yondashuvi", "story.title": "Kamroq, lekin yaxshiroq.",
    "story.text": "Biz shaklini, xarakterini va garderobingizdagi o'rnini saqlaydigan kiyimlar yaratamiz. Klassik tikuv streetwear bilan vazmin ranglar va ifodali siluetlar orqali uchrashadi.",
    "story.btn": "Bizning hikoya",
    "feat.1.t": "01 / Mato", "feat.1.p": "Premium teksturali tanlangan matolar.",
    "feat.2.t": "02 / Kesim", "feat.2.p": "Erkin proporsiyalar va toza konstruksiya.",
    "feat.3.t": "03 / Yetkazib berish", "feat.3.p": "Butun dunyo bo'ylab kuzatuv bilan yetkazish.",
    "feat.4.t": "04 / Xizmat", "feat.4.p": "Xariddan oldin va keyin shaxsiy yordam.",
    "footer.tagline": "Sokin ishonch. Uzoq vaqtga yaratilgan.",
    "footer.rights": "© 2026 LEGACY. Barcha huquqlar himoyalangan.",
    "catalog.eyebrow": "LEGACY / KOLLEKSIYA", "catalog.title": "Kolleksiya",
    "cat.All": "Hammasi", "cat.Blazers": "Blazerlar", "cat.Tops": "Toplar", "cat.Denim": "Jinsi",
    "cat.Suits": "Kostyumlar", "cat.Sets": "To'plamlar", "cat.Accessories": "Aksessuarlar",
    "cat.Dresses": "Ko'ylaklar", "cat.Skirts": "Yubkalar", "cat.Outerwear": "Ustki kiyim", "cat.Knitwear": "Trikotaj", "cat.Trousers": "Shimlar", "cat.Shoes": "Poyabzal",
    "product.size": "O'lchamni tanlang", "product.add": "Savatga qo'shish",
    "about.title": "Bizning hikoya", "about.eyebrow": "Garderob, trend emas.", "about.h2": "Uzoq vaqtga yaratilgan.",
    "about.text": "LEGACY oddiy g'oyadan boshlangan: kiyim baland ovozsiz ham ifodali bo'lishi mumkin. Biz klassik tikuv, hajmli shahar siluetlari va monoxrom ranglarni birlashtirib, kundalik hayotda ham, maxsus kunlarda ham mos keladigan kiyimlar yaratamiz.",
    "contact.eyebrow": "LEGACY / ALOQA", "contact.title": "Gaplashamiz.",
    "contact.name": "Ism", "contact.name.ph": "Ismingiz",
    "contact.email": "Elektron pochta", "contact.message": "Xabar", "contact.message.ph": "Sizga nima kerakligini yozing...",
    "contact.send": "So'rov yuborish", "contact.thanks": "Rahmat — tez orada siz bilan bog'lanamiz.",
    "cart.eyebrow": "LEGACY / SAVAT", "cart.title": "Xarid savati",
    "cart.total": "Jami", "cart.request": "Buyurtma berish", "cart.empty": "Savatingiz bo'sh.",
    "cart.explore": "Kolleksiyani ko'rish", "cart.remove": "Olib tashlash",
    "toast.added": "Savatga qo'shildi",
    "currency.uzs": "so'm"
  }
};

export const NUMBER_LOCALE = { ru: "ru-RU", en: "en-US", uz: "ru-RU" };

export function t(key) {
  return dict[state.lang]?.[key] ?? dict.en[key] ?? key;
}

// Выбор локализованного поля вида {ru, en, uz}
export function pick(obj) {
  return obj[state.lang] ?? obj.en;
}

export function applyI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  document.querySelectorAll("[data-lang]").forEach(el => {
    const active = el.dataset.lang === state.lang;
    el.classList.toggle("active", active);
    el.setAttribute("aria-pressed", String(active));
  });
}
