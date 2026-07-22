import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { ChevronLeft, ArrowRight, PackageSearch, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { AppNavbar } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProductCard } from "@/components/shared/ProductCard";
import { OfferCard } from "@/components/shared/OfferCard";
import BannerStrip from "@/components/shared/BannerStrip";
import { openBannerLink } from "@/lib/bannerLink";
import { ProductGridSkeleton } from "@/pages/LoadingStates";
import { Skeleton } from "@/components/ui";
import { cartApi, extractCarts } from "@/lib/api/services";
import { formatPrice } from "@/lib/theme";
import useCampaignProducts from "@/hooks/useCampaignProducts";

// ────────────────────────────────────────────────────────────────────────
// ProductSelectionPage — step 4. Categories/items come from
// POST /category/preOrder { outletId, belongsTo, preBookId, preOrderDate,
// preOrderTime } (via useCampaignProducts), scoped to the exact campaign +
// date + slot chosen in step 3 — no client-side filtering of the regular
// menu. Reuses the existing ProductCard and the existing global cart state
// (quantities / activeOrderId / updateCartFromCarts from AppContext) so the
// EXISTING Cart and Checkout pages need no product/cart logic of their own
// for this flow. Add-to-cart only gains three extra, backend-ignorable
// fields: campaignId, bookingDate, bookingSlot — cart mutation logic itself
// is unchanged.
// ────────────────────────────────────────────────────────────────────────

export default function ProductSelectionPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const {
    outlet, token, customer, isStoreOpen, banners, discounts,
    quantities, setQuantities, activeOrderId, updateCartFromCarts, setCartCount,
    preBooking,
  } = useApp();

  const campaign = preBooking.campaign?._id === campaignId ? preBooking.campaign : null;
  const { categories: campaignCategories, loading, error, retry } = useCampaignProducts(
    campaignId,
    preBooking.orderType,
    preBooking.date,
    preBooking.slot?.startTime
  );

  const [activeCategory, setActiveCategory] = useState("");
  const categoryRefs = useRef({});
  const chipRefs = useRef({});
  const chipsScrollRef = useRef(null);

  useEffect(() => {
    if (campaignCategories.length && !activeCategory) setActiveCategory(campaignCategories[0]._id);
  }, [campaignCategories, activeCategory]);

  // Categories the API returns for a slot can carry an empty `items[]`
  // (e.g. everything in that category is out of stock for this date/time).
  // Only categories with at least one item are worth a section + chip —
  // an empty section would just be dead space. If that leaves nothing at
  // all, the page falls back to one clear "No products available" state
  // instead of the same message repeated per empty category.
  const categoriesWithItems = campaignCategories.filter((c) => c.items?.length);
  const totalItemCount = categoriesWithItems.reduce((sum, c) => sum + c.items.length, 0);

  const scrollToCategory = (catId) => {
    setActiveCategory(catId);
    categoryRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const chipEl = chipRefs.current[activeCategory];
    const container = chipsScrollRef.current;
    if (!chipEl || !container) return;
    const target = chipEl.offsetLeft - container.clientWidth / 2 + chipEl.offsetWidth / 2;
    container.scrollTo({ left: Math.max(target, 0), behavior: "smooth" });
  }, [activeCategory]);

  const rawPhone = customer?.phone || customer?.phoneNo || customer?.mobileNumber || "";

  const handleQtyChange = async (itemId, qty) => {
    const prevQty = quantities[itemId] || 0;
    setQuantities((q) => ({ ...q, [itemId]: qty }));
    setCartCount((c) => Math.max(0, c + (qty - prevQty)));
    if (!outlet?._id || !rawPhone) return;

    try {
      const fullItems = Object.entries({ ...quantities, [itemId]: qty })
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({ itemId: id, quantity: q }));

      const bookingMeta = {
        campaignId: campaign?._id,
        campaignName: campaign?.name,
        bookingDate: preBooking.date,
        bookingSlot: preBooking.slot?.startTime,
      };

      if (qty <= 0) {
        if (activeOrderId) {
          await cartApi.deleteItem({ orderId: activeOrderId, itemId, outletId: outlet._id, customerPhoneNo: rawPhone }, token).catch(() => { });
        }
      } else if (activeOrderId) {
        await cartApi.update({ orderId: activeOrderId, items: fullItems, outletId: outlet._id, deliveryType: preBooking.orderType, orderType: preBooking.orderType, ...bookingMeta }, token);
      } else {
        await cartApi.create({
          items: fullItems,
          deliveryType: preBooking.orderType,
          orderType: preBooking.orderType,
          customerName: customer?.name || customer?.customerName || "",
          customerPhoneNo: rawPhone,
          instruction: "",
          outletId: outlet._id,
          ...bookingMeta,
        }, token);
      }

      const detailsRes = await cartApi.getDetails(rawPhone, outlet._id, token);
      updateCartFromCarts(extractCarts(detailsRes));
    } catch { /* silent — local optimistic state already applied */ }
  };

  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0);
  const cartTotal = campaignCategories
    .flatMap((c) => c.items || [])
    .reduce((sum, it) => sum + (quantities[it._id] || 0) * (it.defaultSellingPrice ?? it.sellingPrice ?? 0), 0);

  if (!isStoreOpen) return <Navigate to="/closed" replace />;
  // Order type/date/slot must be chosen first — send the guest back to
  // Campaign Details (where the booking controls live) rather than
  // guessing or defaulting anything.
  if (!campaign || !preBooking.slot || !preBooking.orderType || !preBooking.date) {
    return <Navigate to={`/pre-booking/${campaignId}`} replace />;
  }

  return (
    <div className="ieyal min-h-screen w-full">
      <AppNavbar />
      <div className="pt-24 lg:pt-28 pb-28 lg:pb-16">
        <div className="max-w-desktop mx-auto px-5 space-y-6">
          <button onClick={() => navigate(`/pre-booking/${campaignId}`)} className="flex items-center gap-1.5 text-sm font-medium text-[var(--iy-ink-soft)] hover:text-[var(--iy-ink)] transition-colors">
            <ChevronLeft className="h-4 w-4" /> Change booking
          </button>

          <div className="animate-[iyFadeUp_.4s_ease-out] space-y-6">
            <SectionHeader
              eyebrow={campaign.name}
              title="Choose your dishes"
              subtitle={`${preBooking.date ? new Date(preBooking.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : ""} · ${preBooking.slot?.label || preBooking.slot?.startTime || ""} · ${preBooking.orderType}`}
            />

            {/* Banner section — sourced entirely from banner/get-active, never hardcoded */}
            {!loading && <BannerStrip banners={banners} className="h-32 lg:h-44" onBannerClick={(b) => openBannerLink(b, navigate)} />}

            {/* Offers strip — sourced entirely from discount/get-user-discounts */}
            {!loading && discounts?.length > 0 && (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
                {discounts.map((d) => <OfferCard key={d._id} offer={d} />)}
              </div>
            )}
          </div>
        </div>

        {/* Sticky category nav — pinned below the fixed AppNavbar, same
            pattern used on Home, kept independent per-page since Pre
            Booking's category set is scoped to the campaign, not the menu. */}
        {!loading && categoriesWithItems.length > 0 && (
          <div className="sticky top-16 lg:top-20 z-40 bg-[var(--iy-bg)]/95 backdrop-blur-md py-2 -my-2 mt-6">
            <div className="max-w-desktop mx-auto px-5">
              <div ref={chipsScrollRef} className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1 scroll-smooth">
                {categoriesWithItems.map((cat) => {
                  const active = activeCategory === cat._id;
                  return (
                    <button
                      key={cat._id}
                      ref={(el) => (chipRefs.current[cat._id] = el)}
                      onClick={() => scrollToCategory(cat._id)}
                      className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${active ? "bg-[var(--iy-accent)] text-white shadow-[var(--iy-shadow-sm)]" : "bg-white border border-[var(--iy-border)] text-[var(--iy-ink-soft)] hover:border-[var(--iy-accent)]/30 hover:text-[var(--iy-ink)]"
                        }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-desktop mx-auto px-5 space-y-6 mt-6">
          {loading && (
            <div className="space-y-8">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />)}
              </div>
              <ProductGridSkeleton count={6} />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-[24px] border border-danger/25 bg-danger/5 py-14 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-danger" />
              </div>
              <p className="text-[var(--iy-ink)] font-semibold">Couldn't load products for this booking</p>
              <p className="text-sm text-[var(--iy-ink-soft)] mt-1.5 max-w-sm mx-auto">{error}</p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={retry}
                  className="text-sm font-semibold text-[var(--iy-ink-soft)] hover:text-[var(--iy-ink)] underline underline-offset-2"
                >
                  Try again
                </button>
                <button
                  onClick={() => navigate(`/pre-booking/${campaignId}`)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--iy-accent)] hover:underline underline-offset-2"
                >
                  Change booking
                </button>
              </div>
            </div>
          )}

          {!loading && !error && totalItemCount === 0 && (
            <div className="rounded-[24px] border border-dashed border-[var(--iy-border)] bg-[var(--iy-surface)]/60 py-16 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-[var(--iy-accent-soft)] flex items-center justify-center mx-auto mb-4">
                <PackageSearch className="h-6 w-6 text-[var(--iy-accent)]" />
              </div>
              <p className="text-[var(--iy-ink)] font-semibold">No products available</p>
              <p className="text-sm text-[var(--iy-ink-soft)] mt-1.5 max-w-sm mx-auto">
                Nothing's up for grabs on this date and time slot yet. Try a different slot, or check back later.
              </p>
              <button
                onClick={() => navigate(`/pre-booking/${campaignId}`)}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--iy-accent)] hover:underline underline-offset-2"
              >
                Change date or time
              </button>
            </div>
          )}

          {!loading && !error && categoriesWithItems.length > 0 && (
            <div className="space-y-10">
              {categoriesWithItems.map((cat, i) => (
                <section
                  key={cat._id}
                  ref={(el) => (categoryRefs.current[cat._id] = el)}
                  className="scroll-mt-32 animate-[iyFadeUp_.4s_ease-out_both]"
                  style={{ animationDelay: `${Math.min(i, 4) * 60}ms` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="iy-serif text-lg lg:text-xl font-medium text-[var(--iy-ink)]">{cat.name}</h2>
                    <span className="h-px flex-1 bg-[var(--iy-border)]" />
                    <span className="text-xs font-medium text-[var(--iy-ink-soft)]">{cat.items.length} item{cat.items.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5">
                    {cat.items.map((item) => (
                      <ProductCard
                        key={item._id}
                        item={item}
                        qty={quantities[item._id] || 0}
                        onQtyChange={(q) => handleQtyChange(item._id, q)}
                        onClick={() => navigate(`/product/${item._id}`)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating cart bar — reuses the exact pattern from Home; routes to the EXISTING cart page */}
      {totalItems > 0 && (
        <div className="lg:hidden fixed bottom-4 left-0 right-0 z-30 px-4 animate-[iyFadeUp_.3s_ease-out]">
          <div className="w-full max-w-lg mx-auto flex items-center justify-between bg-[var(--iy-accent)] text-white rounded-full pl-5 pr-2 py-2 shadow-[var(--iy-shadow-glow)] font-semibold">
            <button onClick={() => navigate("/cart")} className="flex-1 flex items-center justify-between text-left pr-3">
              <span className="text-sm">{totalItems} item{totalItems > 1 ? "s" : ""} · View cart</span>
              <span className="tabular-nums text-sm flex items-center gap-1">{formatPrice(cartTotal)} <ArrowRight className="h-3.5 w-3.5" /></span>
            </button>
          </div>
        </div>
      )}
      {totalItems > 0 && (
        <div className="hidden lg:block fixed bottom-8 right-8 z-30 animate-[iyFadeUp_.3s_ease-out]">
          <button onClick={() => navigate("/cart")} className="flex items-center gap-4 bg-[var(--iy-accent)] text-white rounded-full pl-6 pr-5 py-3.5 shadow-[var(--iy-shadow-glow)] font-semibold">
            <span className="text-sm">{totalItems} item{totalItems > 1 ? "s" : ""} · View cart</span>
            <span className="tabular-nums text-sm border-l border-white/25 pl-4">{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
