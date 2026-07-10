/* ==========================================================================
   TechNova — Core App Logic
   ========================================================================== */

/* ---- Toast ------------------------------------------------------------ */
function showToast(message) {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

/* ---- Mobile nav --------------------------------------------------------*/
function initNav() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  toggle?.addEventListener("click", () => {
    menu.classList.toggle("open");
    toggle.classList.toggle("open");
    toggle.setAttribute("aria-expanded", menu.classList.contains("open"));
  });

  const header = document.getElementById("siteHeader");
  window.addEventListener("scroll", () => {
    header?.classList.toggle("scrolled", window.scrollY > 12);
  });
}

/* ---- Dark mode ---------------------------------------------------------*/
function initDarkMode() {
  const btns = document.querySelectorAll(".theme-toggle");
  const stored = localStorage.getItem("technova_theme");
  if (stored === "dark") document.documentElement.setAttribute("data-theme", "dark");

  const sync = () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    btns.forEach((b) => (b.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon"));
  };
  sync();

  btns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("technova_theme", "light");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("technova_theme", "dark");
      }
      sync();
    })
  );
}

/* ---- Scroll reveal animation -------------------------------------------*/
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".fade-up, .slide-up").forEach((el) => observer.observe(el));

  // re-observe on dynamic content
  const mo = new MutationObserver(() => {
    document.querySelectorAll(".fade-up:not(.visible), .slide-up:not(.visible)").forEach((el) => observer.observe(el));
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

/* ---- Back to top ---------------------------------------------------- */
function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 500);
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ---- Smooth scroll for anchor links --------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
}

/* ---- FAQ accordion ---------------------------------------------------- */
function initAccordion() {
  document.querySelectorAll(".accordion-item").forEach((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    trigger?.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      item.closest(".accordion")?.querySelectorAll(".accordion-item").forEach((i) => i.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    });
  });
}

/* ---- Countdown timer ---------------------------------------------------*/
function initCountdown() {
  document.querySelectorAll(".countdown").forEach((el) => {
    const end = Date.now() + 1000 * (60 * 60 * 46 + 60 * 12); // ~46h12m demo window
    const dEl = el.querySelector(".cd-days");
    const hEl = el.querySelector(".cd-hours");
    const mEl = el.querySelector(".cd-mins");
    const sEl = el.querySelector(".cd-secs");

    function tick() {
      let diff = Math.max(0, end - Date.now());
      const d = Math.floor(diff / 86400000);
      diff -= d * 86400000;
      const h = Math.floor(diff / 3600000);
      diff -= h * 3600000;
      const m = Math.floor(diff / 60000);
      diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      if (dEl) dEl.textContent = String(d).padStart(2, "0");
      if (hEl) hEl.textContent = String(h).padStart(2, "0");
      if (mEl) mEl.textContent = String(m).padStart(2, "0");
      if (sEl) sEl.textContent = String(s).padStart(2, "0");
    }
    tick();
    setInterval(tick, 1000);
  });
}

/* ---- Newsletter + contact form validation ----------------------------- */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function initForms() {
  document.querySelectorAll(".newsletter-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const msg = form.querySelector(".form-message");
      if (!validateEmail(input.value)) {
        msg.textContent = "Please enter a valid email address.";
        msg.className = "form-message error";
        return;
      }
      try {
        const res = await api.post("/newsletter/subscribe", { email: input.value }, { auth: false });
        msg.textContent = res.message || "You're subscribed! Watch your inbox for exclusive deals.";
        msg.className = "form-message success";
        form.reset();
      } catch (err) {
        msg.textContent = err.message || "Something went wrong. Please try again.";
        msg.className = "form-message error";
      }
    });
  });

  const contactForm = document.getElementById("contactForm");
  contactForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("cf-name");
    const email = document.getElementById("cf-email");
    const subject = document.getElementById("cf-subject");
    const message = document.getElementById("cf-message");
    let valid = true;

    [name, email, subject, message].forEach((field) => field.classList.remove("invalid"));

    if (!name.value.trim()) {
      name.classList.add("invalid");
      valid = false;
    }
    if (!validateEmail(email.value)) {
      email.classList.add("invalid");
      valid = false;
    }
    if (!subject.value.trim()) {
      subject.classList.add("invalid");
      valid = false;
    }
    if (!message.value.trim()) {
      message.classList.add("invalid");
      valid = false;
    }

    const feedback = document.getElementById("contactFeedback");
    if (!valid) {
      feedback.textContent = "Please fill in all required fields correctly.";
      feedback.className = "form-message error";
      return;
    }

    try {
      const res = await api.post(
        "/contact",
        { name: name.value, email: email.value, subject: subject.value, message: message.value },
        { auth: false }
      );
      feedback.textContent = res.message || "Thanks for reaching out! Our team will reply within 24 hours.";
      feedback.className = "form-message success";
      contactForm.reset();
    } catch (err) {
      feedback.textContent = err.message || "Something went wrong sending your message. Please try again.";
      feedback.className = "form-message error";
    }
  });
}

/* ---- Quick view modal --------------------------------------------------*/
function initQuickView() {
  const modal = document.getElementById("quickViewModal");
  if (!modal) return;
  const body = document.getElementById("quickViewBody");

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".quick-view");
    if (trigger) {
      e.preventDefault();
      const product = PRODUCTS.find((p) => String(p.id) === String(trigger.dataset.id));
      if (!product) return;
      const imgUrl = productImageUrl(product);
      const img = imgUrl ? `<img src="${imgUrl}" alt="${product.name}" loading="lazy" onerror="this.remove()">` : "";
      body.innerHTML = `
        <div class="quick-view-media" style="background:${product.color}">
          ${img}
          <i class="fa-solid ${categoryIcon(product.category)}"></i>
        </div>
        <div class="quick-view-info">
          <span class="product-brand">${product.brand}</span>
          <h3>${product.name}</h3>
          <div class="product-rating"><span class="stars">${starRating(product.rating)}</span><span class="rating-count">(${product.reviews} reviews)</span></div>
          <p class="product-specs">${product.specs}</p>
          <div class="product-price-row"><span class="price-now">${formatPrice(product.price)}</span>${product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ""}</div>
          ${stockLabel(product.stock)}
          <div class="quick-view-actions">
            <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>
            <a class="btn btn-outline" href="product-details.html?slug=${product.slug}">View Full Details</a>
          </div>
        </div>`;
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    if (e.target.closest("[data-close-modal]")) {
      document.querySelectorAll(".modal.open").forEach((m) => m.classList.remove("open"));
      document.body.style.overflow = "";
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
      document.body.style.overflow = "";
    }
  });
}

/* ---- Home page: featured products + brands/categories ------------------*/
function initHomePage() {
  const featuredGrid = document.getElementById("featuredGrid");
  if (featuredGrid) {
    const featured = PRODUCTS.filter((p) => p.tag === "bestseller" || p.tag === "new").slice(0, 12);
    const list = featured.length >= 12 ? featured : PRODUCTS.slice(0, 12);
    renderProductGrid(featuredGrid, list);
  }

  const dealsGrid = document.getElementById("dealsGrid");
  if (dealsGrid) {
    const deals = PRODUCTS.filter((p) => p.oldPrice).slice(0, 4);
    renderProductGrid(dealsGrid, deals);
  }

  const brandGrid = document.getElementById("brandGrid");
  if (brandGrid) {
    const brands = [...new Set(PRODUCTS.map((p) => p.brand).filter(Boolean))];
    brandGrid.innerHTML = brands
      .map((b) => `<a class="brand-card fade-up" href="products.html?q=${encodeURIComponent(b)}"><span>${b}</span></a>`)
      .join("");
  }

  const categoryGrid = document.getElementById("categoryGrid");
  if (categoryGrid) {
    categoryGrid.innerHTML = CATEGORIES.map(
      (c) => `
      <a class="category-card fade-up" href="products.html?category=${c.id}">
        <span class="category-icon"><i class="fa-solid ${c.icon}"></i></span>
        <span class="category-name">${c.name}</span>
      </a>`
    ).join("");
  }
}

/* ---- Product details page ---------------------------------------------*/
const SAMPLE_REVIEWS = [
  { name: "Daniel R.", rating: 5, comment: "Exceeded expectations. Setup was painless and performance under load is fantastic." },
  { name: "Priya M.", rating: 4, comment: "Great value overall, though it runs a little warm under sustained workloads." },
  { name: "Jonas K.", rating: 5, comment: "Build quality feels premium and the display is stunning in person." },
];

async function initProductDetailsPage() {
  const container = document.getElementById("productDetails");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || params.get("id");
  container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading product…</p></div>`;

  let product;
  try {
    product = slug ? await fetchProductBySlug(slug) : PRODUCTS[0];
  } catch (err) {
    product = PRODUCTS.find((p) => String(p.id) === String(slug)) || null;
  }

  if (!product) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>We couldn't find that product.</p><a href="products.html" class="btn btn-primary">Browse Products</a></div>`;
    return;
  }

  document.title = `${product.name} — TechNova Computer Store`;

  const galleryUrls = [0, 1, 2, 3].map((i) => productImageUrl(product, i));
  const mainImg = galleryUrls[0]
    ? `<img id="pdMainImg" src="${galleryUrls[0]}" alt="${product.name}" onerror="this.remove()">`
    : "";

  container.innerHTML = `
    <div class="pd-gallery">
      <div class="pd-main-image" id="pdMainImage" style="background:${product.color}">
        ${mainImg}
        <i class="fa-solid ${categoryIcon(product.category)}"></i>
      </div>
      <div class="pd-thumbs">
        ${galleryUrls
          .map((url, i) => {
            const thumbImg = url ? `<img src="${url}" alt="${product.name} view ${i + 1}" loading="lazy" onerror="this.remove()">` : "";
            return `<button class="pd-thumb ${i === 0 ? "active" : ""}" style="background:${product.color}" data-idx="${i}">
                ${thumbImg}
                <i class="fa-solid ${categoryIcon(product.category)}"></i>
              </button>`;
          })
          .join("")}
      </div>
    </div>
    <div class="pd-info">
      <nav class="breadcrumb"><a href="index.html">Home</a> / <a href="products.html">Products</a> / <span>${product.name}</span></nav>
      <span class="product-brand">${product.brand}</span>
      <h1>${product.name}</h1>
      <div class="product-rating"><span class="stars">${starRating(product.rating)}</span><span class="rating-count">(${product.reviews} reviews)</span></div>
      <div class="product-price-row large">
        <span class="price-now">${formatPrice(product.price)}</span>
        ${product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>${badgeHtml(product)}` : ""}
      </div>
      ${stockLabel(product.stock)}
      <p class="pd-description">${product.description}</p>
      <div class="pd-qty-row">
        <div class="qty-selector">
          <button class="qty-btn" id="pdQtyMinus" aria-label="Decrease quantity">−</button>
          <input type="number" id="pdQty" value="1" min="1" aria-label="Quantity">
          <button class="qty-btn" id="pdQtyPlus" aria-label="Increase quantity">+</button>
        </div>
        <button class="btn btn-primary" id="pdAddToCart" ${product.stock <= 0 ? "disabled" : ""}><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>
        <button class="icon-btn wishlist-btn ${isInWishlist(product.id) ? "active" : ""}" data-id="${product.id}" aria-label="Toggle wishlist">
          <i class="fa-${isInWishlist(product.id) ? "solid" : "regular"} fa-heart"></i>
        </button>
      </div>
      <div class="pd-share">
        <span>Share:</span>
        <a href="#" aria-label="Share on Facebook"><i class="fa-brands fa-facebook"></i></a>
        <a href="#" aria-label="Share on X"><i class="fa-brands fa-x-twitter"></i></a>
        <a href="#" aria-label="Share on Pinterest"><i class="fa-brands fa-pinterest"></i></a>
        <a href="#" aria-label="Share via email"><i class="fa-solid fa-envelope"></i></a>
      </div>
      <ul class="pd-trust">
        <li><i class="fa-solid fa-shield-halved"></i> 2-Year Official Warranty</li>
        <li><i class="fa-solid fa-truck-fast"></i> Free delivery over $500</li>
        <li><i class="fa-solid fa-rotate-left"></i> 30-day easy returns</li>
      </ul>
    </div>`;

  document.getElementById("pdAddToCart")?.addEventListener("click", () => {
    const qty = parseInt(document.getElementById("pdQty").value) || 1;
    addToCart(product.id, qty);
  });
  document.getElementById("pdQtyPlus")?.addEventListener("click", () => {
    const input = document.getElementById("pdQty");
    input.value = parseInt(input.value) + 1;
  });
  document.getElementById("pdQtyMinus")?.addEventListener("click", () => {
    const input = document.getElementById("pdQty");
    input.value = Math.max(1, parseInt(input.value) - 1);
  });
  container.querySelectorAll(".pd-thumb").forEach((thumb) =>
    thumb.addEventListener("click", () => {
      container.querySelectorAll(".pd-thumb").forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
      const mainImg = document.getElementById("pdMainImg");
      const idx = parseInt(thumb.dataset.idx, 10);
      const url = productImageUrl(product, idx);
      if (mainImg && url) mainImg.src = url;
    })
  );

  // Zoom effect
  const mainImage = document.getElementById("pdMainImage");
  mainImage?.addEventListener("mousemove", (e) => {
    const rect = mainImage.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    mainImage.style.setProperty("--zoom-x", `${x}%`);
    mainImage.style.setProperty("--zoom-y", `${y}%`);
    mainImage.classList.add("zoomed");
  });
  mainImage?.addEventListener("mouseleave", () => mainImage.classList.remove("zoomed"));

  // Specs table
  const specsTable = document.getElementById("pdSpecsTable");
  if (specsTable) {
    const entries = Object.entries(product.specTable);
    specsTable.innerHTML = entries.length
      ? entries.map(([key, val]) => `<tr><th>${key}</th><td>${val}</td></tr>`).join("")
      : `<tr><td colspan="2">No detailed specifications available for this product yet.</td></tr>`;
  }

  // Reviews
  const reviewsEl = document.getElementById("pdReviews");
  if (reviewsEl) {
    reviewsEl.innerHTML = SAMPLE_REVIEWS.map(
      (r) => `
      <div class="review-card fade-up">
        <div class="review-header">
          <span class="review-avatar">${r.name.charAt(0)}</span>
          <div>
            <strong>${r.name}</strong>
            <div class="stars">${starRating(r.rating)}</div>
          </div>
        </div>
        <p>${r.comment}</p>
      </div>`
    ).join("");
  }

  // Related products
  const relatedGrid = document.getElementById("relatedGrid");
  if (relatedGrid) {
    const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
    renderProductGrid(relatedGrid, related.length ? related : PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4));
  }
}

/* ---- Init ---------------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", async () => {
  initNav();
  initDarkMode();
  initBackToTop();
  initSmoothScroll();
  initAccordion();
  initCountdown();
  initForms();

  await Promise.all([catalogReady, typeof wishlistReady !== "undefined" ? wishlistReady : Promise.resolve()]);

  initQuickView();
  initHomePage();
  await initProductDetailsPage();
  updateCartCount();
  updateWishlistCount();
  initScrollReveal();
});
