/* ==========================================================================
   TechNova — Auth (login, register, logout, account page)
   ========================================================================== */

function fieldError(input, message) {
  input.classList.add("invalid");
  const msg = input.closest(".form-field")?.querySelector(".field-error");
  if (msg) msg.textContent = message || "";
}

function clearFieldErrors(form) {
  form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
}

function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  if (isLoggedIn()) {
    window.location.href = "account.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFieldErrors(form);
    const email = document.getElementById("li-email");
    const password = document.getElementById("li-password");
    const feedback = document.getElementById("loginFeedback");
    const submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    try {
      const res = await api.post("/auth/login", { email: email.value, password: password.value }, { auth: false });
      setSession(res.token, res.user);
      showToast(`Welcome back, ${res.user.name}!`);
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("redirect") || "index.html";
    } catch (err) {
      feedback.textContent = err.message || "Invalid credentials.";
      feedback.className = "form-message error";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function initRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  if (isLoggedIn()) {
    window.location.href = "account.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFieldErrors(form);
    const name = document.getElementById("rg-name");
    const email = document.getElementById("rg-email");
    const phone = document.getElementById("rg-phone");
    const password = document.getElementById("rg-password");
    const passwordConfirm = document.getElementById("rg-password-confirm");
    const feedback = document.getElementById("registerFeedback");
    const submitBtn = form.querySelector('button[type="submit"]');

    if (password.value !== passwordConfirm.value) {
      fieldError(passwordConfirm, "Passwords don't match.");
      feedback.textContent = "Passwords don't match.";
      feedback.className = "form-message error";
      return;
    }

    submitBtn.disabled = true;
    try {
      const res = await api.post(
        "/auth/register",
        {
          name: name.value,
          email: email.value,
          phone: phone?.value || undefined,
          password: password.value,
          password_confirmation: passwordConfirm.value,
        },
        { auth: false }
      );
      setSession(res.token, res.user);
      showToast(`Welcome to TechNova, ${res.user.name}!`);
      window.location.href = "index.html";
    } catch (err) {
      if (err.data?.errors) {
        Object.entries(err.data.errors).forEach(([field, messages]) => {
          const map = { name: name, email: email, phone: phone, password: password };
          if (map[field]) fieldError(map[field], messages[0]);
        });
      }
      feedback.textContent = err.message || "Couldn't create your account.";
      feedback.className = "form-message error";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignore — we clear the local session either way
  }
  clearSession();
  showToast("Logged out");
  window.location.href = "index.html";
}

function initLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  });
}

function orderStatusBadge(status) {
  const classes = {
    processing: "badge-new",
    shipped: "badge-hot",
    delivered: "badge-sale",
    cancelled: "",
  };
  return `<span class="product-badge ${classes[status] || ""}">${status}</span>`;
}

async function initAccountPage() {
  const container = document.getElementById("accountPage");
  if (!container) return;

  if (!requireLogin()) return;

  const user = getCurrentUser();
  const nameEl = document.getElementById("acctName");
  const emailEl = document.getElementById("acctEmail");
  if (nameEl) nameEl.textContent = user?.name || "";
  if (emailEl) emailEl.textContent = user?.email || "";

  const ordersEl = document.getElementById("acctOrders");
  if (!ordersEl) return;

  ordersEl.innerHTML = `<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading your orders…</p></div>`;
  try {
    const res = await api.get("/orders");
    const orders = res.data || res;
    if (!orders.length) {
      ordersEl.innerHTML = `<div class="empty-state"><i class="fa-solid fa-box-open"></i><p>You haven't placed any orders yet.</p><a href="products.html" class="btn btn-primary">Start Shopping</a></div>`;
      return;
    }
    ordersEl.innerHTML = orders
      .map(
        (o) => `
      <div class="cart-line" data-order-id="${o.id}">
        <div class="cart-line-info" style="flex:1">
          <h3>${o.order_number}</h3>
          <p class="product-specs">${new Date(o.created_at).toLocaleDateString()} · ${o.items?.length || 0} item(s)</p>
          ${orderStatusBadge(o.status)}
        </div>
        <div class="cart-line-price">${formatPrice(o.total)}</div>
      </div>`
      )
      .join("");
  } catch (err) {
    ordersEl.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${err.message}</p></div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initRegisterForm();
  initLogoutButtons();
  initAccountPage();
});
