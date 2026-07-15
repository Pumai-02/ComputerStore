/* ==========================================================================
   TechNova — Search, Filters & Sort
   Filters/sorts run client-side over the catalog fetched by products.js
   (catalogReady) — the same UX as before, now backed by real API data.
   ========================================================================== */

function searchProducts(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.specs.toLowerCase().includes(q) ||
      p.category.replace("-", " ").includes(q)
  );
}

/* ---- Header search overlay ------------------------------------------ */
function initHeaderSearch() {
  const overlay = document.getElementById("searchOverlay");
  const openBtns = document.querySelectorAll(".search-open-btn");
  const closeBtn = document.getElementById("searchCloseBtn");
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");

  if (!overlay) return;

  openBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      setTimeout(() => input.focus(), 150);
    })
  );

  closeBtn?.addEventListener("click", closeSearch);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSearch();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
  });

  function closeSearch() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    input.value = "";
    results.innerHTML = "";
  }

  input?.addEventListener("input", () => {
    const matches = searchProducts(input.value);
    if (!input.value.trim()) {
      results.innerHTML = "";
      return;
    }
    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">No products found for "${input.value}"</p>`;
      return;
    }
    results.innerHTML = matches
      .slice(0, 6)
      .map(
        (p) => `
      <a class="search-result-row" href="product-details.html#slug=${p.slug}">
        <span class="search-result-icon" style="background:${p.color}"><i class="fa-solid ${categoryIcon(p.category)}"></i></span>
        <span>
          <strong>${p.name}</strong>
          <small>${p.brand} · ${formatPrice(p.price)}</small>
        </span>
      </a>`
      )
      .join("");
  });
}

/* ---- Products page: filter, sort, search ----------------------------- */
function initProductsPage() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const state = {
    query: params.get("q") || "",
    category: params.get("category") || "all",
    brands: new Set(),
    maxPrice: 5000,
    minRating: 0,
    inStockOnly: false,
    sort: "featured",
  };

  const searchBox = document.getElementById("productSearchBox");
  const brandChecks = document.querySelectorAll(".filter-brand");
  const priceRange = document.getElementById("priceRange");
  const priceValue = document.getElementById("priceValue");
  const ratingChecks = document.querySelectorAll(".filter-rating");
  const stockCheck = document.getElementById("filterInStock");
  const sortSelect = document.getElementById("sortSelect");
  const categoryChips = document.querySelectorAll(".category-chip");
  const resultCount = document.getElementById("resultCount");
  const clearBtn = document.getElementById("clearFiltersBtn");

  if (searchBox) searchBox.value = state.query;
  if (priceRange) priceRange.value = state.maxPrice;

  function apply() {
    let list = PRODUCTS.slice();

    if (state.query) {
      const q = state.query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.specs.toLowerCase().includes(q));
    }
    if (state.category !== "all") {
      list = list.filter((p) => p.category === state.category);
    }
    if (state.brands.size) {
      list = list.filter((p) => state.brands.has(p.brand));
    }
    list = list.filter((p) => p.price <= state.maxPrice);
    if (state.minRating > 0) {
      list = list.filter((p) => p.rating >= state.minRating);
    }
    if (state.inStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }

    switch (state.sort) {
      case "price-low":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        list.sort((a, b) => new Date(b.added || 0) - new Date(a.added || 0));
        break;
      case "bestselling":
        list.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        list.sort((a, b) => (b.tag === "bestseller") - (a.tag === "bestseller"));
    }

    renderProductGrid(grid, list);
    if (resultCount) resultCount.textContent = `${list.length} product${list.length !== 1 ? "s" : ""} found`;
  }

  searchBox?.addEventListener("input", () => {
    state.query = searchBox.value;
    apply();
  });

  brandChecks.forEach((cb) =>
    cb.addEventListener("change", () => {
      cb.checked ? state.brands.add(cb.value) : state.brands.delete(cb.value);
      apply();
    })
  );

  priceRange?.addEventListener("input", () => {
    state.maxPrice = parseInt(priceRange.value);
    if (priceValue) priceValue.textContent = formatPrice(state.maxPrice);
    apply();
  });

  ratingChecks.forEach((cb) =>
    cb.addEventListener("change", () => {
      ratingChecks.forEach((other) => {
        if (other !== cb) other.checked = false;
      });
      state.minRating = cb.checked ? parseInt(cb.value) : 0;
      apply();
    })
  );

  stockCheck?.addEventListener("change", () => {
    state.inStockOnly = stockCheck.checked;
    apply();
  });

  sortSelect?.addEventListener("change", () => {
    state.sort = sortSelect.value;
    apply();
  });

  categoryChips.forEach((chip) =>
    chip.addEventListener("click", () => {
      categoryChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.category = chip.dataset.category;
      apply();
    })
  );

  clearBtn?.addEventListener("click", () => {
    state.query = "";
    state.category = "all";
    state.brands.clear();
    state.maxPrice = 5000;
    state.minRating = 0;
    state.inStockOnly = false;
    state.sort = "featured";
    if (searchBox) searchBox.value = "";
    brandChecks.forEach((cb) => (cb.checked = false));
    ratingChecks.forEach((cb) => (cb.checked = false));
    if (stockCheck) stockCheck.checked = false;
    if (priceRange) priceRange.value = 5000;
    if (priceValue) priceValue.textContent = formatPrice(5000);
    if (sortSelect) sortSelect.value = "featured";
    categoryChips.forEach((c) => c.classList.toggle("active", c.dataset.category === "all"));
    apply();
  });

  // set initial active chip
  categoryChips.forEach((c) => c.classList.toggle("active", c.dataset.category === state.category));

  apply();
}

document.addEventListener("DOMContentLoaded", async () => {
  initHeaderSearch();
  await catalogReady;
  initProductsPage();
});
