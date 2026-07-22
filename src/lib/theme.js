const STORAGE_KEYS = {
  theme: "owncart_theme",
  token: "owncart_token",
  customer: "owncart_customer",
  outlet: "owncart_outlet",
  orderType: "owncart_order_type",
};

export function applyTheme(themeConfig) {
  if (!themeConfig) return;
  const t = themeConfig.theme || themeConfig;
  const root = document.documentElement;

  // ─────────────────────────────────────────────────────────────────────
  // Design decision: the app has ONE premium visual identity — the warm
  // terracotta/cream language established on the public Home, Login, and
  // Dine In pages (the --iy-* tokens, and the matching --color-*
  // defaults in index.css). Every authenticated page must look like it
  // belongs to that same product, not a per-org recolor of it.
  //
  // This used to re-skin --color-primary / --color-ink / --color-bg /
  // --color-border straight from the org API, which is how an org's raw
  // brand color (e.g. a bright orange) ended up bleeding into the nav,
  // buttons, and badges on Cart/Orders/Profile/Outlets while the public
  // pages — which read --iy-* instead — stayed on the intended terracotta.
  // That produced two different-looking apps depending on which token a
  // given page happened to use.
  //
  // Fix: keep loading the org theme response (still fetched from the same
  // API, nothing removed there) but stop letting it override the shared
  // visual tokens. Only truly org-identity data (name, logo, outlets, etc.
  // — handled elsewhere) still varies per organization.
  // ─────────────────────────────────────────────────────────────────────
  void t; // org theme payload intentionally not applied to design tokens — see note above

  localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(t));
}

// Relative luminance (WCAG). 0 = black, 1 = white.
function luminance(hex) {
  if (!hex?.startsWith("#") || hex.length < 7) return 1;
  const num = parseInt(hex.slice(1), 16);
  const chans = [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * chans[0] + 0.7152 * chans[1] + 0.0722 * chans[2];
}

// Returns a color guaranteed dark enough for white text on top (luminance
// <= 0.35). Ink is always a neutral charcoal/navy — deliberately NOT derived
// from the brand's primary color. Deriving it from primary used to mean a
// saturated brand red bled into headers, the sidebar, and every "dark"
// surface as a muddy maroon. Keeping ink neutral keeps those surfaces calm
// no matter how intense the org's brand color is.
function ensureDarkSurface(candidate) {
  const NEUTRAL = "#111827"; // slate-900 — calm, brand-agnostic dark surface
  if (candidate?.startsWith("#") && luminance(candidate) <= 0.35) return candidate;
  return NEUTRAL;
}

export function loadCachedTheme() {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.theme);
    if (cached) applyTheme({ theme: JSON.parse(cached) });
  } catch { /* ignore */ }
}

// Pulls a saturated/hot color toward a soft neutral so it reads as calm and
// premium rather than aggressive when used across large surfaces (buttons,
// glows, active states, gradients). Leaves already-muted colors untouched.
// Lower threshold + stronger blend than before — a deep saturated red/maroon
// brand color was still reading "dark and heavy" across the app at the old
// settings.
function softenIntensity(hex) {
  if (!hex?.startsWith("#") || hex.length < 7) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (saturation < 0.55) return hex; // not an overly hot color, leave as-is
  const mix = 0.24;
  const blend = (c) => Math.round(c + (245 - c) * mix);
  return `#${((1 << 24) + (blend(r) << 16) + (blend(g) << 8) + blend(b)).toString(16).slice(1)}`;
}

// Converts hex -> HSL so we can reason about hue instead of raw RGB.
function hexToHsl(hex) {
  const num = parseInt(hex.slice(1), 16);
  const r = ((num >> 16) & 0xff) / 255, g = ((num >> 8) & 0xff) / 255, b = (num & 0xff) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Hot pink / magenta / fuchsia brand colors (hue roughly 300°–345°) read as
// "candy pink" and clash with the app's warm terracotta/rust visual
// language everywhere they're used as a small accent (pins, avatars,
// checkmarks, active nav states). Rotate hues in that band toward the
// app's signature terracotta hue (~12°) while preserving the org's
// saturation/lightness intent, so a per-org accent still exists but never
// renders as pink again. Colors outside that band (blues, greens, the
// app's own rust/red-orange) are left untouched.
function neutralizeHotPink(hex) {
  if (!hex?.startsWith("#") || hex.length < 7) return hex;
  const { h, s, l } = hexToHsl(hex);
  const isHotPink = h >= 290 && h <= 345;
  if (!isHotPink) return hex;
  const targetHue = 12; // app's signature terracotta/rust hue
  const safeLightness = Math.min(Math.max(l, 0.30), 0.45);
  return hslToHex(targetHue, Math.min(s, 0.62), safeLightness);
}

function adjustColor(hex, percent) {
  if (!hex?.startsWith("#")) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function saveAuth(token, customer) {
  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.customer, JSON.stringify(customer));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.customer);
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEYS.token);
}

export function getCustomer() {
  try {
    const c = localStorage.getItem(STORAGE_KEYS.customer);
    return c ? JSON.parse(c) : null;
  } catch {
    return null;
  }
}

export function saveOutlet(outlet) {
  localStorage.setItem(STORAGE_KEYS.outlet, JSON.stringify(outlet));
}

export function getSavedOutlet() {
  try {
    const o = localStorage.getItem(STORAGE_KEYS.outlet);
    return o ? JSON.parse(o) : null;
  } catch {
    return null;
  }
}

export function getSavedAddress() {
  try {
    const a = localStorage.getItem("selectedAddress");
    return a ? JSON.parse(a) : null;
  } catch {
    return null;
  }
}

export function saveOrderType(type) {
  localStorage.setItem(STORAGE_KEYS.orderType, type);
}

export function getOrderType() {
  return localStorage.getItem(STORAGE_KEYS.orderType) || "Door Delivery";
}

export function formatPrice(amount, symbol = "₹") {
  return `${symbol}${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function formatDistance(km) {
  if (!km && km !== 0) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatPhone(phone) {
  const p = String(phone || "").replace(/\D/g, "");
  if (p.length === 12 && p.startsWith("91")) return p.slice(2);
  return p;
}
