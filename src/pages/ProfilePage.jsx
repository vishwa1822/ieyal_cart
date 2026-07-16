import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button, Input, Label, Switch, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui";
import {
  MapPin, ShoppingBag, LogOut, ChevronRight, Store, CreditCard,
  Gift, Wallet, Pencil, ShieldCheck, HelpCircle, Bell, MessageSquareText, Megaphone, Phone,
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
      <div className="pt-4 lg:pt-0 pb-4">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start space-y-6 lg:space-y-0">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-6">
            {/* Hero identity card */}
            <div ref={heroRef} className="iy-reveal relative overflow-hidden rounded-[28px] border border-white/60 p-5 lg:p-6 shadow-[0_20px_40px_-16px_rgba(251,160,139,0.3)]">
              {/* Wavy Background Layers */}
              <div className="absolute inset-0 pointer-events-none select-none z-0">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    {/* Ivory & Soft Peach Base */}
                    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFFDFB" />
                      <stop offset="50%" stopColor="#FFF4ED" />
                      <stop offset="100%" stopColor="#FFE3D7" />
                    </linearGradient>
                    
                    {/* Upper Diagonal - Very Light Champagne/White Glow */}
                    <radialGradient id="lightGlow" cx="20%" cy="20%" r="65%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                      <stop offset="50%" stopColor="#FFFDFB" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </radialGradient>

                    {/* Lower Diagonal - Luxurious Rose Gold/Coral Glow */}
                    <radialGradient id="roseGlow" cx="90%" cy="90%" r="70%">
                      <stop offset="0%" stopColor="#FF9B85" stopOpacity="0.85" />
                      <stop offset="40%" stopColor="#FC7C65" stopOpacity="0.5" />
                      <stop offset="80%" stopColor="#F5573C" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </radialGradient>

                    <filter id="blurEffect" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="9" />
                    </filter>
                  </defs>
                  
                  {/* Base Background Rect */}
                  <rect width="100" height="100" fill="url(#bgGrad)" />
                  
                  {/* Glowing Blobs overlapping with Blur */}
                  <circle cx="20" cy="20" r="50" fill="url(#lightGlow)" filter="url(#blurEffect)" />
                  <circle cx="90" cy="90" r="55" fill="url(#roseGlow)" filter="url(#blurEffect)" />
                </svg>
              </div>
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-white/90 to-[#FFE9DF]/95 backdrop-blur-sm border-2 border-white/80 flex items-center justify-center shrink-0 shadow-[0_8px_20px_-6px_rgba(251,160,139,0.35)]">
                    <span className="font-display text-2xl font-bold text-[#8A3A25]">{initials || "U"}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-xl sm:text-[22px] font-bold text-[#4E392F] tracking-tight leading-tight">{displayName}</p>
                    <p className="flex items-center gap-1.5 text-sm text-[#8C7A70]/90 font-semibold mt-2 tabular-nums">
                      <Phone className="h-3.5 w-3.5 text-[#8A3A25] shrink-0" />
                      +91 {phone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditOpen(true)}
                  className="h-10 w-10 rounded-full bg-white/60 backdrop-blur-md border border-white/60 hover:bg-white/80 flex items-center justify-center transition-colors shrink-0 shadow-[0_4px_12px_-3px_rgba(251,160,139,0.2)]"
                  aria-label="Edit profile"
                >
                  <Pencil className="h-[18px] w-[18px] text-[#8A3A25]" />
                </button>
              </div>

              {/* Stat tiles */}
              <div className="relative z-10 mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/40 backdrop-blur-[12px] border border-white/50 px-4 py-3 flex items-center gap-3.5 shadow-[0_8px_16px_-6px_rgba(34,26,20,0.04)]">
                  <div className="h-11 w-11 rounded-[14px] bg-[#FFF0E8] border border-white/60 flex items-center justify-center shrink-0 shadow-[0_4px_12px_-3px_rgba(251,160,139,0.15)]">
                    <Gift className="h-5 w-5 text-[#8A3A25]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7A70]/90">Reward points</span>
                    <p className="text-lg font-bold text-[#4E392F] leading-none mt-0.5 tabular-nums">240</p>
                  </div>
                </div>
                
                <div className="rounded-2xl bg-white/40 backdrop-blur-[12px] border border-white/50 px-4 py-3 flex items-center gap-3.5 shadow-[0_8px_16px_-6px_rgba(34,26,20,0.04)]">
                  <div className="h-11 w-11 rounded-[14px] bg-[#FFF0E8] border border-white/60 flex items-center justify-center shrink-0 shadow-[0_4px_12px_-3px_rgba(251,160,139,0.15)]">
                    <Wallet className="h-5 w-5 text-[#8A3A25]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7A70]/90">Wallet balance</span>
                    <p className="text-lg font-bold text-[#4E392F] leading-none mt-0.5 tabular-nums">₹0</p>
                  </div>
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

          </div>
        </div>

        {/* Global Footer Actions */}
        <div className="mt-12 space-y-4 flex flex-col items-center">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-btn border border-[var(--color-danger)]/25 text-[var(--color-danger)] font-medium text-sm py-2.5 px-8 hover:bg-[var(--color-danger)]/5 hover:-translate-y-0.5 transition-all duration-300"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
          <p className="text-center text-xs text-[var(--color-text-faint)]">OwnCart · v1.0.0</p>
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
