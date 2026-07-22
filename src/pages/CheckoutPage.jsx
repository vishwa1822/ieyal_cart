import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button, Separator, Skeleton } from "@/components/ui";
import {
  MapPin, Lock, ChevronLeft, Banknote, Smartphone, Check,
  ShieldCheck, Tag, PlusCircle, CalendarClock,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cartApi, customerApi, extractCarts } from "@/lib/api/services";
import { formatPrice } from "@/lib/theme";

// ===========================================================================
// Checkout / Payment — distraction-free single page (no bottom-nav, no side
// nav) so nothing pulls the customer away from completing the order —
// standard e-commerce checkout UX practice. Uses the shared theme tokens
// (--color-primary etc.) exactly like every other page in the app.
// Delivery address: customer/get-addresses selection
// Payment: settings/get paymentMode
// Place order: cart/create

const PAYMENT_OPTIONS = {
  COD: { key: "cod", label: "Cash on Delivery", sub: "Pay when your order arrives", icon: Banknote },
  ONLINE: { key: "online", label: "Pay Online", sub: "UPI, cards & net banking", icon: Smartphone },
};

/* Slim distraction-free header — back nav + secure badge only. */
function CheckoutHeader({ onBack }) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60">
      <div className="relative max-w-lg lg:max-w-5xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-[var(--color-text)] transition-colors">
          <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
        </button>
        <p className="font-display font-semibold text-[17px] tracking-tight absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">Checkout</p>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2.5 py-1.5 rounded-full">
          <Lock className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Secure</span>
        </div>
      </div>
    </header>
  );
}

function SectionCard({ title, icon: Icon, action, children }) {
  return (
    <div className="rounded-card lg:rounded-lg2 border border-border bg-surface shadow-premium hover:shadow-premium-lg transition-shadow duration-300 overflow-hidden">
      <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3.5">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <p className="text-[15px] font-semibold tracking-tight">{title}</p>
        </div>
        {action}
      </div>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">{children}</div>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { customer, outlet, token, settings, activeOrderId, setActiveOrderId, isStoreOpen, preBooking, clearPreBooking, cartItems } = useApp();
  const [payment, setPayment] = useState("cod");
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartData, setCartData] = useState(null);
  const [address, setAddress] = useState(null);

  useEffect(() => {
    if (!customer?.phone || !outlet?._id) { setLoading(false); return; }
    (async () => {
      try {
        const cartRes = await cartApi.getDetails(customer.phone, outlet._id, token);
        const carts = extractCarts(cartRes);
        
        let allItems = [];
        let totalOrderTotal = 0;
        let totalSavedAmount = 0;
        let totalDeliveryCharge = 0;
        let orderType = "Door Delivery";
        let instruction = "";

        carts.forEach(cart => {
           if (cart.items) allItems.push(...cart.items);
           totalOrderTotal += cart.orderTotal || cart.subTotal || 0;
           totalSavedAmount += cart.savedAmount || 0;
           totalDeliveryCharge += cart.deliveryCharge || 0;
           if (cart.orderType) orderType = cart.orderType;
           if (cart.instruction) instruction = cart.instruction;
        });

        const mergedCart = {
           orderId: carts[0]?.orderId || carts[0]?._id || "",
           items: allItems,
           orderTotal: totalOrderTotal,
           savedAmount: totalSavedAmount,
           deliveryCharge: totalDeliveryCharge,
           orderType: orderType,
           instruction: instruction
        };
        
        setCartData(mergedCart);
        const addrRes = await customerApi.getAddresses(customer.phone, 10.777460, 79.634514, token);
        
        const savedAddrStr = localStorage.getItem("selectedAddress");
        if (savedAddrStr) {
          setAddress(JSON.parse(savedAddrStr));
        } else if (addrRes.data?.length) {
          setAddress(addrRes.data[0]);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [customer, outlet, token]);

  const paymentModes = settings?.paymentMode || ["COD", "ONLINE"];
  const defaultPayment = settings?.defaultPaymentMode?.toLowerCase() || "cod";
  useEffect(() => { setPayment(defaultPayment); }, [defaultPayment]);

  const subtotal = cartData?.orderTotal || cartData?.subTotal || 0;
  const deliveryFee = cartData?.deliveryCharge || 0;
  const discount = cartData?.savedAmount || 0;
  const total = subtotal || 0;
  const itemCount = (cartData?.items || []).reduce((s, it) => s + (it.quantity || 1), 0);

  const applyPromo = () => {
    if (!promo.trim()) return;
    setPromoMsg("Promo code applied at cart — head back to update it.");
  };

  const handlePlace = async () => {
    setPlacing(true);
    try {
      const itemsPayload = cartData?.items?.map(it => ({
        itemId: it.itemId || it._id,
        quantity: it.quantity || 1,
        variationId: it.variationId || "",
        addOnDetails: it.addOnDetails || [],
        currency: it.currency || "INR"
      })) || [];

      const addressPayload = (address && (address._id || address.id))
        ? { addressId: address._id || address.id }
        : {
            address1: address?.address1 || address?.line || "Default",
            address2: address?.address2 || "",
            city: address?.city || "Default",
            state: address?.state || "Default",
            country: address?.country || "India",
            pincode: address?.pincode || "000000",
          };
        const orderId = activeOrderId || cartData?.orderId || cartData?._id;
        const checkoutPayload = {
          orderId,
          outletId: outlet._id,
          customerPhoneNo: customer?.phone || customer?.phoneNo || customer?.mobileNumber || "",
        };
      console.log("Checkout payload:", checkoutPayload);
      const res = await cartApi.checkout(checkoutPayload, token);
      
      // If successful, clear local active order and navigate to confirmation
      setActiveOrderId(null);
      if (preBooking?.campaign) {
        const bookingSnapshot = {
          orderId,
          campaign: preBooking.campaign,
          date: preBooking.date,
          slot: preBooking.slot,
          orderType: preBooking.orderType,
          items: (cartItems || []).map((it) => ({ name: it.name, quantity: it.qty, price: it.price })),
        };
        clearPreBooking();
        setPlacing(false);
        navigate("/pre-booking/confirmation", { state: bookingSnapshot });
        return;
      }
      setPlacing(false);
      navigate("/orders");
    } catch (err) {
      // Extract backend error message if available
      const msg = err?.response?.data?.message || err?.message || "Checkout failed. Please try again.";
      alert(msg);
      setPlacing(false);
    }
  };

  const addressLine = address
    ? [address.address1, address.address2, address.city, address.pincode].filter(Boolean).join(", ")
    : null;

  if (!isStoreOpen) {
    return <Navigate to="/closed" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg)] pb-32 lg:pb-16">
      <CheckoutHeader onBack={() => navigate(-1)} />

      <div className="max-w-lg lg:max-w-5xl mx-auto px-4 lg:px-8 pt-6 lg:pt-10">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start">
          {/* -------- Left column: address, payment, promo -------- */}
          <div className="space-y-4 lg:space-y-5">
            {/* Extends checkout with the campaign / booking date / booking
                slot chosen on the Pre Booking page — display-only, the
                cart already carries this via campaignId/bookingDate/
                bookingSlot set at add-to-cart time. */}
            {preBooking?.campaign && (
              <SectionCard title="Pre Booking" icon={CalendarClock}>
                <div className="space-y-2.5 text-sm rounded-btn bg-[var(--color-bg)] p-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Campaign</span>
                    <span className="font-semibold">{preBooking.campaign.name}</span>
                  </div>
                  {preBooking.date && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted">Booking date</span>
                      <span className="font-semibold">
                        {new Date(preBooking.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                    </div>
                  )}
                  {preBooking.slot?.startTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted">Slot</span>
                      <span className="font-semibold">{preBooking.slot.label || preBooking.slot.startTime}</span>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            <SectionCard title="Delivery address" icon={MapPin}>
              {loading ? (
                <Skeleton className="h-14 w-full" />
              ) : address ? (
                <button onClick={() => navigate("/address")} className="w-full flex items-start gap-3.5 text-left group rounded-btn border border-border hover:border-primary/40 bg-[var(--color-bg)]/60 hover:bg-primary/5 p-4 transition-all duration-200">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{address?.type || "Home"}</p>
                    <p className="text-sm text-muted mt-0.5 leading-relaxed line-clamp-2">{addressLine}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary shrink-0 mt-1.5 group-hover:underline underline-offset-2">Change</span>
                </button>
              ) : (
                <button onClick={() => navigate("/address")} className="w-full flex items-center justify-center gap-2 rounded-btn border border-dashed border-border-strong py-5 text-sm font-medium text-primary hover:bg-primary/5 hover:border-primary/40 transition-all duration-200">
                  <PlusCircle className="h-4 w-4" /> Add a delivery address
                </button>
              )}
            </SectionCard>

            <SectionCard title="Payment method" icon={Lock}>
              <div className="grid sm:grid-cols-2 gap-3.5">
                {["COD", "ONLINE"].filter((k) => paymentModes.includes(k)).map((k) => {
                  const opt = PAYMENT_OPTIONS[k];
                  const selected = payment === opt.key;
                  return (
                    <button
                      key={k}
                      onClick={() => setPayment(opt.key)}
                      className={`relative flex items-start gap-3.5 rounded-btn border p-4 text-left transition-all duration-200 ${
                        selected
                          ? "border-primary bg-primary/[0.06] ring-2 ring-primary/15 shadow-sm"
                          : "border-border hover:border-border-strong hover:bg-[var(--color-bg)]/60"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${selected ? "bg-primary text-white shadow-glow" : "bg-[var(--color-bg)] text-muted"}`}>
                        <opt.icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs text-muted mt-0.5 leading-relaxed">{opt.sub}</p>
                      </div>
                      <div className={`absolute top-3.5 right-3.5 h-4.5 w-4.5 rounded-full flex items-center justify-center transition-all duration-200 ${selected ? "bg-primary scale-100" : "bg-transparent border border-border-strong scale-90"}`}>
                        {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {settings?.checkOutSettings?.enableDiscounts !== false && (
              <SectionCard title="Promo code" icon={Tag}>
                <div className="flex gap-2.5">
                  <div className="flex-1 flex items-center rounded-btn border border-border bg-[var(--color-bg)]/60 focus-within:border-primary focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary/15 transition-all duration-200">
                    <Tag className="h-4 w-4 text-faint ml-3.5" />
                    <input
                      value={promo}
                      onChange={(e) => setPromo(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 h-11 px-2.5 bg-transparent text-sm font-medium outline-none uppercase placeholder:normal-case placeholder:text-faint placeholder:font-normal tracking-wide"
                    />
                  </div>
                  <Button variant="outline" onClick={applyPromo} className="shrink-0 h-11 px-5 font-semibold">Apply</Button>
                </div>
                {promoMsg && <p className="text-xs text-muted mt-2.5 leading-relaxed">{promoMsg}</p>}
              </SectionCard>
            )}

            {/* Desktop trust row */}
            <div className="hidden lg:flex items-center gap-2.5 text-xs text-faint px-1 pt-1">
              <ShieldCheck className="h-4 w-4 text-success shrink-0" />
              Your payment details are encrypted and never stored on our servers.
            </div>
          </div>

          {/* -------- Right column: sticky order summary -------- */}
          <div className="mt-4 lg:mt-0 lg:sticky lg:top-24">
            <div className="rounded-card lg:rounded-lg2 border border-border bg-surface shadow-premium-lg overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 pb-3.5 flex items-center justify-between">
                <p className="text-[15px] font-semibold tracking-tight">Order summary</p>
                <span className="text-xs font-medium text-muted bg-[var(--color-bg)] px-2.5 py-1 rounded-full">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
              </div>
              <div className="px-5 sm:px-6 space-y-2.5 text-sm">
                {loading ? (
                  <div className="space-y-2.5 pb-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-2/3" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-muted"><span>Subtotal</span><span className="tabular-nums font-medium text-[var(--color-text)]">{formatPrice(subtotal)}</span></div>
                    <div className="flex justify-between text-muted"><span>Delivery fee</span><span className={`tabular-nums font-medium ${deliveryFee > 0 ? "text-[var(--color-text)]" : "text-success"}`}>{deliveryFee > 0 ? formatPrice(deliveryFee) : "Free"}</span></div>
                    {discount > 0 && (
                      <div className="flex justify-between text-success"><span>Discount</span><span className="tabular-nums font-medium">−{formatPrice(discount)}</span></div>
                    )}
                  </>
                )}
              </div>
              <div className="px-5 sm:px-6 pt-4 pb-5 sm:pb-6">
                <Separator className="mb-4 opacity-60" />
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold tracking-tight">Grand total</span>
                  <span className="text-2xl font-bold tabular-nums font-display">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Desktop CTA lives inside the card */}
              <div className="hidden lg:block px-5 sm:px-6 pb-6">
                <Button onClick={handlePlace} size="lg" className="w-full h-12 font-semibold shadow-glow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 gap-2" disabled={placing || loading}>
                  <Lock className="h-4 w-4" />
                  {placing ? "Placing order…" : `Place order · ${formatPrice(total)}`}
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-faint mt-3">
                  <ShieldCheck className="h-3 w-3 text-success" /> 100% secure checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA bar — thumb-reachable, matches gradient primary CTA used app-wide */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/60 safe-area-pb px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(34,26,20,0.15)]">
        <Button onClick={handlePlace} size="lg" className="w-full h-12 font-semibold shadow-glow gap-2 active:scale-[0.98] transition-transform" disabled={placing || loading}>
          <Lock className="h-4 w-4" />
          {placing ? "Placing order…" : `Place order · ${formatPrice(total)}`}
        </Button>
      </div>
    </div>
  );
}
