// Генерирует data/seed.json из js/data.js и словарей: начальное содержимое базы магазина.
// Запуск: node tools/seed.mjs   (нужен только при первом запуске или чтобы сбросить каталог к исходному)
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { allProducts, COLLECTIONS, CATEGORIES, PROMOS, DELIVERY, FREE_SHIPPING_FROM, RATE } from "../js/data.js";
import { DICT } from "../js/i18n.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tr = key => ({ ru: DICT.ru[key] ?? key, en: DICT.en[key] ?? key, uz: DICT.uz[key] ?? key });

const seed = {
  settings: {
    rate: RATE,
    freeShippingFrom: FREE_SHIPPING_FROM,
    contacts: { phone: "", email: "legacy@studio.com", telegram: "", instagram: "" },
    telegramNotify: true
  },
  categories: CATEGORIES.map((id, order) => ({ id, order, name: tr("cat." + id) })),
  collections: COLLECTIONS.map(c => ({ ...c })),
  products: allProducts.map(p => {
    const { draft, ...rest } = p;
    // Остаток по размерам: общий остаток раскладываем по размерам поровну (дальше правится в админке)
    const per = Math.floor(p.stock / p.sizes.length), extra = p.stock - per * p.sizes.length;
    const stockBySize = Object.fromEntries(p.sizes.map((s, i) => [s, per + (i < extra ? 1 : 0)]));
    delete rest.stock;
    return { ...rest, stockBySize, hidden: Boolean(draft) };
  }),
  promos: Object.entries(PROMOS).map(([code, p]) => ({ code, active: true, used: 0, limit: 0, from: "", to: "", ...p })),
  delivery: DELIVERY.map(d => ({ ...d, active: true })),
  orders: [], messages: [], audit: []
};

mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(join(root, "data", "seed.json"), JSON.stringify(seed, null, 1));
console.log(`seed.json: ${seed.products.length} товаров, ${seed.categories.length} категорий, ${seed.collections.length} коллекций`);
