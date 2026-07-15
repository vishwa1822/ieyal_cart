import { Badge } from "@/components/ui";

const STATUS_MAP = {
  open: { label: "Open", variant: "success" },
  closed: { label: "Closed", variant: "destructive" },
  holiday: { label: "Holiday", variant: "warning" },
  closing: { label: "Closing soon", variant: "warning" },
};

export function StatusPill({ status = "open", className = "" }) {
  const key = status?.toLowerCase?.() || "open";
  const config = STATUS_MAP[key] || STATUS_MAP.open;
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

export function StoreStatusBadge({ isOpen, holidayMode }) {
  if (holidayMode) return <StatusPill status="holiday" />;
  return <StatusPill status={isOpen ? "open" : "closed"} />;
}
