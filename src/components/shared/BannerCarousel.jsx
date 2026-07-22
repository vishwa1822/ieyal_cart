import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// BannerCarousel — the one carousel every banner section reuses.
//
// Fully presentation-only: it takes whatever banner objects the backend
// already returns and a `renderBanner(banner, index)` function to paint
// each slide, so it never assumes a particular API shape or hardcodes any
// content itself.
//
// - banners.length <= 1  → arrows + dots auto-hide, renders as a plain slide
// - banners.length > 1   → arrows, dots, drag (desktop) and swipe (mobile)
// - autoPlay              → optional, respects existing settings.banner.autoScroll
// ────────────────────────────────────────────────────────────────────────
export default function BannerCarousel({
  banners,
  renderBanner,
  aspectClassName = "",
  roundedClassName = "rounded-3xl",
  className = "",
  autoPlay = false,
  autoPlayInterval = 4000,
}) {
  const containerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const count = banners?.length || 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (index > count - 1) setIndex(Math.max(0, count - 1));
  }, [count, index]);

  const goTo = useCallback((i) => setIndex(Math.max(0, Math.min(count - 1, i))), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (!autoPlay || count <= 1) return;
    const t = setInterval(next, autoPlayInterval);
    return () => clearInterval(t);
  }, [autoPlay, autoPlayInterval, count, next]);

  if (!count) return null;

  const handleDragStart = () => { suppressClickRef.current = false; };
  const handleDrag = (_, info) => {
    if (Math.abs(info.offset.x) > 6) suppressClickRef.current = true;
  };
  const handleDragEnd = (_, info) => {
    const effective = info.offset.x + info.velocity.x * 0.2;
    if (effective < -width * 0.2) next();
    else if (effective > width * 0.2) prev();
    // Let the click-suppression flag clear just after this tick, so a real
    // tap (no movement) still fires the caller's onClick normally.
    setTimeout(() => { suppressClickRef.current = false; }, 50);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${roundedClassName} ${className}`}
      onClickCapture={(e) => { if (suppressClickRef.current) { e.stopPropagation(); e.preventDefault(); } }}
    >
      <motion.div
        className={`flex h-full ${count > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
        drag={count > 1 && width > 0 ? "x" : false}
        dragConstraints={{ left: -(count - 1) * width, right: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: -index * width }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        {banners.map((banner, i) => (
          <div
            key={banner._id || banner.id || i}
            className={`shrink-0 h-full ${aspectClassName}`}
            style={{ width: width ? `${width}px` : "100%" }}
          >
            {renderBanner(banner, i)}
          </div>
        ))}
      </motion.div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:bg-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-neutral-800" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.18)] hover:bg-white transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-neutral-800" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/55"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
