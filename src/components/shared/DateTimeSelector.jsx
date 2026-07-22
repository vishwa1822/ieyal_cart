import { CalendarDays, Clock } from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// DateTimeSelector — shared day-chip row + time-slot grid.
//
// `days` accepts either plain Date objects, or day descriptors of the
// shape { date, dateStr, available }. Days with `available === false`
// render disabled (backend-flagged as closed / fully booked) rather than
// being hidden, so guests can see the full week at a glance.
//
// `slots` accepts either plain strings, or slot descriptors of the shape
// { value, label } — `value` is what gets stored/sent to the API,
// `label` is what's shown to the guest (e.g. 24h "16:29:00" → "4:29 PM").
// ────────────────────────────────────────────────────────────────────────

export function nextDays(n = 7) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

function dayDate(day) {
  return day instanceof Date ? day : day.date;
}

export default function DateTimeSelector({
  days,
  selectedDayIndex,
  onSelectDay,
  slots,
  selectedSlot,
  onSelectSlot,
  emptySlotsMessage = "No time slots available for this day.",
  emptyDaysMessage = "No dates available right now.",
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--iy-ink-soft)] mb-2.5 flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> Choose a date
        </p>
        {days.length === 0 ? (
          <p className="text-sm text-[var(--iy-ink-soft)] italic">{emptyDaysMessage}</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
            {days.map((day, i) => {
              const d = dayDate(day);
              const available = day instanceof Date ? true : day.available !== false;
              const active = i === selectedDayIndex && available;
              return (
                <button
                  key={day instanceof Date ? d.toISOString() : (day.dateStr || i)}
                  onClick={() => available && onSelectDay(i)}
                  disabled={!available}
                  aria-disabled={!available}
                  className={`shrink-0 w-16 py-2.5 rounded-2xl border text-center transition-all duration-200 ${active
                    ? "bg-[var(--iy-accent)] border-[var(--iy-accent)] text-white shadow-[var(--iy-shadow-sm)]"
                    : available
                      ? "border-[var(--iy-border)] bg-white text-[var(--iy-ink)] hover:border-[var(--iy-accent)]/30"
                      : "border-[var(--iy-border)] bg-[var(--iy-bg)] text-[var(--iy-ink-soft)]/50 cursor-not-allowed"
                    }`}
                >
                  <span className={`block text-[10px] uppercase tracking-wide ${active ? "text-white/75" : "text-[var(--iy-ink-soft)]"}`}>
                    {i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                  <span className="block text-sm font-semibold mt-0.5">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--iy-ink-soft)] mb-2.5 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Choose a time
        </p>
        {slots.length === 0 ? (
          <p className="text-sm text-[var(--iy-ink-soft)] italic">{emptySlotsMessage}</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((s) => {
              const value = typeof s === "string" ? s : s.value;
              const label = typeof s === "string" ? s : s.label;
              const active = selectedSlot === value;
              return (
                <button
                  key={value}
                  onClick={() => onSelectSlot(value)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${active
                    ? "bg-[var(--iy-accent)] border-[var(--iy-accent)] text-white shadow-[var(--iy-shadow-sm)]"
                    : "border-[var(--iy-border)] bg-white text-[var(--iy-ink)] hover:border-[var(--iy-accent)]/30"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
