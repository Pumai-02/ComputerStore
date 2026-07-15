/* ==========================================================================
   TechNova — Cart (API-backed)
   Cart requires a logged-in user on this backend (no guest cart), so
   every mutating action checks requireLogin() first.
   ========================================================================== */

const SHIPPING_FLAT = 9.99;
const FREE_SHIPPING_THRESHOLD = 100;

let CART_ITEMS = []; // raw items from GET /cart: [{ id, product_id, quantity, product }]

async function loadCart() {
  if (!isLoggedIn()) {
    CART_ITEMS = [];
    return;
  }
  try {
    const res = await api.get("/cart");
    CART_ITEMS = res.items || [];
  } catch (err) {
    console.error("Failed to load cart:", err);
    CART_ITEMS = [];
  }
  updateCartCount();
}

function cartLinesWithData() {
  return CART_ITEMS.map((item) => ({
    cartItemId: item.id,
    id: item.product_id,
    qty: item.quantity,
    product: normalizeProduct(item.product),
  }));
}

function cartSubtotal() {
  return cartLinesWithData().reduce((sum, line) => sum + line.product.price * line.qty, 0);
}

function cartCount() {
  return CART_ITEMS.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartCount() {
  document.querySelectorAll(".cart-count").forEach((el) => {
    const count = cartCount();
    el.textContent = count;
    el.style.display = count > 0 ? "inline-flex" : "none";
  });
}

async function addToCart(productId, qty = 1) {
  if (!requireLogin("Please log in to add items to your cart.")) return;
  try {
    await api.post("/cart", { product_id: productId, quantity: qty });
    await loadCart();
    showToast("Added to cart");
    if (document.getElementById("cartItems")) renderCartPage();
  } catch (err) {
    showToast(err.message || "Couldn't add that to your cart.");
  }
}

async function removeFromCart(cartItemId) {
  try {
    await api.delete(`/cart/${cartItemId}`);
    await loadCart();
  } catch (err) {
    showToast(err.message || "Couldn't remove that item.");
  }
}

async function updateCartQty(cartItemId, qty) {
  try {
    await api.patch(`/cart/${cartItemId}`, { quantity: Math.max(1, qty) });
    await loadCart();
  } catch (err) {
    showToast(err.message || "Couldn't update quantity.");
  }
}

async function clearCart() {
  try {
    await api.delete("/cart");
    await loadCart();
  } catch (err) {
    showToast(err.message || "Couldn't clear your cart.");
  }
}

function renderCartPage() {
  const container = document.getElementById("cartItems");
  const summaryEl = document.getElementById("cartSummary");
  const emptyEl = document.getElementById("cartEmpty");
  if (!container) return;

  if (!isLoggedIn()) {
    container.innerHTML = "";
    if (summaryEl) summaryEl.style.display = "none";
    if (emptyEl) {
      emptyEl.style.display = "flex";
      emptyEl.innerHTML = `<i class="fa-solid fa-circle-user" style="font-size:2rem"></i><p>Log in to see your cart.</p><a href="login.html?redirect=cart.html" class="btn btn-primary">Log In</a>`;
    }
    return;
  }

  const lines = cartLinesWithData();

  if (!lines.length) {
    container.innerHTML = "";
    if (summaryEl) summaryEl.style.display = "none";
    if (emptyEl) {
      emptyEl.style.display = "flex";
      emptyEl.innerHTML = `<i class="fa-solid fa-cart-shopping" style="font-size:2rem"></i><p>Your cart is empty.</p><a href="products.html" class="btn btn-primary">Shop Products</a>`;
    }
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (summaryEl) summaryEl.style.display = "block";

  container.innerHTML = lines
    .map((line) => {
      const url = productImageUrl(line.product);
      const img = url ? `<img src="${url}" alt="${line.product.name}" loading="lazy" onerror="this.remove()">` : "";
      return `
    <div class="cart-line" data-cart-item-id="${line.cartItemId}">
      <div class="cart-line-media" style="background:${line.product.color}">
        ${img}
        <i class="fa-solid ${categoryIcon(line.product.category)}"></i>
      </div>
      <div class="cart-line-info">
        <span class="product-brand">${line.product.brand}</span>
        <h3><a href="product-details.html#slug=${line.product.slug}">${line.product.name}</a></h3>
        <p class="product-specs">${line.product.specs}</p>
        <button class="link-btn remove-line" data-cart-item-id="${line.cartItemId}"><i class="fa-solid fa-trash"></i> Remove</button>
      </div>
      <div class="cart-line-qty">
        <button class="qty-btn qty-minus" data-cart-item-id="${line.cartItemId}" data-qty="${line.qty}" aria-label="Decrease quantity">−</button>
        <input type="number" min="1" value="${line.qty}" class="qty-input" data-cart-item-id="${line.cartItemId}" aria-label="Quantity">
        <button class="qty-btn qty-plus" data-cart-item-id="${line.cartItemId}" data-qty="${line.qty}" aria-label="Increase quantity">+</button>
      </div>
      <div class="cart-line-price">${formatPrice(line.product.price * line.qty)}</div>
    </div>`;
    })
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
    btn.addEventListener("click", async () => {
      await removeFromCart(btn.dataset.cartItemId);
      renderCartPage();
    })
  );
  container.querySelectorAll(".qty-plus").forEach((btn) =>
    btn.addEventListener("click", async () => {
      await updateCartQty(btn.dataset.cartItemId, parseInt(btn.dataset.qty, 10) + 1);
      renderCartPage();
    })
  );
  container.querySelectorAll(".qty-minus").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const qty = parseInt(btn.dataset.qty, 10);
      if (qty > 1) {
        await updateCartQty(btn.dataset.cartItemId, qty - 1);
        renderCartPage();
      }
    })
  );
  container.querySelectorAll(".qty-input").forEach((input) =>
    input.addEventListener("change", async () => {
      await updateCartQty(input.dataset.cartItemId, parseInt(input.value, 10) || 1);
      renderCartPage();
    })
  );
}

document.addEventListener("click", (e) => {
  const addBtn = e.target.closest(".add-to-cart-btn");
  if (addBtn) {
    e.preventDefault();
    addToCart(parseInt(addBtn.dataset.id, 10), 1);
  }
  const emptyBtn = e.target.closest("#emptyCartBtn");
  if (emptyBtn) {
    clearCart().then(renderCartPage);
  }
  const checkoutBtn = e.target.closest("#checkoutBtn");
  if (checkoutBtn) {
    e.preventDefault();
    if (!requireLogin("Please log in to check out.")) return;
    if (cartCount() === 0) {
      showToast("Your cart is empty");
    } else {
      window.location.href = "checkout.html";
    }
  }
});

const cartReady = (async () => {
  await catalogReady;
  await loadCart();
})();

document.addEventListener("DOMContentLoaded", async () => {
  await cartReady;
  updateCartCount();
  renderCartPage();
});
