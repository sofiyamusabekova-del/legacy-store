// Локальный сервер для разработки: отдаёт сайт и запускает серверные функции из папки api/ (как это делает Vercel).
// Запуск:   node dev-server.js            — настоящий Telegram (нужен .env с токеном и chat_id)
//           node dev-server.js --mock     — сообщения печатаются в консоль, без Telegram (для проверки)
// Порт по умолчанию 8000, можно поменять: node dev-server.js --port=8001
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const args = process.argv.slice(2);
const PORT = Number((args.find(a => a.startsWith("--port=")) || "").split("=")[1]) || Number(process.env.PORT) || 8000;
if (args.includes("--mock")) process.env.TELEGRAM_MOCK = "1";

// Загружаем .env (простой разбор KEY=VALUE), уже заданные переменные окружения не перезаписываем
try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* .env нет — тоже нормально */ }

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon", ".md": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8"
};

// Что нельзя отдавать как статику: скрытые файлы (.env, .git), серверный код, служебные папки
const FORBIDDEN = /(^|\/)(\.|api\/|node_modules\/|dev-server\.js$)/;

function readBody(req) {
  return new Promise(resolve => {
    let raw = "";
    req.on("data", c => { raw += c; if (raw.length > 8e6) req.destroy(); }); // до 8 МБ (загрузка фото из админки)
    req.on("end", () => { try { resolve(JSON.parse(raw)); } catch { resolve(null); } });
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);

  // /sitemap.xml и /robots.txt — тоже серверные функции (на Vercel это rewrites из vercel.json)
  const alias = { "/sitemap.xml": "sitemap", "/robots.txt": "robots" }[pathname];
  // Серверные функции: /api/<имя> → api/<имя>.js
  const fn = alias ? [null, alias] : pathname.match(/^\/api\/([a-z0-9-]+)$/i);
  if (fn) {
    const file = path.join(ROOT, "api", fn[1] + ".js");
    if (fn[1].startsWith("_") || !fs.existsSync(file)) { res.writeHead(404); return res.end("Not found"); }
    req.body = await readBody(req);
    res.status = code => { res.statusCode = code; return res; };
    res.json = obj => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
    try { return await require(file)(req, res); }
    catch (e) { console.error(e); res.statusCode = 500; return res.end("Server error"); }
  }

  // Статические файлы
  let rel = pathname === "/" ? "/index.html" : pathname;
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT) || FORBIDDEN.test(rel.slice(1))) { res.writeHead(404); return res.end("Not found"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  });
}).listen(PORT, () => {
  if (!process.env.ADMIN_PASSWORD_HASH) console.log(`Админка http://localhost:${PORT}/admin.html — пароль не задан, временный вход для разработки: admin / legacy-admin (свой пароль: node make-admin.js "пароль")`);
  console.log(`LEGACY dev server: http://localhost:${PORT}  (Telegram: ${process.env.TELEGRAM_MOCK === "1" ? "режим mock" : process.env.TELEGRAM_BOT_TOKEN ? "настроен" : "НЕ настроен, заполни .env"})`);
});
