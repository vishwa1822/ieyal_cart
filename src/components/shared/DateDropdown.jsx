import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// DateDropdown — premium dropdown-style date selector for the Booking
// section. Renders a single trigger button showing the selected date; on
// click, opens an anchored panel listing every date the API returned
// (`days`), with unavailable days rendered disabled rather than hidden.
// Purely presentational — `days` and the selection callback come straight
// from the caller, so this never invents or filters API data itself.
// ────────────────────────────────────────────────────────────────────────

function dayDate(day) {
  return day instanceof Date ? day : day.date;
}

export default function DateDropdown({ days, selectedDayIndex, onSelectDay, emptyMessage = "No dates available right now." }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (!days.length) {
    return <p className="text-sm text-[var(--iy-ink-soft)] italic py-2">{emptyMessage}</p>;
  }

  const selected = days[selectedDayIndex];
  const selectedDate = selected ? dayDate(selected) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-3 h-14 px-4 rounded-2xl border text-left transition-all duration-300 ${open
          ? "border-[var(--iy-accent)] bg-[var(--iy-accent-soft)] shadow-[var(--iy-shadow-sm)]"
          : "border-[var(--iy-border)] bg-white hover:border-[var(--iy-accent)]/40"
          }`}
      >
        {selectedDate ? (
          <span className="flex items-baseline gap-2 min-w-0">
            <span className="text-[15px] font-bold text-[var(--iy-ink)] tabular-nums">
              {selectedDate.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </span>
            {selectedDayIndex === 0 && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[var(--iy-accent)] bg-[var(--iy-accent-soft)] rounded-full px-2 py-0.5">Today</span>
            )}
          </span>
        ) : (
          <span className="text-[15px] font-medium text-[var(--iy-ink-soft)]">Select a date</span>
        )}
        <ChevronDown className={`h-4 w-4 text-[var(--iy-ink-soft)] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-2 rounded-2xl border border-[var(--iy-border)] bg-white shadow-[var(--iy-shadow-md)] p-2 max-h-72 overflow-y-auto animate-[iyFadeUp_.18s_ease-out]">
          {days.map((day, i) => {
            const d = dayDate(day);
            const available = day instanceof Date ? true : day.available !== false;
            const active = i === selectedDayIndex;
            return (
              <button
                key={day instanceof Date ? d.toISOString() : (day.dateStr || i)}
                type="button"
                disabled={!available}
                onClick={() => { onSelectDay(i); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors duration-150 ${active
                  ? "bg-[var(--iy-accent)] text-white"
                  : available
                    ? "text-[var(--iy-ink)] hover:bg-[var(--iy-bg)]"
                    : "text-[var(--iy-ink-soft)]/40 cursor-not-allowed"
                  }`}
              >
                <span className="flex items-baseline gap-2 min-w-0">
                  <span className="text-sm font-semibold tabular-nums">{d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</span>
                  {i === 0 && (
                    <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5 ${active ? "bg-white/20 text-white" : "bg-[var(--iy-accent-soft)] text-[var(--iy-accent)]"}`}>Today</span>
                  )}
                  {!available && <span className="shrink-0 text-[10px] uppercase tracking-wide">Unavailable</span>}
                </span>
                {active && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
