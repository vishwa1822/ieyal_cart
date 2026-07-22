// Pre Booking backend model — see AppContext.preBooking / preBookingApi.getActive.
// Mirrors the documented POST /preBooking/getActive response exactly.

export interface Campaign {
  preBookingId: string;
  preBookingName: string;
  description?: string | null;
  image?: string;
  allowedOrderTypes: string[]; // subset of ["Door Delivery", "Self Pickup"]
  availableDates: string[]; // "YYYY-MM-DD", positionally paired with slotCount
  unAvailableDates: string[]; // "YYYY-MM-DD"
  timeSlots: string[]; // "HH:mm:ss", shared across every available date
  slotCount: number[]; // capacity per entry in availableDates

  // Convenience aliases added client-side by usePreBookingCampaigns, so
  // existing `_id` / `name` lookup code works without special-casing this
  // endpoint's field names.
  _id?: string;
  name?: string;
}

// Local selection state carried Pre Booking → Cart → Checkout.
export interface PreBookingSelection {
  campaign: Campaign | null;
  orderType: "Door Delivery" | "Self Pickup" | null;
  date: string | null; // "YYYY-MM-DD"
  slot: { startTime: string; label?: string } | null; // startTime is "HH:mm:ss"
}
