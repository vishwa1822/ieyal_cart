import { Truck, ShoppingBag } from "lucide-react";

export function OrderTypeBadges({ allowedOrderTypes }) {
  if (!allowedOrderTypes?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {allowedOrderTypes.includes("Door Delivery") && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--iy-ink)] bg-[var(--iy-bg)] border border-[var(--iy-border)] rounded-full px-2.5 py-1">
          <Truck className="h-3 w-3" /> Delivery
        </span>
      )}
      {allowedOrderTypes.includes("Self Pickup") && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--iy-ink)] bg-[var(--iy-bg)] border border-[var(--iy-border)] rounded-full px-2.5 py-1">
          <ShoppingBag className="h-3 w-3" /> Pickup
        </span>
      )}
    </div>
  );
}

export function formatValidity(campaign) {
  if (!campaign?.startDate && !campaign?.endDate) return null;
  const fmt = (d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (campaign.startDate && campaign.endDate) return `Valid ${fmt(campaign.startDate)} – ${fmt(campaign.endDate)}`;
  if (campaign.endDate) return `Valid until ${fmt(campaign.endDate)}`;
  return `Valid from ${fmt(campaign.startDate)}`;
}
