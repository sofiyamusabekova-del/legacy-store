// POST /api/contact — сообщение из формы обратной связи: сохраняется в базе (раздел «Сообщения» в админке) и уходит в Telegram.
const { esc, sendTelegram, route } = require("./_telegram");
const { update, uid } = require("./_db");

const str = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.trim().length <= max;

module.exports = route(async b => {
  // Защита от ботов: скрытое поле-ловушка, форма «заполнена» быстрее человека, одинаковые сообщения подряд.
  // Боту отвечаем «успех», чтобы он не искал обходных путей.
  if (typeof b.website === "string" && b.website.trim() !== "") return { body: { ok: true } };
  if (Number.isFinite(b.elapsed) && b.elapsed < 2500) return { body: { ok: true } };

  if (!str(b.name, 2, 80) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(b.email || "").trim()) || !str(b.message, 5, 2000)) {
    return { status: 400, body: { ok: false, error: "invalid" } };
  }
  const msg = { id: uid("m"), createdAt: new Date().toISOString(), name: b.name.trim(), email: b.email.trim(), message: b.message.trim(), read: false };
  const notify = await update(db => {
    const dup = db.messages.find(m => m.email === msg.email && m.message === msg.message && Date.now() - Date.parse(m.createdAt) < 10 * 60 * 1000);
    if (dup) return null; // тот же текст от того же адреса в последние 10 минут
    db.messages.unshift(msg);
    return db.settings.telegramNotify;
  });
  if (notify) {
    try {
      await sendTelegram(["✉️ <b>Сообщение с сайта</b>", "", `👤 ${esc(msg.name)}`, `📧 ${esc(msg.email)}`, "", esc(msg.message)].join("\n"));
    } catch (e) { console.error("[api] telegram:", e.message); }
  }
});
