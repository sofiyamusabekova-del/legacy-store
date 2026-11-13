// SEO: мета-теги страницы и структурированные данные JSON-LD (товар, хлебные крошки).
import { RATE } from "./data.js";

const origin = () => (location.origin.startsWith("http") ? location.origin : "");
const abs = path => (/^https?:/.test(path) ? path : `${origin()}/${String(path).replace(/^\//, "")}`);

function meta(attrName, attrValue, content) {
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attrName, attrValue); document.head.append(el); }
  el.setAttribute("content", content);
}

// Заголовок, описание, картинка и адрес страницы для поисковиков и превью в соцсетях
export function setPageMeta({ title, description, image, path = location.pathname + location.search }) {
  document.title = title;
  const url = origin() ? origin() + path : "";
  meta("name", "description", description);
  meta("property", "og:title", title);
  meta("property", "og:description", description);
  meta("name", "twitter:title", title);
  meta("name", "twitter:description", description);
  if (image) { meta("property", "og:image", abs(image)); meta("name", "twitter:image", abs(image)); }
  if (url) {
    meta("property", "og:url", url);
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.append(link); }
    link.href = url;
  }
}

export function setJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!data) { script?.remove(); return; }
  if (!script) { script = document.createElement("script"); script.type = "application/ld+json"; script.id = id; document.head.append(script); }
  script.textContent = JSON.stringify(data);
}

// Карточка товара для Google (цена в сумах, наличие по остатку)
export function productLd(p, { name, description, url, category }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name, description, sku: p.id, category,
    image: [abs(p.img)],
    ...(p.colors?.length ? { color: p.colors.join(", ") } : {}),
    brand: { "@type": "Brand", name: "LEGACY" },
    offers: {
      "@type": "Offer", url,
      priceCurrency: "UZS", price: Math.round(p.price * RATE),
      itemCondition: "https://schema.org/NewCondition",
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };
}

export function breadcrumbLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) }))
  };
}
