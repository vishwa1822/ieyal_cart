import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { CheckCircle2, CalendarClock } from "lucide-react";
import { AppNavbar } from "@/components/layout/AppShell";
import { formatPrice } from "@/lib/theme";

// Reached only via CheckoutPage's success path (router `state`, not a
// fetch of its own) — it just presents what checkout already confirmed.
// No new order/booking API is introduced; this is a display-only step.
export default function BookingConfirmationPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state?.orderId) return <Navigate to="/home" replace />;

  const { orderId, campaign, date, slot, orderType, items = [] } = state;

  return (
    <div className="ieyal min-h-screen w-full">
      <AppNavbar />
      <div className="pt-24 lg:pt-28 pb-16">
        <div className="max-w-lg mx-auto px-5">
          <div className="flex flex-col items-center text-center animate-[iyFadeUp_.6s_ease-out]">
            <div className="h-16 w-16 rounded-full bg-[var(--iy-accent-soft)] flex items-center justify-center mb-5">
              <CheckCircle2 className="h-8 w-8 text-[var(--iy-accent)]" strokeWidth={2.5} />
            </div>
            <h1 className="iy-serif text-2xl font-medium tracking-tight text-[var(--iy-ink)]">Booking confirmed</h1>
            <p className="text-sm text-[var(--iy-ink-soft)] mt-2">
              Booking ID <span className="font-semibold text-[var(--iy-ink)] tabular-nums">#{String(orderId).slice(-8).toUpperCase()}</span>
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-[var(--iy-border)] bg-[var(--iy-surface)] shadow-[var(--iy-shadow-xs)] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--iy-border)]">
              <CalendarClock className="h-4 w-4 text-[var(--iy-accent)]" />
              <p className="text-sm font-semibold text-[var(--iy-ink)]">{campaign?.name || "Pre Booking"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {date && (
                <div>
                  <p className="text-xs text-[var(--iy-ink-soft)]">Date</p>
                  <p className="font-medium text-[var(--iy-ink)]">{new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                </div>
              )}
              {slot?.startTime && (
                <div>
                  <p className="text-xs text-[var(--iy-ink-soft)]">Time</p>
                  <p className="font-medium text-[var(--iy-ink)]">{slot.label || slot.startTime}</p>
                </div>
              )}
              {orderType && (
                <div>
                  <p className="text-xs text-[var(--iy-ink-soft)]">Order type</p>
                  <p className="font-medium text-[var(--iy-ink)]">{orderType}</p>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="pt-3 border-t border-[var(--iy-border)] space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--iy-ink-soft)]">Ordered items</p>
                {items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[var(--iy-ink)]">{it.name || it.itemName} × {it.quantity || 1}</span>
                    {typeof it.price === "number" && <span className="tabular-nums text-[var(--iy-ink-soft)]">{formatPrice(it.price * (it.quantity || 1))}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/home")}
              className="flex-1 h-12 rounded-full border border-[var(--iy-border)] bg-white text-sm font-semibold text-[var(--iy-ink)] hover:border-[var(--iy-accent)]/30 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate("/orders")}
              className="flex-1 h-12 rounded-full bg-[var(--iy-accent)] text-white text-sm font-semibold shadow-[var(--iy-shadow-sm)] hover:-translate-y-0.5 transition-all duration-300"
            >
              View Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
