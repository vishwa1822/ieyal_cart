import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Skeleton } from "@/components/ui";
import { PageShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { orderApi, cartApi } from "@/lib/api/services";
import { formatPrice } from "@/lib/theme";
import {
  Package, Clock, CheckCircle2, XCircle, ChevronRight,
  ShoppingBag, RefreshCw, Truck, UtensilsCrossed, Receipt,
} from "lucide-react";

// ===========================================================================
// Orders — redesigned with PageShell for consistent nav/header, real API
// shape handling, premium card design with timeline status, and functional
// Reorder that pushes items back into the cart.
// Maps to: POST /order/get-all-order-by-customer?page=&limit= (paginated)
// ===========================================================================

const STATUS_CONFIG = {
  Delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    cls: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
  "Order Placed": {
    label: "Order placed",
    icon: Clock,
    cls: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  Preparing: {
    label: "Preparing",
    icon: UtensilsCrossed,
    cls: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  "Order Pending": {
    label: "Pending",
    icon: Clock,
    cls: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  "Out for Delivery": {
    label: "Out for delivery",
    icon: Truck,
    cls: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  Cancelled: {
    label: "Cancelled",
    icon: XCircle,
    cls: "bg-danger/10 text-danger border-danger/20",
    dot: "bg-danger",
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    label: status || "Unknown",
    icon: Package,
    cls: "bg-border text-muted border-border",
    dot: "bg-border",
  };
}

function OrderCardSkeleton() {
  return (
    <div className="rounded-card border border-border bg-surface shadow-premium p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-2/3" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-24 rounded-btn" />
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: any;
  onReorder: (order: any) => void;
  reordering: boolean;
}

function OrderCard({ order, onReorder, reordering }: OrderCardProps) {
  const cfg = getStatusConfig(order.status || "");
  const StatusIcon = cfg.icon;
  const itemCount = (order.items || []).length;
  const total = order.orderTotal || order.grandTotal || order.totalPrice || 0;
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const time = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";
  const orderId = (order.orderId || order._id || "").slice(-8).toUpperCase();

  const itemSummary = (order.items || [])
    .slice(0, 3)
    .map((it) => it.itemName || it.name || "Item")
    .join(", ");

  return (
    <div className="rounded-card border border-border bg-surface shadow-premium overflow-hidden card-hover">
      {/* Status accent bar */}
      <div className={`h-1 w-full ${cfg.dot}`} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold tabular-nums">#{orderId}</p>
            <p className="text-xs text-faint mt-0.5">{date}{time ? ` · ${time}` : ""}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>

        {/* Item summary */}
        {itemSummary && (
          <p className="text-sm text-muted leading-snug truncate">
            {itemSummary}{itemCount > 3 ? ` +${itemCount - 3} more` : ""}
          </p>
        )}

        {/* Meta pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-faint bg-[var(--color-bg)] px-2 py-0.5 rounded-full border border-border">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
          {order.orderType && (
            <span className="text-[11px] text-faint bg-[var(--color-bg)] px-2 py-0.5 rounded-full border border-border">
              {order.orderType}
            </span>
          )}
          {order.paymentStatus && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${order.paymentStatus === "Paid" ? "bg-success/10 text-success border-success/20" : "bg-[var(--color-bg)] text-faint border-border"
              }`}>
              {order.paymentStatus}
            </span>
          )}
        </div>

        {/* Footer: total + actions */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-base font-bold tabular-nums">{formatPrice(total)}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReorder(order)}
              disabled={reordering}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className={`h-3 w-3 ${reordering ? "animate-spin" : ""}`} />
              Reorder
            </Button>
            <Button size="sm" variant="ghost" className="gap-1 text-xs h-8 text-primary">
              Details <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { token, isLoggedIn, customer, outlet } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const LIMIT = 20;

  // API: POST /order/get-all-order-by-customer?page=&limit=
  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const res = await orderApi.getAllByCustomer(token, page, LIMIT);
        // Handle both { data: [] } and { data: { orders: [], totalOrders: N } }
        const rawData = res.data;
        const list = Array.isArray(rawData)
          ? rawData
          : rawData?.orders || rawData?.data || [];
        const total = rawData?.totalOrders || rawData?.total || res.totalOrders || 0;
        setOrders(list);
        setTotalOrders(total);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, page, isLoggedIn]);

  // Reorder: adds each item from the order back into the cart
  const handleReorder = async (order: any) => {
    if (!token || !outlet?._id || !customer?.phone) return;
    setReorderingId(order.orderId || order._id);
    setErrorMsg(null);
    try {
      const items = (order.items || []).map((it: any) => ({
        itemId: it.itemId || it._id,
        quantity: it.quantity || 1,
        variationId: it.variationId || "",
        addOnDetails: it.addOnDetails || [],
        currency: "INR",
      }));
      if (!items.length) return;
      const savedAddrStr = localStorage.getItem("selectedAddress");
      const savedAddr = savedAddrStr ? JSON.parse(savedAddrStr) : null;
      const addressPayload = (savedAddr && (savedAddr.id || savedAddr._id))
        ? { addressId: savedAddr.id || savedAddr._id }
        : (order.addressId ? { addressId: order.addressId } : {
          address1: "Default",
          address2: "Default",
          city: "Default",
          state: "Default",
          country: "India",
          pincode: "000000",
          latitude: 10.777460,
          longitude: 79.634514
        });

      const payload = {
        items,
        deliveryType: order.orderType || "Door Delivery",
        orderType: order.orderType || "Door Delivery",
        customerName: customer?.name || "",
        customerPhoneNo: customer?.phone || "",
        instruction: "",
        outletId: outlet._id,
        ...addressPayload
      };
      await cartApi.create(payload, token);
      navigate("/cart");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reorder. Please try again.");
    } finally {
      setReorderingId(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <PageShell title="My Orders">
        <div className="flex flex-col items-center justify-center gap-4 py-24 px-4 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Receipt className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Sign in to view your orders</p>
            <p className="text-sm text-muted mt-1">Track, reorder, and manage all your past orders.</p>
          </div>
          <Button onClick={() => navigate("/login")} size="lg" className="shadow-glow">Log in</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="pb-6 space-y-5">
        {/* Header */}
        <div className="animate-fade-in flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)]">My Orders</h1>
            {totalOrders > 0 && (
              <p className="text-sm text-[var(--color-text-muted)] mt-1">{totalOrders} order{totalOrders !== 1 ? "s" : ""} total</p>
            )}
          </div>
          {errorMsg && (
            <div className="bg-danger/10 text-danger text-sm px-3 py-1.5 rounded-lg border border-danger/20 font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Order list */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <OrderCardSkeleton key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">No orders yet</p>
              <p className="text-sm text-muted mt-1">Place your first order to see it here.</p>
            </div>
            <Button onClick={() => navigate("/home")} size="lg" className="shadow-glow">Browse menu</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {orders.map((o: any) => (
              <OrderCard
                key={o.orderId || o._id}
                order={o}
                onReorder={handleReorder}
                reordering={reorderingId === (o.orderId || o._id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && (orders.length > 0 || page > 1) && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Previous
            </Button>
            <span className="text-sm font-medium tabular-nums">
              Page {page}{totalOrders > 0 ? ` of ${Math.ceil(totalOrders / LIMIT)}` : ""}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={orders.length < LIMIT}
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
