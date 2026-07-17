import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, Button, Label, Separator } from "@/components/ui";
import { CalendarDays, Clock, Users, CheckCircle2, MessageSquare, Utensils, Sparkles, Phone, User, Star, ShieldCheck, ArrowRight, CalendarPlus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import useReveal from "@/hooks/useReveal";
import SectionDivider from "@/components/shared/SectionDivider";
import SiteNavbar from "@/components/shared/SiteNavbar";

// ===========================================================================
// BookTablePage — "dine-in with a reservation" flow alongside delivery and
// pickup. Uses the same navbar-only shell as the marketing Home page (no
// app sidebar / bottom nav) so it reads as one continuous, premium product
// rather than a form bolted onto the ordering app's dashboard chrome.
// ===========================================================================

function nextDays(n = 7) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, "7+"];

function parseLocalDate(str) {
  if (!str) return new Date();
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export default function BookTablePage() {
  const navigate = useNavigate();
  const { outlet, customer, isLoggedIn } = useApp();
  const days = nextDays();

  const [selectedDay, setSelectedDay] = useState(0);
  const [customDate, setCustomDate] = useState(false);
  const [customDateValue, setCustomDateValue] = useState("");
  const [time, setTime] = useState("");
  const [customTime, setCustomTime] = useState(false);
  const [guests, setGuests] = useState(2);
  const [customGuests, setCustomGuests] = useState(false);
  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const minDateStr = days[0].toISOString().slice(0, 10);

  const slots = ["12:30 PM", "1:00 PM", "1:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"];

  const chosenDate = customDate && customDateValue ? parseLocalDate(customDateValue) : days[selectedDay];

  const valid =
    time &&
    name.trim() &&
    /^\d{10}$/.test(phone.replace(/\D/g, "").slice(-10)) &&
    (!customDate || !!customDateValue);

  const handleConfirm = () => {
    if (!valid) return;
    // No booking endpoint exists yet in the provided API surface — this
    // captures the full intent locally so it's a one-line swap once a
    // `POST /reservation/create` (or similar) endpoint is wired up.
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div className="ieyal min-h-screen w-full">
        <SiteNavbar onLoginClick={() => navigate(isLoggedIn ? "/profile" : "/login")} isLoggedIn={isLoggedIn} customerName={customer?.name} forceSolid />
        <div className="pt-32">
          <div className="px-4 lg:px-0 pt-14 pb-16 flex flex-col items-center text-center max-w-sm mx-auto animate-[iyFadeUp_.7s_ease-out]">
            <div className="h-16 w-16 rounded-full bg-[var(--iy-accent-soft)] flex items-center justify-center mb-5 iy-pulse-once">
              <CheckCircle2 className="h-8 w-8 text-[var(--iy-accent)]" strokeWidth={2.5} />
            </div>
            <h2 className="iy-serif text-2xl font-medium tracking-tight text-[var(--iy-ink)]">Table requested</h2>
            <p className="text-sm text-[var(--iy-ink-soft)] mt-2.5 leading-relaxed">
              We've sent your reservation for {guests} guest{guests > 1 ? "s" : ""} on{" "}
              <span className="font-semibold text-[var(--iy-ink)]">
                {chosenDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </span>{" "}
              at <span className="font-semibold text-[var(--iy-ink)]">{time}</span> to {outlet?.outletName || "the outlet"}.
              They'll confirm by SMS shortly.
            </p>
            <button
              onClick={() => navigate(isLoggedIn ? "/home" : "/")}
              className="w-full mt-7 rounded-full bg-[var(--iy-accent)] text-white text-sm font-semibold px-7 py-3.5 shadow-[var(--iy-shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--iy-shadow-glow)] active:translate-y-0 active:scale-[0.97]"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const heroRef = useReveal();

  return (
    <div className="ieyal min-h-screen w-full">
      <SiteNavbar onLoginClick={() => navigate(isLoggedIn ? "/profile" : "/login")} isLoggedIn={isLoggedIn} customerName={customer?.name} forceSolid />

      <div className="pt-24 sm:pt-28">

        {/* ── Full-bleed hero — the actual introduction to this page, not a
             flat gradient strip. Uses the uploaded dining photo so the guest
             sees the experience they're booking, not just a form. ── */}
        <section className="relative px-4 sm:px-6 pt-4">
          <div
            ref={heroRef}
            className="iy-reveal-blur iy-in relative max-w-6xl mx-auto rounded-[1.75rem] lg:rounded-[2.25rem] overflow-hidden shadow-[var(--iy-shadow-lg)]"
          >
            <img
              src="/images/booktable-hero.png"
              alt="Guests sharing a table, plates of biryani, kebabs and mezze laid out"
              className="h-[260px] sm:h-[320px] lg:h-[380px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--iy-ink)]/85 via-[var(--iy-ink)]/20 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-3.5 py-1.5 mb-3">
                <Sparkles className="h-3 w-3" /> Dine-in Reservation
              </span>
              <h1 className="iy-serif text-[28px] sm:text-4xl lg:text-[44px] leading-[1.08] font-medium text-white tracking-tight max-w-lg">
                A table, held<br className="hidden sm:block" /> just for you.
              </h1>
              <p className="mt-2.5 text-sm sm:text-[15px] text-white/80 max-w-md">
                {outlet?.outletName ? `Reserve your seat at ${outlet.outletName} — no payment needed.` : "Reserve your dine-in experience in under a minute."}
              </p>
              <div className="mt-4 flex items-center gap-5 text-xs text-white/75">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> No advance payment</span>
                <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> 4.9 dine-in rating</span>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider variant="curve" tone="bg" />

        <div className="px-4 lg:px-6 pt-1 pb-28 lg:pb-10 max-w-2xl lg:max-w-6xl mx-auto">

          {/* Desktop-first 2-column Grid */}
          <div className="lg:grid lg:grid-cols-[1fr_370px] xl:grid-cols-[1fr_390px] lg:gap-6 lg:items-start">

            {/* ── Left Column: Reservation Form ── */}
            <div className="space-y-4 lg:space-y-4 flex flex-col justify-between">

              {/* Main Inputs Card */}
              <div ref={useReveal()} className="iy-reveal-scale rounded-[1.5rem] lg:rounded-[1.75rem] border border-[var(--iy-border)] bg-[var(--iy-surface)] shadow-[var(--iy-shadow-sm)] p-4 sm:p-6 space-y-5 flex-1 flex flex-col justify-around">

                {/* Date picker */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                    <Label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--iy-ink)]">
                      <CalendarDays className="h-4 w-4 text-[var(--iy-accent)]" /> Select Date
                    </Label>
                    <button
                      type="button"
                      onClick={() => { setCustomDate((v) => !v); setCustomDateValue(""); }}
                      className="flex items-center gap-1 text-xs font-semibold text-[var(--iy-accent)] hover:underline underline-offset-2"
                    >
                      {customDate ? "Choose a preset day" : (<><CalendarPlus className="h-3.5 w-3.5" /> Custom date</>)}
                    </button>
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    {customDate ? (
                      <motion.div
                        key="custom-date"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <input
                          type="date"
                          min={minDateStr}
                          value={customDateValue}
                          onChange={(e) => setCustomDateValue(e.target.value)}
                          className="flex h-10 sm:h-11 w-full sm:max-w-xs rounded-xl border border-[var(--iy-border)] bg-[var(--iy-bg)] px-3.5 text-sm outline-none focus:border-[var(--iy-accent)] focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="preset-dates"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex gap-2 overflow-x-auto hide-scrollbar pb-1"
                      >
                        {days.map((d, i) => {
                          const active = i === selectedDay;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSelectedDay(i)}
                              className={`relative shrink-0 w-14 sm:w-15 py-2 rounded-xl border text-center transition-all duration-300 active:scale-[0.97] ${active
                                  ? "bg-[var(--iy-accent)] text-white border-[var(--iy-accent)] shadow-[var(--iy-shadow-xs)]"
                                  : "border-[var(--iy-border)] bg-[var(--iy-bg)] text-[var(--iy-ink-soft)] hover:border-[var(--iy-accent)]/50 hover:text-[var(--iy-ink)]"
                                }`}
                            >
                              <span className="relative">
                                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider opacity-85">
                                  {i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" })}
                                </p>
                                <p className="text-sm sm:text-base font-bold mt-0.5">{d.getDate()}</p>
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Time picker */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                    <Label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--iy-ink)]">
                      <Clock className="h-4 w-4 text-[var(--iy-accent)]" /> Select Time Slot
                    </Label>
                    <button
                      type="button"
                      onClick={() => { setCustomTime((v) => !v); setTime(""); }}
                      className="text-xs font-semibold text-[var(--iy-accent)] hover:underline underline-offset-2"
                    >
                      {customTime ? "Choose a preset slot" : "Custom time"}
                    </button>
                  </div>

                  {customTime ? (
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="flex h-10 sm:h-11 w-full sm:max-w-xs rounded-xl border border-[var(--iy-border)] bg-[var(--iy-bg)] px-3.5 text-sm outline-none focus:border-[var(--iy-accent)] focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((s) => {
                        const active = time === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setTime(s)}
                            className={`relative py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-300 active:scale-[0.97] ${active
                                ? "bg-[var(--iy-accent)] text-white border-[var(--iy-accent)] shadow-[var(--iy-shadow-xs)]"
                                : "border-[var(--iy-border)] bg-[var(--iy-bg)] text-[var(--iy-ink-soft)] hover:border-[var(--iy-accent)]/50 hover:text-[var(--iy-ink)]"
                              }`}
                          >
                            <span className="relative">{s}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Party size (+ Custom guest count option) */}
                <div>
                  <Label className="flex items-center gap-1.5 mb-2 sm:mb-2.5 text-xs sm:text-sm font-semibold text-[var(--iy-ink)]">
                    <Users className="h-4 w-4 text-[var(--iy-accent)]" /> Number of Guests
                  </Label>

                  {customGuests ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={guests}
                        onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                        placeholder="Enter exact number of guests (e.g. 15)"
                        className="flex h-10 w-full max-w-xs rounded-xl border border-[var(--iy-border)] bg-[var(--iy-bg)] px-3 text-sm font-semibold outline-none focus:border-[var(--iy-accent)] focus:ring-2 focus:ring-primary/20 transition-all tabular-nums"
                      />
                      <span className="text-xs sm:text-sm font-medium text-[var(--iy-ink-soft)] shrink-0">guests</span>
                      <button
                        type="button"
                        onClick={() => setCustomGuests(false)}
                        className="h-10 px-3.5 rounded-full border border-[var(--iy-border)] bg-[var(--iy-bg)] text-xs font-semibold text-[var(--iy-accent)] hover:bg-[var(--iy-accent)]/10 transition-all shrink-0"
                      >
                        Presets
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => {
                        const active = !customGuests && guests === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => { setGuests(n); setCustomGuests(false); }}
                            className={`relative h-9 sm:h-10 min-w-9 px-3 rounded-full border text-xs sm:text-sm font-semibold transition-all duration-300 active:scale-[0.97] ${active
                                ? "bg-[var(--iy-accent)] text-white border-[var(--iy-accent)] shadow-[var(--iy-shadow-xs)]"
                                : "border-[var(--iy-border)] bg-[var(--iy-bg)] text-[var(--iy-ink-soft)] hover:border-[var(--iy-accent)]/50 hover:text-[var(--iy-ink)]"
                              }`}
                          >
                            <span className="relative">{n} {n === 1 ? "Guest" : "Guests"}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setCustomGuests(true)}
                        className="h-9 sm:h-10 px-3.5 rounded-full border border-[var(--iy-accent)]/40 bg-[var(--iy-accent)]/5 text-xs sm:text-sm font-semibold text-[var(--iy-accent)] hover:bg-[var(--iy-accent)]/10 transition-all duration-300 active:scale-[0.97]"
                      >
                        + Custom
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact + note */}
                <div className="pt-1">
                  <Card className="border-[var(--iy-border)] bg-[var(--iy-bg)]/70 shadow-[var(--iy-shadow-xs)]">
                    <CardContent className="p-3 sm:p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="bt-name" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--iy-ink-soft)]">
                            <User className="h-3 w-3 text-[var(--iy-accent)]" /> Full Name
                          </Label>
                          <input
                            id="bt-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="flex h-9 sm:h-10 w-full rounded-xl border border-[var(--iy-border)] bg-[var(--iy-surface)] px-3 text-xs sm:text-sm outline-none focus:border-[var(--iy-accent)] focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="bt-phone" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--iy-ink-soft)]">
                            <Phone className="h-3 w-3 text-[var(--iy-accent)]" /> Mobile Number
                          </Label>
                          <input
                            id="bt-phone"
                            inputMode="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="10-digit number"
                            className="flex h-9 sm:h-10 w-full rounded-xl border border-[var(--iy-border)] bg-[var(--iy-surface)] px-3 text-xs sm:text-sm outline-none tabular-nums focus:border-[var(--iy-accent)] focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="bt-note" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--iy-ink-soft)]">
                          <MessageSquare className="h-3 w-3 text-[var(--iy-accent)]" /> Special Request (Optional)
                        </Label>
                        <input
                          id="bt-note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Window seat, anniversary celebration, high chair needed…"
                          className="flex h-9 sm:h-10 w-full rounded-xl border border-[var(--iy-border)] bg-[var(--iy-surface)] px-3 text-xs sm:text-sm outline-none focus:border-[var(--iy-accent)] focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </div>

            {/* ── Right Column: Reservation Desk / Sticky Summary ── */}
            <div ref={useReveal()} className="iy-reveal-right mt-6 lg:mt-0 lg:self-start">
              <div className="rounded-[1.5rem] lg:rounded-[1.75rem] border border-[var(--iy-border)] bg-[var(--iy-surface)] shadow-[var(--iy-shadow-md)] overflow-hidden">

                <div className="px-4 sm:px-5 py-3 border-b border-[var(--iy-border)]/60 bg-[var(--iy-bg)]/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--iy-ink)] flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[var(--iy-accent)]" /> Reservation Desk
                    </p>
                    <p className="text-xs text-[var(--iy-ink-soft)] mt-0.5">Live booking summary</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--iy-accent)]/10 text-[var(--iy-accent)] border border-[var(--iy-accent)]/20">
                    Dine-in
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-[var(--iy-ink-soft)] text-xs uppercase tracking-wider font-semibold">Restaurant</span>
                    <span className="font-semibold text-right max-w-[180px] truncate text-[var(--iy-ink)]">
                      {outlet?.outletName || "Selected Outlet"}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--iy-ink-soft)] flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-[var(--iy-ink-soft)]" /> Date
                    </span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={chosenDate.toDateString()}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.18 }}
                        className="font-medium text-[var(--iy-ink)]"
                      >
                        {chosenDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--iy-ink-soft)] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[var(--iy-ink-soft)]" /> Time Slot
                    </span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={time || "empty"}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.18 }}
                        className={time ? "font-bold text-[var(--iy-accent)]" : "text-[var(--iy-ink-soft)] italic"}
                      >
                        {time || "Choose time"}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[var(--iy-ink-soft)] flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[var(--iy-ink-soft)]" /> Party Size
                    </span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={guests}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.18 }}
                        className="font-medium text-[var(--iy-ink)]"
                      >
                        {guests} {guests === 1 ? "Guest" : "Guests"}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <Separator />

                  <div className="space-y-2 pt-0.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--iy-ink-soft)]">Guest Name</span>
                      <span className={name.trim() ? "font-medium text-[var(--iy-ink)]" : "text-[var(--iy-ink-soft)] italic"}>
                        {name.trim() || "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--iy-ink-soft)]">Contact Phone</span>
                      <span className={phone.trim().length === 10 ? "font-medium tabular-nums text-[var(--iy-ink)]" : "text-[var(--iy-ink-soft)] italic"}>
                        {phone.trim() || "Required (10 digits)"}
                      </span>
                    </div>
                    {note && (
                      <div className="pt-1">
                        <span className="text-xs text-[var(--iy-ink-soft)] block mb-0.5">Special Request:</span>
                        <p className="text-xs font-medium text-[var(--iy-ink)] bg-[var(--iy-bg)] p-2 rounded border border-[var(--iy-border)]/60 line-clamp-2">
                          "{note}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop CTA */}
                <div className="p-4 sm:p-5 pt-3 bg-[var(--iy-bg)]/40 border-t border-[var(--iy-border)]/60">
                  <motion.button
                    onClick={handleConfirm}
                    disabled={!valid}
                    whileHover={valid ? { y: -3 } : {}}
                    whileTap={valid ? { scale: 0.97, y: 0 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 26 }}
                    className="group relative w-full h-11 sm:h-12 rounded-full bg-[var(--iy-accent)] text-white font-semibold text-sm sm:text-base shadow-[var(--iy-shadow-sm)] overflow-hidden transition-shadow duration-300 hover:shadow-[var(--iy-shadow-glow)] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[var(--iy-accent)] via-[var(--iy-accent-dark)] to-[var(--iy-accent)] bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-[gradientShift_1.6s_ease_infinite]" />
                    <span className="relative">{valid ? "Confirm Reservation" : "Complete Details"}</span>
                    <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </motion.button>
                  <p className="text-[10px] sm:text-[11px] text-center text-[var(--iy-ink-soft)] mt-2 sm:mt-2.5 leading-relaxed">
                    No advance payment required. The restaurant will verify seat availability and send confirmation via SMS.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile sticky confirm CTA */}
        <div className="ieyal lg:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-[var(--iy-surface)]/95 backdrop-blur-xl border-t border-[var(--iy-border)] z-30 shadow-[var(--iy-shadow-md)]">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--iy-ink)] truncate">
                {chosenDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} • {time || "No time"}
              </p>
              <p className="text-[11px] text-[var(--iy-ink-soft)] truncate">
                {guests} {guests === 1 ? "guest" : "guests"} {name ? `• ${name}` : ""}
              </p>
            </div>
            <motion.button
              onClick={handleConfirm}
              disabled={!valid}
              whileTap={valid ? { scale: 0.94 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              className="flex items-center gap-1.5 rounded-full bg-[var(--iy-accent)] text-white text-sm font-semibold px-5 py-2.5 shadow-[var(--iy-shadow-sm)] disabled:opacity-40 disabled:pointer-events-none shrink-0"
            >
              Confirm <ArrowRight className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </div>

      </div>
    </div>
  );
}
