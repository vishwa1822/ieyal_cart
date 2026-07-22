import BannerCarousel from "@/components/shared/BannerCarousel";

// ────────────────────────────────────────────────────────────────────────
// BannerStrip — a horizontal, inline banner section backed by
// banner/get-active. Wraps the shared BannerCarousel (arrows, dots, drag +
// swipe already built in) with the standard picture/webView/mobileView
// rendering used across the app, so every page that needs a banner rail
// (Pre Booking listing, product selection, …) gets identical behaviour
// without re-implementing the responsive <picture> markup each time.
//
// Never hardcodes banner content — `banners` must come from the caller
// (AppContext's `banners`, sourced from banner/get-active).
// ────────────────────────────────────────────────────────────────────────
export default function BannerStrip({ banners, className = "", roundedClassName = "rounded-3xl", onBannerClick, autoPlay = false }) {
  const sorted = [...(banners || [])].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  if (sorted.length === 0) return null;

  return (
    <BannerCarousel
      banners={sorted}
      autoPlay={autoPlay}
      roundedClassName={roundedClassName}
      className={`shadow-[var(--iy-shadow-xs)] ${className}`}
      renderBanner={(banner) => (
        <div
          className={`relative w-full h-full bg-[var(--iy-bg)] ${onBannerClick ? "cursor-pointer" : ""}`}
          onClick={onBannerClick ? () => onBannerClick(banner) : undefined}
        >
          <picture>
            {(banner.image?.webView || banner.imageUrl) && (
              <source media="(min-width: 1024px)" srcSet={banner.image?.webView || banner.imageUrl} />
            )}
            <img
              src={banner.image?.mobileView || banner.image?.webView || banner.imageUrl}
              alt={banner.title || "Promo"}
              draggable={false}
              className="w-full h-full object-cover"
            />
          </picture>
        </div>
      )}
    />
  );
}
