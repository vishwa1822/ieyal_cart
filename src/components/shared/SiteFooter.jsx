import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Mail, MapPin, ArrowUp,
  Instagram, Facebook, Twitter, Youtube,
  Truck, ShoppingBag, Store, PackageSearch,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
   SiteFooter — the closing note of the IEYAL experience, not a link dump.
   Dark ink surface (matches ClosingCTA right above it, so the page ends on
   one continuous dark beat instead of snapping back to cream), generous
   whitespace, thin hairline separators, and quiet scroll-reveals instead
   of anything that draws attention to itself.
   ──────────────────────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 0.61, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group relative inline-flex w-fit items-center text-[13.5px] text-[var(--iy-ink)]/70 hover:text-[var(--iy-ink)] transition-colors duration-300"
    >
      {children}
      <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-[var(--iy-accent)] transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

function FooterColumn({ title, children }) {
  return (
    <motion.div variants={fadeUp} className="min-w-0">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--iy-ink)]/50 mb-5">{title}</h4>
      <ul className="space-y-3.5">{children}</ul>
    </motion.div>
  );
}

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
  { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
  { icon: Twitter, label: "X (Twitter)", href: "https://twitter.com" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com" },
];

const PAYMENTS = ["Visa", "Mastercard", "UPI", "Amex"];

export default function SiteFooter() {
  return (
    <footer id="footer" className="ieyal relative bg-[var(--iy-bg)] text-[var(--iy-ink)] overflow-hidden">
      {/* Quiet ambient glow — echoes the hero/CTA sections instead of a flat black block */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-full bg-gradient-to-r from-transparent via-[var(--iy-ink)]/10 to-transparent" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[var(--iy-accent)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[var(--iy-accent)]/10 blur-3xl" />

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="relative max-w-6xl mx-auto px-6 pt-20 md:pt-28 pb-14"
      >
        {/* ── Main grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-14">

          {/* Section 1 — Brand */}
          <motion.div variants={fadeUp} className="col-span-2 md:col-span-4 pr-0 md:pr-8">
            <Link to="/" className="iy-serif text-2xl tracking-tight font-medium text-[var(--iy-ink)]">IEYAL</Link>
            <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--iy-ink)]/70 max-w-[30ch]">
              Restaurant-grade craft, delivered with care — sourced daily, cooked to order, and always plated with intention.
            </p>
          </motion.div>

          {/* Section 2 — Quick Links */}
          <div className="col-span-1 md:col-span-2">
            <FooterColumn title="Quick Links">
              <li><FooterLink to="/#top">Home</FooterLink></li>
              <li><FooterLink to="/#menu">Order Now</FooterLink></li>
              <li><FooterLink to="/#dishes">Explore</FooterLink></li>
              <li><FooterLink to="/#footer">Contact</FooterLink></li>
            </FooterColumn>
          </div>

          {/* Section 3 — Customer Support */}
          <div className="col-span-1 md:col-span-2">
            <FooterColumn title="Customer Support">
              <li><FooterLink to="/help-center">Help Center</FooterLink></li>
              <li><FooterLink to="/privacy-policy">Privacy Policy</FooterLink></li>
              <li><FooterLink to="/terms">Terms &amp; Conditions</FooterLink></li>
              <li><FooterLink to="/refund-policy">Refund Policy</FooterLink></li>
            </FooterColumn>
          </div>

          {/* Section 4 — Services */}
          <div className="col-span-1 md:col-span-2">
            <motion.div variants={fadeUp}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--iy-ink)]/50 mb-5">Services</h4>
              <ul className="space-y-3.5">
                <li className="flex items-center gap-2 text-[13.5px] text-[var(--iy-ink)]/70">
                  <Truck className="h-3.5 w-3.5 text-[var(--iy-ink)]/50 shrink-0" /> Door Delivery
                </li>
                <li className="flex items-center gap-2 text-[13.5px] text-[var(--iy-ink)]/70">
                  <ShoppingBag className="h-3.5 w-3.5 text-[var(--iy-ink)]/50 shrink-0" /> Self Pickup
                </li>
                <li className="flex items-center gap-2 text-[13.5px] text-[var(--iy-ink)]/70">
                  <Store className="h-3.5 w-3.5 text-[var(--iy-ink)]/50 shrink-0" /> Multiple Outlets
                </li>
                <li>
                  <Link to="/orders" className="group inline-flex items-center gap-2 text-[13.5px] text-[var(--iy-ink)]/70 hover:text-[var(--iy-ink)] transition-colors duration-300">
                    <PackageSearch className="h-3.5 w-3.5 text-[var(--iy-ink)]/50 shrink-0 group-hover:text-[var(--iy-accent)] transition-colors duration-300" />
                    <span className="relative">
                      Track Orders
                      <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-[var(--iy-accent)] transition-all duration-300 group-hover:w-full" />
                    </span>
                  </Link>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Section 5 — Contact Information */}
          <motion.div variants={fadeUp} className="col-span-2 md:col-span-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--iy-ink)]/50 mb-5">Contact</h4>
            <ul className="space-y-3.5">
              <li>
                <a href="tel:+911234567890" className="flex items-center gap-2 text-[13.5px] text-[var(--iy-ink)]/70 hover:text-[var(--iy-ink)] transition-colors duration-300">
                  <Phone className="h-3.5 w-3.5 text-[var(--iy-ink)]/50 shrink-0" /> +91 12345 67890
                </a>
              </li>
              <li>
                <a href="mailto:hello@ieyal.com" className="flex items-center gap-2 text-[13.5px] text-[var(--iy-ink)]/70 hover:text-[var(--iy-ink)] transition-colors duration-300">
                  <Mail className="h-3.5 w-3.5 text-[var(--iy-ink)]/50 shrink-0" /> hello@ieyal.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-[13.5px] text-[var(--iy-ink)]/70">
                <MapPin className="h-3.5 w-3.5 text-[var(--iy-ink)]/50 shrink-0 mt-0.5" />
                <span>12 Marina Row,<br />Chennai, Tamil Nadu</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* ── Hairline separator ── */}
        <motion.div variants={fadeUp} className="mt-16 md:mt-20 border-t border-[var(--iy-ink)]/10" />

        {/* ── Bottom bar ── */}
        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <p className="text-xs text-[var(--iy-ink)]/50 order-3 md:order-1">
            © {new Date().getFullYear()} IEYAL. All rights reserved.
          </p>

          <div className="flex items-center gap-3 order-1 md:order-2">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="h-9 w-9 rounded-full border border-[var(--iy-ink)]/10 flex items-center justify-center text-[var(--iy-ink)]/70 hover:text-[var(--iy-ink)] hover:border-[var(--iy-ink)]/25 hover:bg-[var(--iy-ink)]/5 transition-all duration-300"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 order-2 md:order-3">
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="text-[10.5px] font-medium tracking-wide text-[var(--iy-ink)]/60 border border-[var(--iy-ink)]/10 rounded-md px-2.5 py-1"
              >
                {p}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <BackToTop />
    </footer>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   BackToTop — floating circular button, appears once the hero has scrolled
   out of view, smooth-scrolls back up to it. Lives inside the footer so it
   naturally unmounts with the page rather than needing global wiring.
   ──────────────────────────────────────────────────────────────────── */
function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const top = document.getElementById("top");
    if (top) top.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={scrollToTop}
          aria-label="Back to top"
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-50 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[var(--iy-accent)] text-white shadow-[var(--iy-shadow-glow)] flex items-center justify-center backdrop-blur-md"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
