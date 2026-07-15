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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

const REVIEW_STORAGE_KEY = "technova_local_reviews";

function loadLocalReviews() {
  try {
    return JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function saveLocalReviews(reviews) {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
}

function getLocalReviewsForProduct(productId) {
  const reviews = loadLocalReviews();
  return Array.isArray(reviews[productId]) ? reviews[productId] : [];
}

function getLocalReviewForUser(productId, userId) {
  if (!userId) return null;
  return getLocalReviewsForProduct(productId).find((review) => String(review.userId) === String(userId)) || null;
}

function recordLocalReview(productId, rating, comment, userId) {
  const reviews = loadLocalReviews();
  const productReviews = Array.isArray(reviews[productId]) ? reviews[productId] : [];
  const now = new Date().toISOString();
  const existingIndex = userId ? productReviews.findIndex((review) => String(review.userId) === String(userId)) : -1;

  const reviewRecord = {
    id: existingIndex >= 0 ? productReviews[existingIndex].id : `${productId}_${userId || Math.random().toString(36).slice(2)}`,
    userId: userId || null,
    userName: getCurrentUser()?.name || "You",
    rating: Number(rating),
    comment: comment?.trim() || "",
    created_at: existingIndex >= 0 ? productReviews[existingIndex].created_at : now,
    updated_at: now,
  };

  if (existingIndex >= 0) {
    productReviews[existingIndex] = reviewRecord;
  } else {
    productReviews.unshift(reviewRecord);
  }

  reviews[productId] = productReviews;
  saveLocalReviews(reviews);
  return reviewRecord;
}

function renderInteractiveStars(selected = 0) {
  return [1, 2, 3, 4, 5]
    .map(
      (value) => `
      <button class="review-star-btn ${value <= selected ? "active" : ""}" type="button" data-rating="${value}" aria-label="Rate ${value} stars">
        <i class="${value <= selected ? "fa-solid fa-star" : "fa-regular fa-star"}"></i>
      </button>`
    )
    .join("");
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function renderReviewCard(review) {
  const user = review.user || review.author || review.customer || {};
  const name = user.name || review.user_name || review.name || "Anonymous";
  const avatar = (name || "A").toString().trim().charAt(0).toUpperCase();
  const rating = Number(review.rating || review.stars || 0);
  const comment = review.comment || review.review || "";
  const date = formatReviewDate(review.created_at || review.createdAt || review.updated_at || review.updatedAt);

  return `
  <div class="review-card fade-up">
    <div class="review-header">
      <span class="review-avatar">${avatar}</span>
      <div>
        <strong>${escapeHtml(name)}</strong>
        <div class="stars">${starRating(rating)}</div>
        ${date ? `<div class="rating-count">${escapeHtml(date)}</div>` : ""}
      </div>
    </div>
    ${comment ? `<p>${escapeHtml(comment)}</p>` : ""}
  </div>`;
}

function updateProductRatingSummary(product, average, count) {
  const topStars = document.getElementById("pdTopRatingStars");
  if (topStars) topStars.innerHTML = starRating(average);

  const topCount = document.getElementById("pdTopRatingCount");
  if (topCount) topCount.textContent = `(${count} ${count === 1 ? "review" : "reviews"})`;

  const topAverage = document.getElementById("pdTopRatingAverage");
  if (topAverage) topAverage.innerHTML = `Average Rating: <strong>${Number(average || 0).toFixed(1)}</strong>`;
}

async function fetchProductReviews(productId) {
  if (!productId) return { reviews: [], average: 0, count: 0, userReview: null };

  const attempts = [
    () => api.get("/reviews", { product_id: productId, per_page: 50 }),
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      const payload = await attempt();
      const data = Array.isArray(payload) ? payload : payload.data || payload.reviews || payload.results || [];
      const reviews = Array.isArray(data) ? data : [];
      const normalizedReviews = reviews.map((review) => ({
        ...review,
        rating: Number(review.rating || review.stars || 0),
      }));
      const count = Number(payload.count || payload.total || normalizedReviews.length || 0);
      const average = normalizedReviews.length
        ? normalizedReviews.reduce((sum, review) => sum + review.rating, 0) / normalizedReviews.length
        : Number(payload.average_rating || payload.average || 0);
      const user = getCurrentUser();
      const userReview = user
        ? normalizedReviews.find((review) => String(review.user_id || review.user?.id || review.author_id || "") === String(user.id)) || null
        : null;

      return {
        reviews: normalizedReviews,
        average: Number(average || 0),
        count: Number(count || normalizedReviews.length || 0),
        userReview,
      };
    } catch (err) {
      lastError = err;
    }
  }

  const localReviews = getLocalReviewsForProduct(productId).map((review) => ({
    ...review,
    rating: Number(review.rating || 0),
  }));
  const localCount = localReviews.length;
  const localAverage = localCount
    ? localReviews.reduce((sum, review) => sum + review.rating, 0) / localCount
    : 0;
  const user = getCurrentUser();
  const userReview = user ? getLocalReviewForUser(productId, user.id) : null;

  return {
    reviews: localReviews,
    average: Number(localAverage || 0),
    count: localCount,
    userReview,
    backendError: lastError?.message || "Review service unavailable.",
    localFallback: true,
  };
}

async function submitProductReview(productId, rating, comment, existingReviewId) {
  if (!isLoggedIn()) throw new Error("Please log in to rate this product.");
  if (!rating || Number(rating) < 1 || Number(rating) > 5) throw new Error("Please select a rating from 1 to 5 stars.");

  const body = { product_id: productId, rating: Number(rating), comment: comment?.trim() || "" };

  if (existingReviewId) {
    try {
      return await api.patch(`/reviews/${encodeURIComponent(existingReviewId)}`, body);
    } catch (err) {
      try {
        return await api.post(`/reviews/${encodeURIComponent(existingReviewId)}`, { ...body, _method: "PATCH" });
      } catch (fallbackErr) {
        // continue to local fallback below
      }
    }
  }

  const attempts = [
    () => api.post("/reviews", body),
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
    }
  }

  const user = getCurrentUser();
  const localReview = recordLocalReview(productId, rating, comment, user?.id);
  return localReview;
}

let activeReviewState = null;

function renderReviewSection(product, reviewState) {
  const reviewsEl = document.getElementById("pdReviews");
  if (!reviewsEl) return;

  const count = reviewState.count || reviewState.reviews.length || Number(product.reviews || 0);
  const average = reviewState.average || Number(product.rating || 0);
  const reviewsMarkup = reviewState.reviews.length
    ? reviewState.reviews.map(renderReviewCard).join("")
    : `<div class="empty-state"><i class="fa-solid fa-comments"></i><p>No reviews yet. Be the first to rate this product.</p></div>`;

  reviewsEl.innerHTML = `
    <div class="review-summary-card fade-up">
      <div class="product-rating">
        <span class="stars">${starRating(average)}</span>
        <span class="rating-count">(${count} ${count === 1 ? "review" : "reviews"})</span>
      </div>
      <div class="pd-rating-average">Average Rating: <strong>${Number(average || 0).toFixed(1)}</strong></div>
      ${isLoggedIn()
        ? `
        <div class="review-form-card">
          <div class="review-stars" id="reviewStars">${renderInteractiveStars(reviewState.selectedRating || 0)}</div>
          <textarea id="reviewComment" class="review-comment" placeholder="Share your experience (optional)">${escapeHtml(reviewState.comment || "")}</textarea>
          <div class="review-actions">
            <button class="btn btn-primary" id="submitReviewBtn">Submit Rating</button>
          </div>
          ${reviewState.localFallback ? `<div class="form-message success">Ratings are stored locally in this browser.</div>` : ""}
          ${reviewState.feedbackText ? `<div class="form-message ${reviewState.feedbackType || "success"}" id="reviewFeedback">${escapeHtml(reviewState.feedbackText)}</div>` : ""}
        </div>`
        : `<div class="review-form-card"><p class="form-message error">Please log in to rate this product.</p></div>`}
    </div>
    <div class="review-grid">${reviewsMarkup}</div>`;

  const starContainer = reviewsEl.querySelector("#reviewStars");
  starContainer?.querySelectorAll(".review-star-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      reviewState.selectedRating = Number(btn.dataset.rating);
      reviewState.comment = reviewsEl.querySelector("#reviewComment")?.value || "";
      reviewState.feedbackText = "";
      reviewState.feedbackType = "";
      renderReviewSection(product, reviewState);
    });
  });

  const submitBtn = reviewsEl.querySelector("#submitReviewBtn");
  submitBtn?.addEventListener("click", async () => {
    reviewState.comment = reviewsEl.querySelector("#reviewComment")?.value || "";
    if (!reviewState.selectedRating) {
      reviewState.feedbackText = "Please select a rating from 1 to 5 stars.";
      reviewState.feedbackType = "error";
      renderReviewSection(product, reviewState);
      return;
    }

    submitBtn.disabled = true;
    try {
      await submitProductReview(product.id, reviewState.selectedRating, reviewState.comment, reviewState.userReview?.id);
      await refreshReviews(product, "Thanks! Your rating has been submitted.", "success");
      showToast("Rating submitted");
    } catch (err) {
      reviewState.feedbackText = err.message || "Could not submit your rating.";
      reviewState.feedbackType = "error";
      renderReviewSection(product, reviewState);
      showToast(reviewState.feedbackText);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

async function refreshReviews(product, feedbackText = "", feedbackType = "") {
  const reviewData = await fetchProductReviews(product.id);
  activeReviewState = {
    reviews: reviewData.reviews || [],
    average: reviewData.average || Number(product.rating || 0),
    count: reviewData.count || reviewData.reviews?.length || Number(product.reviews || 0),
    selectedRating: reviewData.userReview?.rating || 0,
    comment: reviewData.userReview?.comment || "",
    userReview: reviewData.userReview || null,
    backendError: reviewData.error || "",
    feedbackText,
    feedbackType,
  };
  product.rating = activeReviewState.average;
  product.reviews = activeReviewState.count;
  updateProductRatingSummary(product, activeReviewState.average, activeReviewState.count);
  renderReviewSection(product, activeReviewState);
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
            <a class="btn btn-outline" href="product-details.html#slug=${product.slug}">View Full Details</a>
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

function getProductSlugFromHash() {
  const rawHash = window.location.hash.replace(/^#/, "");
  if (!rawHash) return null;
  const params = new URLSearchParams(rawHash.includes("=") ? rawHash : `slug=${rawHash}`);
  return params.get("slug");
}

function getProductSlugFromPath() {
  const path = window.location.pathname.replace(/\/+$/, "");
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return null;

  const last = segments[segments.length - 1];
  if (last && last !== "product-details" && last !== "product-details.html") {
    return last;
  }

  if (segments.length >= 2 && segments[segments.length - 2].startsWith("product-details")) {
    return last;
  }

  return null;
}

async function initProductDetailsPage() {
  const container = document.getElementById("productDetails");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || params.get("id") || getProductSlugFromHash() || getProductSlugFromPath();
  container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading product…</p></div>`;

  let product;
  try {
    product = slug ? await fetchProductBySlug(slug) : null;
  } catch (err) {
    product = PRODUCTS.find((p) => String(p.id) === String(slug) || String(p.slug) === String(slug)) || null;
  }

  if (!product) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>We couldn't find that product.</p><a href="products.html" class="btn btn-primary">Browse Products</a></div>`;
    return;
  }

  document.title = `${product.name} — TechNova Computer Store`;

  const galleryUrls = Array.isArray(product.images) ? product.images : [];
  const combinedUrls = product.image ? [product.image, ...galleryUrls] : galleryUrls;

  // Allow overriding the initial image via query param ?img=N
  const requestedImg = params.has("img") ? Number(params.get("img")) : NaN;
  const activeIndex = Number.isInteger(requestedImg) && requestedImg >= 0 && requestedImg < combinedUrls.length
    ? requestedImg
    : combinedUrls.findIndex((url) => typeof url === "string" && url.trim());
  const mainImageUrl = activeIndex >= 0 ? combinedUrls[activeIndex] : "";

  container.innerHTML = `
    <div class="pd-gallery">
      <div class="pd-main-image" id="pdMainImage" style="background:${product.color}">
        ${mainImageUrl ? `<img id="pdMainImg" src="${mainImageUrl}" alt="${product.name}" loading="eager">` : ""}
        <div class="pd-image-fallback" id="pdMainFallback">
          <i class="fa-solid fa-image"></i>
          <span>Image unavailable</span>
        </div>
        <i class="fa-solid ${categoryIcon(product.category)} placeholder-icon"></i>
      </div>
      <div class="pd-thumbs">
        ${combinedUrls
          .map((url, i) => {
            const thumbImg = url ? `<img src="${url}" alt="${product.name} view ${i + 1}" loading="lazy">` : "";
            return `<button class="pd-thumb ${i === activeIndex ? "active" : ""}" style="background:${product.color}" data-idx="${i}" ${!url ? "disabled" : ""}>
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
      <div class="product-rating">
        <span class="stars" id="pdTopRatingStars">${starRating(product.rating)}</span>
        <span class="rating-count" id="pdTopRatingCount">(${product.reviews} reviews)</span>
      </div>
      <div class="pd-rating-average" id="pdTopRatingAverage">Average Rating: <strong>${Number(product.rating || 0).toFixed(1)}</strong></div>
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

  const mainImg = document.getElementById("pdMainImg");
  const mainFallback = document.getElementById("pdMainFallback");
  let activeImageIdx = activeIndex >= 0 ? activeIndex : 0;

  const setActiveThumbnail = (index) => {
    container.querySelectorAll(".pd-thumb").forEach((thumb) => {
      thumb.classList.toggle("active", Number(thumb.dataset.idx) === index);
    });
  };

  const showFallbackImage = () => {
    if (mainImg) mainImg.remove();
    if (mainFallback) mainFallback.style.display = "flex";
  };

  const updateMainImage = (url, idx) => {
    if (!mainImg || !url) {
      showFallbackImage();
      return;
    }

    activeImageIdx = idx;
    setActiveThumbnail(idx);
    if (mainFallback) mainFallback.style.display = "none";
    mainImg.src = url;
    mainImg.alt = `${product.name}`;
    mainImg.classList.add("fade-in");
    mainImg.addEventListener(
      "animationend",
      () => mainImg.classList.remove("fade-in"),
      { once: true }
    );
  };

  const trySetMainImage = (startIndex = 0) => {
    for (let i = startIndex; i < combinedUrls.length; i += 1) {
      const url = combinedUrls[i];
      if (typeof url === "string" && url.trim()) {
        updateMainImage(url, i);
        return true;
      }
    }
    showFallbackImage();
    return false;
  };

  container.querySelectorAll(".pd-thumb").forEach((thumb) =>
    thumb.addEventListener("click", () => {
      const idx = parseInt(thumb.dataset.idx, 10);
      const url = combinedUrls[idx];
      if (!url) return;
      updateMainImage(url, idx);
    })
  );

  if (mainImg) {
    mainImg.addEventListener("error", () => {
      trySetMainImage(activeImageIdx + 1);
    });
  }

  // Specs table
  const specsTable = document.getElementById("pdSpecsTable");
  if (specsTable) {
    const entries = Object.entries(product.specTable);
    specsTable.innerHTML = entries.length
      ? entries.map(([key, val]) => `<tr><th>${key}</th><td>${val}</td></tr>`).join("")
      : `<tr><td colspan="2">No detailed specifications available for this product yet.</td></tr>`;
  }

  // Reviews
  await refreshReviews(product);

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
  // Fallback: if the reveal didn't add any `.visible` classes (some browsers
  // / environments may delay IntersectionObserver), ensure content isn't left
  // invisible — make `.fade-up` elements visible after a short timeout.
  setTimeout(() => {
    try {
      const anyVisible = document.querySelectorAll('.fade-up.visible, .slide-up.visible').length > 0;
      if (!anyVisible) {
        document.querySelectorAll('.fade-up, .slide-up').forEach((el) => el.classList.add('visible'));
      }
    } catch (e) {
      // ignore — do not break page load
    }
  }, 450);
});
