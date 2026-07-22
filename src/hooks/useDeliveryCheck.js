import { useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { deliveryApi } from "@/lib/api/services";
import { getSavedAddress } from "@/lib/theme";

// Validates delivery availability for the guest's saved address against
// POST /delivery/check { belongsTo, outletId, pincode, state, country }.
// Pure on-demand check (not auto-run) — callers decide when it matters,
// e.g. only once "Door Delivery" is the chosen order type.
export default function useDeliveryCheck() {
  const { outlet, belongsTo, token } = useApp();
  const [status, setStatus] = useState("idle"); // idle | checking | available | unavailable | error
  const [message, setMessage] = useState("");

  const check = useCallback(async () => {
    const address = getSavedAddress();
    if (!address?.pincode) {
      setStatus("error");
      setMessage("Add a delivery address to check availability.");
      return false;
    }
    if (!outlet?._id) return false;

    setStatus("checking");
    setMessage("");
    try {
      const res = await deliveryApi.check({
        belongsTo,
        outletId: outlet._id,
        pincode: address.pincode,
        state: address.state || "Tamil Nadu",
        country: address.country || "India",
      }, token);

      const available = res?.available === true;
      setStatus(available ? "available" : "unavailable");
      setMessage(res?.message || (available ? "Delivery is available for your location" : "Delivery isn't available for your location"));
      return available;
    } catch (e) {
      setStatus("error");
      setMessage(e?.data?.message || e?.message || "Couldn't verify delivery availability.");
      return false;
    }
  }, [outlet, belongsTo, token]);

  const reset = useCallback(() => { setStatus("idle"); setMessage(""); }, []);

  return { status, message, check, reset };
}
