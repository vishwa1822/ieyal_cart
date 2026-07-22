// Shared "what happens when a banner is tapped" resolver — a trimmed
// version of the logic already used on Home, for banner strips that don't
// need the Home-specific category-scroll/dismiss behaviour (Pre Booking).
// Internal links use React Router; external links open in a new tab (or
// Telegram's in-app browser, if present).
export function openBannerLink(banner, navigate) {
  if (!banner) return;
  const targetLink = banner.link || banner.url;
  if (banner.type === "item" && (banner.itemId || banner.referenceId)) {
    navigate(`/product/${banner.itemId || banner.referenceId}`);
    return;
  }
  if (!targetLink) return;
  try {
    if (targetLink.startsWith("/")) {
      navigate(targetLink);
      return;
    }
    const urlObj = new URL(targetLink, window.location.origin);
    if (urlObj.origin === window.location.origin) {
      navigate(urlObj.pathname + urlObj.search + urlObj.hash);
    } else if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(targetLink);
    } else {
      window.open(targetLink, "_blank", "noopener,noreferrer");
    }
  } catch {
    // Malformed URL — ignore rather than throw during a tap handler.
  }
}
