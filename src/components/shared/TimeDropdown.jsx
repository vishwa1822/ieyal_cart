import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// TimeDropdown — premium dropdown-style time-slot selector, matching
// DateDropdown's interaction pattern. The panel's option list is itself a
// smooth, scrollable picker (not a static button grid). `slots` accepts
// strings or { value, label, full } descriptors straight from the API via
// useCampaignSlots — nothing here invents or reorders slot data.
// ────────────────────────────────────────────────────────────────────────

export default function TimeDropdown({ slots, selectedSlot, onSelectSlot, emptyMessage = "No time slots available for this day." }) {
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

  // Selection is tied to a specific day, so if the day changes underneath
  // an open panel, close it rather than show stale slots.
  useEffect(() => { setOpen(false); }, [slots]);

  if (!slots.length) {
    return <p className="text-sm text-[var(--iy-ink-soft)] italic py-2">{emptyMessage}</p>;
  }

  const selectedObj = slots.find((s) => (typeof s === "string" ? s : s.value) === selectedSlot);
  const selectedLabel = selectedObj ? (typeof selectedObj === "string" ? selectedObj : selectedObj.label) : null;

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
        <span className={`text-[15px] font-bold tabular-nums ${selectedLabel ? "text-[var(--iy-ink)]" : "text-[var(--iy-ink-soft)] font-medium"}`}>
          {selectedLabel || "Select a time slot"}
        </span>
        <ChevronDown className={`h-4 w-4 text-[var(--iy-ink-soft)] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-2 rounded-2xl border border-[var(--iy-border)] bg-white shadow-[var(--iy-shadow-md)] p-2 max-h-72 overflow-y-auto scroll-smooth animate-[iyFadeUp_.18s_ease-out]">
          {slots.map((s) => {
            const value = typeof s === "string" ? s : s.value;
            const label = typeof s === "string" ? s : s.label;
            const full = typeof s === "object" && s.full;
            const active = selectedSlot === value;
            return (
              <button
                key={value}
                type="button"
                disabled={full}
                onClick={() => { onSelectSlot(value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors duration-150 ${active
                  ? "bg-[var(--iy-accent)] text-white"
                  : full
                    ? "text-[var(--iy-ink-soft)]/40 cursor-not-allowed"
                    : "text-[var(--iy-ink)] hover:bg-[var(--iy-bg)]"
                  }`}
              >
                <span className="text-sm font-semibold tabular-nums">{label}</span>
                {full ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide">Full</span>
                ) : active ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
