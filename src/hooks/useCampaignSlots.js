import { useMemo } from "react";

// Converts a 24-hour "HH:mm:ss" string into a friendly 12-hour label, and
// keeps the original value around for the API payload (preOrderTime expects
// the raw "HH:mm:ss" string, not the display label).
function to12Hour(time24) {
  const [hh, mm] = (time24 || "00:00").split(":").map(Number);
  const period = hh >= 12 ? "PM" : "AM";
  const displayH = hh % 12 === 0 ? 12 : hh % 12;
  return `${displayH}:${String(mm).padStart(2, "0")} ${period}`;
}

function parseDateOnly(dateStr) {
  // "YYYY-MM-DD" parsed as local midnight, not UTC — avoids the day
  // shifting backward/forward depending on the browser's timezone offset.
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function isSameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Derives the bookable days and per-day time-slot options directly from the
// documented preBooking/getActive model: a flat `availableDates[]` (each
// entry paired positionally with `slotCount[]`), a flat `unAvailableDates[]`
// for explicitly closed days, and a single flat `timeSlots[]` shared across
// every available day. No day-of-week/interval expansion — the backend
// already returns the exact bookable dates and times.
export default function useCampaignSlots(campaign) {
  const days = useMemo(() => {
    if (!campaign?.availableDates?.length) return [];
    return campaign.availableDates.map((dateStr, i) => ({
      dateStr,
      date: parseDateOnly(dateStr),
      slotCount: campaign.slotCount?.[i] ?? 1,
      available: (campaign.slotCount?.[i] ?? 1) > 0 && !campaign.unAvailableDates?.includes(dateStr),
    }));
  }, [campaign]);

  // If the selected day is today, a time slot earlier than "now" has
  // already passed and the backend will reject a booking for it (400
  // "Cannot book a slot that has already passed"). Filtering those out
  // client-side means the guest never sees or can tap a dead slot in
  // the first place, rather than discovering it only after Book Now.
  const slotsForDay = (dayIndex) => {
    const day = days[dayIndex];
    if (!day || !day.available || !campaign?.timeSlots?.length) return [];
    const now = new Date();
    const isToday = isSameLocalDay(day.date, now);
    return campaign.timeSlots
      .filter((t) => {
        if (!isToday) return true;
        const [hh, mm, ss] = t.split(":").map(Number);
        const slotDate = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), hh || 0, mm || 0, ss || 0);
        return slotDate.getTime() > now.getTime();
      })
      .map((t) => ({ value: t, label: to12Hour(t) }));
  };

  return { days, slotsForDay, to12Hour };
}
