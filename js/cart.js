/* ==========================================================================
   TechNova — Cart (Local Storage)
   ========================================================================== */

const CART_KEY = "technova_cart";
const SHIPPING_FLAT = 15;
const FREE_SHIPPING_THRESHOLD = 500;

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }
  saveCart(cart);
  showToast("Added to cart");
}

function removeFromCart(productId) {
  saveCart(getCart().filter((item) => item.id !== productId));
}

function updateCartQty(productId, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === productId);
  if (item) {
    item.qty = Math.max(1, qty);
    saveCart(cart);
  }
}

function clearCart() {
  saveCart([]);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function updateCartCount() {
  document.querySelectorAll(".cart-count").forEach((el) => {
    const count = cartCount();
    el.textContent = count;
    el.style.display = count > 0 ? "inline-flex" : "none";
  });
}

function cartLinesWithData() {
  return getCart()
    .map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.id);
      return product ? { ...item, product } : null;
    })
    .filter(Boolean);
}

function cartSubtotal() {
  return cartLinesWithData().reduce((sum, line) => sum + line.product.price * line.qty, 0);
}

function renderCartPage() {
  const container = document.getElementById("cartItems");
  const summaryEl = document.getElementById("cartSummary");
  const emptyEl = document.getElementById("cartEmpty");
  if (!container) return;

  const lines = cartLinesWithData();

  if (!lines.length) {
    container.innerHTML = "";
    if (summaryEl) summaryEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "flex";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (summaryEl) summaryEl.style.display = "block";

  container.innerHTML = lines
    .map(
      (line) => `
    <div class="cart-line" data-id="${line.id}">
      <div class="cart-line-media" style="background:${line.product.color}">
        <img src="${productImageUrl(line.product)}" alt="${line.product.name}" loading="lazy" onerror="this.remove()">
        <i class="fa-solid ${categoryIcon(line.product.category)}"></i>
      </div>
      <div class="cart-line-info">
        <span class="product-brand">${line.product.brand}</span>
        <h3><a href="product-details.html?id=${line.id}">${line.product.name}</a></h3>
        <p class="product-specs">${line.product.specs}</p>
        <button class="link-btn remove-line" data-id="${line.id}"><i class="fa-solid fa-trash"></i> Remove</button>
      </div>
      <div class="cart-line-qty">
        <button class="qty-btn qty-minus" data-id="${line.id}" aria-label="Decrease quantity">−</button>
        <input type="number" min="1" value="${line.qty}" class="qty-input" data-id="${line.id}" aria-label="Quantity">
        <button class="qty-btn qty-plus" data-id="${line.id}" aria-label="Increase quantity">+</button>
      </div>
      <div class="cart-line-price">${formatPrice(line.product.price * line.qty)}</div>
    </div>`
    )
    .join("");

  const subtotal = cartSubtotal();
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  if (summaryEl) {
    summaryEl.querySelector(".sum-subtotal").textContent = formatPrice(subtotal);
    summaryEl.querySelector(".sum-shipping").textContent = shipping === 0 ? "Free" : formatPrice(shipping);
    summaryEl.querySelector(".sum-total").textContent = formatPrice(total);
  }

  container.querySelectorAll(".remove-line").forEach((btn) =>
    btn.addEventListener("click", () => {
      removeFromCart(btn.dataset.id);
      renderCartPage();
    })
  );
  container.querySelectorAll(".qty-plus").forEach((btn) =>
    btn.addEventListener("click", () => {
      const cart = getCart();
      const item = cart.find((i) => i.id === btn.dataset.id);
      updateCartQty(btn.dataset.id, item.qty + 1);
      renderCartPage();
    })
  );
  container.querySelectorAll(".qty-minus").forEach((btn) =>
    btn.addEventListener("click", () => {
      const cart = getCart();
      const item = cart.find((i) => i.id === btn.dataset.id);
      if (item.qty > 1) {
        updateCartQty(btn.dataset.id, item.qty - 1);
        renderCartPage();
      }
    })
  );
  container.querySelectorAll(".qty-input").forEach((input) =>
    input.addEventListener("change", () => {
      updateCartQty(input.dataset.id, parseInt(input.value) || 1);
      renderCartPage();
    })
  );
}

document.addEventListener("click", (e) => {
  const addBtn = e.target.closest(".add-to-cart-btn");
  if (addBtn) {
    e.preventDefault();
    addToCart(addBtn.dataset.id, 1);
  }
  const emptyBtn = e.target.closest("#emptyCartBtn");
  if (emptyBtn) {
    clearCart();
    renderCartPage();
  }
  const checkoutBtn = e.target.closest("#checkoutBtn");
  if (checkoutBtn) {
    e.preventDefault();
    if (cartCount() === 0) {
      showToast("Your cart is empty");
    } else {
      document.getElementById("checkoutModal")?.classList.add("open");
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCartPage();
});
