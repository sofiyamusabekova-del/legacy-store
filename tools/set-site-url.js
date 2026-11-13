// Прописывает адрес сайта в превью для соцсетей (og:image должен быть полным адресом).
// Запуск после того, как стал известен домен:  node tools/set-site-url.js https://legacy-store.vercel.app
const fs = require("fs");
const path = require("path");

const site = (process.argv[2] || "").replace(/\/$/, "");
if (!/^https?:\/\/[^\s/]+$/.test(site)) {
  console.log("Укажите адрес сайта: node tools/set-site-url.js https://ваш-домен");
  process.exit(1);
}
const root = path.join(__dirname, "..");
let changed = 0;
for (const file of fs.readdirSync(root).filter(f => f.endsWith(".html") && f !== "admin.html" && f !== "offline.html")) {
  const p = path.join(root, file);
  const html = fs.readFileSync(p, "utf8");
  const next = html.replace(/(<meta property="og:image" content=")(?:https?:\/\/[^"/]+\/)?(images\/[^"]+")/g, `$1${site}/$2`);
  if (next !== html) { fs.writeFileSync(p, next); changed++; }
}
console.log(`Готово: адрес ${site} прописан в ${changed} страницах.`);
