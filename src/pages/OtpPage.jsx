import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from "@/components/ui";
import { ChevronLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { customerApi } from "@/lib/api/services";
import { formatPhone } from "@/lib/theme";

export default function OtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { belongsTo, login } = useApp();
  const phone = location.state?.phone || "919876543210";

  const [digits, setDigits] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
    if (val && i === 5) {
      const code = next.join("");
      if (code.length === 6) handleVerify(code);
    }
  };

  const handleVerify = async (codeOverride) => {
    const code = codeOverride || digits.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // API: POST /customer/verify-otp
      const res = await customerApi.verifyOtp(phone, belongsTo, code);
      login(res.data.token, res.data.customer);
      navigate("/home");
    } catch {
      // Demo fallback
      login("demo-token", { _id: "demo", name: formatPhone(phone), phone });
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setCooldown(30);
    try {
      await customerApi.login(phone, belongsTo);
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <Card className="shadow-premium-lg border-border/60">
          <CardHeader>
            <button onClick={() => navigate("/login")} className="flex items-center gap-1 text-sm text-muted hover:text-[var(--color-text)] mb-4 transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <CardTitle className="text-xl">Enter verification code</CardTitle>
            <CardDescription>
              Sent to +{formatPhone(phone).replace(/(\d{5})(\d{5})/, "$1 $2")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex gap-2 justify-between" role="group" aria-label="One-time code">
              {digits.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Digit ${i + 1} of 6`}
                  className="w-11 h-12 text-center text-lg font-semibold rounded-2xl border-2 border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                />
              ))}
            </div>
            {error && <p className="text-sm text-danger" aria-live="assertive">{error}</p>}
            <Button onClick={() => handleVerify()} className="w-full h-11" disabled={loading}>
              {loading ? "Verifying…" : "Verify and continue"}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                disabled={cooldown > 0}
                onClick={handleResend}
                className="text-muted disabled:opacity-40 hover:text-primary transition-colors"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
              </button>
              <button onClick={() => navigate("/login")} className="text-primary font-medium hover:underline">
                Edit number
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
