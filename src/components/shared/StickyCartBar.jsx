import { useState } from "react";
import { ChevronUp, ChevronDown, ArrowRight, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/theme";

// ────────────────────────────────────────────────────────────────────────
// StickyCartBar — floating summary that appears the moment the first item
// is added. Collapsed by default (item count + total + continue); tapping
// "expand" reveals a per-item breakdown. Never auto-navigates — checkout
// only happens when the guest explicitly taps Continue.
// ────────────────────────────────────────────────────────────────────────
export default function StickyCartBar({ items, totalItems, cartTotal, onCheckout }) {
  const [expanded, setExpanded] = useState(false);
  if (totalItems <= 0) return null;

  return (
    <div className="ieyal fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 lg:px-0 lg:pb-6 pointer-events-none">
      <div className="w-full max-w-lg mx-auto pointer-events-auto animate-[iyFadeUp_.35s_cubic-bezier(0.34,1.56,0.64,1)]">
        {expanded && (
          <div className="mb-2 rounded-3xl bg-[var(--iy-surface)]/98 backdrop-blur-xl border border-[var(--iy-border)] shadow-[var(--iy-shadow-lg)] p-4 max-h-64 overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--iy-ink-soft)] mb-3">Your booking</p>
            <div className="space-y-2.5">
              {items.map((it) => (
                <div key={it._id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[var(--iy-ink)] truncate">
                    <span className="font-semibold text-[var(--iy-accent)] tabular-nums mr-1.5">{it.qty}×</span>
                    {it.name}
                  </span>
                  <span className="tabular-nums text-[var(--iy-ink-soft)] shrink-0">{formatPrice(it.qty * it.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 bg-[var(--iy-accent)] text-white rounded-full pl-5 pr-2 py-2 shadow-[var(--iy-shadow-glow)]">
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse cart summary" : "Expand cart summary"}
            className="flex items-center gap-2 pr-3"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="text-sm font-semibold">{totalItems} item{totalItems > 1 ? "s" : ""}</span>
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onCheckout} className="flex-1 flex items-center justify-between gap-2 bg-white/15 hover:bg-white/20 transition-colors rounded-full pl-4 pr-3 py-2.5 font-semibold">
            <span className="text-sm tabular-nums">{formatPrice(cartTotal)}</span>
            <span className="text-sm flex items-center gap-1">Continue <ArrowRight className="h-3.5 w-3.5" /></span>
          </button>
        </div>
      </div>
    </div>
  );
}
