import { useRef, useEffect } from "react";

function dayDate(day) {
  return day instanceof Date ? day : day.date;
}

// ────────────────────────────────────────────────────────────────────────
// DateStrip — premium horizontal date picker. Snap-scrolls, auto-centers
// the active date, marks "today", and renders unavailable days disabled
// (not hidden) so the guest can see the whole week at a glance.
// ────────────────────────────────────────────────────────────────────────
export default function DateStrip({ days, selectedDayIndex, onSelectDay, emptyMessage = "No dates available right now." }) {
  const scrollRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    const el = itemRefs.current[selectedDayIndex];
    const container = scrollRef.current;
    if (!el || !container) return;
    const target = el.offsetLeft - container.clientWidth / 2 + el.offsetWidth / 2;
    container.scrollTo({ left: Math.max(target, 0), behavior: "smooth" });
  }, [selectedDayIndex]);

  if (!days.length) {
    return <p className="text-sm text-[var(--iy-ink-soft)] italic py-2">{emptyMessage}</p>;
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto hide-scrollbar -mx-1 px-1 py-1 scroll-smooth"
        style={{ scrollSnapType: "x proximity" }}
      >
        {days.map((day, i) => {
          const d = dayDate(day);
          const available = day instanceof Date ? true : day.available !== false;
          const active = i === selectedDayIndex && available;
          const isToday = i === 0;
          return (
            <button
              key={day instanceof Date ? d.toISOString() : (day.dateStr || i)}
              ref={(el) => (itemRefs.current[i] = el)}
              onClick={() => available && onSelectDay(i)}
              disabled={!available}
              aria-disabled={!available}
              aria-pressed={active}
              style={{ scrollSnapAlign: "center" }}
              className={`group relative shrink-0 w-[64px] py-3 rounded-2xl border text-center transition-all duration-300 ease-out ${active
                ? "bg-[var(--iy-accent)] border-[var(--iy-accent)] text-white shadow-[var(--iy-shadow-glow)] scale-[1.04]"
                : available
                  ? "border-[var(--iy-border)] bg-[var(--iy-surface)] text-[var(--iy-ink)] hover:border-[var(--iy-accent)]/40 hover:-translate-y-0.5 hover:shadow-[var(--iy-shadow-xs)]"
                  : "border-[var(--iy-border)] bg-[var(--iy-bg)] text-[var(--iy-ink-soft)]/40 cursor-not-allowed"
                }`}
            >
              {isToday && (
                <span
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${active ? "bg-white text-[var(--iy-accent)]" : "bg-[var(--iy-accent)] text-white"
                    }`}
                >
                  Today
                </span>
              )}
              <span className={`block text-[10px] uppercase tracking-wide ${active ? "text-white/75" : "text-[var(--iy-ink-soft)]"}`}>
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span className="block text-base font-bold mt-0.5 tabular-nums">{d.getDate()}</span>
              <span className={`block text-[9px] mt-0.5 ${active ? "text-white/70" : "text-[var(--iy-ink-soft)]/70"}`}>
                {d.toLocaleDateString(undefined, { month: "short" })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
