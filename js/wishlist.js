/* ==========================================================================
   TechNova — Wishlist (API-backed)
   ========================================================================== */

let WISHLIST_ITEMS = []; // raw items from GET /wishlist: [{ id, product_id, product }]

async function loadWishlist() {
  if (!isLoggedIn()) {
    WISHLIST_ITEMS = [];
    return;
  }
  try {
    const wishlist = await api.get("/wishlist");
    WISHLIST_ITEMS = Array.isArray(wishlist) ? wishlist : wishlist.data || [];
  } catch (err) {
    console.error("Failed to load wishlist:", err);
    WISHLIST_ITEMS = [];
  }
  if (!Array.isArray(WISHLIST_ITEMS)) {
    WISHLIST_ITEMS = [];
  }
  updateWishlistCount();
}

function isInWishlist(productId) {
  return WISHLIST_ITEMS.some((item) => item.product_id === productId);
}

function wishlistItemFor(productId) {
  return WISHLIST_ITEMS.find((item) => item.product_id === productId);
}

async function toggleWishlist(productId) {
  if (!requireLogin("Please log in to save items to your wishlist.")) return isInWishlist(productId);

  const existing = wishlistItemFor(productId);
  try {
    if (existing) {
      await api.delete(`/wishlist/${existing.id}`);
      showToast("Removed from wishlist");
    } else {
      await api.post("/wishlist", { product_id: productId });
      showToast("Added to wishlist");
    }
    await loadWishlist();
  } catch (err) {
    showToast(err.message || "Couldn't update your wishlist.");
  }
  return isInWishlist(productId);
}

function wishlistCount() {
  return WISHLIST_ITEMS.length;
}

function updateWishlistCount() {
  document.querySelectorAll(".wishlist-count").forEach((el) => {
    const count = wishlistCount();
    el.textContent = count;
    el.style.display = count > 0 ? "inline-flex" : "none";
  });
}

function renderWishlistPage() {
  const container = document.getElementById("wishlistItems");
  const emptyEl = document.getElementById("wishlistEmpty");
  if (!container) return;

  if (!isLoggedIn()) {
    container.innerHTML = "";
    if (emptyEl) {
      emptyEl.style.display = "flex";
      emptyEl.innerHTML = `<i class="fa-solid fa-circle-user" style="font-size:2rem"></i><p>Log in to see your wishlist.</p><a href="login.html?redirect=wishlist.html" class="btn btn-primary">Log In</a>`;
    }
    return;
  }

  const items = WISHLIST_ITEMS.map((item) => normalizeProduct(item.product)).filter(Boolean);

  if (!items.length) {
    container.innerHTML = "";
    if (emptyEl) {
      emptyEl.style.display = "flex";
      emptyEl.innerHTML = `<i class="fa-regular fa-heart" style="font-size:2rem"></i><p>Your wishlist is empty.</p><a href="products.html" class="btn btn-primary">Shop Products</a>`;
    }
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";
  renderProductGrid(container, items);
}

document.addEventListener("click", async (e) => {
  const wishBtn = e.target.closest(".wishlist-btn");
  if (wishBtn) {
    e.preventDefault();
    const productId = parseInt(wishBtn.dataset.id, 10);
    const nowActive = await toggleWishlist(productId);
    wishBtn.classList.toggle("active", nowActive);
    const icon = wishBtn.querySelector("i");
    if (icon) icon.className = `fa-${nowActive ? "solid" : "regular"} fa-heart`;
    if (document.getElementById("wishlistItems") && !nowActive) {
      renderWishlistPage();
    }
  }
});

const wishlistReady = (async () => {
  await catalogReady;
  await loadWishlist();
})();

document.addEventListener("DOMContentLoaded", async () => {
  await wishlistReady;
  updateWishlistCount();
  renderWishlistPage();
});
