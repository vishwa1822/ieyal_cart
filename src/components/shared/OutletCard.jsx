import { motion } from "framer-motion";
import { MapPin, ChevronRight, Bike, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatDistance } from "@/lib/theme";
import useReveal from "@/hooks/useReveal";

// ────────────────────────────────────────────────────────────────────────
// OutletCard — the one outlet/store card used on Outlet Selection. Text
// -first, no photography (a store isn't a dish — a name/address/status
// card reads cleaner and loads instantly), same premium card language as
// the rest of the app (rounded-card, warm border, soft shadow, terracotta
// accent). The whole card is the control: tapping an open store selects
// it and continues in one motion instead of a separate confirm step.
// ────────────────────────────────────────────────────────────────────────
/**
 * @param {{ outlet: import("../../types/outlet").Outlet, onSelect: (outlet: import("../../types/outlet").Outlet) => void }} props
 */
export function OutletCard({ outlet, onSelect }) {
  const isOpen = outlet.storeStatus && outlet.isActive;
  const distance = outlet.distance ? formatDistance(outlet.distance / 1000) : null;
  const revealRef = useReveal();

  return (
    <motion.button
      ref={revealRef}
      type="button"
      disabled={!isOpen}
      onClick={() => isOpen && onSelect?.(outlet)}
      whileHover={isOpen ? { y: -3 } : {}}
      whileTap={isOpen ? { scale: 0.985 } : {}}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={`iy-reveal group w-full text-left rounded-card border bg-[var(--color-surface)] p-5 transition-shadow duration-300 ${
        isOpen
          ? "border-[var(--color-border)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-primary)]/30"
          : "border-[var(--color-border)] shadow-none opacity-55 cursor-not-allowed"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-xl shrink-0 flex items-center justify-center transition-colors duration-300 ${
          isOpen ? "bg-[var(--color-primary)]/10 group-hover:bg-[var(--color-primary)]/15" : "bg-[var(--color-bg)]"
        }`}>
          <MapPin className={`h-5 w-5 ${isOpen ? "text-[var(--color-primary)]" : "text-[var(--color-text-faint)]"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-base font-medium text-[var(--color-ink)] truncate">{outlet.outletName}</p>
            <Badge variant={isOpen ? "success" : "secondary"} className="shrink-0 normal-case tracking-normal">
              {isOpen ? "Open now" : "Closed"}
            </Badge>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 leading-snug line-clamp-2">{outlet.address}</p>

          <div className="flex items-center gap-3 mt-2.5 text-xs text-[var(--color-text-faint)] flex-wrap">
            {distance && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {distance}
              </span>
            )}
            {outlet.orderType?.includes("Door Delivery") && (
              <span className="flex items-center gap-1">
                <Bike className="h-3 w-3" /> Delivery
              </span>
            )}
            {outlet.orderType?.includes("Self Pickup") && (
              <span className="flex items-center gap-1">
                <ShoppingBag className="h-3 w-3" /> Pickup
              </span>
            )}
            {outlet.orderType?.includes("Dine In") && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Dine In
              </span>
            )}
            {outlet.currencySymbol && (
              <span className="flex items-center gap-1 border-l border-[var(--color-border)] pl-3">
                {outlet.currencySymbol} {outlet.currencyCode}
              </span>
            )}
            {outlet.defaultOrderType && (
              <span className="flex items-center gap-1 border-l border-[var(--color-border)] pl-3 text-[var(--color-ink)]/70">
                Default: {outlet.defaultOrderType}
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          className={`h-5 w-5 shrink-0 self-center transition-transform duration-300 ${
            isOpen ? "text-[var(--color-text-faint)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5" : "text-[var(--color-text-faint)]/50"
          }`}
        />
      </div>
    </motion.button>
  );
}

export default OutletCard;
