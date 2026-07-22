import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { preBookingApi } from "@/lib/api/services";

// Normalizes one raw preBooking/getActive record into the shape every Pre
// Booking page reads from. Keeps every documented field as-is and layers on
// `_id` / `name` aliases (matching the `_id` / `name` convention used by
// campaign/category/item objects elsewhere in the app) so existing card,
// route-param and lookup code doesn't need to special-case this endpoint's
// field names.
function normalizeCampaign(raw) {
  if (!raw) return raw;
  return {
    ...raw,
    _id: raw.preBookingId,
    name: raw.preBookingName,
  };
}

// Single fetch point for "active campaigns" used by the listing, details,
// slot and product pages, so the request/response-shape tolerance lives in
// exactly one place instead of being duplicated per page.
export default function usePreBookingCampaigns() {
  const { outlet, belongsTo, token } = useApp();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!outlet?._id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        // POST /preBooking/getActive { outletId, belongsTo }
        // → { success, count, data: [{ preBookingId, preBookingName,
        //     description, image, allowedOrderTypes[], availableDates[],
        //     unAvailableDates[], timeSlots[], slotCount[] }] }
        const res = await preBookingApi.getActive(outlet._id, belongsTo, token);
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) setCampaigns(list.map(normalizeCampaign));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [outlet, belongsTo, token]);

  return { campaigns, loading, error };
}
