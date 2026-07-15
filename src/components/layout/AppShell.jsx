import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Search, ShoppingBag, User, MapPin, ChevronDown,
  Receipt, LogOut, Menu, X, Store,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

// ────────────────────────────────────────────────────────────────────────
// AppNavbar — the single premium top navigation used across every
// authenticated page (Home, Cart, Orders, Book Table, Profile, Outlets...).
// Built in the same visual language as the public homepage's SiteNavbar
// (rounded pill bar, glass-on-scroll, warm ink/accent tokens) so there is
// no visible seam between the public site and the logged-in app — this
// version additionally carries the outlet switcher, cart badge and
// account menu an authenticated shell needs.
// No left sidebar, no bottom tab bar: this bar is the whole nav story on
// every screen size.
// ────────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/orders", icon: Receipt, label: "Orders" },
  { to: "/cart", icon: ShoppingBag, label: "Cart" },
];

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

function OutletChip({ onClick }) {
  const { outlet, orderType, setOrderType, isDeliveryAvailable, isPickupAvailable } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!outlet) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] transition-colors max-w-[140px] sm:max-w-[220px]"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
        <span className="truncate">{outlet.outletName}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-3 w-64 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] p-3 z-50"
          >
            <button
              onClick={() => { setOpen(false); onClick?.(); }}
              className="w-full flex items-center gap-3 rounded-xl hover:bg-[var(--color-bg)] p-2 transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                <Store className="h-4 w-4 text-[var(--color-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{outlet.outletName}</p>
                {outlet.address && <p className="text-xs text-[var(--color-text-faint)] truncate">{outlet.address}</p>}
              </div>
            </button>

            {(isDeliveryAvailable || isPickupAvailable) && (
              <div className="mt-2 flex rounded-full p-1 bg-[var(--color-bg)]">
                {isDeliveryAvailable && (
                  <button
                    onClick={() => setOrderType("Door Delivery")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                      orderType === "Door Delivery" ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    Delivery
                  </button>
                )}
                {isPickupAvailable && (
                  <button
                    onClick={() => setOrderType("Self Pickup")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                      orderType === "Self Pickup" ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]" : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    Pickup
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppNavbar() {
  const scrolled = useScrolled();
  const location = useLocation();
  const navigate = useNavigate();
  const { orgName, orgLogo, customer, logout, cartCount } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-2" : "py-4"}`}>
        <div
          className={`mx-auto max-w-desktop px-4 sm:px-6 flex items-center gap-3 rounded-full transition-all duration-500 ${
            scrolled
              ? "bg-white/80 backdrop-blur-xl border border-[var(--color-border)] shadow-[var(--shadow-xs)] py-2"
              : "py-2.5 border border-transparent"
          }`}
        >
          <div className="flex-1 flex items-center gap-3 sm:gap-5 min-w-0">
            <Link to="/home" className="flex items-center gap-2 shrink-0">
              {orgLogo ? (
                <img src={orgLogo} alt={orgName} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center font-display text-sm font-medium text-[var(--color-primary)]">
                  {orgName?.[0] || "O"}
                </div>
              )}
              <span className="font-display hidden sm:inline text-lg tracking-tight font-medium text-[var(--color-ink)]">{orgName}</span>
            </Link>
            <div className="hidden sm:block h-5 w-px bg-[var(--color-border)]" />
            <OutletChip onClick={() => navigate("/outlets")} />
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to;
              return (
                  <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 ${
                    active ? "text-[var(--color-primary)] bg-[var(--color-primary)]/10" : "text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] hover:bg-[var(--color-ink)]/[0.04]"
                  }`}
                >
                  {label}
                  {to === "/cart" && cartCount > 0 && (
                    <span className="h-4 min-w-4 px-1 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex flex-1 items-center justify-end gap-2">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink)] pl-2 pr-4 py-1.5 rounded-full hover:bg-[var(--color-ink)]/[0.04] transition-all duration-300"
            >
              <span className="h-7 w-7 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-xs font-semibold text-[var(--color-primary)]">
                {customer?.name?.[0] || "U"}
              </span>
              {customer?.name ? customer.name.split(" ")[0] : "Profile"}
            </button>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="p-2 rounded-full text-[var(--color-ink)]/60 hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/8 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <Link to="/cart" className="relative p-2 rounded-full text-[var(--color-ink)]" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 min-w-4 px-1 rounded-full bg-[var(--color-primary)] text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button className="p-2 rounded-full text-[var(--color-ink)]" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="md:hidden mx-4 mt-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-[var(--color-border)] shadow-[var(--shadow-md)] p-4 flex flex-col gap-1"
            >
              {NAV_LINKS.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 text-sm font-medium px-3 py-2.5 rounded-xl transition-colors ${
                      active ? "text-[var(--color-primary)] bg-[var(--color-primary)]/10" : "text-[var(--color-ink)]"
                    }`}
                  >
                    {label}
                    {to === "/cart" && cartCount > 0 && (
                      <span className="ml-auto h-5 min-w-5 px-1.5 rounded-full bg-[var(--color-primary)] text-white text-[11px] font-bold flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="my-1 h-px bg-[var(--color-border)]" />
              <button onClick={() => { setMobileOpen(false); navigate("/profile"); }} className="flex items-center gap-3 text-sm font-medium px-3 py-2.5 rounded-xl text-[var(--color-ink)]">
                <User className="h-4 w-4" /> {customer?.name || "Profile"}
              </button>
              <button onClick={handleLogout} className="flex items-center gap-3 text-sm font-medium px-3 py-2.5 rounded-xl text-[var(--color-danger)]">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {mobileOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-[var(--color-ink)]/20 backdrop-blur-[2px]"
        />
      )}
    </>
  );
}

// ── PageShell ─────────────────────────────────────────────────────────────
// Every authenticated page wraps its content in this. Same top navbar,
// same max-width content column, same fade-in — one consistent shell,
// no left sidebar, no bottom tab bar.
// `showNav` / `showHeader` are accepted (and ignored) for backward
// compatibility with existing page call sites — there is no alternate
// chrome to toggle, the premium navbar is always the same.
export function PageShell({ children, title = "", className = "", showNav, showHeader }) {
  return (
    <div className={`min-h-screen bg-[var(--color-bg)] ${className}`}>
      <AppNavbar />
      <main
        className="max-w-desktop mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in"
        style={{ paddingTop: "calc(var(--navbar-h) + 1rem)", paddingBottom: "3rem" }}
      >
        {title && <h1 className="font-display text-2xl sm:text-3xl font-medium text-[var(--color-ink)] mb-6">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
