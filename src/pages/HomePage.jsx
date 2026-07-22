import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Leaf, Search, Truck, ShoppingBag, CalendarClock, CalendarPlus,
  Trash2, MapPin, ArrowRight, ArrowUpRight, X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BannerSkeleton, ProductGridSkeleton } from "@/pages/LoadingStates";
import { StoreStatusBadge } from "@/components/shared/StatusPill";
import { ProductCard } from "@/components/shared/ProductCard";
import { OfferCard } from "@/components/shared/OfferCard";
import { AppNavbar } from "@/components/layout/AppShell";
import SectionDivider from "@/components/shared/SectionDivider";
import BannerCarousel from "@/components/shared/BannerCarousel";
import { formatPrice } from "@/lib/theme";
import { cartApi, extractCarts } from "@/lib/api/services";
import useReveal from "@/hooks/useReveal";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui";

/* ────────────────────────────────────────────────────────────────────────
   HomePage — the authenticated Home experience.

   Every API integration, hook, and mutation below is unchanged from the
   original implementation (see HomePage.functional.backup.jsx for the
   pre-redesign version, diffed against this file): banners/categories/
   discounts from AppContext, the cart sync effect, handleAddToCart,
   handleClearCart, the filteredCategories/cartTotal/totalItems derivations.
   Only the presentation layer changed — it now lives under the `.ieyal`
   brand scope, drops the dashboard-style sidebar, and reuses SiteNavbar so
   this reads as a continuation of the public site rather than a separate
   admin-feeling surface.
   ──────────────────────────────────────────────────────────────────── */

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* Search entry field — inline search without navigating away. */
function SearchEntry({ value, onChange }) {
  return (
    <div className="w-full flex items-center gap-2.5 rounded-full border border-[var(--iy-border)] bg-white px-5 py-2.5 shadow-[var(--iy-shadow-xs)] focus-within:shadow-[var(--iy-shadow-sm)] focus-within:border-[var(--iy-accent)]/25 transition-all duration-300">
      <Search className="h-4 w-4 text-[var(--iy-ink-soft)] shrink-0" />
      <input
        type="text"
        placeholder="Search dishes, categories…"
        className="flex-1 bg-transparent text-sm text-[var(--iy-ink)] outline-none placeholder:text-[var(--iy-ink-soft)] h-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* Smart order-mode fork: delivery / pickup / dine in. Dine In
   routes to its own flow since it needs date/time/guest inputs. Pre
   Booking is a fifth, backend-controlled entry — only rendered when
   settings.preBookingEnabled is true (see AppContext.isPreBookingEnabled).
   No hardcoded on/off logic here at all. */
function OrderModeBar({ orderType, setOrderType, isDeliveryAvailable, isPickupAvailable, onBookTable, isPreBookingEnabled, onPreBooking }) {
  const modes = [
    isDeliveryAvailable && { key: "Door Delivery", label: "Delivery", icon: Truck },
    isPickupAvailable && { key: "Self Pickup", label: "Pickup", icon: ShoppingBag },
  ].filter(Boolean);

  if (modes.length === 0) return null;

  return (
    <div className="flex gap-2">
      {modes.map(({ key, label, icon: Icon }) => {
        const active = orderType === key;
        return (
          <button
            key={key}
            onClick={() => setOrderType(key)}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-full border text-sm font-semibold transition-all duration-300 ${active
              ? "bg-[var(--iy-accent)] text-white border-[var(--iy-accent)] shadow-[var(--iy-shadow-sm)]"
              : "border-[var(--iy-border)] bg-white text-[var(--iy-ink-soft)] hover:border-[var(--iy-accent)]/30 hover:text-[var(--iy-ink)]"
              }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        );
      })}
      <button
        onClick={onBookTable}
        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full border border-[var(--iy-border)] bg-white text-sm font-semibold text-[var(--iy-ink-soft)] hover:border-[var(--iy-accent)]/30 hover:text-[var(--iy-ink)] transition-all duration-300"
      >
        <CalendarClock className="h-4 w-4" /> Dine in
      </button>
      {isPreBookingEnabled && (
        <button
          onClick={onPreBooking}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full border border-[var(--iy-border)] bg-white text-sm font-semibold text-[var(--iy-ink-soft)] hover:border-[var(--iy-accent)]/30 hover:text-[var(--iy-ink)] transition-all duration-300"
        >
          <CalendarPlus className="h-4 w-4" /> Pre Book
        </button>
      )}
    </div>
  );
}

/* Continue Browsing — real cart state (quantities > 0), not sample data.
   Lets a returning visitor pick up where they left off instead of
   re-searching the whole menu. */
function ContinueBrowsingStrip({ items, onOpenCart }) {
  const ref = useReveal();
  if (items.length === 0) return null;
  return (
    <section className="iy-reveal max-w-desktop mx-auto px-5 pt-2" ref={ref}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="iy-serif text-xl lg:text-2xl font-medium text-[var(--iy-ink)]">Continue Browsing</h2>
        <button onClick={onOpenCart} className="flex items-center gap-1 text-sm font-semibold text-[var(--iy-accent)] hover:gap-1.5 transition-all">
          View cart <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
        {items.map(({ item, qty }) => (
          <button
            key={item._id}
            onClick={onOpenCart}
            className="shrink-0 w-40 rounded-2xl border border-[var(--iy-border)] bg-white p-3 text-left shadow-[var(--iy-shadow-xs)] hover:shadow-[var(--iy-shadow-sm)] hover:-translate-y-1 transition-all duration-300"
          >
            <div className="h-20 w-full rounded-xl bg-[var(--iy-bg)] overflow-hidden mb-2">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xl">🍽️</div>
              )}
            </div>
            <p className="text-xs font-semibold truncate text-[var(--iy-ink)]">{item.name}</p>
            <p className="text-[11px] text-[var(--iy-ink-soft)] mt-0.5">Qty {qty} in cart</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const {
    banners, categories, discounts, setCartCount, isStoreOpen, customer, outlet, token, belongsTo,
    orderType, setOrderType, isDeliveryAvailable, isPickupAvailable, isLoggedIn,
    quantities, setQuantities, activeOrderId, setActiveOrderId, updateCartFromCarts, settings, userLocation,
    isPreBookingEnabled,
  } = useApp();
  const firstName = customer?.name?.split(" ")[0];
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  // Shared cart states managed by AppContext
  const [vegOnly, setVegOnly] = useState(false);
  const categoryRefs = useRef({});
  // Sticky category bar: refs for auto-centering the active chip within the
  // horizontal scroller (behavior-only addition, no visual/style changes).
  const chipRefs = useRef({});
  const chipsScrollRef = useRef(null);

  const menuData = categories || [];

  useEffect(() => {
    // Shortened from the previous fixed 800ms — this only gates the
    // lightweight skeleton placeholders below (categories/products/promo
    // strip), never the Welcome Card, which now renders independently.
    const t = setTimeout(() => setLoading(false), 350);
    if (menuData.length) setActiveCategory(menuData[0]._id);
    return () => clearTimeout(t);
  }, [menuData]);

  // Sync existing cart quantities and orderId when HomePage mounts
  useEffect(() => {
    const phone = customer?.phone || customer?.phoneNo || customer?.mobileNumber || "";
    if (!token || !phone || !outlet?._id) return;
    (async () => {
      try {
        const res = await cartApi.getDetails(phone, outlet._id, token);
        const carts = extractCarts(res);
        updateCartFromCarts(carts);
      } catch { /* ignore */ }
    })();
  }, [token, customer, outlet?._id, updateCartFromCarts]);

  useEffect(() => {
    const total = Object.values(quantities).reduce((s, q) => s + q, 0);
    setCartCount(total);
  }, [quantities, setCartCount]);

  const scrollToCategory = (catId) => {
    setActiveCategory(catId);
    categoryRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Keep the selected category chip visible within the horizontal chip list
  // (centers it in the scroller) — pure UX behavior, no layout/style change.
  useEffect(() => {
    const chipEl = chipRefs.current[activeCategory];
    const container = chipsScrollRef.current;
    if (!chipEl || !container) return;
    const target = chipEl.offsetLeft - container.clientWidth / 2 + chipEl.offsetWidth / 2;
    container.scrollTo({ left: Math.max(target, 0), behavior: "smooth" });
  }, [activeCategory]);

  const sortedBanners = [...(banners || [])].sort((a, b) => (a.rank || 0) - (b.rank || 0));

  const handleBannerClick = (banner) => {
    if (!banner) return;

    let hasAction = false;
    const targetLink = banner.link || banner.url;

    if (banner.type === "category" && (banner.categoryId || banner.referenceId)) {
      scrollToCategory(banner.categoryId || banner.referenceId);
      hasAction = true;
    } else if (banner.type === "item" && (banner.itemId || banner.referenceId)) {
      navigate(`/product/${banner.itemId || banner.referenceId}`);
      hasAction = true;
    } else if (targetLink) {
      try {
        const urlStr = targetLink;
        if (urlStr.startsWith("/")) {
          navigate(urlStr);
          hasAction = true;
        } else {
          const urlObj = new URL(urlStr, window.location.origin);
          if (urlObj.origin === window.location.origin) {
            navigate(urlObj.pathname + urlObj.search + urlObj.hash);
            hasAction = true;
          } else {
            // External URL
            if (window.Telegram?.WebApp?.openLink) {
              window.Telegram.WebApp.openLink(urlStr);
            } else {
              window.open(urlStr, "_blank", "noopener,noreferrer");
            }
            hasAction = true;
          }
        }
      } catch (error) {
        console.error("Invalid banner URL:", error);
      }
    }

    if (hasAction) {
      setIsBannerDismissed(true);
    }
  };

  const filteredCategories = menuData
    .map((cat) => {
      const q = searchQuery.toLowerCase();
      const items = (cat.items || []).filter((item) => {
        const isVeg = !vegOnly || item.dietryType === "veg" || item.dietryType === "Veg";
        if (!isVeg) return false;
        if (!q) return true;
        return item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q);
      });
      return { ...cat, items };
    })
    .filter((cat) => {
      // Hide empty categories when filtering to reduce noise
      if (!searchQuery && !vegOnly) return true;
      return cat.items.length > 0;
    });

  const cartTotal = Object.entries(quantities).reduce((sum, [id, qty]) => {
    const item = menuData.flatMap((c) => c.items || []).find((i) => i._id === id);
    return sum + (item ? (item.sellingPrice || item.basePrice) * qty : 0);
  }, 0);

  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0);

  const continueBrowsingItems = Object.entries(quantities)
    .map(([id, qty]) => ({ item: menuData.flatMap((c) => c.items || []).find((i) => i._id === id), qty }))
    .filter((entry) => entry.item);

  // Serialize cart mutations so rapid taps don't cause race conditions
  const cartMutexRef = useRef(Promise.resolve());
  // Keep a ref to latest quantities so the mutex chain always reads fresh state
  const quantitiesRef = useRef(quantities);
  quantitiesRef.current = quantities;

  const handleAddToCart = async (itemId, qty) => {
    const prevQty = quantities[itemId] || 0;
    setQuantities((prev) => {
      const next = { ...prev, [itemId]: qty };
      if (qty <= 0) delete next[itemId];
      return next;
    });

    if (!token || !outlet?._id) return;
    // Normalize phone: always send as stored (backend handles prefix)
    const rawPhone = customer?.phone || customer?.phoneNo || customer?.mobileNumber || "";

    // Chain onto the mutex so concurrent adds run sequentially
    cartMutexRef.current = cartMutexRef.current.then(async () => {
      try {
        // Build the full items list from the latest quantities ref
        // (avoids stale closure — quantitiesRef.current is always fresh)
        const latestQuantities = { ...quantitiesRef.current, [itemId]: qty };
        if (qty <= 0) delete latestQuantities[itemId];
        const fullItems = Object.entries(latestQuantities).map(([id, q]) => ({
          itemId: id,
          quantity: q,
          variationId: "",
          addOnDetails: []
        }));

        // Shared address payload
        const savedAddrStr = localStorage.getItem("selectedAddress");
        const savedAddr = savedAddrStr ? JSON.parse(savedAddrStr) : null;
        const validLat = savedAddr?.latitude && !isNaN(Number(savedAddr.latitude)) ? Number(savedAddr.latitude) : 10.777460;
        const validLng = savedAddr?.longitude && !isNaN(Number(savedAddr.longitude)) ? Number(savedAddr.longitude) : 79.634514;
        const addressPayload = (savedAddr && (savedAddr.id || savedAddr._id))
          ? { addressId: savedAddr.id || savedAddr._id }
          : {
            address1: "Default",
            address2: "Default",
            city: "Default",
            state: "Default",
            country: "India",
            pincode: "000000",
            latitude: validLat,
            longitude: validLng
          };

        if (qty <= 0) {
          // Removing item
          if (activeOrderId) {
            await cartApi.deleteItem({
              orderId: activeOrderId,
              itemId: itemId,
              outletId: outlet._id,
              customerPhoneNo: rawPhone,
              customerName: customer?.name || customer?.customerName || ""
            }, token).catch(() => { });
          }
        } else if (activeOrderId) {
            // For update
            await cartApi.update(
              {
                orderId: activeOrderId,
                items: fullItems,
                outletId: outlet._id,
                deliveryType: orderType || "Door Delivery",
                orderType: orderType || "Door Delivery",
                ...addressPayload
              },
              token
            );
        } else {
          // No cart yet — create a fresh one
            const createPayload = {
              items: fullItems,
              deliveryType: orderType || "Door Delivery",
              orderType: orderType || "Door Delivery",
              customerName: customer?.name || customer?.customerName || "",
              customerPhoneNo: rawPhone,
              instruction: "",
              outletId: outlet._id,
              ...addressPayload
            };
            console.log("Creating cart with payload:", createPayload);
            await cartApi.create(createPayload, token);
        }

        // Always re-fetch the full cart after any mutation so we get
        // ALL items — the create/update response is partial and would
        // overwrite quantities for items not in the response.
        const detailsRes = await cartApi.getDetails(rawPhone, outlet._id, token);
        const carts = extractCarts(detailsRes);
        updateCartFromCarts(carts);
      } catch { /* silent — local optimistic state is already set */ }
    });
  };

  const handleClearCart = async (e) => {
    e.stopPropagation();
    const currentQtyKeys = Object.keys(quantities);
    if (currentQtyKeys.length === 0) return;
    const snapshot = { ...quantities };
    setQuantities({});
    setCartCount(0);
    if (!token || !outlet?._id || !activeOrderId) return;
    try {
      for (const itemId of currentQtyKeys) {
        await cartApi.deleteItem({ orderId: activeOrderId, itemId, outletId: outlet._id }, token).catch(() => { });
      }
    } catch {
      setQuantities(snapshot);
      setCartCount(Object.values(snapshot).reduce((s, q) => s + q, 0));
    }
  };

  const heroRef = useReveal();

  return (
    <div className="ieyal min-h-screen w-full">
      <AppNavbar />

      <div className="pt-24 lg:pt-28 pb-28 lg:pb-16">
        <div className="max-w-desktop mx-auto px-5 space-y-5">

          {/* Current Outlet */}
          <div className="flex items-center justify-between">
            <button
              className="flex items-center gap-2 text-sm text-[var(--iy-ink-soft)] hover:text-[var(--iy-ink)] transition-colors group"
              title="Outlet selection isn't wired up on this pass"
            >
              <MapPin className="h-4 w-4 text-[var(--iy-accent)] shrink-0" />
              <span className="truncate max-w-[220px] font-medium text-[var(--iy-ink)]">
                {userLocation?.formatted_address || outlet?.outletName || "Selected Outlet"}
              </span>
            </button>
            <StoreStatusBadge isOpen={isStoreOpen} />
          </div>

          {/* Search */}
          <SearchEntry value={searchQuery} onChange={setSearchQuery} />

          {/* Delivery / Pickup / Dine In */}
          <OrderModeBar
            orderType={orderType}
            setOrderType={setOrderType}
            isDeliveryAvailable={isDeliveryAvailable}
            isPickupAvailable={isPickupAvailable}
            onBookTable={() => navigate("/book-table")}
            isPreBookingEnabled={isPreBookingEnabled}
            onPreBooking={() => navigate("/pre-booking")}
          />

          {/* Welcome Card — renders immediately on mount. `customer` is
              hydrated synchronously from localStorage in AppContext and
              `outlet` resolves independently, so this never needs to wait
              on the categories/banners fetch (the source of the old delay).
              Falls back to a generic subtitle until outlet name is ready —
              same reserved height either way, so no layout shift. */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 90, damping: 16, mass: 0.7 }}
          >
            <div className="relative rounded-3xl overflow-hidden bg-[var(--iy-ink)] p-6 lg:p-10 text-white shadow-[var(--iy-shadow-md)]">
              <div className="iy-drift-slow pointer-events-none absolute -top-10 -right-10 h-40 w-40 lg:h-56 lg:w-56 rounded-full bg-[var(--iy-accent)]/25 blur-3xl" />
              <Sparkles className="relative h-5 w-5 lg:h-6 lg:w-6 mb-2 text-[var(--iy-accent)]" />
              <p className="relative iy-serif font-medium text-lg lg:text-3xl">
                {timeGreeting()}{firstName ? `, ${firstName}` : ""}
              </p>
              <p className="relative text-sm lg:text-base text-white/70 mt-1">
                {outlet?.outletName ? `Ordering from ${outlet.outletName}` : "Fresh food, fast delivery"}
              </p>
            </div>
          </motion.div>

          {/* Promo banner strip — still uses a skeleton while secondary
              (non-blocking) data settles, independent of the Welcome Card. */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading-banner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl overflow-hidden shadow-[var(--iy-shadow-xs)]"
              >
                <BannerSkeleton />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Offers strip */}
          {discounts?.length > 0 && (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
              {discounts.map((d) => <OfferCard key={d._id} offer={d} />)}
            </div>
          )}
        </div>

        <SectionDivider variant="gradient" />

        {/* Categories — horizontal, real data, replaces the old sidebar rail.
            Wrapped in a plain (non-animated) sticky container so it becomes
            pinned immediately below the fixed AppNavbar once scrolled past,
            without breaking CSS position:sticky via framer-motion transforms.
            z-40 keeps it stacked under the navbar's z-50 at all times. */}
        <div className="sticky top-16 lg:top-20 z-40 bg-[var(--iy-bg)]/95 backdrop-blur-md py-2 -my-2">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="categories-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-desktop mx-auto px-5"
              >
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
                  <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                  <Skeleton className="h-8 w-20 rounded-full shrink-0" />
                  <Skeleton className="h-8 w-28 rounded-full shrink-0" />
                  <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                  <Skeleton className="h-8 w-20 rounded-full shrink-0" />
                </div>
              </motion.div>
            ) : (
              menuData.length > 0 && (
                <motion.div
                  key="categories-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-desktop mx-auto px-5"
                >
                  <div ref={chipsScrollRef} className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1 scroll-smooth">
                    <button
                      onClick={() => setVegOnly(!vegOnly)}
                      className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300 ${vegOnly ? "bg-[var(--iy-accent-soft)] border-[var(--iy-accent)]/40 text-[var(--iy-accent-dark)]" : "border-[var(--iy-border)] text-[var(--iy-ink-soft)] hover:border-[var(--iy-accent)]/30"
                        }`}
                    >
                      <Leaf className="h-3.5 w-3.5" /> Veg only
                    </button>
                    {filteredCategories.map((cat) => {
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
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Popular / Recommended — grouped by category, driven entirely by
            the categories API response (no invented "popular" endpoint). */}
        <div className="max-w-desktop mx-auto px-5 mt-6 animate-[iyFadeUp_.3s_ease-out]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="products-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-10"
              >
                <section className="scroll-mt-40">
                  <Skeleton className="h-7 w-48 mb-4 rounded-md bg-border/40" />
                  <ProductGridSkeleton count={6} />
                </section>
              </motion.div>
            ) : menuData.length === 0 ? (
              <motion.div
                key="products-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-center py-16 rounded-3xl border border-dashed border-[var(--iy-border)] bg-white/60"
              >
                <p className="text-[var(--iy-ink-soft)]">No products available right now.</p>
              </motion.div>
            ) : (
              <motion.div
                key="products-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-10"
              >
                {filteredCategories.map((cat) => (
                  <section key={cat._id} ref={(el) => (categoryRefs.current[cat._id] = el)} className="scroll-mt-40">
                    <h2 className="iy-serif text-xl lg:text-2xl font-medium text-[var(--iy-ink)] mb-4">{cat.name}</h2>
                    <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5">
                      {(cat.items || []).map((item) => (
                        <ProductCard
                          key={item._id}
                          item={item}
                          qty={quantities[item._id] || 0}
                          onQtyChange={(q) => handleAddToCart(item._id, q)}
                          onClick={() => navigate(`/product/${item._id}`)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Continue Browsing — resumes from real cart state */}
        <div className="mt-10">
          <ContinueBrowsingStrip items={continueBrowsingItems} onOpenCart={() => navigate("/cart")} />
        </div>
      </div>

      {/* Floating cart bar — mobile */}
      {totalItems > 0 && (
        <div className="lg:hidden fixed bottom-4 left-0 right-0 z-30 px-4 animate-[iyFadeUp_.3s_ease-out]">
          <div className="w-full max-w-lg mx-auto flex items-center justify-between bg-[var(--iy-accent)] text-white rounded-full pl-5 pr-2 py-2 shadow-[var(--iy-shadow-glow)] font-semibold">
            <button onClick={() => navigate("/cart")} className="flex-1 flex items-center justify-between text-left pr-3">
              <span className="text-sm">{totalItems} item{totalItems > 1 ? "s" : ""} · View cart</span>
              <span className="tabular-nums text-sm flex items-center gap-1">{formatPrice(cartTotal)} <ArrowRight className="h-3.5 w-3.5" /></span>
            </button>
            <button
              onClick={handleClearCart}
              title="Clear cart / Unselect all"
              className="pl-3 border-l border-white/25 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating cart bar — desktop */}
      {totalItems > 0 && (
        <div className="hidden lg:block fixed bottom-8 right-8 z-30 animate-[iyFadeUp_.3s_ease-out]">
          <div className="flex items-center gap-4 bg-[var(--iy-accent)] text-white rounded-full pl-6 pr-3 py-3.5 shadow-[var(--iy-shadow-glow)] font-semibold">
            <button onClick={() => navigate("/cart")} className="flex items-center gap-4 text-left">
              <span className="text-sm">{totalItems} item{totalItems > 1 ? "s" : ""} · View cart</span>
              <span className="tabular-nums text-sm border-l border-white/25 pl-4">{formatPrice(cartTotal)}</span>
            </button>
            <button
              onClick={handleClearCart}
              title="Clear cart / Unselect all"
              className="p-2 rounded-full border-l border-white/25 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Banner Popup Overlay */}
      <AnimatePresence>
        {!loading && !isBannerDismissed && sortedBanners.length > 0 && settings?.banner?.enable !== false && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsBannerDismissed(true)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <BannerCarousel
                banners={sortedBanners}
                autoPlay={!!settings?.banner?.autoScroll}
                roundedClassName="rounded-3xl"
                className="shadow-2xl"
                renderBanner={(banner) => (
                  <div
                    className="relative w-full h-full cursor-pointer bg-white"
                    onClick={() => handleBannerClick(banner)}
                  >
                    <picture>
                      {(banner.image?.webView || banner.imageUrl) && (
                        <source media="(min-width: 1024px)" srcSet={banner.image?.webView || banner.imageUrl} />
                      )}
                      <img
                        src={banner.image?.mobileView || banner.image?.webView || banner.imageUrl}
                        alt="Promo"
                        draggable={false}
                        className="w-full h-auto max-h-[70vh] object-contain"
                      />
                    </picture>
                  </div>
                )}
              />
              {/* Cancel Button */}
              <button
                onClick={() => setIsBannerDismissed(true)}
                className="absolute -top-4 -right-4 bg-white text-[var(--iy-ink)] p-2 rounded-full z-10 hover:bg-gray-100 transition-colors shadow-lg"
                aria-label="Dismiss banner"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
