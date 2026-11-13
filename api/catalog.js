// GET /api/catalog — актуальный каталог для витрины (товары, категории, коллекции, доставка, настройки).
const { read } = require("./_db");
const { publicCatalog } = require("./_core");

module.exports = async (req, res) => {
  try {
    const db = await read();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(publicCatalog(db));
  } catch (e) {
    console.error("[api] catalog", e.message);
    res.status(503).json({ ok: false, error: e.code || "server_error" });
  }
};
