import { Clock, Bell, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

export default function StoreClosedPage() {
  const { orgName, outlet } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-bg)]">
      <div className="max-w-sm w-full text-center animate-slide-up">
        <div className="mx-auto h-24 w-24 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
          <Clock className="h-12 w-12 text-primary" />
        </div>

        <h1 className="text-2xl font-bold mb-2">We're currently closed</h1>
        <p className="text-muted text-sm leading-relaxed mb-1">
          {orgName} {outlet ? `— ${outlet.outletName}` : ""} isn't accepting orders right now.
        </p>
        <p className="text-sm font-medium text-primary mb-8">
          Opens tomorrow at 10:00 AM
        </p>

        <div className="space-y-3">
          <Button className="w-full gap-2" onClick={() => {}}>
            <Bell className="h-4 w-4" />
            Notify me when open
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/home")}>
            <UtensilsCrossed className="h-4 w-4" />
            Browse menu (read-only)
          </Button>
        </div>
      </div>
    </div>
  );
}
