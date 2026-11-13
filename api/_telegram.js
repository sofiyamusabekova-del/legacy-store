// Общий помощник для серверных функций: отправка сообщения в Telegram.
// Токен и chat_id берутся ТОЛЬКО из переменных окружения сервера (.env локально, Settings → Environment Variables на Vercel)
// и никогда не попадают в браузер. Файлы с префиксом «_» Vercel не публикует как маршруты.

const MAX_BODY = 20000; // байт: защита от слишком больших запросов

const esc = s => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// Очень простой ограничитель частоты: не больше 6 запросов в минуту с одного адреса.
// (На serverless память живёт недолго, но от случайного спама защищает; настоящую защиту добавим вместе с деплоем.)
const hits = new Map();
function rateLimited(req, max = 6) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
  const key = ip + "|" + (req.url || "").split("?")[0];
  const now = Date.now();
  const list = (hits.get(key) || []).filter(ts => now - ts < 60000);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
}

async function sendTelegram(text) {
  // Режим проверки без настоящего бота: сообщение просто печатается в консоль сервера
  if (process.env.TELEGRAM_MOCK === "1") {
    console.log("[telegram:mock]\n" + text.replace(/<[^>]+>/g, "") + "\n");
    return;
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw Object.assign(new Error("Telegram не настроен"), { code: "not_configured" });
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true })
  });
  if (!res.ok) {
    // Причину пишем только в лог сервера (токена в ней нет), покупателю уходит общий код ошибки
    const info = await res.json().catch(() => ({}));
    throw Object.assign(new Error(`Telegram вернул ошибку ${res.status}: ${info.description || "без описания"}`), { code: "telegram_error" });
  }
}

// Общая обвязка: метод, размер, частота, разбор JSON, единый формат ответов
// handler(body, req, res) возвращает { status, body, headers } или ничего (тогда ответ {ok:true}).
// options: maxBody — максимальный размер запроса, rate — запросов в минуту с одного адреса (0 = без ограничения).
function route(handler, { maxBody = MAX_BODY, rate = 6 } = {}) {
  return async (req, res) => {
    const send = (status, body, headers = {}) => {
      for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
      res.setHeader("Cache-Control", "no-store");
      return res.status(status).json(body);
    };
    if (req.method !== "POST") return send(405, { ok: false, error: "method_not_allowed" });
    const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
    if (!body || typeof body !== "object") return send(400, { ok: false, error: "invalid" });
    if (JSON.stringify(body).length > maxBody) return send(413, { ok: false, error: "too_large" });
    if (rate && rateLimited(req, rate)) return send(429, { ok: false, error: "rate_limited" });
    try {
      const out = await handler(body, req, res);
      return send(out?.status ?? 200, out?.body ?? { ok: true }, out?.headers);
    } catch (e) {
      const code = e.code === "not_configured" || e.code === "storage_not_configured" ? 503 : 502;
      console.error("[api]", e.code || "error", e.message);
      return send(code, { ok: false, error: e.code || "server_error" });
    }
  };
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

module.exports = { esc, sendTelegram, route, safeParse };
