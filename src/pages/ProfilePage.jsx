import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button, Input, Label, Switch, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui";
import {
  MapPin, ShoppingBag, LogOut, ChevronRight, Store, CreditCard,
  Gift, Wallet, Pencil, ShieldCheck, HelpCircle, Bell, MessageSquareText, Megaphone,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PageShell } from "@/components/layout/AppShell";
import useReveal from "@/hooks/useReveal";

// ===========================================================================
// Profile — dashboard-style account hub. Uses PageShell so it shares the
// same header / sidebar / bottom-nav chrome as the rest of the logged-in
// app (Home, Cart, Orders), instead of living as an isolated screen.
// Data: customer/verify-otp session (name, phone) via AppContext.
// Reward points / wallet balance are illustrative — no API for these yet.

function QuickAction({ icon: Icon, label, sub, onClick }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="iy-reveal">
      <Card hover as="button" onClick={onClick} className="flex flex-col items-start gap-3 p-4 text-left w-full">
        <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <Icon className="h-[18px] w-[18px] text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{label}</p>
          {sub && <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate w-full">{sub}</p>}
        </div>
      </Card>
    </div>
  );
}

function MenuRow({ icon: Icon, label, value, onClick, danger }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`w-full flex items-center justify-between py-3.5 px-4 -mx-4 group transition-colors ${onClick ? "hover:bg-[var(--color-bg)] cursor-pointer" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${danger ? "bg-danger/10" : "bg-[var(--color-bg)]"}`}>
          <Icon className={`h-4 w-4 ${danger ? "text-danger" : "text-muted"}`} />
        </div>
        <span className={`text-sm font-medium ${danger ? "text-danger" : "text-[var(--color-text)]"}`}>{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-faint">
        {value && <span>{value}</span>}
        {onClick && <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
      </div>
    </Comp>
  );
}

function EditProfileDialog({ open, onOpenChange, name, phone, onSave }) {
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave(draft.trim() || name);
      setSaving(false);
      onOpenChange(false);
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Full name</Label>
            <Input id="edit-name" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">Phone number</Label>
            <Input id="edit-phone" value={`+91 ${phone}`} disabled className="opacity-60 tabular-nums" />
            <p className="text-xs text-faint">Verified numbers can't be changed here.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreferenceRow({ icon: Icon, label, sub, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 -mx-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-[var(--color-bg)] flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {sub && <p className="text-xs text-faint mt-0.5">{sub}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { customer, logout, isLoggedIn, outlet, settings } = useApp();

  if (!isLoggedIn) {
    return (
      <PageShell title="Profile" showNav={false}>
        <div className="flex flex-col items-center justify-center gap-4 py-24 px-4 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Sign in to view your profile</p>
            <p className="text-sm text-muted mt-1">Your orders, addresses, and rewards live here.</p>
          </div>
          <Button onClick={() => navigate("/login")} size="lg" className="shadow-glow">Log in</Button>
        </div>
      </PageShell>
    );
  }

  const phone = (customer?.phone || "").replace(/^91/, "");
  const paymentModes = settings?.paymentMode || ["COD"];

  const [displayName, setDisplayName] = useState(customer?.name || "Guest");
  const [editOpen, setEditOpen] = useState(false);
  const [prefs, setPrefs] = useState({ push: true, sms: true, promo: false });
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const heroRef = useReveal();
  const actionsRef = useReveal();
  const prefsRef = useReveal();
  const accountRef = useReveal();

  return (
    <PageShell title="Profile">
      {/* Desktop: 2-col grid. Mobile: single stack */}
      <div className="px-4 lg:px-0 pt-4 lg:pt-0 pb-4 max-w-2xl lg:max-w-5xl mx-auto lg:mx-0">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start space-y-6 lg:space-y-0">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-6">
            {/* Hero identity card */}
            <div ref={heroRef} className="iy-reveal relative overflow-hidden rounded-card lg:rounded-lg2 gradient-hero text-white p-5 lg:p-7 shadow-premium">
              <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/15 backdrop-blur ring-2 ring-white/25 flex items-center justify-center text-xl font-bold shrink-0">
                  {initials || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold truncate">{displayName}</p>
                  <p className="text-sm text-white/70 tabular-nums">+91 {phone}</p>
                </div>
                <button
                  onClick={() => setEditOpen(true)}
                  className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
                  aria-label="Edit profile"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              {/* Stat tiles */}
              <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-btn bg-white/10 backdrop-blur px-4 py-3">
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Gift className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Reward points</span>
                  </div>
                  <p className="text-lg font-bold mt-1 tabular-nums">240</p>
                </div>
                <div className="rounded-btn bg-white/10 backdrop-blur px-4 py-3">
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Wallet className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Wallet balance</span>
                  </div>
                  <p className="text-lg font-bold mt-1 tabular-nums">₹0</p>
                </div>
              </div>
            </div>

            {/* Quick actions — 2 col always, 4 col on xl */}
            <div ref={actionsRef} className="iy-reveal">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-faint)] mb-3 px-0.5">Quick actions</p>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <QuickAction icon={MapPin} label="Addresses" sub="Delivery spots" onClick={() => navigate("/address")} />
                <QuickAction icon={ShoppingBag} label="My orders" sub="Track & reorder" onClick={() => navigate("/orders")} />
                <QuickAction icon={Store} label="Outlets" sub={outlet?.outletName || "Switch store"} onClick={() => navigate("/outlets")} />
                <QuickAction icon={CreditCard} label="Payments" sub={paymentModes.join(" & ")} />
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6">
            {/* Notification preferences */}
            <div ref={prefsRef} className="iy-reveal">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-faint)] mb-2 px-0.5">Notification preferences</p>
              <Card className="px-4 divide-y divide-[var(--color-border)]">
                <PreferenceRow
                  icon={Bell}
                  label="Push notifications"
                  sub="Order status & delivery updates"
                  checked={prefs.push}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, push: v }))}
                />
                <PreferenceRow
                  icon={MessageSquareText}
                  label="SMS updates"
                  sub="OTP and order confirmations"
                  checked={prefs.sms}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, sms: v }))}
                />
                <PreferenceRow
                  icon={Megaphone}
                  label="Offers & promotions"
                  sub="Occasional deals, no spam"
                  checked={prefs.promo}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, promo: v }))}
                />
              </Card>
            </div>

            {/* Account list */}
            <div ref={accountRef} className="iy-reveal">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-faint)] mb-2 px-0.5">Account</p>
              <Card className="px-4 divide-y divide-[var(--color-border)]">
                <MenuRow icon={ShieldCheck} label="Privacy & security" />
                <MenuRow icon={HelpCircle} label="Help & support" />
              </Card>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-btn border border-[var(--color-danger)]/25 text-[var(--color-danger)] font-medium text-sm py-3 hover:bg-[var(--color-danger)]/5 hover:-translate-y-0.5 transition-all duration-300"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>

            <p className="text-center text-xs text-[var(--color-text-faint)] pb-2">OwnCart · v1.0.0</p>
          </div>
        </div>
      </div>

      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        name={displayName}
        phone={phone}
        onSave={setDisplayName}
      />
    </PageShell>
  );
}
