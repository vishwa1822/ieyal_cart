import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Separator, Skeleton, Card } from "@/components/ui";
import { PageShell } from "@/components/layout/AppShell";
import {
  Minus, Plus, Trash2, ShoppingBag, Tag, Check, X,
  NotebookPen, Clock, Loader2, AlertCircle, Lock,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cartApi, discountApi, extractCarts } from "@/lib/api/services";
import { CartSkeleton } from "@/pages/LoadingStates";
import { formatPrice } from "@/lib/theme";
import useReveal from "@/hooks/useReveal";

// ===========================================================================
// CartPage — fully API-wired with real-time updates.
//
// Data flow:
//  • fetchCart()  →  GET cart from backend, set items + totals
//  • updateQty()  →  optimistic local update → cart/update API → fetchCart()
//  • qty=1 & press− → removeItem() path (removes entirely)
//  • removeItem() →  optimistic remove → cart/delete/item API → fetchCart()
//  • applyCoupon() →  discount/applyToCart → fetchCart() (shows new savedAmount)
//  • handleNoteChange() → debounced cart/update-instruction (no re-fetch needed)
//
// All three "totals" (subtotal, delivery, discount, grand total) always
// reflect the last server response — never stale local state.
// ===========================================================================

// ── Item row ─────────────────────────────────────────────────────────────
function CartItemRow({ item, onQtyChange, onRemove, updating, selected, onToggleSelect }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item), 180);
  };

  return (
    <Card
      hover={!removing}
      className={`relative flex items-center gap-4 p-3.5 sm:p-4 !shadow-[var(--shadow-xs)] ${removing ? "opacity-30 scale-[0.97]" : selected !== false ? "border-[var(--color-primary)]/35 bg-[var(--color-primary)]/[0.02]" : "opacity-60"
        }`}
    >
      {/* Selection checkbox */}
      <div className="flex items-center self-center pr-0.5">
        <input
          type="checkbox"
          checked={selected !== false}
          onChange={() => onToggleSelect && onToggleSelect(item.id)}
          className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 cursor-pointer accent-[var(--color-primary)]"
          aria-label={`Select ${item.name}`}
        />
      </div>

      {/* Item image / emoji placeholder */}
      <div className="h-20 w-20 rounded-card bg-[var(--color-bg)] shrink-0 flex items-center justify-center text-2xl overflow-hidden border border-[var(--color-border)]">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : "🍽️"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{item.name}</p>
        {(item.variation || item.addons) && (
          <p className="text-xs text-[var(--color-text-faint)] truncate mt-0.5">
            {item.variation}{item.addons ? ` · ${item.addons}` : ""}
          </p>
        )}
        {/* Unit price — derive from total/qty if itemPrice was 0 */}
        {(() => {
          const displayPrice = item.price > 0 ? item.price : (item.total > 0 && item.qty > 0 ? Math.round(item.total / item.qty) : 0);
          return displayPrice > 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 tabular-nums">{formatPrice(displayPrice)} each</p>
          ) : null;
        })()}

        <div className="flex items-center justify-between mt-2.5">
          {/* Qty stepper */}
          <div className="inline-flex items-center gap-0.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/[0.04] overflow-hidden transition-colors">
            <button
              type="button"
              onClick={() => onQtyChange(item, -1)}
              disabled={updating}
              className="p-1.5 hover:bg-[var(--color-primary)]/10 transition-colors disabled:opacity-50"
              aria-label="Decrease"
            >
              {item.qty === 1 ? (
                <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger)]" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              )}
            </button>

            <span className="w-7 text-center text-sm font-semibold tabular-nums text-[var(--color-primary)]">
              {updating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-[var(--color-primary)]" />
              ) : item.qty}
            </span>

            <button
              type="button"
              onClick={() => onQtyChange(item, 1)}
              disabled={updating}
              className="p-1.5 hover:bg-[var(--color-primary)]/10 transition-colors disabled:opacity-50"
              aria-label="Increase"
            >
              <Plus className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            </button>
          </div>

          {/* Line total — use server total if available, else qty×price */}
          <span className="text-sm font-bold tabular-nums">
            {formatPrice(item.total > 0 ? item.total : item.qty * item.price)}
          </span>
        </div>
      </div>

      {/* Trash button */}
      <button
        type="button"
        onClick={handleRemove}
        disabled={updating || removing}
        className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] transition-colors self-start p-1 -m-1 disabled:opacity-40"
        aria-label={`Remove ${item.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </Card>
  );
}

// ── Bill row helper ───────────────────────────────────────────────────────
function BillRow({ label, value, success, bold }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : "text-muted"}`}>
      <span className={success ? "text-success" : ""}>{label}</span>
      <span className={`tabular-nums ${success ? "text-success" : bold ? "" : "text-[var(--color-text)]"}`}>
        {value}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function CartPage() {
  const navigate = useNavigate();
  const {
    customer, outlet, token, setCartCount, isLoggedIn,
    cartData, setCartData, cartItems: items, setCartItems: setItems,
    updateCartFromCarts
  } = useApp();

  // Shared cart states managed by AppContext
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null); // item id being mutated
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [coupon, setCoupon] = useState("");
  const [couponState, setCouponState] = useState(null); // { ok, msg }
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(true);
  const noteTimer = useRef(null);

  const customerPhone = customer?.phone || customer?.phoneNo || customer?.mobileNumber || "";
  const outletId = outlet?._id;

  // ── fetchCart — single source of truth ───────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!customerPhone || !outletId) return;
    try {
      const res = await cartApi.getDetails(customerPhone, outletId, token);
      // Use shared parser — handles all API response shapes
      const carts = extractCarts(res);
      updateCartFromCarts(carts);

      // Seed note from first cart
      setNote(carts?.[0]?.instruction || "");

      // Handle items selection
      const allItems = [];
      carts.forEach((cart) => {
        (cart.items || []).forEach((item) => {
          allItems.push({
            id: item._id || item.cartRowId || item.product_retailer_id || item.itemId,
          });
        });
      });
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        allItems.forEach((it) => {
          if (!prev.has(it.id)) next.add(it.id);
        });
        return next;
      });

      setFetchError(null);
    } catch (err) {
      setFetchError(err?.message || "Could not load your cart.");
      setItems([]);
    }
  }, [customerPhone, outletId, token, updateCartFromCarts, setItems]);

  // ── fetchUserDiscounts ────────────────────────────────────────────────
  const fetchUserDiscounts = useCallback(async () => {
    if (!outletId || !token) return;
    try {
      setDiscountsLoading(true);
      const res = await discountApi.getUserDiscounts(outletId, token);
      const list = res?.data?.discounts || res?.data || res?.discounts || [];
      const eligibleList = Array.isArray(list) ? list.filter(d => d.eligible) : [];
      setAvailableDiscounts(eligibleList);
    } catch {
      setAvailableDiscounts([]);
    } finally {
      setDiscountsLoading(false);
    }
  }, [outletId, token]);

  // Initial load
  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    if (!customerPhone || !outletId) { setLoading(false); return; }

    (async () => {
      // Don't show skeleton if we already have data
      setLoading(prev => items.length === 0 ? true : prev);
      await Promise.all([
        fetchCart(),
        fetchUserDiscounts()
      ]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, customerPhone, outletId, token, fetchCart, fetchUserDiscounts]);

  // ── updateQty — optimistic + re-sync ─────────────────────────────────
  const updateQty = async (item, delta) => {
    const newQty = item.qty + delta;

    // qty goes to 0 → remove
    if (newQty <= 0) {
      removeItem(item);
      return;
    }

    // Optimistic update
    setUpdatingId(item.id);
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, qty: newQty, total: newQty * it.price } : it))
    );
    setCartCount((c) => c + delta);

    try {
      try {
        await cartApi.update(
          {
            orderId: item.orderId,
            items: [{
              itemId: item.productId,
              quantity: newQty,
              variationId: item.variationId || "",
              addOnDetails: item.addOnDetails || []
            }],
            outletId: outlet._id,
          },
          token
        );
      } catch (err) {
        if (item.cartRowId && item.cartRowId !== item.productId) {
          await cartApi.update(
            {
              orderId: item.orderId,
              items: [{
                itemId: item.cartRowId,
                quantity: newQty,
                variationId: item.variationId || "",
                addOnDetails: item.addOnDetails || []
              }],
              outletId: outlet._id,
            },
            token
          );
        } else {
          throw err;
        }
      }
      // Re-fetch to sync delivery fee / discount from server
      await fetchCart();
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, qty: item.qty } : it))
      );
      setCartCount((c) => c - delta);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── removeItem — optimistic + re-sync ────────────────────────────────
  const removeItem = async (item) => {
    // Snapshot for revert
    const snapshot = [...items];
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    setCartCount((c) => Math.max(0, c - item.qty));
    setUpdatingId(item.id);

    try {
      try {
        await cartApi.deleteItem(
          {
            outletId: outletId,
            orderId: item.orderId,
            itemId: item.cartRowId,
            customerPhoneNo: customerPhone,
            customerName: customer?.name || ""
          },
          token
        );
      } catch (err) {
        const errorMsg = err?.message || err?.data?.message || "";
        if (errorMsg.includes("No cart found to delete") || errorMsg.includes("Order not found")) {
          // The order/cart is already gone on the server.
          // Auto refresh the cart state to sync.
          await fetchCart();
        } else {
          // If it's a real failure, throw to trigger revert.
          throw err;
        }
      }
      // Re-fetch so totals (delivery, discount) update
      await fetchCart();
    } catch {
      // Revert
      setItems(snapshot);
      setCartCount((c) => c + item.qty);
      alert("Unable to delete item. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── removeAllItems — clear all or unselected items ────────────────────
  const removeAllItems = async (onlyUnselected = false) => {
    const toRemove = onlyUnselected
      ? items.filter((it) => !selectedItemIds.has(it.id))
      : items;
    if (toRemove.length === 0) return;
    setUpdatingId("clear");
    const snapshot = [...items];
    const remaining = onlyUnselected ? items.filter((it) => selectedItemIds.has(it.id)) : [];
    setItems(remaining);
    const newQty = remaining.reduce((s, it) => s + it.qty, 0);
    setCartCount(newQty);
    if (!onlyUnselected) setSelectedItemIds(new Set());

    try {
      for (const item of toRemove) {
        try {
          await cartApi.deleteItem(
            {
              outletId: outletId,
              orderId: item.orderId,
              itemId: item.cartRowId,
              customerPhoneNo: customerPhone,
              customerName: customer?.name || ""
            },
            token
          );
        } catch (err) {
          const errorMsg = err?.message || err?.data?.message || "";
          if (errorMsg.includes("No cart found to delete") || errorMsg.includes("Order not found")) {
            // Whole cart is gone, no need to keep deleting items
            break;
          } else {
            throw err;
          }
        }
      }
      await fetchCart();
    } catch {
      setItems(snapshot);
      setCartCount(snapshot.reduce((s, it) => s + it.qty, 0));
      alert("Unable to clear items. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── applyCoupon ───────────────────────────────────────────────────────
  const applyCoupon = async (discountObj = null) => {
    const orderId = cartData?.[0]?.orderId || cartData?.[0]?._id;
    const isManual = !discountObj || !discountObj._id;
    const codeToApply = isManual ? coupon : "";
    const discountId = isManual ? "" : discountObj._id;
    
    if ((!codeToApply && !discountId) || !orderId) return;
    
    setCouponLoading(discountId || "manual");
    try {
      await discountApi.applyToCart(
        { orderId, code: codeToApply, discountId, outletId: outlet._id },
        token
      );
      setCouponState({ ok: true, msg: isManual ? `"${coupon}" applied successfully` : `"${discountObj.name || discountObj.title}" applied` });
      if (isManual) setCoupon("");
      // Re-fetch so savedAmount shows in bill
      await fetchCart();
    } catch (err) {
      setCouponState({ ok: false, msg: err.message || "That discount could not be applied" });
    } finally {
      setCouponLoading(false);
    }
  };

  // ── Order note (debounced) ────────────────────────────────────────────
  const handleNoteChange = (val) => {
    setNote(val);
    setNoteSaved(false);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(async () => {
      const orderId = cartData?.[0]?.orderId || cartData?.[0]?._id;
      if (!orderId) { setNoteSaved(true); return; }
      try {
        await cartApi.updateInstruction(
          { orderId, instruction: val, outletId: outlet._id },
          token
        );
      } catch { /* silent */ }
      finally { setNoteSaved(true); }
    }, 700);
  };

  // ── Derived totals — server is the single source of truth ─────────────
  // Use server-provided totals from the cart document so the bill always
  // matches the backend exactly. Only fall back to local computation if
  // the server fields are missing.
  // Filter items by selectedItemIds when computing local subtotal and itemCount
  const selectedItemsList = items.filter((it) => selectedItemIds.has(it.id));
  const allSelected = items.length > 0 && selectedItemsList.length === items.length;

  const firstCart = cartData?.[0] ?? {};
  const deliveryFee = firstCart.deliveryCharge ?? firstCart.deliveryFee ?? 0;
  const discount = firstCart.savedAmount ?? firstCart.discount ?? firstCart.couponDiscount ?? 0;
  const taxes = firstCart.taxAmount ?? firstCart.tax ?? firstCart.gst ?? 0;

  // Subtotal: compute exact total of selected items when items are deselected or being updated
  const subtotal = updatingId !== null || !allSelected
    ? selectedItemsList.reduce((s, it) => s + (it.total > 0 ? it.total : it.qty * it.price), 0)
    : (firstCart.subTotal ??
      firstCart.orderTotal ??
      firstCart.itemTotal ??
      selectedItemsList.reduce((s, it) => s + (it.total > 0 ? it.total : it.qty * it.price), 0));

  // Grand total: compute exact net total when items are deselected or being updated
  const total = updatingId !== null || !allSelected
    ? Math.max(0, subtotal + (subtotal > 0 ? deliveryFee - discount + taxes : 0))
    : (firstCart.grandTotal ??
      firstCart.totalAmount ??
      firstCart.netTotal ??
      Math.max(0, subtotal + deliveryFee - discount + taxes));
  const itemCount = selectedItemsList.reduce((s, it) => s + it.qty, 0);

  // ── Render guards ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell title="Cart">
        <div className="px-4 lg:px-0 pt-4 lg:pt-0 max-w-lg lg:max-w-2xl mx-auto lg:mx-0">
          <CartSkeleton />
        </div>
      </PageShell>
    );
  }

  if (!isLoggedIn) {
    return (
      <PageShell title="Cart">
        <div className="flex flex-col items-center justify-center gap-4 py-24 px-4 text-center">
          <div className="h-16 w-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
            <ShoppingBag className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Sign in to see your cart</p>
            <p className="text-sm text-muted mt-1">Log in to view items you've added and place orders.</p>
          </div>
          <Button onClick={() => navigate("/login")} size="lg" className="shadow-glow">Log in</Button>
        </div>
      </PageShell>
    );
  }

  if (fetchError) {
    return (
      <PageShell title="Cart">
        <div className="flex flex-col items-center justify-center gap-4 py-24 px-4 text-center">
          <div className="h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-danger" />
          </div>
          <div>
            <p className="font-semibold">Couldn't load cart</p>
            <p className="text-sm text-muted mt-1">{fetchError}</p>
          </div>
          <Button
            onClick={async () => { setLoading(true); await fetchCart(); setLoading(false); }}
            size="lg"
            variant="outline"
          >
            Try again
          </Button>
        </div>
      </PageShell>
    );
  }

  if (!items.length) {
    return (
      <PageShell title="Cart">
        <div className="flex flex-col items-center justify-center gap-4 py-24 px-4 text-center">
          <div className="h-16 w-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
            <ShoppingBag className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Your cart is empty</p>
            <p className="text-sm text-muted mt-1">Add something delicious from the menu.</p>
          </div>
          <Button onClick={() => navigate("/home")} size="lg" className="shadow-glow">Browse menu</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="pb-6 lg:pb-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)]">Cart</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Review your items and proceed to checkout</p>
        </div>
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start">

          {/* ── Left column: items + note + coupon ─────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {items.length > 0 && (
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedItemIds.size === items.length}
                    onChange={() => {
                      if (selectedItemIds.size === items.length) {
                        setSelectedItemIds(new Set());
                      } else {
                        setSelectedItemIds(new Set(items.map((it) => it.id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 cursor-pointer accent-[var(--color-primary)]"
                    title="Select / Unselect all"
                  />
                )}
                <p className="font-display text-lg font-medium text-[var(--color-ink)]">Your order</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--color-text-muted)]">{itemCount} item{itemCount !== 1 ? "s" : ""} selected</span>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removeAllItems(false)}
                    disabled={updatingId !== null}
                    className="text-xs font-semibold text-[var(--color-danger)] hover:underline disabled:opacity-40 flex items-center gap-1"
                    title="Clear all items from cart"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear cart
                  </button>
                )}
              </div>
            </div>

            {/* Item list */}
            <div className="space-y-2.5">
              {items.map((it) => (
                <CartItemRow
                  key={it.id}
                  item={it}
                  onQtyChange={updateQty}
                  onRemove={removeItem}
                  updating={updatingId === it.id}
                  selected={selectedItemIds.has(it.id)}
                  onToggleSelect={(id) => {
                    setSelectedItemIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    });
                  }}
                />
              ))}
            </div>

            {/* Available Discounts */}
            {!discountsLoading && availableDiscounts.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Available Offers</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableDiscounts.map(discount => {
                    const isApplying = couponLoading === discount._id;
                    return (
                      <Card 
                        key={discount._id} 
                        hover={!isApplying}
                        className="p-3.5 flex items-center gap-3 cursor-pointer border-[var(--color-primary)]/20 hover:border-[var(--color-primary)]/40 transition-colors"
                        onClick={() => !isApplying && applyCoupon(discount)}
                      >
                        <div className="h-10 w-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                          {isApplying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Tag className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{discount.name || discount.title}</p>
                          <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                            {discount.discountAmount ? `₹${discount.discountAmount} OFF` : (discount.discountPercentage ? `${discount.discountPercentage}% OFF` : 'Tap to apply')}
                          </p>
                          {discount.validUntil && (
                            <p className="text-[10px] text-[var(--color-text-faint)] mt-1">
                              Valid till {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(discount.validUntil))}
                            </p>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coupon */}
            <Card className="p-4 mt-4">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center rounded-btn border border-[var(--color-border)] bg-[var(--color-bg)] focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/15 transition-all">
                  <Tag className="h-4 w-4 text-[var(--color-text-faint)] ml-3 shrink-0" />
                  <input
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value.toUpperCase());
                      setCouponState(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    placeholder="Coupon code"
                    className="flex-1 h-10 px-2.5 bg-transparent text-sm outline-none uppercase placeholder:normal-case"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={applyCoupon}
                  disabled={!coupon || couponLoading}
                  className="shrink-0"
                >
                  {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
              {couponState && (
                <p className={`text-xs mt-2 flex items-center gap-1.5 font-medium ${couponState.ok ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                  {couponState.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  {couponState.msg}
                </p>
              )}
            </Card>
          </div>

          {/* ── Right column: sticky bill summary + kitchen note ────── */}
          <div className="mt-4 lg:mt-0 lg:sticky lg:top-24 space-y-4">
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[var(--color-primary)]" />
                <p className="text-sm font-semibold">Bill summary</p>
              </div>

              <div className="space-y-2 text-sm">
                <BillRow label="Subtotal" value={formatPrice(subtotal)} />
                <BillRow
                  label="Delivery fee"
                  value={deliveryFee > 0 ? formatPrice(deliveryFee) : "Free"}
                />
                {taxes > 0 && (
                  <BillRow label="Taxes & charges" value={formatPrice(taxes)} />
                )}
                {discount > 0 && (
                  <BillRow
                    label="Discount"
                    value={`−${formatPrice(discount)}`}
                    success
                  />
                )}
              </div>

              <Separator />

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-sm">Grand total</span>
                  <span className="text-xl font-bold tabular-nums">{formatPrice(total)}</span>
                </div>
                {discount > 0 && (
                  <p className="text-xs text-[var(--color-success)] flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    You save {formatPrice(discount)} on this order
                  </p>
                )}
              </div>

              {/* Desktop CTA */}
              <div className="hidden lg:block space-y-3 pt-1">
                {!allSelected && items.length > 0 && selectedItemsList.length < items.length && (
                  <Button
                    variant="outline"
                    onClick={() => removeAllItems(true)}
                    disabled={updatingId !== null}
                    size="sm"
                    className="w-full text-xs text-[var(--color-danger)] border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/10"
                  >
                    Remove unselected items ({items.length - selectedItemsList.length})
                  </Button>
                )}
                <Button
                  onClick={() => navigate("/checkout")}
                  size="lg"
                  disabled={itemCount === 0 || updatingId !== null}
                  className="w-full font-semibold shadow-glow"
                >
                  {itemCount > 0 ? `Proceed to checkout · ${formatPrice(total)}` : "Select items to checkout"}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-faint)] pt-1">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span>Secure payments. 100% safe & trusted.</span>
                </div>
              </div>
            </Card>

            {/* Kitchen note */}
            <Card className="p-4 !shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2 mb-2">
                <NotebookPen className="h-4 w-4 text-[var(--color-primary)]" />
                <p className="text-sm font-semibold">Add a note for the kitchen</p>
              </div>
              <textarea
                value={note}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="E.g. less spicy, no onions, extra sauce…"
                rows={2}
                className="w-full rounded-btn border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 transition-all resize-none"
              />
              <p className="text-xs text-[var(--color-text-faint)] mt-1.5 flex items-center gap-1">
                {noteSaved ? (
                  <Check className="h-3 w-3 text-[var(--color-success)]" />
                ) : (
                  <Clock className="h-3 w-3 animate-pulse" />
                )}
                {noteSaved ? "Saved" : "Saving…"}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-[var(--color-border)] px-4 py-3 safe-area-pb">
        {!allSelected && items.length > 0 && selectedItemsList.length < items.length && (
          <button
            type="button"
            onClick={() => removeAllItems(true)}
            disabled={updatingId !== null}
            className="w-full text-center text-xs font-semibold text-[var(--color-danger)] mb-2 hover:underline"
          >
            Remove unselected items ({items.length - selectedItemsList.length})
          </button>
        )}
        <Button
          onClick={() => navigate("/checkout")}
          size="lg"
          disabled={itemCount === 0 || updatingId !== null}
          className="w-full font-semibold shadow-glow flex items-center justify-between px-5"
        >
          <span>{itemCount} item{itemCount !== 1 ? "s" : ""} · Checkout</span>
          <span className="tabular-nums">{formatPrice(total)}</span>
        </Button>
      </div>
    </PageShell>
  );
}
