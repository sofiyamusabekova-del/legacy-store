// GET /robots.txt — правила для поисковых роботов: закрываем админку, API и личные страницы покупателя.
const { originOf } = require("./_core");

module.exports = (req, res) => {
  const lines = [
    "User-agent: *",
    "Disallow: /admin.html",
    "Disallow: /api/",
    "Disallow: /cart.html",
    "Disallow: /checkout.html",
    "Disallow: /order.html",
    "Disallow: /orders.html",
    "Disallow: /wishlist.html",
    "",
    `Sitemap: ${originOf(req)}/sitemap.xml`
  ];
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).end(lines.join("\n") + "\n");
};
