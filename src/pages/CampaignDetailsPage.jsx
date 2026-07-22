import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import {
  ChevronLeft, CalendarClock, Sparkles, CalendarDays, Clock3,
  Truck, ShoppingBag, Package, CheckCircle2, AlertTriangle, Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { AppNavbar } from "@/components/layout/AppShell";
import { BannerSkeleton } from "@/pages/LoadingStates";
import { formatValidity } from "@/components/shared/PreBookingBits";
import { OfferCard } from "@/components/shared/OfferCard";
import BannerCarousel from "@/components/shared/BannerCarousel";
import DateDropdown from "@/components/shared/DateDropdown";
import TimeDropdown from "@/components/shared/TimeDropdown";
import usePreBookingCampaigns from "@/hooks/usePreBookingCampaigns";
import useCampaignSlots from "@/hooks/useCampaignSlots";
import useDeliveryCheck from "@/hooks/useDeliveryCheck";

// ────────────────────────────────────────────────────────────────────────
// CampaignDetailsPage — Campaign (banner/info/offers, unchanged) +
// Booking controls (order type, date, slot, Book Now) on the SAME page.
// There is no separate Booking route: everything must be completed here
// before Book Now unlocks and sends the guest to the existing Products
// page. Order types are rendered purely from campaign.allowedOrderTypes —
// whatever the API returns — never assumed or hardcoded to a fixed pair.
// ────────────────────────────────────────────────────────────────────────

// Best-effort icon for whatever order-type string the API sends — a
// presentation nicety only. It never limits, filters, or reorders the
// options themselves, and falls back to a generic icon for any type it
// doesn't recognize (so a brand-new order type from the backend still
// renders correctly, just without a bespoke icon).
function orderTypeIcon(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("deliver")) return Truck;
  if (t.includes("pickup") || t.includes("pick up") || t.includes("collect")) return ShoppingBag;
  return Package;
}

function OrderTypeSelector({ allowedOrderTypes, value, onChange }) {
  const types = allowedOrderTypes || [];
  if (!types.length) {
    return <p className="text-sm text-[var(--iy-ink-soft)] italic">No order types available for this campaign.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => {
        const Icon = orderTypeIcon(type);
        const active = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            aria-pressed={active}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 h-12 rounded-2xl border text-sm font-semibold transition-all duration-300 ${active
              ? "bg-[var(--iy-accent)] text-white border-[var(--iy-accent)] shadow-[var(--iy-shadow-sm)] scale-[1.01]"
              : "border-[var(--iy-border)] bg-white text-[var(--iy-ink-soft)] hover:border-[var(--iy-accent)]/30 hover:text-[var(--iy-ink)]"
              }`}
          >
            <Icon className="h-4 w-4" /> {type}
          </button>
        );
      })}
    </div>
  );
}

// Inline banner reflecting delivery/check's result — only relevant once
// a delivery-type order type is selected.
function DeliveryAvailabilityNote({ status, message, onRetry }) {
  if (status === "idle") return null;
  const styles = {
    checking: "border-[var(--iy-border)] bg-[var(--iy-bg)] text-[var(--iy-ink-soft)]",
    available: "border-emerald-200 bg-emerald-50 text-emerald-700",
    unavailable: "border-danger/30 bg-danger/5 text-danger",
    error: "border-danger/30 bg-danger/5 text-danger",
  };
  const Icon = status === "checking" ? Loader2 : status === "available" ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium animate-[iyFadeUp_.3s_ease-out] ${styles[status]}`}>
      <Icon className={`h-4 w-4 shrink-0 ${status === "checking" ? "animate-spin" : ""}`} />
      <span className="flex-1">{message || "Checking delivery availability…"}</span>
      {(status === "unavailable" || status === "error") && (
        <button onClick={onRetry} className="text-xs font-semibold underline underline-offset-2 shrink-0">Retry</button>
      )}
    </div>
  );
}

export default function CampaignDetailsPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { isStoreOpen, setPreBooking, discounts, preBooking } = useApp();
  const { campaigns, loading, error } = usePreBookingCampaigns();

  const campaign = useMemo(() => campaigns.find((c) => c._id === campaignId), [campaigns, campaignId]);
  const validity = campaign ? formatValidity(campaign) : null;
  // Tolerant of a future multi-image field (banners/images) without
  // assuming it exists — today's model only exposes a single `image`.
  const campaignBanners = campaign
    ? (campaign.banners || campaign.images || (campaign.image ? [{ _id: "primary", imageUrl: campaign.image }] : []))
    : [];

  // Availability summary — how many days this campaign can currently be
  // booked on, straight off availableDates/getActive.
  const availableDayCount = campaign?.availableDates?.length || 0;

  // ── Booking controls — order type, date, slot ───────────────────────
  const { days, slotsForDay } = useCampaignSlots(campaign);
  const [orderType, setOrderType] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const slots = slotsForDay(selectedDayIndex);

  // "Change Booking" from the Product page (or the backend rejecting a
  // slot that's since passed) sends the guest back here. Restore their
  // previous order type / date / slot for this same campaign exactly
  // once, so they don't have to redo every choice — but only after
  // re-validating the slot is still in the (now time-filtered) options
  // for that day, so a slot that passed in the meantime is never
  // silently reused.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || !campaign || campaign._id !== campaignId) return;
    restoredRef.current = true;
    if (preBooking.campaign?._id !== campaignId) return;
    if (preBooking.orderType) setOrderType(preBooking.orderType);
    if (preBooking.date) {
      const idx = days.findIndex((d) => d.dateStr === preBooking.date);
      if (idx >= 0) {
        setSelectedDayIndex(idx);
        const daySlots = slotsForDay(idx);
        if (preBooking.slot?.startTime && daySlots.some((s) => s.value === preBooking.slot.startTime)) {
          setSelectedSlot(preBooking.slot.startTime);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, campaignId, days]);

  // Fewer taps: auto-pick order type the moment it's unambiguous —
  // still driven entirely by whatever the API returned.
  useEffect(() => {
    if (!orderType && campaign?.allowedOrderTypes?.length === 1) {
      setOrderType(campaign.allowedOrderTypes[0]);
    }
  }, [campaign, orderType]);

  const delivery = useDeliveryCheck();
  useEffect(() => {
    if (orderType === "Door Delivery") delivery.check();
    else delivery.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderType]);

  if (!isStoreOpen) return <Navigate to="/closed" replace />;

  const deliveryBlocked = orderType === "Door Delivery" && (delivery.status === "unavailable" || delivery.status === "checking");
  const canBookNow = !!orderType && !!selectedSlot && !deliveryBlocked;

  const handleBookNow = () => {
    if (!canBookNow) return;
    const day = days[selectedDayIndex];
    const slotObj = slots.find((s) => s.value === selectedSlot);
    setPreBooking({
      campaign,
      orderType,
      date: day?.dateStr || null,
      slot: { startTime: selectedSlot, label: slotObj?.label || selectedSlot },
    });
    navigate(`/pre-booking/${campaignId}/products`);
  };

  return (
    <div className="ieyal min-h-screen w-full">
      <AppNavbar />
      <div className="pt-24 lg:pt-28 pb-36 lg:pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-5">
          <button onClick={() => navigate("/pre-booking")} className="flex items-center gap-1.5 text-sm font-medium text-[var(--iy-ink-soft)] hover:text-[var(--iy-ink)] transition-colors">
            <ChevronLeft className="h-4 w-4" /> All campaigns
          </button>
        </div>

        {loading && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <BannerSkeleton />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-danger text-center py-10">Couldn't load this campaign. Please try again shortly.</p>
        )}

        {!loading && !error && !campaign && (
          <div className="text-center py-16">
            <Sparkles className="h-8 w-8 text-[var(--iy-ink-soft)] mx-auto mb-3" />
            <p className="text-[var(--iy-ink)] font-medium">This campaign isn't available anymore</p>
            <button onClick={() => navigate("/pre-booking")} className="mt-5 text-sm font-semibold text-[var(--iy-accent)] hover:underline underline-offset-2">
              Browse active campaigns
            </button>
          </div>
        )}

        {!loading && campaign && (
          <div className="animate-[iyFadeUp_.5s_ease-out] space-y-5">
            {/* ── Hero — full-width horizontal banner. Title and the
                "bookable on X days" summary sit inside the overlay so
                the whole hero reads as one premium, wide strip. ────── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <BannerCarousel
                banners={campaignBanners}
                roundedClassName="rounded-[28px]"
                className="bg-[var(--iy-ink)] text-white shadow-[var(--iy-shadow-md)] border border-[var(--iy-border)] h-[220px] sm:h-[280px] lg:h-[360px] w-full"
                renderBanner={(banner) => (
                  <div
                    className="relative w-full h-full flex items-end"
                    style={banner.imageUrl ? { backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.82), rgba(0,0,0,0.05) 65%), url(${banner.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  >
                    <div className="relative w-full flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 p-5 sm:p-8 lg:p-10">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90 bg-white/10 backdrop-blur border border-white/20 rounded-full px-3 py-1 mb-3">
                          <CalendarClock className="h-3 w-3" /> Pre Booking
                        </span>
                        <p className="iy-serif font-medium text-2xl sm:text-3xl lg:text-[2.75rem] leading-[1.08] tracking-tight max-w-xl">{campaign.name}</p>
                      </div>
                      {availableDayCount > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-white/10 backdrop-blur border border-white/20 rounded-full px-3.5 py-1.5 sm:mb-1 w-fit">
                          Bookable on {availableDayCount} day{availableDayCount > 1 ? "s" : ""} of the week
                        </span>
                      )}
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-5">
              {/* ── Booking card — description, validity, and the order
                  type / date / time controls all live together in one
                  premium panel. ───────────────────────────────────── */}
              <div className="rounded-[24px] bg-[var(--iy-surface)] border border-[var(--iy-border)] shadow-[var(--iy-shadow-sm)] p-5 sm:p-7 lg:p-8 space-y-5">
                {(campaign.description || validity) && (
                  <div className="space-y-2">
                    {campaign.description && (
                      <p className="text-[15px] text-[var(--iy-ink-soft)] leading-relaxed">{campaign.description}</p>
                    )}
                    {validity && (
                      <span className="inline-block text-sm font-semibold text-[var(--iy-accent)]">{validity}</span>
                    )}
                  </div>
                )}

                <div className="h-px bg-[var(--iy-border)]" />

                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--iy-accent)]">Complete your booking</p>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--iy-ink-soft)] mb-2">Order type</p>
                  <OrderTypeSelector
                    allowedOrderTypes={campaign.allowedOrderTypes}
                    value={orderType}
                    onChange={setOrderType}
                  />
                </div>

                {orderType === "Door Delivery" && (
                  <DeliveryAvailabilityNote status={delivery.status} message={delivery.message} onRetry={delivery.check} />
                )}

                <div className="h-px bg-[var(--iy-border)]" />

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--iy-ink-soft)] mb-2 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> Date
                  </p>
                  <DateDropdown
                    days={days}
                    selectedDayIndex={selectedDayIndex}
                    onSelectDay={(i) => { setSelectedDayIndex(i); setSelectedSlot(null); }}
                    emptyMessage="No booking dates available for this campaign right now."
                  />
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--iy-ink-soft)] mb-2 flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" /> Time slot
                  </p>
                  <TimeDropdown
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                    emptyMessage="No booking slots available for this day — try another date."
                  />
                </div>
              </div>

              {discounts?.length > 0 && (
                <div className="rounded-[24px] bg-[var(--iy-surface)] border border-[var(--iy-border)] shadow-[var(--iy-shadow-xs)] p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--iy-ink-soft)] mb-3">Available offers</p>
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
                    {discounts.map((d) => <OfferCard key={d._id} offer={d} />)}
                  </div>
                </div>
              )}

              <button
                onClick={handleBookNow}
                disabled={!canBookNow}
                className="hidden lg:flex w-full h-14 px-8 rounded-2xl bg-[var(--iy-accent)] text-white font-bold text-[15px] tracking-wide shadow-[var(--iy-shadow-md)] items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--iy-shadow-glow)] active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none disabled:hover:translate-y-0 disabled:hover:shadow-[var(--iy-shadow-md)]"
              >
                Book Now
              </button>
            </div>
          </div>
          )}
      </div>

      {/* Mobile sticky Book Now */}
      {campaign && (
        <div className="ieyal lg:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-[var(--iy-surface)]/95 backdrop-blur-xl border-t border-[var(--iy-border)] z-30">
          <button
            onClick={handleBookNow}
            disabled={!canBookNow}
            className="w-full py-3.5 rounded-2xl bg-[var(--iy-accent)] text-white font-bold text-[15px] shadow-[var(--iy-shadow-md)] flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            Book Now
          </button>
        </div>
      )}
    </div>
  );
}
