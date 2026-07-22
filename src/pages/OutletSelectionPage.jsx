import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui";
import { PageShell } from "@/components/layout/AppShell";
import { OutletCard } from "@/components/shared/OutletCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Store, MapPin } from "lucide-react";
import { useApp } from "@/context/AppContext";

// ===========================================================================
// OutletSelectionPage — wrapped in PageShell (shared premium top nav).
// One tap on an open store selects it and continues straight to the menu —
// no separate "select, then confirm" step, no extra chrome. Desktop:
// 2-column card list. Mobile: single column.
// Maps to: organization/outlets/get-all (loaded in AppContext)
// ===========================================================================

export default function OutletSelectionPage() {
  const navigate = useNavigate();
  const { outlets, setOutlet, orgName, userLocation } = useApp();

  const handleSelect = (chosen) => {
    setOutlet(chosen);
    navigate("/home");
  };

  const openCount = outlets.filter((o) => o.storeStatus && o.isActive).length;

  return (
    <PageShell>
      <div className="pb-10 space-y-7">
        <SectionHeader
          eyebrow="Step 1 of 2"
          title="Choose your store"
          subtitle={
            userLocation
              ? `Sorted by distance from your current location · ${openCount} store${openCount !== 1 ? "s" : ""} open now`
              : `Showing outlets for ${orgName} · ${openCount} store${openCount !== 1 ? "s" : ""} open now`
          }
          action={
            userLocation && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-faint)] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--color-primary)]" /> Using your location
              </span>
            )
          }
        />

        {/* Empty state */}
        {outlets.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center border-dashed !shadow-none">
            <div className="h-14 w-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--color-ink)]">No outlets available</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">No stores found near you right now.</p>
            </div>
          </Card>
        )}

        {/* Outlet list — 1 col mobile, 2 col desktop. Tap a store to continue. */}
        {outlets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {outlets.map((o) => (
              <OutletCard key={o._id} outlet={o} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
