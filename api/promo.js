// POST /api/promo {code, subtotal} — проверка промокода (сами коды покупателям не раздаются).
const { route } = require("./_telegram");
const { read } = require("./_db");
const { promoCheck } = require("./_core");

module.exports = route(async b => {
  const sub = Number(b.subtotal);
  const r = promoCheck(await read(), b.code, Number.isFinite(sub) ? sub : 0);
  if (!r.ok) return { body: { ok: false, reason: r.reason, min: r.min } };
  const { type, value, min } = r.promo;
  return { body: { ok: true, promo: { code: r.promo.code, type, value, min } } };
}, { rate: 20 });
