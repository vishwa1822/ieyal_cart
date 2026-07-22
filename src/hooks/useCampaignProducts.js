import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { productApi } from "@/lib/api/services";
import { ApiError } from "@/lib/api/client";

// Loads categories + items scoped to a chosen campaign/date/slot via
// POST /category/preOrder { outletId, belongsTo, preBookId, orderType,
// preOrderDate, preOrderTime } → { status, data: Category[] } where each
// category already carries its own populated `items[]`. `apiRequest`
// (client.js) resolves with the parsed JSON body itself — i.e. this hook's
// `res` IS the axios-style `response.data` — so the categories array is
// `res.data`, never `res.data.data` or any other shape.
//
// The backend rejects a slot that has already passed (400 — "Cannot book
// a slot that has already passed") or is otherwise no longer valid. That
// is a distinct state from "this slot genuinely has no products": it
// means the booking itself needs to change, not that the menu is empty.
// `error` here is the backend's own message so the page can show it
// verbatim and point the guest back to Campaign Details, rather than
// sitting on a skeleton or silently showing "No products".
//
// Request versioning instead of a dedup-key + cancelled-flag guard:
// each effect run stamps a fresh requestId, and only the response whose
// id still matches the latest one is applied to state. A dedup key
// combined with a per-call `cancelled` closure looks safe but is not
// StrictMode-safe — the simulated mount→cleanup→mount sequence sets
// `cancelled = true` on the *first* call before it resolves, then the
// key-match guard skips starting a second call entirely, so the first
// call's `finally` sees `cancelled === true` and never clears loading
// even though the request actually succeeded. Versioning sidesteps that
// entirely: a superseded response is simply ignored, and the effect is
// always free to start a fresh request when its inputs actually change.
export default function useCampaignProducts(campaignId, orderType, date, time) {
  const { outlet, belongsTo, token } = useApp();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);
  const [retryTick, setRetryTick] = useState(0);

  const retry = useCallback(() => setRetryTick((t) => t + 1), []);

  useEffect(() => {
    if (!outlet?._id || !campaignId || !orderType || !date || !time) {
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await productApi.getPreOrderCategories({
          outletId: outlet._id,
          belongsTo,
          preBookId: campaignId,
          orderType,
          preOrderDate: date,
          preOrderTime: time,
        }, token);

        if (requestIdRef.current !== requestId) return; // a newer request has since started; ignore this stale response

        // response.data.data, unwrapped one level by apiRequest already:
        // `res` here is that inner { status, data } body, so the
        // categories array is `res.data` — each entry already has items[].
        const list = Array.isArray(res?.data) ? res.data : [];
        setCategories(list);
      } catch (e) {
        if (requestIdRef.current !== requestId) return;
        const message = e instanceof ApiError
          ? (e.data?.message || e.message || "This booking slot is no longer valid.")
          : "Couldn't reach the server. Please check your connection and try again.";
        setError(message);
        setCategories([]);
      } finally {
        if (requestIdRef.current === requestId) setLoading(false);
      }
    })();
  }, [outlet, belongsTo, token, campaignId, orderType, date, time, retryTick]);

  return { categories, loading, error, retry };
}
