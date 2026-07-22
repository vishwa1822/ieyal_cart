import { Ticket } from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// OfferCard — the one discount/offer chip used anywhere discounts from
// discount/get-user-discounts are surfaced (Home, Pre Booking product
// selection). Presentation-only; eligibility comes straight off the
// backend's `eligible` flag.
// ────────────────────────────────────────────────────────────────────────
export function OfferCard({ offer }) {
  const eligible = offer.eligible !== false;
  return (
    <div
      className={`shrink-0 w-56 lg:w-64 rounded-2xl border p-4 transition-all duration-300 ${eligible
        ? "border-[var(--iy-accent)]/25 bg-[var(--iy-accent-soft)]/60 hover:-translate-y-1 hover:shadow-[var(--iy-shadow-sm)]"
        : "border-[var(--iy-border)] bg-white opacity-70"
        }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-[var(--iy-shadow-xs)]">
          <Ticket className="h-4 w-4 text-[var(--iy-accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate text-[var(--iy-ink)]">{offer.name}</p>
          <p className="text-[11px] text-[var(--iy-ink-soft)] mt-0.5">
            {eligible ? "Tap to apply" : "Add more items to unlock"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default OfferCard;
