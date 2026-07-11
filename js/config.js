/* ==========================================================================
   TechNova — Frontend Configuration
   ==========================================================================
   Change these two values to match your setup:

   1. API_BASE_URL  — where your Laravel backend is running.
      - Local dev (php artisan serve default): http://localhost:8000/api
      - Deployed (Forge/Railway/Render/etc.): https://your-api-domain.com/api

   2. STRIPE_PUBLISHABLE_KEY — your Stripe *publishable* key (starts with
      pk_test_ or pk_live_). Never put your secret key here — that one stays
      server-side in the backend's .env file.
   ========================================================================== */

const API_BASE_URL = "http://127.0.0.1:8000/api";
const STRIPE_PUBLISHABLE_KEY = "#";
