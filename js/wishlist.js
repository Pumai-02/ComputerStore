/* ==========================================================================
   TechNova — Wishlist (Local Storage)
   ========================================================================== */

const WISHLIST_KEY = "technova_wishlist";

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  updateWishlistCount();
}

function isInWishlist(productId) {
  return getWishlist().includes(productId);
}

function toggleWishlist(productId) {
  let list = getWishlist();
  if (list.includes(productId)) {
    list = list.filter((id) => id !== productId);
    showToast("Removed from wishlist");
  } else {
    list.push(productId);
    showToast("Added to wishlist");
  }
  saveWishlist(list);
  return list.includes(productId);
}

function wishlistCount() {
  return getWishlist().length;
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

  const ids = getWishlist();
  const items = ids.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);

  if (!items.length) {
    container.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "flex";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";
  renderProductGrid(container, items);
}

document.addEventListener("click", (e) => {
  const wishBtn = e.target.closest(".wishlist-btn");
  if (wishBtn) {
    e.preventDefault();
    const nowActive = toggleWishlist(wishBtn.dataset.id);
    wishBtn.classList.toggle("active", nowActive);
    wishBtn.querySelector("i").className = `fa-${nowActive ? "solid" : "regular"} fa-heart`;
    if (document.getElementById("wishlistItems") && !nowActive) {
      renderWishlistPage();
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  updateWishlistCount();
  renderWishlistPage();
});
