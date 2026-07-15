import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, Button } from "@/components/ui";
import { MapPin, Navigation, Clock, ChevronRight, ShieldCheck, PencilLine, Sparkles, Truck, Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getSavedOutlet } from "@/lib/theme";

// ===========================================================================
// LocationPage — dedicated step between Login and Outlet selection.
// Rebuilt to match the premium "ieyal" visual language 1:1 with LoginPage
// (same --iy-* tokens, split brand panel, glass card, Framer Motion) so the
// Login → Location → Outlets flow reads as one continuous experience
// instead of dropping into a differently-themed legacy screen.
// ===========================================================================

function StepIndicator({ step = 2 }) {
  const steps = ["Phone", "Verify", "Location"];
  return (
    <div className="flex items-center gap-1.5 mb-5" aria-label={`Step ${step + 1} of ${steps.length}`}>
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5 flex-1">
          <div className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-[var(--iy-accent)]" : "bg-[var(--iy-border)]"}`} />
        </div>
      ))}
    </div>
  );
}

function BrandPanel({ orgName, orgLogo }) {
  const points = [
    { icon: Zap, text: "Accurate delivery times for your area" },
    { icon: Truck, text: "Nearby outlets, sorted by real distance" },
    { icon: ShieldCheck, text: "Location used only to find your store" },
  ];
  return (
    <div className="relative hidden lg:flex flex-col justify-between w-1/2 min-h-screen text-white p-12 overflow-hidden">
      <motion.img
        src="/images/kadai-curry-parotta.png"
        alt="Kadai curry with fresh parotta"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "easeOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--iy-ink)] via-[var(--iy-ink)]/70 to-[var(--iy-ink)]/30" />
      <div className="absolute inset-0 bg-[var(--iy-ink)]/20" />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex items-center gap-3"
      >
        {orgLogo ? (
          <img src={orgLogo} alt={orgName} className="h-11 w-11 rounded-full object-cover ring-2 ring-white/25" />
        ) : (
          <div className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center font-bold text-lg">
            {orgName?.[0] || "O"}
          </div>
        )}
        <span className="iy-serif font-medium text-lg tracking-tight">{orgName}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        className="relative z-10 max-w-md"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] mb-6 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> One step from the menu
        </div>
        <h1 className="iy-serif text-4xl leading-[1.1] font-medium tracking-tight">
          Find food,<br />near you.
        </h1>
        <p className="mt-4 text-white/75 text-[15px] leading-relaxed">
          We use your location to show the right menu, delivery times and
          offers for your area — nothing is shared beyond finding your
          nearest outlet.
        </p>

        <div className="mt-10 space-y-4">
          {points.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 + i * 0.1, ease: "easeOut" }}
              className="flex items-center gap-3"
            >
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm text-white/85">{text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} {orgName}. All rights reserved.</p>
    </div>
  );
}

export default function LocationPage() {
  const navigate = useNavigate();
  const { orgName, orgLogo, refreshOutletsForLocation } = useApp();
  const [status, setStatus] = useState("idle"); // idle | locating | error
  const savedOutlet = getSavedOutlet();

  const goNext = (loc) => {
    if (loc?.lat != null && loc?.lng != null) {
      refreshOutletsForLocation(loc);
    } else if (loc?.source === "saved" && loc.outlet) {
      refreshOutletsForLocation({ lat: loc.outlet.lat, lng: loc.outlet.lng, source: "saved" });
    }
    navigate("/outlets");
  };

  const handleAllow = () => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => goNext({ source: "live", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setStatus("error"),
      { timeout: 8000 }
    );
  };

  return (
    <div className="ieyal min-h-screen w-full flex bg-[var(--iy-bg)]">
      <BrandPanel orgName={orgName} orgLogo={orgLogo} />

      <div className="relative w-full lg:w-1/2 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        {/* Mobile-only brand mark */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          {orgLogo ? (
            <img src={orgLogo} alt={orgName} className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--iy-accent)]/20" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-[var(--iy-accent)]/10 flex items-center justify-center text-[var(--iy-accent)] font-bold">
              {orgName?.[0] || "O"}
            </div>
          )}
          <span className="iy-serif font-medium text-lg tracking-tight text-[var(--iy-ink)]">{orgName}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24, filter: "blur(4px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <Card className="border-[var(--iy-border)] shadow-[var(--iy-shadow-md)] rounded-[1.75rem]">
            <CardContent className="p-6 sm:p-8 space-y-5">
              <StepIndicator step={2} />

              <div className="space-y-1.5">
                <div className="h-12 w-12 rounded-2xl bg-[var(--iy-accent)]/10 flex items-center justify-center mb-1">
                  <MapPin className="h-6 w-6 text-[var(--iy-accent)]" />
                </div>
                <h2 className="iy-serif text-2xl font-medium tracking-tight text-[var(--iy-ink)]">Find food near you</h2>
                <p className="text-sm text-[var(--iy-ink-soft)]">
                  Allow location access so we can show accurate delivery times and nearby outlets.
                </p>
              </div>

              <motion.div whileHover={status !== "locating" ? { y: -2 } : {}} whileTap={status !== "locating" ? { scale: 0.98 } : {}} transition={{ type: "spring", stiffness: 400, damping: 26 }}>
                <Button
                  onClick={handleAllow}
                  size="lg"
                  disabled={status === "locating"}
                  className="w-full justify-between font-semibold bg-[var(--iy-accent)] hover:bg-[var(--iy-accent-dark)] text-white rounded-full shadow-[var(--iy-shadow-glow)] transition-colors duration-300 group"
                >
                  <span className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    {status === "locating" ? "Getting your location…" : "Allow location access"}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </motion.div>

              {savedOutlet ? (
                <button
                  onClick={() => goNext({ source: "saved", outlet: savedOutlet })}
                  className="w-full flex items-center justify-between rounded-xl border border-[var(--iy-border)] bg-[var(--iy-surface)] px-4 py-3 text-left hover:border-[var(--iy-accent)]/40 hover:bg-[var(--iy-bg)] transition-all"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Clock className="h-4 w-4 text-[var(--iy-ink-soft)] shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[var(--iy-ink)] truncate">Use saved location</span>
                      <span className="block text-xs text-[var(--iy-ink-soft)] truncate">{savedOutlet.outletName}</span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--iy-ink-soft)] shrink-0" />
                </button>
              ) : (
                <button
                  onClick={() => goNext({ source: "manual" })}
                  className="w-full flex items-center justify-center gap-2 text-sm text-[var(--iy-ink-soft)] hover:text-[var(--iy-ink)] transition-colors py-1"
                >
                  <PencilLine className="h-3.5 w-3.5" /> Enter location manually
                </button>
              )}

              <AnimatePresence>
                {status === "error" && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-danger text-center"
                  >
                    Couldn't access your location. You can pick a store manually instead.
                  </motion.p>
                )}
              </AnimatePresence>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--iy-ink-soft)] pt-1">
                <ShieldCheck className="h-3 w-3" /> Only used to find nearby stores
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
