// Хранилище данных магазина (товары, заказы, промокоды, сообщения и т. д.).
// Сейчас: JSON-файл data/store.json (первый запуск копирует data/seed.json). Подходит для разработки и обычного хостинга.
// На Vercel файловая система только для чтения, поэтому там нужна настоящая база: драйвер подключается здесь же
// (например, Supabase или Vercel KV), а остальной код пользуется только read() и update().
const fs = require("fs");
const path = require("path");

// STORE_FILE нужен для тестов: можно направить сервер на временную копию базы и не трогать рабочие данные
const FILE = process.env.STORE_FILE ? path.resolve(process.env.STORE_FILE) : path.join(__dirname, "..", "data", "store.json");
const SEED = path.join(__dirname, "..", "data", "seed.json");

let cache = null;
let queue = Promise.resolve(); // записи выполняются строго по очереди, чтобы два запроса не затёрли друг друга

function persist() {
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 1));
  fs.renameSync(tmp, FILE); // атомарная замена: файл не бывает «наполовину записанным»
}

function ensure() {
  if (cache) return cache;
  if (process.env.VERCEL) throw Object.assign(new Error("На Vercel нужна внешняя база данных"), { code: "storage_not_configured" });
  try {
    cache = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    cache = JSON.parse(fs.readFileSync(SEED, "utf8"));
    persist();
  }
  return cache;
}

// Только чтение: возвращённый объект менять нельзя
async function read() { return ensure(); }

// Изменение: fn получает копию базы, любые правки применяются, только если fn завершилась без ошибки
function update(fn) {
  const run = queue.then(() => {
    const draft = structuredClone(ensure());
    const result = fn(draft);
    cache = draft;
    persist();
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

const uid = (prefix = "") => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

module.exports = { read, update, uid };
