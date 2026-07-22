import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu, X, ArrowRight, ArrowUpRight, Star, Clock, Heart,
  ShieldCheck, Sparkles, Leaf, Flame, Soup,
} from "lucide-react";
import useReveal from "@/hooks/useReveal";
import SiteNavbar from "@/components/shared/SiteNavbar";
import SiteFooter from "@/components/shared/SiteFooter";
import { useApp } from "@/context/AppContext";

/* ────────────────────────────────────────────────────────────────────────
   IEYAL — premium homepage.
   Self-contained marketing landing page (scoped under the `.ieyal` class
   in index.css so it never inherits the runtime org-theme CSS variables
   used by the rest of the ordering app). Pure CSS/IntersectionObserver
   motion — no extra animation dependency required.
   ──────────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { name: "Tandoori & Grills", desc: "Smoked slow, finished on open flame.", image: "/images/kadai-curry-parotta.png" },
  { name: "Rice & Biryani", desc: "Layered, dum-cooked, always fragrant.", image: "/images/dish-biryani.png" },
  { name: "Curry House", desc: "Slow-simmered gravies, house spice blends.", image: "/images/sadhya-thali.png" },
];

const DISHES = [
  { name: "Charcoal Tandoori Wings", tag: "Bestseller", image: "/images/dish-wings.png", rating: "4.9", time: "22 min", price: "₹349" },
  { name: "Saffron Dum Biryani", tag: "Chef's Pick", image: "/images/dish-biryani.png", rating: "4.8", time: "28 min", price: "₹429" },
  { name: "Heritage Mutton Thali", tag: "Limited", image: "/images/dish-thali.png", rating: "4.9", time: "25 min", price: "₹519" },
];


function useParallax(strength = 14) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * strength;
      const y = (e.clientY / window.innerHeight - 0.5) * strength;
      el.style.setProperty("--px", `${x}px`);
      el.style.setProperty("--py", `${y}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [strength]);
  return ref;
}

/* Lazy image with a shimmering skeleton while it loads — replaces the
   abrupt blank-box-then-snap-in that plain <img> gives you. */
function SmartImage({ src, alt, className = "" }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden ${!loaded ? "iy-skeleton" : ""}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}


function Hero() {
  const parallaxRef = useParallax(18);
  return (
    <section id="top" ref={parallaxRef} className="relative pt-36 md:pt-44 pb-24 md:pb-32 px-5 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full bg-[radial-gradient(closest-side,rgba(166,65,43,0.10),transparent)]" />
        <div className="iy-particle absolute top-24 left-[12%] h-2 w-2 rounded-full bg-[var(--iy-accent)]/40" />
        <div className="iy-particle absolute top-1/2 right-[16%] h-1.5 w-1.5 rounded-full bg-[var(--iy-accent)]/50" style={{ animationDelay: "2s" }} />
        <div className="iy-particle absolute bottom-24 left-[22%] h-1 w-1 rounded-full bg-[var(--iy-accent)]/60" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.15fr_1fr] items-center gap-10">
        <div className="hidden lg:block relative" style={{ transform: "translate3d(calc(var(--px,0px) * -1), calc(var(--py,0px) * -1), 0)" }}>
          <div className="iy-float rounded-[2rem] overflow-hidden shadow-[var(--iy-shadow-lg)] ring-1 ring-white/70 -ml-6 lg:-ml-14 rotate-[-2.5deg]">
            <SmartImage src="/images/hero-left.png" alt="Char-grilled tandoori wings" className="h-[320px] w-full object-cover" />
          </div>
        </div>

        <div className="text-center flex flex-col items-center animate-[iyFadeUp_.9s_ease-out]">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--iy-accent-dark)] bg-[var(--iy-accent-soft)] rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Freshly Reimagined Dining
          </span>

          <h1 className="iy-serif text-[42px] leading-[1.05] sm:text-6xl md:text-[68px] font-medium text-[var(--iy-ink)] tracking-tight">
            Food, plated<br /><span className="text-[var(--iy-accent)]">with intention.</span>
          </h1>

          <p className="mt-6 max-w-md text-[15px] md:text-base text-[var(--iy-ink-soft)] leading-relaxed">
            IEYAL brings restaurant-grade craft to your door — sourced daily, cooked to order, and delivered while it's still warm.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link to="/book-table" className="group relative inline-flex items-center gap-2 rounded-full bg-[var(--iy-accent)] text-white text-sm font-semibold px-7 py-3.5 shadow-[var(--iy-shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--iy-shadow-glow)] active:translate-y-0 active:scale-[0.97] active:shadow-[var(--iy-shadow-xs)]">
              Dine In
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a href="#dishes" className="inline-flex items-center gap-2 rounded-full border border-[var(--iy-ink)]/15 text-[var(--iy-ink)] text-sm font-semibold px-7 py-3.5 transition-all duration-300 hover:bg-[var(--iy-ink)] hover:text-white hover:border-[var(--iy-ink)] active:scale-[0.97]">
              Explore Menu
            </a>
          </div>

          <div className="mt-10 flex items-center gap-6 text-xs text-[var(--iy-ink-soft)]">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[var(--iy-accent)]" /> Hygiene Certified</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-[var(--iy-accent)]" /> 4.9 Avg Rating</span>
          </div>
        </div>

        <div className="hidden lg:block relative" style={{ transform: "translate3d(var(--px,0px), var(--py,0px), 0)" }}>
          <div className="iy-float-slow rounded-[2rem] overflow-hidden shadow-[var(--iy-shadow-lg)] ring-1 ring-white/70 -mr-6 lg:-mr-14 rotate-[2.5deg]">
            <SmartImage src="/images/hero-right.png" alt="Heritage mutton thali" className="h-[320px] w-full object-cover" />
          </div>
        </div>

        <div className="lg:hidden flex gap-4 justify-center -mt-2 order-last">
          <div className="rounded-2xl overflow-hidden shadow-[var(--iy-shadow-sm)] ring-1 ring-white/70 rotate-[-2.5deg]">
            <SmartImage src="/images/hero-left.png" alt="Char-grilled tandoori wings" className="h-28 w-28 object-cover" />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-[var(--iy-shadow-sm)] ring-1 ring-white/70 rotate-[2.5deg]">
            <SmartImage src="/images/hero-right.png" alt="Heritage mutton thali" className="h-28 w-28 object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="iy-reveal max-w-xl mx-auto text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--iy-accent)]">{eyebrow}</span>
      <h2 className="iy-serif mt-3 text-3xl md:text-[40px] font-medium text-[var(--iy-ink)] tracking-tight">{title}</h2>
      {subtitle && <p className="mt-3 text-[var(--iy-ink-soft)] text-[15px] leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function CategoryCard({ cat, i }) {
  const ref = useReveal();
  return (
    <a
      href="#dishes"
      ref={ref}
      className="iy-reveal group relative block rounded-3xl overflow-hidden bg-[var(--iy-surface)] border border-[var(--iy-border)] shadow-[var(--iy-shadow-xs)] transition-all duration-[250ms] ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[var(--iy-shadow-md)] hover:border-[var(--iy-accent)]/30 cursor-pointer"
      style={{ transitionDelay: `${i * 90}ms` }}
    >
      <div className="h-56">
        <SmartImage src={cat.image} alt={cat.name} className="h-56 w-full object-cover transition-transform duration-[250ms] ease-out group-hover:scale-110" />
      </div>
      <div className="p-6">
        <h3 className="iy-serif text-xl font-medium text-[var(--iy-ink)]">{cat.name}</h3>
        <p className="mt-1.5 text-sm text-[var(--iy-ink-soft)]">{cat.desc}</p>
        <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[var(--iy-accent)]">
          View dishes
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
        </div>
      </div>
    </a>
  );
}

function DishCard({ dish, i }) {
  const ref = useReveal();
  const [fav, setFav] = useState(false);
  const [pulse, setPulse] = useState(false);
  const toggleFav = () => {
    setFav(!fav);
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
  };
  return (
    <div ref={ref} className="iy-reveal group relative rounded-3xl bg-[var(--iy-surface)] border border-[var(--iy-border)] shadow-[var(--iy-shadow-xs)] overflow-hidden transition-all duration-[250ms] ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[var(--iy-shadow-md)] hover:border-[var(--iy-accent)]/30" style={{ transitionDelay: `${i * 90}ms` }}>
      <div className="relative h-52">
        <SmartImage src={dish.image} alt={dish.name} className="h-52 w-full object-cover transition-transform duration-[250ms] ease-out group-hover:scale-110" />
        <span className="absolute top-3 left-3 text-[11px] font-semibold uppercase tracking-wide bg-white/90 backdrop-blur text-[var(--iy-accent-dark)] px-3 py-1 rounded-full shadow-[var(--iy-shadow-xs)]">{dish.tag}</span>
        <button
          onClick={toggleFav}
          aria-label={fav ? "Remove from favourites" : "Save to favourites"}
          aria-pressed={fav}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-[var(--iy-shadow-xs)] transition-transform duration-300 hover:scale-110 active:scale-95"
        >
          <Heart className={`h-4 w-4 transition-colors ${pulse ? "iy-pulse-once" : ""} ${fav ? "fill-[var(--iy-accent)] text-[var(--iy-accent)]" : "text-[var(--iy-ink)]"}`} />
        </button>
      </div>
      <div className="p-5">
        <h3 className="iy-serif text-lg font-medium text-[var(--iy-ink)]">{dish.name}</h3>
        <div className="mt-2 flex items-center gap-4 text-xs text-[var(--iy-ink-soft)]">
          <span className="flex items-center gap-1"><Star className="h-4 w-4 text-[var(--iy-accent)]" /> {dish.rating}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {dish.time}</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="iy-serif text-xl font-medium text-[var(--iy-ink)]">{dish.price}</span>
          <button className="text-xs font-semibold text-white bg-[var(--iy-ink)] rounded-full px-4 py-2.5 transition-all duration-300 hover:bg-[var(--iy-accent)] hover:shadow-[var(--iy-shadow-sm)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95">
            Add to cart
          </button>
        </div>
      </div>

    </div>
  );
}

function ExploreMenu() {
  return (
    <section id="menu" className="relative py-24 md:py-32 px-5">
      <div className="max-w-6xl mx-auto">
        <SectionHeading eyebrow="Explore Menu" title="Crafted by category, not by convenience" subtitle="Every category is its own kitchen discipline — pick the mood, not just the meal." />
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, i) => <CategoryCard key={cat.name} cat={cat} i={i} />)}
        </div>
      </div>
      {/* Seam into the next section — a deliberate curve instead of a flat color-swap */}
      <svg className="absolute bottom-0 left-0 w-full text-white" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,60 C480,0 960,0 1440,60 L1440,60 L0,60 Z" fill="currentColor" />
      </svg>
    </section>
  );
}

function FeaturedDishes() {
  return (
    <section id="dishes" className="relative py-24 md:py-32 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionHeading eyebrow="Featured Dishes" title="The table's favourites" subtitle="Signature plates our guests reorder the most — made fresh per ticket, never batched." />
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DISHES.map((dish, i) => <DishCard key={dish.name} dish={dish} i={i} />)}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const ref = useReveal();
  const items = [
    { icon: Leaf, label: "Sourced Daily", desc: "Farm-fresh ingredients, no cold storage shortcuts." },
    { icon: Flame, label: "Cooked to Order", desc: "Nothing pre-made — the ticket fires the pan." },
    { icon: Soup, label: "House Recipes", desc: "Spice blends built in-house, never off the shelf." },
  ];
  return (
    <section className="py-24 px-5 bg-white">
      <div ref={ref} className="iy-reveal max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
        {items.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-4 p-6 rounded-2xl bg-[var(--iy-bg)] border border-[var(--iy-border)] transition-all duration-300 hover:border-[var(--iy-accent)]/25 hover:-translate-y-1">
            <div className="h-11 w-11 rounded-full bg-[var(--iy-accent-soft)] flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-[var(--iy-accent-dark)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--iy-ink)] text-sm">{label}</p>
              <p className="text-sm text-[var(--iy-ink-soft)] mt-1 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClosingCTA() {
  const ref = useReveal();
  return (
    <section id="book" className="px-5 pt-4 pb-24 bg-white">
      <div ref={ref} className="iy-reveal max-w-6xl mx-auto relative rounded-[2.5rem] overflow-hidden bg-[var(--iy-ink)] px-8 md:px-16 py-16 md:py-20 text-center">
        <div className="iy-drift-slow pointer-events-none absolute -top-20 -right-10 h-72 w-72 rounded-full bg-[var(--iy-accent)]/25 blur-3xl" />
        <div className="iy-drift-slow pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-[var(--iy-accent)]/15 blur-3xl" style={{ animationDelay: "-8s" }} />
        <h2 className="iy-serif relative text-3xl md:text-[44px] text-white font-medium tracking-tight max-w-xl mx-auto">Dine in is one tap away.</h2>
        <p className="relative mt-4 text-white/70 max-w-md mx-auto text-[15px]">Reserve a seat or place an order — either way, dinner is handled.</p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/book-table" className="inline-flex items-center gap-2 rounded-full bg-[var(--iy-accent)] text-white text-sm font-semibold px-7 py-3.5 transition-all duration-300 hover:-translate-y-0.5 shadow-[var(--iy-shadow-glow)] active:translate-y-0 active:scale-95">
            Dine In <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#dishes" className="inline-flex items-center gap-2 rounded-full border border-white/25 text-white text-sm font-semibold px-7 py-3.5 hover:bg-white hover:text-[var(--iy-ink)] transition-all duration-300 active:scale-95">
            Explore Menu
          </a>
        </div>
      </div>
    </section>
  );
}

export default function PublicHomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, customer } = useApp();
  return (
    <div className="ieyal min-h-screen w-full">
      <SiteNavbar
        onLoginClick={() => navigate(isLoggedIn ? "/home" : "/login")}
        isLoggedIn={isLoggedIn}
        customerName={customer?.name}
      />
      <Hero />
      <ExploreMenu />
      <FeaturedDishes />
      <TrustStrip />
      <ClosingCTA />
      <SiteFooter />
    </div>
  );
}
