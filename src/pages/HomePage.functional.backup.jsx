import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Sparkles, Leaf, Search, Truck, ShoppingBag, CalendarClock, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PageShell } from "@/components/layout/AppShell";
import { BannerSkeleton, ProductGridSkeleton } from "@/pages/LoadingStates";
import { VegDot } from "@/components/shared/VegDot";
import { Price } from "@/components/shared/Price";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { formatPrice } from "@/lib/theme";
import { cartApi, extractCarts } from "@/lib/api/services";

/* Tappable search entry — routes to the real search page instead of being
   a decorative bar. First name of day / time-aware greeting keeps the
   hero feeling alive instead of a static "Welcome back!" every visit. */
function SearchEntry({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 rounded-btn border border-border bg-surface px-4 py-3 text-left shadow-xs hover:border-border-strong hover:shadow-sm2 transition-all"
    >
      <Search className="h-4 w-4 text-faint shrink-0" />
      <span className="text-sm text-faint">Search dishes, categories…</span>
    </button>
  );
}

/* Smart order-mode bar — the "what do you want to do" fork every food app
   needs up front: get it delivered, pick it up yourself, or reserve a table
   and dine in. Book a Table routes to its own flow since it needs date/time/
   guest inputs that don't fit the cart model. */
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
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-btn border text-sm font-semibold transition-all ${
              active ? "bg-primary text-white border-primary shadow-sm2" : "border-border bg-surface text-muted hover:border-border-strong"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        );
      })}
      <button
        onClick={onBookTable}
        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-btn border border-border bg-surface text-sm font-semibold text-muted hover:border-border-strong hover:text-[var(--color-text)] transition-all"
      >
        <CalendarClock className="h-4 w-4" /> Book a table
      </button>
    </div>
  );
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function OfferCard({ offer }) {
  const eligible = offer.eligible !== false;
  return (
    <div className={`shrink-0 w-56 lg:w-64 rounded-card border p-3 lg:p-4 ${eligible ? "border-primary/30 bg-primary/5" : "border-border bg-surface opacity-70"}`}>
      <div className="flex items-start gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Ticket className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{offer.name}</p>
          <p className="text-[10px] text-muted mt-0.5">
            {eligible ? "Tap to apply" : "Add more items to unlock"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Mobile: horizontal row card. Desktop: vertical grid card. Same data, same
   interactions — only the layout direction changes at the lg breakpoint. */
function ProductCard({ item, qty, onQtyChange, onClick }) {
  return (
    <div className="flex lg:flex-col gap-3 lg:gap-0 p-3 lg:p-0 rounded-card lg:rounded-lg2 bg-surface border border-border/60 shadow-premium card-hover overflow-hidden">
      <button onClick={onClick} className="h-20 w-20 lg:h-40 lg:w-full rounded-xl lg:rounded-none bg-[var(--color-bg)] shrink-0 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-2xl lg:text-4xl">🍽️</div>
        )}
      </button>
      <div className="flex-1 min-w-0 flex flex-col lg:p-4">
        <button onClick={onClick} className="text-left">
          <div className="flex items-center gap-1.5">
            <VegDot type={item.dietryType} />
            <p className="text-sm lg:text-[15px] font-semibold truncate">{item.name}</p>
          </div>
          <p className="text-xs text-muted line-clamp-2 mt-0.5">{item.description}</p>
          <Price basePrice={item.basePrice} sellingPrice={item.sellingPrice} size="sm" className="mt-1" />
        </button>
        <div className="mt-auto pt-2 flex justify-end">
          <QuantityStepper value={qty} onChange={onQtyChange} size="sm" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const {
    banners, categories, discounts, setCartCount, isStoreOpen, customer, outlet, token, belongsTo,
    orderType, setOrderType, isDeliveryAvailable, isPickupAvailable,
  } = useApp();
  const firstName = customer?.name?.split(" ")[0];
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
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
              const id = item.itemId || item._id;
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

  const filteredCategories = menuData.map((cat) => ({
    ...cat,
    items: (cat.items || []).filter((item) => !vegOnly || item.dietryType === "veg" || item.dietryType === "Veg"),
  }));

  const cartTotal = Object.entries(quantities).reduce((sum, [id, qty]) => {
    const item = menuData.flatMap((c) => c.items || []).find((i) => i._id === id);
    return sum + (item ? (item.sellingPrice || item.basePrice) * qty : 0);
  }, 0);

  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0);

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
          await cartApi.deleteItem({ orderId: activeOrderId, itemId, outletId: outlet._id }, token).catch(() => {});
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
        const res = await cartApi.create({
          items: [{ itemId, quantity: qty, variationId: "", addOnDetails: [], currency: "INR" }],
          deliveryType: orderType || "Door Delivery",
          orderType: orderType || "Door Delivery",
          customerName: customer?.name || customer?.customerName || "",
          customerPhoneNo: rawPhone,
          instruction: "",
          addressId: "",
          outletId: outlet._id,
        }, token);
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
            const id = item.itemId || item._id;
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
        await cartApi.deleteItem({ orderId: activeOrderId, itemId, outletId: outlet._id }, token).catch(() => {});
      }
    } catch {
      setQuantities(snapshot);
      setCartCount(Object.values(snapshot).reduce((s, q) => s + q, 0));
    }
  };

  return (
    <PageShell title="OwnCart">
      <div className="px-4 lg:px-0 pt-4 lg:pt-0 space-y-4 lg:space-y-6">
        {/* Search entry — real tap target, not decoration */}
        <SearchEntry onClick={() => navigate("/search")} />

        {/* Smart order-mode fork: delivery / pickup / book a table */}
        <OrderModeBar
          orderType={orderType}
          setOrderType={setOrderType}
          isDeliveryAvailable={isDeliveryAvailable}
          isPickupAvailable={isPickupAvailable}
          onBookTable={() => navigate("/book-table")}
        />

        {/* Banner */}
        {loading ? (
          <BannerSkeleton />
        ) : banners?.length > 0 ? (
          <div className="relative rounded-card lg:rounded-lg2 overflow-hidden shadow-premium">
            <img src={banners[0]?.image?.mobileView || banners[0]?.imageUrl} alt="Promo" className="w-full h-36 lg:h-64 object-cover" />
          </div>
        ) : (
          <div className="relative rounded-card lg:rounded-lg2 overflow-hidden gradient-hero p-5 lg:p-10 text-white shadow-premium">
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 lg:h-56 lg:w-56 rounded-full bg-white/10 blur-3xl" />
            <Sparkles className="relative h-5 w-5 lg:h-6 lg:w-6 mb-2 opacity-80" />
            <p className="relative font-semibold text-base lg:text-2xl">
              {timeGreeting()}{firstName ? `, ${firstName}` : ""} 👋
            </p>
            <p className="relative text-sm lg:text-base opacity-90 mt-0.5">
              {outlet?.outletName ? `Ordering from ${outlet.outletName}` : "Fresh food, fast delivery"}
            </p>
          </div>
        )}

        {/* Offers strip */}
        {discounts?.length > 0 && (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
            {discounts.map((d) => (
              <OfferCard key={d._id} offer={d} />
            ))}
          </div>
        )}

        {/* Desktop: two-column layout — sticky category rail + product grid.
            Mobile: sticky horizontal chip row above a single-column list. */}
        <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-8 lg:items-start">
          {menuData.length > 0 && (
            <>
              {/* Mobile chip row */}
              <div className="lg:hidden sticky top-[172px] z-20 -mx-4 px-4 py-2 glass">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                  <button
                    onClick={() => setVegOnly(!vegOnly)}
                    className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${vegOnly ? "bg-success/10 border-success text-success" : "border-border text-muted"}`}
                  >
                    <Leaf className="h-3 w-3" /> Veg only
                  </button>
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => scrollToCategory(cat._id)}
                      className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat._id ? "bg-primary text-white shadow-sm2" : "bg-surface border border-border text-muted"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop vertical category rail */}
              <div className="hidden lg:block sticky top-24 space-y-1">
                <button
                  onClick={() => setVegOnly(!vegOnly)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-medium transition-all mb-3 ${vegOnly ? "bg-success/10 text-success" : "text-muted hover:bg-[var(--color-bg)]"}`}
                >
                  <Leaf className="h-4 w-4" /> Veg only
                </button>
                {filteredCategories.map((cat) => {
                  const active = activeCategory === cat._id;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => scrollToCategory(cat._id)}
                      className={`relative w-full text-left pl-3.5 pr-3 py-2 rounded-btn text-sm font-medium transition-all flex items-center justify-between gap-2 ${
                        active ? "bg-primary/10 text-primary" : "text-muted hover:bg-[var(--color-bg)]"
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary" />}
                      <span className="truncate">{cat.name}</span>
                      <span className={`text-xs tabular-nums shrink-0 ${active ? "text-primary/70" : "text-faint"}`}>
                        {(cat.items || []).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Menu listing */}
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : menuData.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted">No products available</p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {filteredCategories.map((cat) => (
                <section key={cat._id} ref={(el) => (categoryRefs.current[cat._id] = el)}>
                  <h2 className="text-base lg:text-lg font-bold mb-3 lg:mb-4 sticky top-[220px] lg:static z-10 bg-[var(--color-bg)]/90 lg:bg-transparent py-1">
                    {cat.name}
                  </h2>
                  <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
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
      </div>

      {/* Floating cart bar — mobile only; desktop shows cart count in the top bar instead */}
      {totalItems > 0 && (
        <div className="lg:hidden fixed bottom-20 left-0 right-0 z-30 px-4 animate-slide-up">
          <div className="w-full max-w-lg mx-auto flex items-center justify-between bg-primary text-white rounded-card px-4 py-3.5 shadow-glow font-semibold">
            <button
              onClick={() => navigate("/cart")}
              className="flex-1 flex items-center justify-between text-left pr-3"
            >
              <span>{totalItems} item{totalItems > 1 ? "s" : ""} · View cart</span>
              <span className="tabular-nums">{formatPrice(cartTotal)}</span>
            </button>
            <button
              onClick={handleClearCart}
              title="Clear cart / Unselect all"
              className="pl-3 border-l border-white/20 p-1 text-white/80 hover:text-white transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop floating cart bar, bottom-right */}
      {totalItems > 0 && (
        <div className="hidden lg:block fixed bottom-8 right-8 z-30 animate-slide-up">
          <div className="flex items-center gap-4 bg-primary text-white rounded-lg2 px-6 py-4 shadow-glow font-semibold">
            <button onClick={() => navigate("/cart")} className="flex items-center gap-4 text-left">
              <span>{totalItems} item{totalItems > 1 ? "s" : ""} · View cart</span>
              <span className="tabular-nums border-l border-white/25 pl-4">{formatPrice(cartTotal)}</span>
            </button>
            <button
              onClick={handleClearCart}
              title="Clear cart / Unselect all"
              className="pl-2 border-l border-white/25 p-1 text-white/80 hover:text-white transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
