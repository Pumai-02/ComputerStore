/* ==========================================================================
   TechNova — Checkout (Stripe Elements)
   Flow:
   1. POST /checkout/create-payment-intent  -> client_secret + totals
   2. stripe.confirmCardPayment(client_secret, { payment_method: {card, billing_details} })
   3. POST /checkout/confirm with the payment_intent_id + shipping address
      -> creates the Order and clears the cart
   ========================================================================== */

let stripe;
let cardElement;

function renderCheckoutSummary(totals) {
  const el = document.getElementById("checkoutSummary");
  if (!el) return;
  const lines = cartLinesWithData();
  el.innerHTML = `
    <div class="cart-items-mini">
      ${lines
        .map(
          (line) => `
        <div class="cart-line" style="padding:10px 0">
          <div class="cart-line-info" style="flex:1">
            <h3 style="font-size:0.95rem">${line.product.name} <span style="color:var(--text-muted)">× ${line.qty}</span></h3>
          </div>
          <div class="cart-line-price">${formatPrice(line.product.price * line.qty)}</div>
        </div>`
        )
        .join("")}
    </div>
    <div class="checkout-totals" style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px">
      <div class="summary-row"><span>Subtotal</span><span>${formatPrice(totals.subtotal)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${totals.shipping_fee === 0 ? "Free" : formatPrice(totals.shipping_fee)}</span></div>
      <div class="summary-row"><span>Tax</span><span>${formatPrice(totals.tax)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatPrice(totals.total)}</span></div>
    </div>`;
}

async function initCheckoutPage() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  if (!requireLogin("Please log in to check out.")) return;

  await cartReady;

  if (cartCount() === 0) {
    document.getElementById("checkoutContent").innerHTML = `<div class="empty-state"><i class="fa-solid fa-cart-shopping"></i><p>Your cart is empty.</p><a href="products.html" class="btn btn-primary">Shop Products</a></div>`;
    return;
  }

  const feedback = document.getElementById("checkoutFeedback");
  const payBtn = document.getElementById("checkoutPayBtn");

  let intent;
  try {
    intent = await api.post("/checkout/create-payment-intent", {});
    renderCheckoutSummary(intent);
  } catch (err) {
    document.getElementById("checkoutContent").innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${err.message}</p></div>`;
    return;
  }

  const useFakePayment = intent.client_secret?.startsWith("fake_") || !window.Stripe || !STRIPE_PUBLISHABLE_KEY;

  if (useFakePayment) {
    document.getElementById("cardElement").innerHTML = "<div style='padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text-muted)'>Fake payment mode enabled. No real card entry is needed.</div>";
    document.getElementById("cardErrors").textContent = "";
    cardElement = null;
  } else {
    if (!window.Stripe) {
      feedback.textContent = "Stripe.js failed to load — check your connection and try again.";
      feedback.className = "form-message error";
      payBtn.disabled = true;
      return;
    }
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements();
    cardElement = elements.create("card", { style: { base: { fontSize: "16px" } } });
    cardElement.mount("#cardElement");
    cardElement.on("change", (e) => {
      const cardErrors = document.getElementById("cardErrors");
      cardErrors.textContent = e.error ? e.error.message : "";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    feedback.textContent = "";
    feedback.className = "form-message";
    payBtn.disabled = true;
    payBtn.textContent = "Processing…";

    const name = document.getElementById("co-name").value;
    const line1 = document.getElementById("co-address").value;
    const city = document.getElementById("co-city").value;
    const state = document.getElementById("co-state").value;
    const postal = document.getElementById("co-zip").value;
    const country = document.getElementById("co-country").value;

    try {
      let paymentIntentId = intent.payment_intent_id;

      if (!useFakePayment) {
        const { error, paymentIntent } = await stripe.confirmCardPayment(intent.client_secret, {
          payment_method: {
            card: cardElement,
            billing_details: { name, address: { line1, city, state, postal_code: postal, country } },
          },
        });

        if (error) {
          feedback.textContent = error.message;
          feedback.className = "form-message error";
          payBtn.disabled = false;
          payBtn.textContent = "Pay Now";
          return;
        }

        paymentIntentId = paymentIntent.id;
      }

      const order = await api.post("/checkout/confirm", {
        payment_intent_id: paymentIntentId,
        shipping_address: { line1, city, state, postal_code: postal, country },
      });

      await loadCart();
      await showPaymentSuccessPopup(order.order_number);
      window.location.href = `order-confirmation.html?order=${encodeURIComponent(order.order_number)}`;
    } catch (err) {
      feedback.textContent = err.message || "Payment could not be completed.";
      feedback.className = "form-message error";
      payBtn.disabled = false;
      payBtn.textContent = "Pay Now";
    }
  });
}

function showPaymentSuccessPopup(orderNumber) {
  const existing = document.getElementById("paymentSuccessPopup");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "paymentSuccessPopup";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.75);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;";
  overlay.innerHTML = `
    <div style="max-width:420px;width:100%;background:#ffffff;color:#111827;border-radius:20px;box-shadow:0 28px 80px rgba(15,23,42,0.24);padding:32px;text-align:center;font-family:Inter,system-ui,sans-serif;">
      <div style="font-size:3rem;line-height:1;color:#16a34a;margin-bottom:16px;"><i class="fa-solid fa-circle-check"></i></div>
      <h2 style="margin:0 0 12px;font-size:1.85rem;">Payment Successful</h2>
      <p style="margin:0 0 22px;color:#4b5563;font-size:1rem;line-height:1.5;">Your order <strong>${orderNumber}</strong> is confirmed. Thank you for shopping with TechNova.</p>
      <button id="paymentSuccessClose" style="border:none;padding:12px 24px;border-radius:999px;background:#2563eb;color:#fff;font-size:1rem;cursor:pointer;transition:background .2s;">Continue</button>
    </div>
  `;

  document.body.appendChild(overlay);

  return new Promise((resolve) => {
    const close = () => {
      overlay.remove();
      resolve();
    };
    overlay.querySelector("#paymentSuccessClose").addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await catalogReady;
  initCheckoutPage();
});
