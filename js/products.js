/* ==========================================================================
   TechNova — Product Catalog (API-backed)
   Fetches categories + products from the Laravel backend and normalizes
   them into the shape the rest of the UI (app.js, search.js, cart.js,
   wishlist.js) already knows how to render.
   ========================================================================== */

let PRODUCTS = [];
let CATEGORIES = [];

const CATEGORY_ICONS = {
  laptops: "fa-laptop",
  "gaming-laptops": "fa-laptop",
  "business-laptops": "fa-briefcase",
  desktops: "fa-desktop",
  "desktop-pcs": "fa-desktop",
  "gaming-pcs": "fa-gamepad",
  monitors: "fa-tv",
  components: "fa-microchip",
  "graphics-cards": "fa-microchip",
  motherboards: "fa-server",
  ram: "fa-memory",
  ssd: "fa-hard-drive",
  hdd: "fa-database",
  "power-supply": "fa-plug",
  "pc-cases": "fa-box",
  cooling: "fa-fan",
  peripherals: "fa-keyboard",
  keyboard: "fa-keyboard",
  mouse: "fa-computer-mouse",
  headsets: "fa-headphones",
  webcam: "fa-camera",
  accessories: "fa-plug-circle-bolt",
};

const PLACEHOLDER_COLORS = ["#0f172a", "#1e293b", "#111827", "#1f2937"];

function colorForId(id) {
  const n = typeof id === "number" ? id : String(id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return PLACEHOLDER_COLORS[n % PLACEHOLDER_COLORS.length];
}

function categoryIcon(catSlug) {
  return CATEGORY_ICONS[catSlug] || "fa-box";
}

/** Turns the raw Laravel `Product` JSON into the flat shape the UI templates use. */
function normalizeProduct(p) {
  const category = p.category || {};
  const hasSale = p.sale_price !== null && p.sale_price !== undefined && Number(p.sale_price) < Number(p.price);
  const price = hasSale ? Number(p.sale_price) : Number(p.price);
  const oldPrice = hasSale ? Number(p.price) : null;

  const images = Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : [];

  let specsLine = p.description ? p.description.slice(0, 90) + (p.description.length > 90 ? "…" : "") : "";
  const specTable = p.specs && typeof p.specs === "object" && !Array.isArray(p.specs) ? p.specs : null;
  if (specTable) {
    specsLine = Object.entries(specTable).slice(0, 3).map(([, v]) => `${v}`).join(" · ");
  }

  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    brand: category.name || "",
    category: category.slug || "",
    categoryName: category.name || "",
    images,
    specs: specsLine,
    specTable: specTable || {},
    price,
    oldPrice,
    rating: Number(p.rating) || 0,
    reviews: p.reviews_count || 0,
    stock: p.stock ?? 0,
    badge: hasSale ? "sale" : p.is_featured ? "new" : null,
    tag: p.is_featured ? "bestseller" : null,
    color: colorForId(p.id),
    added: p.created_at || null,
    description: p.description || "",
  };
}

function normalizeCategory(c) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: categoryIcon(c.slug),
    productsCount: c.products_count ?? null,
  };
}

/**
 * Returns an image URL for a product, or null if it has none (callers
 * should fall back to the category icon in that case). `variant` (0-3)
 * picks a different image from the product's gallery when available.
 */
function productImageUrl(product, variant = 0) {
  if (!product.images || !product.images.length) return null;
  return product.images[variant % product.images.length];
}

/** Fetches the full product list once (large per_page) so existing
 *  client-side filter/sort/search code can keep working the same way
 *  it did against the old static array. */
async function fetchAllProducts(extraParams = {}) {
  const res = await api.get("/products", { per_page: 200, ...extraParams });
  const list = Array.isArray(res) ? res : res.data || [];
  return list.map(normalizeProduct);
}

async function fetchCategories() {
  const res = await api.get("/categories");
  const list = Array.isArray(res) ? res : res.data || [];
  return list.map(normalizeCategory);
}

async function fetchProductBySlug(slug) {
  const p = await api.get(`/products/${encodeURIComponent(slug)}`);
  return normalizeProduct(p);
}

/** Resolves once PRODUCTS + CATEGORIES have been loaded from the API.
 *  Every page waits on this before rendering anything catalog-related. */
const catalogReady = (async () => {
  try {
    const [categories, products] = await Promise.all([fetchCategories(), fetchAllProducts()]);
    CATEGORIES = categories;
    PRODUCTS = products;
  } catch (err) {
    console.error("Failed to load catalog from the API:", err);
    document.querySelectorAll("[data-catalog-error-target]").forEach((el) => {
      el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${err.message}</p></div>`;
    });
  }
  return { CATEGORIES, PRODUCTS };
})();

/* ---- Render helpers (unchanged from the static version) --------------- */

function formatPrice(value) {
  return "$" + Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function starRating(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let html = "";
  for (let i = 0; i < full; i++) html += '<i class="fa-solid fa-star"></i>';
  if (half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
  for (let i = full + (half ? 1 : 0); i < 5; i++) html += '<i class="fa-regular fa-star"></i>';
  return html;
}

function stockLabel(stock) {
  if (stock <= 0) return '<span class="stock out">Out of Stock</span>';
  if (stock <= 5) return `<span class="stock low">Only ${stock} left</span>`;
  return '<span class="stock in">In Stock</span>';
}

function badgeHtml(product) {
  if (product.badge === "sale" && product.oldPrice) {
    const pct = Math.round(100 - (product.price / product.oldPrice) * 100);
    return `<span class="product-badge badge-sale">-${pct}%</span>`;
  }
  if (product.badge === "hot") return '<span class="product-badge badge-hot">Hot</span>';
  if (product.badge === "new") return '<span class="product-badge badge-new">New</span>';
  return "";
}

function productMediaInner(product) {
  const url = productImageUrl(product);
  const img = url
    ? `<img src="${url}" alt="${product.name}" loading="lazy" onerror="this.remove()">`
    : "";
  return `${img}<i class="fa-solid ${categoryIcon(product.category)} placeholder-icon"></i>`;
}

function productCard(product) {
  const wished = isInWishlist(product.id);
  return `
  <article class="product-card fade-up" data-id="${product.id}">
    ${badgeHtml(product)}
    <button class="icon-btn wishlist-btn ${wished ? "active" : ""}" data-id="${product.id}" aria-label="Toggle wishlist" title="Add to wishlist">
      <i class="fa-${wished ? "solid" : "regular"} fa-heart"></i>
    </button>
    <a href="product-details.html?slug=${product.slug}" class="product-media" style="background:${product.color}">
      ${productMediaInner(product)}
      <span class="quick-view" data-id="${product.id}">Quick View</span>
    </a>
    <div class="product-body">
      <span class="product-brand">${product.brand}</span>
      <h3 class="product-name"><a href="product-details.html?slug=${product.slug}">${product.name}</a></h3>
      <p class="product-specs">${product.specs}</p>
      <div class="product-rating">
        <span class="stars">${starRating(product.rating)}</span>
        <span class="rating-count">(${product.reviews})</span>
      </div>
      <div class="product-price-row">
        <span class="price-now">${formatPrice(product.price)}</span>
        ${product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ""}
      </div>
      ${stockLabel(product.stock)}
      <button class="btn btn-primary btn-block add-to-cart-btn" data-id="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>
        <i class="fa-solid fa-cart-plus"></i> Add to Cart
      </button>
    </div>
  </article>`;
}

function renderProductGrid(container, list) {
  if (!container) return;
  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>No products match your filters.</p></div>`;
    return;
  }
  container.innerHTML = list.map(productCard).join("");
}
