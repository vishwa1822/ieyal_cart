import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarClock, Sparkles, ArrowRight, CalendarDays } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { AppNavbar } from "@/components/layout/AppShell";
import useReveal from "@/hooks/useReveal";
import { BannerSkeleton } from "@/pages/LoadingStates";
import BannerStrip from "@/components/shared/BannerStrip";
import { openBannerLink } from "@/lib/bannerLink";
import { OrderTypeBadges, formatValidity } from "@/components/shared/PreBookingBits";
import usePreBookingCampaigns from "@/hooks/usePreBookingCampaigns";

function CampaignCard({ campaign, onView }) {
  const validity = formatValidity(campaign);
  const availableDayCount = campaign.availableDates?.length || 0;
  return (
    <motion.button
      onClick={onView}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="text-left rounded-3xl overflow-hidden bg-[var(--iy-surface)] border border-[var(--iy-border)] shadow-[var(--iy-shadow-xs)] hover:shadow-[var(--iy-shadow-md)] transition-shadow duration-300"
    >
      <div
        className="h-40 sm:h-48 bg-[var(--iy-ink)] relative flex items-end"
        style={campaign.image ? { backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0.05)), url(${campaign.image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {!campaign.image && <Sparkles className="absolute top-4 right-4 h-5 w-5 text-white/50" />}
      </div>
      <div className="p-5 space-y-2.5">
        <p className="iy-serif text-lg font-medium text-[var(--iy-ink)] truncate">{campaign.name}</p>
        {campaign.description && (
          <p className="text-sm text-[var(--iy-ink-soft)] line-clamp-2">{campaign.description}</p>
        )}
        {validity && <p className="text-xs font-medium text-[var(--iy-accent)]">{validity}</p>}
        {!validity && availableDayCount > 0 && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--iy-accent)]">
            <CalendarDays className="h-3.5 w-3.5" /> {availableDayCount} day{availableDayCount > 1 ? "s" : ""} to book
          </p>
        )}
        <OrderTypeBadges allowedOrderTypes={campaign.allowedOrderTypes} />
        <div className="pt-1.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--iy-accent)]">
          View Details <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </motion.button>
  );
}

export default function PreBookingListPage() {
  const navigate = useNavigate();
  const { isStoreOpen, isPreBookingEnabled, banners } = useApp();
  const { campaigns, loading, error } = usePreBookingCampaigns();
  const headerRef = useReveal();

  if (!isStoreOpen) return <Navigate to="/closed" replace />;
  if (!loading && !isPreBookingEnabled) return <Navigate to="/home" replace />;

  return (
    <div className="ieyal min-h-screen w-full">
      <AppNavbar />
      <div className="pt-24 lg:pt-28 pb-16">
        <div className="max-w-desktop mx-auto px-5 space-y-6">
          <h1
            ref={headerRef}
            className="iy-reveal text-2xl sm:text-3xl font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]"
          >
            PRE BOOKING
          </h1>

          {/* Banner section with text overlay — sourced entirely from banner/get-active */}
          <div className="relative rounded-3xl overflow-hidden shadow-[var(--iy-shadow-xs)]">
            <BannerStrip
              banners={banners}
              className="h-40 lg:h-56"
              onBannerClick={(b) => openBannerLink(b, navigate)}
            />
            {/* Subtle dark gradient overlay behind the text to ensure readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none flex flex-col justify-center px-6 sm:px-12 md:px-16">
              <div className="max-w-[85%] sm:max-w-[70%] text-white space-y-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                  Book ahead, order later
                </h2>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
                  Reserve your favourites from a limited-time campaign and pick a slot that works for you.
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => <BannerSkeleton key={i} />)}
            </div>
          )}

          {!loading && error && (
            <p className="text-sm text-danger text-center py-10">Couldn't load campaigns. Please try again shortly.</p>
          )}

          {!loading && !error && campaigns.length === 0 && (
            <div className="text-center py-16">
              <CalendarClock className="h-8 w-8 text-[var(--iy-ink-soft)] mx-auto mb-3" />
              <p className="text-[var(--iy-ink)] font-medium">No active pre-booking campaigns right now</p>
              <p className="text-sm text-[var(--iy-ink-soft)] mt-1">Check back soon, or explore the regular menu.</p>
              <button onClick={() => navigate("/home")} className="mt-5 text-sm font-semibold text-[var(--iy-accent)] hover:underline underline-offset-2">
                Back to Home
              </button>
            </div>
          )}

          {!loading && campaigns.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaigns.map((c) => (
                <CampaignCard key={c._id} campaign={c} onView={() => navigate(`/pre-booking/${c._id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
