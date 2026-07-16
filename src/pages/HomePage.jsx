import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ticket, Sparkles, Leaf, Search, Truck, ShoppingBag, CalendarClock,
  Trash2, MapPin, ArrowRight, ArrowUpRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BannerSkeleton, ProductGridSkeleton } from "@/pages/LoadingStates";
import { StoreStatusBadge } from "@/components/shared/StatusPill";
import { ProductCard } from "@/components/shared/ProductCard";
import { AppNavbar } from "@/components/layout/AppShell";
import SectionDivider from "@/components/shared/SectionDivider";
import { formatPrice } from "@/lib/theme";
import { cartApi, extractCarts } from "@/lib/api/services";
import useReveal from "@/hooks/useReveal";
import { motion } from "framer-motion";

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

/* Smart order-mode fork: delivery / pickup / book a table. Book a Table
   routes to its own flow since it needs date/time/guest inputs. */
function OrderModeBar({ orderType, setOrderType, isDeliveryAvailable, isPickupAvailable, onBookTable }) {
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
        <CalendarClock className="h-4 w-4" /> Book a table
      </button>
    </div>
  );
}

function OfferCard({ offer }) {
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
  } = useApp();
  const firstName = customer?.name?.split(" ")[0];
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState({});
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [vegOnly, setVegOnly] = useState(false);
  const categoryRefs = useRef({});

  const menuData = categories || [];

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
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
        const firstCart = carts?.[0];
        if (firstCart) {
          setActiveOrderId(firstCart.orderId || firstCart._id);
          const qMap = {};
          carts.forEach((cart) => {
            (cart.items || []).forEach((item) => {
              const id = item.product_retailer_id || item.itemId || item._id;
              if (id) qMap[id] = (qMap[id] || 0) + (item.quantity || 1);
            });
          });
          setQuantities(qMap);
        } else {
          setActiveOrderId(null);
          setQuantities({});
        }
      } catch { /* ignore */ }
    })();
  }, [token, customer, outlet?._id]);

  useEffect(() => {
    const total = Object.values(quantities).reduce((s, q) => s + q, 0);
    setCartCount(total);
  }, [quantities, setCartCount]);

  const scrollToCategory = (catId) => {
    setActiveCategory(catId);
    categoryRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
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

    try {
      if (qty <= 0) {
        // Removing item
        if (activeOrderId) {
          await cartApi.deleteItem({
            orderId: activeOrderId,
            itemid: itemId,
            outletId: outlet._id,
            customerPhoneNo: rawPhone,
            customerName: customer?.name || customer?.customerName || ""
          }, token).catch(() => { });
        }
      } else if (activeOrderId) {
        // Cart exists — always use update (it upserts items, even new ones)
        await cartApi.update(
          {
            orderId: activeOrderId,
            items: [{ itemId, quantity: qty }],
            outletId: outlet._id,
          },
          token
        );
      } else {
        // No cart yet — create a fresh one
        const savedAddrStr = localStorage.getItem("selectedAddress");
        const savedAddr = savedAddrStr ? JSON.parse(savedAddrStr) : null;
        const addressPayload = (savedAddr && (savedAddr.id || savedAddr._id))
          ? { addressId: savedAddr.id || savedAddr._id }
          : {
            address1: "Default",
            address2: "Default",
            city: "Default",
            state: "Default",
            country: "India",
            pincode: "000000",
            latitude: 10.777460,
            longitude: 79.634514
          };

        const payload = {
          items: [{ itemId, quantity: qty, variationId: "", addOnDetails: [], currency: "INR" }],
          deliveryType: orderType || "Door Delivery",
          orderType: orderType || "Door Delivery",
          customerName: customer?.name || customer?.customerName || "",
          customerPhoneNo: rawPhone,
          instruction: "",
          outletId: outlet._id,
          ...addressPayload
        };
        console.log("Creating cart with payload:", payload);
        const res = await cartApi.create(payload, token);
        // Extract the new orderId from any response shape
        const created = extractCarts(res);
        const newOrderId =
          created[0]?.orderId || created[0]?._id ||
          res?.data?.orderId || res?.data?._id ||
          res?.orderId || res?._id;
        if (newOrderId) setActiveOrderId(newOrderId);
      }

      // Always re-sync quantities from backend after any mutation
      const detailsRes = await cartApi.getDetails(rawPhone, outlet._id, token);
      const carts = extractCarts(detailsRes);
      const firstCart = carts?.[0];
      if (firstCart) {
        setActiveOrderId(firstCart.orderId || firstCart._id);
        const qMap = {};
        carts.forEach((cart) => {
          (cart.items || []).forEach((item) => {
            const id = item.product_retailer_id || item.itemId || item._id;
            if (id) qMap[id] = (qMap[id] || 0) + (item.quantity || 1);
          });
        });
        setQuantities(qMap);
      }
    } catch { /* silent — local optimistic state is already set */ }
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
                {outlet?.outletName || "Selected Outlet"}
              </span>
            </button>
            <StoreStatusBadge isOpen={isStoreOpen} />
          </div>

          {/* Search */}
          <SearchEntry value={searchQuery} onChange={setSearchQuery} />

          {/* Delivery / Pickup / Book a table */}
          <OrderModeBar
            orderType={orderType}
            setOrderType={setOrderType}
            isDeliveryAvailable={isDeliveryAvailable}
            isPickupAvailable={isPickupAvailable}
            onBookTable={() => navigate("/book-table")}
          />

          {/* Offers Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          >
            {loading ? (
              <div className="rounded-3xl overflow-hidden shadow-[var(--iy-shadow-xs)]">
                <BannerSkeleton />
              </div>
            ) : banners?.length > 0 ? (
              <div className="relative rounded-3xl overflow-hidden shadow-[var(--iy-shadow-sm)]">
                <img src={banners[0]?.image?.mobileView || banners[0]?.imageUrl} alt="Promo" className="w-full h-36 lg:h-64 object-cover" />
              </div>
            ) : (
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
            )}
          </motion.div>

          {/* Offers strip */}
          {discounts?.length > 0 && (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
              {discounts.map((d) => <OfferCard key={d._id} offer={d} />)}
            </div>
          )}
        </div>

        <SectionDivider variant="gradient" />

        {/* Categories — horizontal, real data, replaces the old sidebar rail */}
        {menuData.length > 0 && (
          <div className="max-w-desktop mx-auto px-5">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
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
        )}

        {/* Popular / Recommended — grouped by category, driven entirely by
            the categories API response (no invented "popular" endpoint). */}
        <div className="max-w-desktop mx-auto px-5 mt-6 animate-[iyFadeUp_.3s_ease-out]">
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : menuData.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-[var(--iy-border)] bg-white/60">
              <p className="text-[var(--iy-ink-soft)]">No products available right now.</p>
            </div>
          ) : (
            <div className="space-y-10">
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
            </div>
          )}
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
    </div>
  );
}
