/**
 * Frontend runtime config.
 *
 * USE_MOCK=true   → in-app mock data, no network calls (offline dev/demos).
 * USE_MOCK=false  → hit the real backend at API_BASE_URL.
 */
export const USE_MOCK = false;

// Production backend on Render
export const API_BASE_URL = 'https://backenddeploy-e010.onrender.com';

// Local dev alternatives:
//   http://10.0.2.2:4000      Android emulator (host loopback)
//   http://localhost:4000      iOS simulator
//   http://<lan-ip>:4000       Physical device on same WiFi

// Render free tier sleeps after 15min idle. First request after sleep takes
// ~30s cold-start — 45s timeout absorbs that without UX errors.
export const API_TIMEOUT_MS = 45000;
