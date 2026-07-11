/* ==========================================================================
   TechNova Admin — Dashboard logic
   A small hash-routed SPA over the /admin/* API endpoints. Requires a
   logged-in user whose `role` is "admin" (see AdminUserSeeder in the
   backend — seeded admin is admin@technova.test / password).
   ========================================================================== */

const SECTION_TITLES = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  messages: "Messages",
};

let categoriesCache = [];

function showToast(message) {
  const el = document.getElementById("adminToast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 2600);
}

function money(v) {
  return "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---- Modal helpers ----------------------------------------------------- */
const modalBackdrop = () => document.getElementById("adminModal");
function openModal(title, bodyHtml) {
  document.getElementById("adminModalTitle").textContent = title;
  document.getElementById("adminModalBody").innerHTML = bodyHtml;
  modalBackdrop().classList.add("open");
}
function closeModal() {
  modalBackdrop().classList.remove("open");
  document.getElementById("adminModalBody").innerHTML = "";
}
document.getElementById("adminModalClose").addEventListener("click", closeModal);
modalBackdrop().addEventListener("click", (e) => {
  if (e.target === modalBackdrop()) closeModal();
});

/* ---- Auth guard --------------------------------------------------------- */
async function guardAdmin() {
  const gate = document.getElementById("adminLoginGate");
  const shell = document.getElementById("adminShell");

  if (!isLoggedIn()) {
    gate.style.display = "flex";
    return false;
  }

  try {
    // Validate the token / role against the API itself rather than trusting
    // the cached user object, in case the role changed server-side.
    await api.get("/admin/dashboard");
  } catch (err) {
    gate.style.display = "flex";
    document.getElementById("adminGateMessage").textContent =
      err.status === 403
        ? "This account doesn't have admin access."
        : "Your session has expired. Please log in again.";
    return false;
  }

  const user = getCurrentUser();
  document.getElementById("adminUserName").textContent = user?.name || "Admin";
  gate.style.display = "none";
  shell.style.display = "flex";
  return true;
}

/* ---- Router ------------------------------------------------------------- */
function currentSection() {
  const hash = (window.location.hash || "#dashboard").replace("#", "");
  return SECTION_TITLES[hash] ? hash : "dashboard";
}

async function renderSection() {
  const section = currentSection();
  document.getElementById("adminPageTitle").textContent = SECTION_TITLES[section];
  document.querySelectorAll("#adminNav a").forEach((a) => a.classList.toggle("active", a.dataset.section === section));

  const content = document.getElementById("adminContent");
  content.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-spinner fa-spin"></i>Loading…</div>`;

  try {
    if (section === "dashboard") await renderDashboard(content);
    else if (section === "products") await renderProducts(content);
    else if (section === "categories") await renderCategories(content);
    else if (section === "orders") await renderOrders(content);
    else if (section === "messages") await renderMessages(content);
  } catch (err) {
    content.innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i>${esc(err.message)}</div>`;
  }
}

window.addEventListener("hashchange", renderSection);

/* ---- Dashboard ------------------------------------------------------------ */
async function renderDashboard(content) {
  const d = await api.get("/admin/dashboard");
  content.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><i class="fa-solid fa-sack-dollar"></i><div class="stat-label">Total Revenue</div><div class="stat-value">${money(d.total_revenue)}</div></div>
      <div class="stat-card"><i class="fa-solid fa-receipt"></i><div class="stat-label">Total Orders</div><div class="stat-value">${d.total_orders}</div></div>
      <div class="stat-card"><i class="fa-solid fa-box"></i><div class="stat-label">Total Products</div><div class="stat-value">${d.total_products}</div></div>
      <div class="stat-card"><i class="fa-solid fa-users"></i><div class="stat-label">Total Customers</div><div class="stat-value">${d.total_customers}</div></div>
      <div class="stat-card"><i class="fa-solid fa-hourglass-half"></i><div class="stat-label">Pending Orders</div><div class="stat-value">${d.pending_orders}</div></div>
      <div class="stat-card"><i class="fa-solid fa-triangle-exclamation"></i><div class="stat-label">Low Stock</div><div class="stat-value">${d.low_stock_products}</div></div>
    </div>
    <div class="admin-panel">
      <h2>Recent Orders</h2>
      ${
        d.recent_orders?.length
          ? `<table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>
          ${d.recent_orders
            .map(
              (o) => `<tr><td>${esc(o.order_number)}</td><td>${esc(o.user?.name || "—")}</td><td>${money(o.total)}</td><td><span class="status-pill status-${o.status}">${o.status}</span></td></tr>`
            )
            .join("")}
          </tbody></table>`
          : `<div class="admin-empty"><i class="fa-solid fa-receipt"></i>No orders yet.</div>`
      }
    </div>
    <div class="admin-panel">
      <h2>Top Selling Products</h2>
      ${
        d.top_products?.length
          ? `<table class="admin-table"><thead><tr><th>Product</th><th>Units Sold</th></tr></thead><tbody>
          ${d.top_products.map((p) => `<tr><td>${esc(p.product_name)}</td><td>${p.total_sold}</td></tr>`).join("")}
          </tbody></table>`
          : `<div class="admin-empty"><i class="fa-solid fa-chart-line"></i>No sales data yet.</div>`
      }
    </div>`;
}

/* ---- Products --------------------------------------------------------- */
async function loadCategoriesForSelect() {
  if (categoriesCache.length) return categoriesCache;
  categoriesCache = await api.get("/admin/categories");
  return categoriesCache;
}

async function renderProducts(content, page = 1) {
  const [res] = await Promise.all([api.get("/admin/products", { page }), loadCategoriesForSelect()]);
  const products = res.data || [];

  content.innerHTML = `
    <div class="admin-panel">
      <div class="admin-panel-header">
        <h2 style="margin:0">All Products (${res.total ?? products.length})</h2>
        <button class="admin-btn primary" id="addProductBtn"><i class="fa-solid fa-plus"></i> Add Product</button>
      </div>
      ${
        products.length
          ? `<table class="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>
          ${products
            .map(
              (p) => `<tr>
                <td>${p.image ? `<img class="thumb" src="${esc(p.image)}" onerror="this.remove()">` : ""}${esc(p.name)}<br><small style="color:var(--text-muted)">${esc(p.sku)}</small></td>
                <td>${esc(p.category?.name || "—")}</td>
                <td>${p.sale_price ? `${money(p.sale_price)} <s style="color:var(--text-muted)">${money(p.price)}</s>` : money(p.price)}</td>
                <td>${p.stock}</td>
                <td>${p.is_active ? '<span class="status-pill status-completed">active</span>' : '<span class="status-pill status-cancelled">hidden</span>'}</td>
                <td class="row-actions">
                  <button class="admin-btn sm edit-product-btn" data-id="${p.id}"><i class="fa-solid fa-pen"></i></button>
                  <button class="admin-btn sm danger delete-product-btn" data-id="${p.id}" data-name="${esc(p.name)}"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>`
            )
            .join("")}
          </tbody></table>
          ${renderPagination(res, "products")}`
          : `<div class="admin-empty"><i class="fa-solid fa-box-open"></i>No products yet. Add your first one.</div>`
      }
    </div>`;

  document.getElementById("addProductBtn").addEventListener("click", () => openProductModal());
  content.querySelectorAll(".edit-product-btn").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const product = await api.get(`/admin/products/${btn.dataset.id}`);
      openProductModal(product);
    })
  );
  content.querySelectorAll(".delete-product-btn").forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete "${btn.dataset.name}"? This can't be undone.`)) return;
      try {
        await api.delete(`/admin/products/${btn.dataset.id}`);
        showToast("Product deleted");
        renderProducts(document.getElementById("adminContent"));
      } catch (err) {
        showToast(err.message);
      }
    })
  );
  content.querySelectorAll("[data-goto-page]").forEach((btn) =>
    btn.addEventListener("click", () => renderProducts(content, parseInt(btn.dataset.gotoPage, 10)))
  );
}

function renderPagination(res, kind) {
  if (!res.last_page || res.last_page <= 1) return "";
  const pages = [];
  for (let i = 1; i <= res.last_page; i++) {
    pages.push(`<button class="admin-btn sm ${i === res.current_page ? "primary" : ""}" data-goto-page="${i}">${i}</button>`);
  }
  return `<div class="admin-pagination">${pages.join("")}</div>`;
}

function categoryOptions(selectedId) {
  return categoriesCache
    .map((c) => `<option value="${c.id}" ${String(c.id) === String(selectedId) ? "selected" : ""}>${esc(c.name)}</option>`)
    .join("");
}

function openProductModal(product) {
  const isEdit = !!product;
  openModal(
    isEdit ? "Edit Product" : "Add Product",
    `
    <form id="productForm">
      <div class="admin-field">
        <label>Product Name *</label>
        <input type="text" id="pf-name" value="${esc(product?.name || "")}" required>
      </div>
      <div class="admin-field-row">
        <div class="admin-field">
          <label>Category *</label>
          <select id="pf-category" required><option value="">Select…</option>${categoryOptions(product?.category_id)}</select>
        </div>
        <div class="admin-field">
          <label>SKU *</label>
          <input type="text" id="pf-sku" value="${esc(product?.sku || "")}" required>
        </div>
      </div>
      <div class="admin-field">
        <label>Description</label>
        <textarea id="pf-description">${esc(product?.description || "")}</textarea>
      </div>
      <div class="admin-field-row">
        <div class="admin-field">
          <label>Price *</label>
          <input type="number" step="0.01" min="0" id="pf-price" value="${product?.price ?? ""}" required>
        </div>
        <div class="admin-field">
          <label>Sale Price</label>
          <input type="number" step="0.01" min="0" id="pf-sale-price" value="${product?.sale_price ?? ""}">
        </div>
      </div>
      <div class="admin-field-row">
        <div class="admin-field">
          <label>Stock *</label>
          <input type="number" min="0" id="pf-stock" value="${product?.stock ?? 0}" required>
        </div>
        <div class="admin-field">
          <label>Image URL</label>
          <input type="text" id="pf-image" value="${esc(product?.image || "")}" placeholder="https://…">
        </div>
      </div>
      <div class="admin-field-row">
        <div class="admin-field">
          <label>Upload Image</label>
          <input type="file" id="pf-image-file" accept="image/*">
        </div>
        <div class="admin-field">
          <label>Gallery Image URLs (comma-separated)</label>
          <input type="text" id="pf-images" value="${esc((product?.images || []).join(", "))}" placeholder="https://…, https://…">
        </div>
      </div>
      <div class="admin-field" style="display:flex;gap:20px">
        <label class="admin-checkbox"><input type="checkbox" id="pf-featured" ${product?.is_featured ? "checked" : ""}> Featured</label>
        <label class="admin-checkbox"><input type="checkbox" id="pf-active" ${product?.is_active !== false ? "checked" : ""}> Active</label>
      </div>
      <p class="form-message" id="productFormFeedback"></p>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn" id="productCancelBtn">Cancel</button>
        <button type="submit" class="admin-btn primary">${isEdit ? "Save Changes" : "Create Product"}</button>
      </div>
    </form>`
  );

  document.getElementById("productCancelBtn").addEventListener("click", closeModal);
  document.getElementById("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const feedback = document.getElementById("productFormFeedback");
    const imagesRaw = document.getElementById("pf-images").value.trim();
    const imageFile = document.getElementById("pf-image-file").files[0];
    let payload;

    if (imageFile) {
      payload = new FormData();
      payload.append("category_id", parseInt(document.getElementById("pf-category").value, 10));
      payload.append("name", document.getElementById("pf-name").value);
      payload.append("sku", document.getElementById("pf-sku").value);
      payload.append("description", document.getElementById("pf-description").value || "");
      payload.append("price", parseFloat(document.getElementById("pf-price").value));
      payload.append("sale_price", document.getElementById("pf-sale-price").value ? parseFloat(document.getElementById("pf-sale-price").value) : "");
      payload.append("stock", parseInt(document.getElementById("pf-stock").value, 10));
      payload.append("image_file", imageFile);
      payload.append("images", imagesRaw ? imagesRaw.split(",").map((s) => s.trim()).filter(Boolean).join(",") : "");
      payload.append("is_featured", document.getElementById("pf-featured").checked ? "1" : "0");
      payload.append("is_active", document.getElementById("pf-active").checked ? "1" : "0");
    } else {
      payload = {
        category_id: parseInt(document.getElementById("pf-category").value, 10),
        name: document.getElementById("pf-name").value,
        sku: document.getElementById("pf-sku").value,
        description: document.getElementById("pf-description").value || null,
        price: parseFloat(document.getElementById("pf-price").value),
        sale_price: document.getElementById("pf-sale-price").value ? parseFloat(document.getElementById("pf-sale-price").value) : null,
        stock: parseInt(document.getElementById("pf-stock").value, 10),
        image: document.getElementById("pf-image").value || null,
        images: imagesRaw ? imagesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
        is_featured: document.getElementById("pf-featured").checked,
        is_active: document.getElementById("pf-active").checked,
      };
    }

    try {
      if (isEdit) {
        await api.patch(`/admin/products/${product.id}`, payload);
        showToast("Product updated");
      } else {
        await api.post("/admin/products", payload);
        showToast("Product created");
      }
      closeModal();
      renderProducts(document.getElementById("adminContent"));
    } catch (err) {
      feedback.textContent = err.message;
      feedback.className = "form-message error";
    }
  });
}

/* ---- Categories --------------------------------------------------------- */
async function renderCategories(content) {
  categoriesCache = await api.get("/admin/categories");

  content.innerHTML = `
    <div class="admin-panel">
      <div class="admin-panel-header">
        <h2 style="margin:0">All Categories (${categoriesCache.length})</h2>
        <button class="admin-btn primary" id="addCategoryBtn"><i class="fa-solid fa-plus"></i> Add Category</button>
      </div>
      ${
        categoriesCache.length
          ? `<table class="admin-table"><thead><tr><th>Name</th><th>Slug</th><th>Products</th><th>Status</th><th></th></tr></thead><tbody>
          ${categoriesCache
            .map(
              (c) => `<tr>
                <td>${c.image ? `<img class="thumb" src="${esc(c.image)}" onerror="this.remove()">` : ""}${esc(c.name)}</td>
                <td>${esc(c.slug)}</td>
                <td>${c.products_count ?? 0}</td>
                <td>${c.is_active !== false ? '<span class="status-pill status-completed">active</span>' : '<span class="status-pill status-cancelled">hidden</span>'}</td>
                <td class="row-actions">
                  <button class="admin-btn sm edit-category-btn" data-id="${c.id}"><i class="fa-solid fa-pen"></i></button>
                  <button class="admin-btn sm danger delete-category-btn" data-id="${c.id}" data-name="${esc(c.name)}"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>`
            )
            .join("")}
          </tbody></table>`
          : `<div class="admin-empty"><i class="fa-solid fa-tags"></i>No categories yet.</div>`
      }
    </div>`;

  document.getElementById("addCategoryBtn").addEventListener("click", () => openCategoryModal());
  content.querySelectorAll(".edit-category-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      const cat = categoriesCache.find((c) => String(c.id) === btn.dataset.id);
      openCategoryModal(cat);
    })
  );
  content.querySelectorAll(".delete-category-btn").forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete category "${btn.dataset.name}"?`)) return;
      try {
        await api.delete(`/admin/categories/${btn.dataset.id}`);
        showToast("Category deleted");
        categoriesCache = [];
        renderCategories(document.getElementById("adminContent"));
      } catch (err) {
        showToast(err.message);
      }
    })
  );
}

function openCategoryModal(category) {
  const isEdit = !!category;
  openModal(
    isEdit ? "Edit Category" : "Add Category",
    `
    <form id="categoryForm">
      <div class="admin-field">
        <label>Category Name *</label>
        <input type="text" id="cf-name" value="${esc(category?.name || "")}" required>
      </div>
      <div class="admin-field">
        <label>Description</label>
        <textarea id="cf-description">${esc(category?.description || "")}</textarea>
      </div>
      <div class="admin-field-row">
        <div class="admin-field">
          <label>Image URL</label>
          <input type="text" id="cf-image" value="${esc(category?.image || "")}" placeholder="https://…">
        </div>
        <div class="admin-field">
          <label>Upload Image</label>
          <input type="file" id="cf-image-file" accept="image/*">
        </div>
      </div>
      <div class="admin-field">
        <label class="admin-checkbox"><input type="checkbox" id="cf-active" ${category?.is_active !== false ? "checked" : ""}> Active</label>
      </div>
      <p class="form-message" id="categoryFormFeedback"></p>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn" id="categoryCancelBtn">Cancel</button>
        <button type="submit" class="admin-btn primary">${isEdit ? "Save Changes" : "Create Category"}</button>
      </div>
    </form>`
  );

  document.getElementById("categoryCancelBtn").addEventListener("click", closeModal);
  document.getElementById("categoryForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const feedback = document.getElementById("categoryFormFeedback");
    const imageFile = document.getElementById("cf-image-file").files[0];
    let payload;

    if (imageFile) {
      payload = new FormData();
      payload.append("name", document.getElementById("cf-name").value);
      payload.append("description", document.getElementById("cf-description").value || "");
      payload.append("image_file", imageFile);
      payload.append("is_active", document.getElementById("cf-active").checked ? "1" : "0");
    } else {
      payload = {
        name: document.getElementById("cf-name").value,
        description: document.getElementById("cf-description").value || null,
        image: document.getElementById("cf-image").value || null,
        is_active: document.getElementById("cf-active").checked,
      };
    }
    try {
      if (isEdit) {
        await api.patch(`/admin/categories/${category.id}`, payload);
        showToast("Category updated");
      } else {
        await api.post("/admin/categories", payload);
        showToast("Category created");
      }
      closeModal();
      categoriesCache = [];
      renderCategories(document.getElementById("adminContent"));
    } catch (err) {
      feedback.textContent = err.message;
      feedback.className = "form-message error";
    }
  });
}

/* ---- Orders ------------------------------------------------------------- */
async function renderOrders(content, page = 1, status = "") {
  const res = await api.get("/admin/orders", { page, status: status || undefined });
  const orders = res.data || [];
  const statuses = ["pending", "processing", "shipped", "completed", "cancelled"];

  content.innerHTML = `
    <div class="admin-panel">
      <div class="admin-panel-header">
        <h2 style="margin:0">All Orders (${res.total ?? orders.length})</h2>
        <select id="orderStatusFilter" class="admin-field" style="width:auto;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);color:var(--text)">
          <option value="">All Statuses</option>
          ${statuses.map((s) => `<option value="${s}" ${s === status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </div>
      ${
        orders.length
          ? `<table class="admin-table"><thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>
          ${orders
            .map(
              (o) => `<tr>
                <td>${esc(o.order_number)}</td>
                <td>${esc(o.user?.name || "—")}<br><small style="color:var(--text-muted)">${esc(o.user?.email || "")}</small></td>
                <td>${new Date(o.created_at).toLocaleDateString()}</td>
                <td>${money(o.total)}</td>
                <td><span class="status-pill status-${o.status}">${o.status}</span></td>
                <td><button class="admin-btn sm view-order-btn" data-id="${o.id}">View</button></td>
              </tr>`
            )
            .join("")}
          </tbody></table>
          ${renderPagination(res, "orders")}`
          : `<div class="admin-empty"><i class="fa-solid fa-receipt"></i>No orders found.</div>`
      }
    </div>`;

  document.getElementById("orderStatusFilter").addEventListener("change", (e) => renderOrders(content, 1, e.target.value));
  content.querySelectorAll(".view-order-btn").forEach((btn) => btn.addEventListener("click", () => openOrderModal(btn.dataset.id, status)));
  content.querySelectorAll("[data-goto-page]").forEach((btn) =>
    btn.addEventListener("click", () => renderOrders(content, parseInt(btn.dataset.gotoPage, 10), status))
  );
}

async function openOrderModal(orderId, currentStatusFilter) {
  openModal("Order Details", `<div class="admin-empty"><i class="fa-solid fa-spinner fa-spin"></i>Loading…</div>`);
  const statuses = ["pending", "processing", "shipped", "completed", "cancelled"];
  try {
    const o = await api.get(`/admin/orders/${orderId}`);
    const items = o.items || [];
    document.getElementById("adminModalBody").innerHTML = `
      <p><strong>${esc(o.order_number)}</strong> · ${new Date(o.created_at).toLocaleString()}</p>
      <p style="color:var(--text-muted);font-size:0.88rem">${esc(o.user?.name || "")} · ${esc(o.user?.email || "")}</p>
      ${
        o.shipping_address
          ? `<p style="font-size:0.88rem"><strong>Ship to:</strong> ${esc(o.shipping_address.line1 || "")}, ${esc(o.shipping_address.city || "")}, ${esc(o.shipping_address.state || "")} ${esc(o.shipping_address.postal_code || "")}, ${esc(o.shipping_address.country || "")}</p>`
          : ""
      }
      <table class="admin-table">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${items.map((i) => `<tr><td>${esc(i.product_name)}</td><td>${i.quantity}</td><td>${money(i.product_price)}</td></tr>`).join("")}</tbody>
      </table>
      <div class="summary-row total" style="margin-top:8px"><span>Total</span><span>${money(o.total)}</span></div>
      <div class="admin-field" style="margin-top:16px">
        <label>Order Status</label>
        <select id="orderStatusSelect">${statuses.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select>
      </div>
      <p class="form-message" id="orderFormFeedback"></p>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn" id="orderCancelBtn">Close</button>
        <button type="button" class="admin-btn primary" id="orderSaveBtn">Update Status</button>
      </div>`;

    document.getElementById("orderCancelBtn").addEventListener("click", closeModal);
    document.getElementById("orderSaveBtn").addEventListener("click", async () => {
      const feedback = document.getElementById("orderFormFeedback");
      try {
        await api.patch(`/admin/orders/${orderId}`, { status: document.getElementById("orderStatusSelect").value });
        showToast("Order status updated");
        closeModal();
        renderOrders(document.getElementById("adminContent"), 1, currentStatusFilter);
      } catch (err) {
        feedback.textContent = err.message;
        feedback.className = "form-message error";
      }
    });
  } catch (err) {
    document.getElementById("adminModalBody").innerHTML = `<div class="admin-empty"><i class="fa-solid fa-triangle-exclamation"></i>${esc(err.message)}</div>`;
  }
}

/* ---- Messages ------------------------------------------------------------ */
async function renderMessages(content, page = 1) {
  const res = await api.get("/admin/messages", { page });
  const messages = res.data || [];

  content.innerHTML = `
    <div class="admin-panel">
      <h2>Contact Messages (${res.total ?? messages.length})</h2>
      ${
        messages.length
          ? `<table class="admin-table"><thead><tr><th>From</th><th>Subject</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>
          ${messages
            .map(
              (m) => `<tr>
                <td>${esc(m.name)}<br><small style="color:var(--text-muted)">${esc(m.email)}</small></td>
                <td>${esc(m.subject)}</td>
                <td>${new Date(m.created_at).toLocaleDateString()}</td>
                <td>${m.is_read ? '<span class="status-pill status-completed">read</span>' : '<span class="status-pill status-pending">new</span>'}</td>
                <td class="row-actions">
                  <button class="admin-btn sm view-message-btn" data-id="${m.id}">View</button>
                  <button class="admin-btn sm danger delete-message-btn" data-id="${m.id}">Delete</button>
                </td>
              </tr>`
            )
            .join("")}
          </tbody></table>
          ${renderPagination(res, "messages")}`
          : `<div class="admin-empty"><i class="fa-solid fa-envelope-open"></i>No messages yet.</div>`
      }
    </div>`;

  content.querySelectorAll(".view-message-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      const m = messages.find((x) => String(x.id) === btn.dataset.id);
      openModal(
        m.subject,
        `<p style="font-size:0.88rem;color:var(--text-muted)">${esc(m.name)} · ${esc(m.email)} · ${new Date(m.created_at).toLocaleString()}</p>
         <p style="white-space:pre-wrap">${esc(m.message)}</p>
         <div class="admin-modal-footer"><button class="admin-btn" id="msgCloseBtn">Close</button></div>`
      );
      document.getElementById("msgCloseBtn").addEventListener("click", closeModal);
      if (!m.is_read) {
        api.patch(`/admin/messages/${m.id}`, {}).catch(() => {});
      }
    })
  );
  content.querySelectorAll(".delete-message-btn").forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this message?")) return;
      try {
        await api.delete(`/admin/messages/${btn.dataset.id}`);
        showToast("Message deleted");
        renderMessages(document.getElementById("adminContent"));
      } catch (err) {
        showToast(err.message);
      }
    })
  );
  content.querySelectorAll("[data-goto-page]").forEach((btn) =>
    btn.addEventListener("click", () => renderMessages(content, parseInt(btn.dataset.gotoPage, 10)))
  );
}

/* ---- Init ---------------------------------------------------------------*/
document.getElementById("adminLogoutBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await api.post("/auth/logout");
  } catch {
    // ignore
  }
  clearSession();
  window.location.href = "../index.html";
});

document.addEventListener("DOMContentLoaded", async () => {
  const ok = await guardAdmin();
  if (ok) renderSection();
});
