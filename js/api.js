/* ==========================================================================
   TechNova — API Client
   Thin wrapper around fetch() for talking to the Laravel backend, plus
   Sanctum token storage helpers shared by every page.
   ========================================================================== */

const AUTH_TOKEN_KEY = "technova_token";
const AUTH_USER_KEY = "technova_user";

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY)) || null;
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return !!getToken();
}

/**
 * Core request helper. Path is relative to API_BASE_URL, e.g. "/products".
 * Automatically attaches the Bearer token (if any) and JSON headers.
 * Throws an Error with a `.status` and `.data` (parsed JSON body) on
 * non-2xx responses so callers can show validation messages.
 */
async function apiRequest(path, { method = "GET", body, auth = true, params } = {}) {
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const headers = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const err = new Error(
      "Couldn't reach the TechNova API. Is the backend running and is API_BASE_URL in js/config.js correct?"
    );
    err.status = 0;
    err.cause = networkErr;
    throw err;
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (response.status === 401 && auth) {
    // Token missing/expired — drop the stale session so the UI reflects it.
    clearSession();
  }

  if (!response.ok) {
    const message =
      (data && (data.message || (data.errors && Object.values(data.errors)[0]?.[0]))) ||
      `Request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

const api = {
  get: (path, params) => apiRequest(path, { method: "GET", params }),
  post: (path, body, opts = {}) => apiRequest(path, { method: "POST", body, ...opts }),
  patch: (path, body) => apiRequest(path, { method: "PATCH", body }),
  delete: (path) => apiRequest(path, { method: "DELETE" }),
};

/* ---- Nav account link + gated actions --------------------------------- */

function updateAuthUI() {
  const user = getCurrentUser();
  document.querySelectorAll("#accountLink").forEach((link) => {
    if (user) {
      link.href = "account.html";
      link.setAttribute("aria-label", `Account (${user.name})`);
      link.title = user.name;
    } else {
      link.href = "login.html";
      link.setAttribute("aria-label", "Account");
      link.removeAttribute("title");
    }
  });
}

/** Redirects to login (remembering where to come back to) if not logged in. Returns true if logged in. */
function requireLogin(message) {
  if (isLoggedIn()) return true;
  if (message) showToast(message);
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `login.html?redirect=${returnTo}`;
  return false;
}

document.addEventListener("DOMContentLoaded", updateAuthUI);
