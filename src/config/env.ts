/**
 * Frontend runtime config.
 *
 * USE_MOCK=true   → in-app mock data, no network calls (default for offline dev/demos).
 * USE_MOCK=false  → hit the real backend at API_BASE_URL.
 */
export const USE_MOCK = true;

// Local dev: http://10.0.2.2:4000 for Android emulator (host loopback)
//            http://localhost:4000 for iOS simulator
//            http://<your-lan-ip>:4000 for physical device on same WiFi
// Production: your Render URL, e.g. https://aabroo-api.onrender.com
export const API_BASE_URL = 'http://10.0.2.2:4000';

export const API_TIMEOUT_MS = 20000;
