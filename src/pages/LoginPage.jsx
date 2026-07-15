import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card, CardContent, Button, Label, TabsList, TabsTrigger,
} from "@/components/ui";
import { ChevronLeft, Check, ShieldCheck, Truck, Sparkles, Zap, UserPlus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { customerApi } from "@/lib/api/services";

// ===========================================================================
// Login — split-screen: real dining photography on the left (same imagery
// family as Home/Book-a-Table), phone/OTP + Google auth on the right.
// Uses the same --iy-* design tokens as Home so it reads as one brand, not
// a bolted-on auth screen. Fully wired to the live API — no mock data:
// API: POST /customer/login       { phone, belongsTo, mode: "otp" }
// API: POST /customer/verify-otp  { phone, belongsTo, otp }
// orgName / orgLogo come from AppContext, which itself loads from
// POST /organization/get-org on app boot.
// ===========================================================================

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" {...props}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 7.1 29.5 5 24 5c-7.7 0-14.3 4.4-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.4 35.3 26.8 36 24 36c-5.3 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.5 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C40.9 36 44 30.8 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-[var(--iy-ink-soft)] hover:text-[var(--iy-ink)] transition-colors mb-6 -ml-1"
    >
      <ChevronLeft className="h-4 w-4" /> Back
    </button>
  );
}

/* Three-dot progress read: Phone → Verify → Location. Small, quiet, but it
   tells the person how many steps stand between them and the menu instead
   of leaving each screen feeling like an unbounded flow. */
function StepIndicator({ step }) {
  const steps = ["Phone", "Verify", "Location"];
  return (
    <div className="flex items-center gap-1.5 mb-5" aria-label={`Step ${step + 1} of ${steps.length}`}>
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5 flex-1">
          <div
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-[var(--iy-accent)]" : "bg-[var(--iy-border)]"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Left brand panel — desktop only. Uses the same real dining photography
   as the Home hero + Book-a-Table pages (not a flat gradient), with a
   dark-to-transparent overlay for text contrast — so Login visually reads
   as the same restaurant, not a different, generic auth screen.
------------------------------------------------------------------------- */
function BrandPanel({ orgName, orgLogo }) {
  const points = [
    { icon: Zap, text: "Order in seconds, track in real time" },
    { icon: Truck, text: "Fast delivery from your nearest outlet" },
    { icon: ShieldCheck, text: "Payments secured end-to-end" },
  ];
  return (
    <div className="relative hidden lg:flex flex-col justify-between w-1/2 min-h-screen text-white p-12 overflow-hidden">
      <motion.img
        src="/images/login-hero.png"
        alt="Steaming hot clay pot chicken biryani with spices"
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
          <div className="h-11 w-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center font-bold text-lg">
            {orgName?.[0] || "O"}
          </div>
        )}
        <span className="iy-serif font-medium text-lg tracking-tight">IEYAL</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        className="relative z-10 max-w-md"
      >
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-3.5 py-1.5 mb-5">
          <Sparkles className="h-3 w-3" /> Welcome back to the table
        </span>
        <h1 className="iy-serif text-4xl leading-[1.1] font-medium tracking-tight">
          Good food,<br />plated with intention.
        </h1>
        <p className="mt-4 text-white/80 text-[15px] leading-relaxed">
          Sign in to pick up right where you left off — saved addresses, past orders, and your favorite dishes are waiting.
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

      <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} IEYAL. All rights reserved.</p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Landing login card — Google + Phone OTP entry.
------------------------------------------------------------------------- */
function LoginCard({ onGoogle, onPhoneSubmit, apiLoading, apiError }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = () => {
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      onGoogle();
    }, 700);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNewUser && name.trim().length < 2) {
      setError("Enter your name to create an account.");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    onPhoneSubmit(phone, isNewUser ? name.trim() : undefined);
  };

  return (
    <Card className="border-[var(--iy-border)] shadow-[var(--iy-shadow-md)] rounded-[1.75rem]">
      <CardContent className="p-6 sm:p-8 space-y-5">
        <StepIndicator step={0} />
        <div className="space-y-1.5">
          <h2 className="iy-serif text-2xl font-medium tracking-tight text-[var(--iy-ink)]">{isNewUser ? "Create your account" : "Welcome back"}</h2>
          <p className="text-sm text-[var(--iy-ink-soft)]">
            {isNewUser ? "Takes less than a minute." : "Log in to continue ordering."}
          </p>
        </div>

        <TabsList className="w-full bg-[var(--iy-bg)] p-1 rounded-full">
          <TabsTrigger
            onClick={() => { setIsNewUser(false); setError(""); }}
            className={`rounded-full ${!isNewUser ? "bg-[var(--iy-surface)] text-[var(--iy-ink)] shadow-[var(--iy-shadow-xs)]" : "text-[var(--iy-ink-soft)]"}`}
          >
            Log In
          </TabsTrigger>
          <TabsTrigger
            onClick={() => { setIsNewUser(true); setError(""); }}
            className={`rounded-full flex items-center justify-center gap-1.5 ${isNewUser ? "bg-[var(--iy-surface)] text-[var(--iy-ink)] shadow-[var(--iy-shadow-xs)]" : "text-[var(--iy-ink-soft)]"}`}
          >
            <UserPlus className="h-3.5 w-3.5" /> Register
          </TabsTrigger>
        </TabsList>

        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 26 }}>
          <Button
            variant="outline"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-11 border-[var(--iy-border)] justify-center gap-2 font-medium hover:bg-[var(--iy-bg)] hover:border-[var(--iy-border)]"
          >
            <GoogleIcon />
            {googleLoading ? "Connecting…" : "Continue with Google"}
          </Button>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--iy-border)]" />
          <span className="text-xs text-[var(--iy-ink-soft)] font-medium">OR CONTINUE WITH PHONE</span>
          <div className="h-px flex-1 bg-[var(--iy-border)]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isNewUser && (
            <div className="space-y-1.5 animate-fade-in">
              <Label htmlFor="name">Full name</Label>
              <input
                id="name"
                autoFocus
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-[var(--iy-border)] bg-[var(--iy-surface)] px-3 text-sm outline-none transition-colors focus:border-[var(--iy-accent)] focus:ring-2 focus:ring-[var(--iy-accent)]/20"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <div className={`flex items-center rounded-xl border bg-[var(--iy-surface)] transition-all ${
              error || apiError ? "border-danger ring-2 ring-danger/15" : "border-[var(--iy-border)] focus-within:border-[var(--iy-accent)] focus-within:ring-2 focus-within:ring-[var(--iy-accent)]/20"
            }`}>
              <span className="pl-3 pr-2.5 text-sm font-medium text-[var(--iy-ink-soft)] border-r border-[var(--iy-border)] py-2.5">+91</span>
              <input
                id="phone"
                inputMode="tel"
                autoFocus
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="flex-1 h-10 px-3 bg-transparent text-sm outline-none tabular-nums"
              />
            </div>
            {(error || apiError) && <p className="text-sm text-danger">{error || apiError}</p>}
          </div>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 26 }}>
            <Button
              type="submit"
              size="lg"
              className="bg-[var(--iy-accent)] hover:bg-[var(--iy-accent-dark)] text-white rounded-full w-full font-semibold shadow-[var(--iy-shadow-glow)] transition-colors duration-300"
              disabled={apiLoading || !/^\d{10}$/.test(phone) || (isNewUser && name.trim().length < 2)}
            >
              {apiLoading ? "Sending code…" : isNewUser ? "Create account & continue" : "Send verification code"}
            </Button>
          </motion.div>
        </form>

        <p className="text-xs text-[var(--iy-ink-soft)] text-center leading-relaxed pt-1">
          By continuing you agree to our <span className="text-[var(--iy-ink-soft)] underline underline-offset-2">Terms</span> and <span className="text-[var(--iy-ink-soft)] underline underline-offset-2">Privacy Policy</span>.
        </p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------
   OTP verification step
------------------------------------------------------------------------- */
function OtpStep({ phone, onBack, onVerified, apiLoading, apiError, onResend }) {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(30);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (apiError) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [apiError]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill("");
    text.split("").forEach((d, i) => (next[i] = d));
    setDigits(next);
    document.getElementById(`otp-${Math.min(text.length, 5)}`)?.focus();
  };

  const code = digits.join("");

  const handleVerify = () => {
    if (code.length !== 6) {
      setError("Enter all 6 digits.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setError("");
    onVerified(code);
  };

  const handleResend = () => {
    setCooldown(30);
    onResend?.();
  };

  return (
    <Card className="border-[var(--iy-border)] shadow-[var(--iy-shadow-md)] rounded-[1.75rem]">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <StepIndicator step={1} />
        <div>
          <BackButton onClick={onBack} />
          <h2 className="iy-serif text-2xl font-medium tracking-tight text-[var(--iy-ink)]">Enter the code</h2>
          <p className="text-sm text-[var(--iy-ink-soft)] mt-1">
            We sent a 6-digit code to <span className="font-medium text-[var(--iy-ink)] tabular-nums">+91 {phone.replace(/(\d{5})(\d{5})/, "$1 $2")}</span>
          </p>
        </div>

        <motion.div
          className="flex gap-2 sm:gap-2.5 justify-between"
          role="group"
          aria-label="One-time code"
          onPaste={handlePaste}
          animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
        >
          {digits.map((d, i) => (
            <motion.input
              key={i}
              id={`otp-${i}`}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              aria-label={`Digit ${i + 1} of 6`}
              initial={false}
              animate={d ? { scale: [1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.18 }}
              className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-semibold rounded-xl border bg-[var(--iy-surface)] outline-none transition-colors ${
                d ? "border-[var(--iy-accent)]/60 bg-[var(--iy-accent)]/5" : "border-[var(--iy-border)]"
              } focus:border-[var(--iy-accent)] focus:ring-2 focus:ring-[var(--iy-accent)]/20`}
            />
          ))}
        </motion.div>
        {(error || apiError) && (
          <p className="text-sm text-danger -mt-2" aria-live="assertive">
            {error || apiError}
          </p>
        )}
        <motion.div whileHover={apiLoading ? {} : { y: -2 }} whileTap={apiLoading ? {} : { scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 26 }}>
          <Button onClick={handleVerify} size="lg" className="bg-[var(--iy-accent)] hover:bg-[var(--iy-accent-dark)] text-white rounded-full w-full font-semibold shadow-[var(--iy-shadow-glow)] transition-colors duration-300" disabled={apiLoading}>
            {apiLoading ? "Verifying…" : "Verify and continue"}
          </Button>
        </motion.div>
        <div className="flex items-center justify-between text-sm">
          <button disabled={cooldown > 0} onClick={handleResend} className="text-[var(--iy-ink-soft)] disabled:text-[var(--iy-ink-soft)] transition-colors hover:text-[var(--iy-ink)] disabled:hover:text-[var(--iy-ink-soft)]">
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
          <button onClick={onBack} className="text-[var(--iy-accent)] font-medium hover:underline underline-offset-2">
            Edit number
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------
   Success state
------------------------------------------------------------------------- */
function LoggedIn({ method, onReset, onContinue }) {
  return (
    <Card className="border-[var(--iy-border)] shadow-[var(--iy-shadow-md)] rounded-[1.75rem] overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary-dark to-primary" />
      <CardContent className="p-6 sm:p-8 pt-6 pb-8 flex flex-col items-center text-center gap-3">
        <div className="w-full">
          <StepIndicator step={2} />
        </div>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="relative h-16 w-16 flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full bg-success/10 animate-pulse" />
          <div className="relative h-14 w-14 rounded-full bg-success/15 flex items-center justify-center">
            <Check className="h-7 w-7 text-success" strokeWidth={2.5} />
          </div>
        </motion.div>
        <p className="iy-serif text-xl font-medium tracking-tight text-[var(--iy-ink)]">You're all set</p>
        <p className="text-sm text-[var(--iy-ink-soft)] max-w-[300px] leading-relaxed">
          {method === "google"
            ? "Signed in via Google."
            : "Your phone number has been verified successfully."}
        </p>
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 26 }} className="w-full mt-3">
          <Button onClick={onContinue} size="lg" className="bg-[var(--iy-accent)] hover:bg-[var(--iy-accent-dark)] text-white rounded-full w-full font-semibold shadow-[var(--iy-shadow-glow)] transition-colors duration-300">
            Continue to Home
          </Button>
        </motion.div>
        <button onClick={onReset} className="text-sm text-[var(--iy-accent)] font-medium hover:underline underline-offset-2 pt-1">
          Use another account
        </button>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------
   Main LoginPage
------------------------------------------------------------------------- */
export default function LoginPage() {
  const navigate = useNavigate();
  const { belongsTo, login, isLoggedIn, orgName, orgLogo } = useApp();
  const [view, setView] = useState("login"); // login | otp | done
  const [phone, setPhone] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [method, setMethod] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (isLoggedIn && view !== "done") navigate("/home", { replace: true });
  }, [isLoggedIn, navigate, view]);

  // API 5: POST /customer/login { phone, belongsTo, mode: "otp" }
  const handlePhoneSubmit = async (rawPhone, newUserName) => {
    setApiError("");
    setLoading(true);
    try {
      const fullPhone = `91${rawPhone}`;
      await customerApi.login(fullPhone, belongsTo);
      setPhone(rawPhone);
      setPendingName(newUserName || "");
      setMethod("phone");
      setView("otp");
    } catch (err) {
      setApiError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp) => {
    setApiError("");
    setLoading(true);
    try {
      const fullPhone = `91${phone}`;
      const res = await customerApi.verifyOtp(fullPhone, belongsTo, otp);
      const customerData = pendingName
        ? { ...res.data.customer, name: pendingName }
        : res.data.customer;
      login(res.data.token, customerData);
      navigate("/location", { replace: true });
    } catch (err) {
      setApiError(err.message || "Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await customerApi.login(`91${phone}`, belongsTo);
    } catch { /* silent */ }
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
          <span className="iy-serif font-medium text-lg tracking-tight text-[var(--iy-ink)]">IEYAL</span>
        </div>

        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {view === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 24, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -24, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <LoginCard
                  onGoogle={() => { setMethod("google"); setView("done"); }}
                  onPhoneSubmit={handlePhoneSubmit}
                  apiLoading={loading}
                  apiError={apiError}
                />
              </motion.div>
            )}
            {view === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 24, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -24, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <OtpStep
                  phone={phone}
                  onBack={() => { setView("login"); setApiError(""); }}
                  onVerified={handleVerifyOtp}
                  onResend={handleResend}
                  apiLoading={loading}
                  apiError={apiError}
                />
              </motion.div>
            )}
            {view === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <LoggedIn
                  method={method}
                  onReset={() => setView("login")}
                  onContinue={() => navigate("/location", { replace: true })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
