// Диагностика Telegram: node check-telegram.js
// Читает .env, проверяет токен (getMe), показывает чаты, которые писали боту (getUpdates), и сверяет их с TELEGRAM_CHAT_ID.
// Токен в вывод не попадает.
const fs = require("fs");
const path = require("path");

try {
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { console.log("Файл .env не найден."); }

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = (process.env.TELEGRAM_CHAT_ID || "").trim();
const api = async method => (await fetch(`https://api.telegram.org/bot${token}/${method}`)).json();

(async () => {
  if (!token) return console.log("TELEGRAM_BOT_TOKEN в .env пустой.");
  console.log("TELEGRAM_CHAT_ID в .env:", chatId ? `«${chatId}»` : "ПУСТО");
  if (chatId && !/^-?\d+$/.test(chatId)) console.log("  ⚠ chat_id должен быть числом (например 123456789), без @, кавычек и пробелов.");

  const me = await api("getMe");
  if (!me.ok) return console.log("✗ Токен не принят Telegram:", me.description);
  console.log(`✓ Токен рабочий. Бот: @${me.result.username} (его собственный id ${me.result.id}, это НЕ chat_id)`);

  const upd = await api("getUpdates");
  const chats = new Map();
  for (const u of upd.result || []) {
    const c = (u.message || u.edited_message || u.channel_post || u.my_chat_member || {}).chat;
    if (c) chats.set(c.id, c);
  }
  if (!chats.size) {
    console.log("\nБоту пока никто не писал. Откройте бота в Telegram, нажмите Start и отправьте любое сообщение, потом запустите проверку снова.");
    return;
  }
  console.log("\nЧаты, которые писали боту:");
  for (const c of chats.values()) {
    const name = c.title || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.username || "?";
    console.log(`  chat_id = ${c.id}   (${c.type}, ${name})${String(c.id) === chatId ? "   ← совпадает с .env ✓" : ""}`);
  }
  if (![...chats.keys()].some(id => String(id) === chatId)) console.log("\n✗ Значение TELEGRAM_CHAT_ID из .env не найдено среди этих чатов: впишите в .env нужный chat_id из списка выше.");
})().catch(e => console.log("Ошибка запроса:", e.message));
