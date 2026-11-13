// GET /sitemap.xml — карта сайта для поисковиков: страницы, коллекции и открытые товары из базы.
// Адрес сайта берётся из запроса, так что на любом домене ссылки получаются правильными.
const { read } = require("./_db");
const { originOf } = require("./_core");

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const PAGES = ["index.html", "catalog.html", "collections.html", "about.html", "contact.html"];

module.exports = async (req, res) => {
  try {
    const db = await read();
    const base = originOf(req);
    const urls = [
      ...PAGES.map(p => ({ loc: `${base}/${p === "index.html" ? "" : p}`, prio: p === "index.html" ? "1.0" : "0.7" })),
      ...db.collections.map(c => ({ loc: `${base}/collection.html?id=${c.id}`, prio: "0.6" })),
      ...db.products.filter(p => !p.hidden).map(p => ({ loc: `${base}/product.html?id=${p.id}`, prio: "0.8", img: `${base}/${p.img}`, mod: p.added }))
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
      urls.map(u => `  <url><loc>${esc(u.loc)}</loc>${u.mod ? `<lastmod>${u.mod}</lastmod>` : ""}<priority>${u.prio}</priority>${u.img ? `<image:image><image:loc>${esc(u.img)}</image:loc></image:image>` : ""}</url>`).join("\n") + "\n</urlset>\n";
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).end(xml);
  } catch (e) {
    console.error("[api] sitemap", e.message);
    res.status(503).end("Sitemap unavailable");
  }
};
