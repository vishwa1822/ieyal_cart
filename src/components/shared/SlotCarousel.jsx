import { useRef, useEffect, useState, useCallback } from "react";

// ────────────────────────────────────────────────────────────────────────
// SlotCarousel — time-slot picker built as a snap-scrolling chip carousel
// (never plain buttons in a grid). Auto-centers the active chip, fades the
// left/right edges to hint more content, and renders full slots disabled
// rather than hiding them.
// `slots` accepts strings or { value, label, full } descriptors.
// ────────────────────────────────────────────────────────────────────────
export default function SlotCarousel({ slots, selectedSlot, onSelectSlot, emptyMessage = "No time slots available for this day." }) {
  const scrollRef = useRef(null);
  const chipRefs = useRef({});
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [slots, updateEdges]);

  useEffect(() => {
    const el = chipRefs.current[selectedSlot];
    const container = scrollRef.current;
    if (!el || !container) return;
    const target = el.offsetLeft - container.clientWidth / 2 + el.offsetWidth / 2;
    container.scrollTo({ left: Math.max(target, 0), behavior: "smooth" });
  }, [selectedSlot]);

  if (!slots.length) {
    return <p className="text-sm text-[var(--iy-ink-soft)] italic py-2">{emptyMessage}</p>;
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 py-1 scroll-smooth"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {slots.map((s) => {
          const value = typeof s === "string" ? s : s.value;
          const label = typeof s === "string" ? s : s.label;
          const full = typeof s === "object" && s.full;
          const active = selectedSlot === value;
          return (
            <button
              key={value}
              ref={(el) => (chipRefs.current[value] = el)}
              onClick={() => !full && onSelectSlot(value)}
              disabled={full}
              aria-pressed={active}
              style={{ scrollSnapAlign: "center" }}
              className={`shrink-0 px-5 py-2.5 rounded-full border text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-out ${active
                ? "bg-[var(--iy-accent)] border-[var(--iy-accent)] text-white shadow-[var(--iy-shadow-sm)] scale-[1.05]"
                : full
                  ? "border-[var(--iy-border)] bg-[var(--iy-bg)] text-[var(--iy-ink-soft)]/40 cursor-not-allowed line-through"
                  : "border-[var(--iy-border)] bg-[var(--iy-surface)] text-[var(--iy-ink)] hover:border-[var(--iy-accent)]/40 hover:-translate-y-0.5"
                }`}
            >
              {label}
              {full && <span className="ml-1.5 text-[10px] uppercase tracking-wide">Full</span>}
            </button>
          );
        })}
      </div>
      {/* Left/right fade to hint more scrollable content */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--iy-bg)] to-transparent transition-opacity duration-200 ${edges.left ? "opacity-100" : "opacity-0"}`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--iy-bg)] to-transparent transition-opacity duration-200 ${edges.right ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
