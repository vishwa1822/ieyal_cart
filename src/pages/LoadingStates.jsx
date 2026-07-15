import { Skeleton, Progress } from "@/components/ui";
import { Loader2 } from "lucide-react";

// ===========================================================================
// Reusable loading-state components for every page that fetches from the
// OWNCART APIs (category/getCategory, order/get-all-order-by-customer,
// banner/get-active, customer profile session, cart/get-cart-details).
// ===========================================================================

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-28 w-full rounded-md" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function OrderListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-md" />
      ))}
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-16 w-16 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BannerSkeleton() {
  return <Skeleton className="h-32 w-full rounded-md" />;
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-14 w-14 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function InlineSpinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function ProgressBar({ value = 60 }) {
  return <Progress value={value} className="w-full" />;
}

export default function LoadingStatesDemo() {
  return (
    <div className="min-h-[600px] w-full bg-[var(--color-bg)] flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <p className="text-xs font-medium text-faint mb-2">Loading products</p>
          <ProductGridSkeleton count={4} />
        </div>
        <div>
          <p className="text-xs font-medium text-faint mb-2">Loading orders</p>
          <OrderListSkeleton count={2} />
        </div>
        <div>
          <p className="text-xs font-medium text-faint mb-2">Loading cart</p>
          <CartSkeleton />
        </div>
        <div>
          <p className="text-xs font-medium text-faint mb-2">Loading banner</p>
          <BannerSkeleton />
        </div>
        <div>
          <p className="text-xs font-medium text-faint mb-2">Loading profile</p>
          <ProfileSkeleton />
        </div>
        <div>
          <p className="text-xs font-medium text-faint mb-2">Inline / progress</p>
          <InlineSpinner />
          <div className="mt-2"><ProgressBar value={45} /></div>
        </div>
      </div>
    </div>
  );
}
