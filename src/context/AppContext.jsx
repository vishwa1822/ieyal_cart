import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  organizationApi,
  settingsApi,
  bannerApi,
  productApi,
  discountApi,
  extractCarts,
} from "@/lib/api/services";
import {
  applyTheme,
  loadCachedTheme,
  getToken,
  getCustomer,
  saveAuth,
  clearAuth,
  getSavedOutlet,
  saveOutlet,
  getOrderType,
  saveOrderType,
} from "@/lib/theme";

const AppContext = createContext(null);

const DEFAULT_LOCATION = { lat: 10.777460082400633, lng: 79.63451395714621 };

export function AppProvider({ children }) {
  const [bootState, setBootState] = useState("loading"); // loading | ready | closed | error
  const [org, setOrg] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [outlet, setOutletState] = useState(getSavedOutlet());
  const [settings, setSettings] = useState(null);
  const [token, setToken] = useState(getToken());
  const [customer, setCustomer] = useState(getCustomer());
  const [orderType, setOrderTypeState] = useState(getOrderType());
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartData, setCartData] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [quantities, setQuantities] = useState({});

  const updateCartFromCarts = useCallback((carts) => {
    const firstCart = carts?.[0];
    if (firstCart) {
      setActiveOrderId(firstCart.orderId || firstCart._id);
      const qMap = {};
      const allItems = [];
      carts.forEach((cart) => {
        (cart.items || []).forEach((item) => {
          const id = item.product_retailer_id || item.itemId || item._id;
          if (id) qMap[id] = (qMap[id] || 0) + (item.quantity || 1);

          const unitPrice =
            item.itemPrice ??
            item.sellingPrice ??
            item.price ??
            item.rate ??
            item.basePrice ??
            item.mrp ??
            0;
          const lineQty = item.quantity || 1;
          allItems.push({
            id: item._id || item.cartRowId || item.product_retailer_id || item.itemId,
            productId: item.product_retailer_id || item.itemId,
            cartRowId: item._id || item.itemId,
            orderId: cart.orderId || cart._id,
            name: item.itemName || item.name || "Item",
            variation: item.variationName || item.variantName || "",
            variationId: item.variationId || "",
            addOnDetails: item.addOnDetails || [],
            addons: (item.addOnDetails || [])
              .map((a) => a.name || a.addon_item_name || a.addonName)
              .filter(Boolean)
              .join(", "),
            qty: lineQty,
            price: unitPrice,
            total: item.itemTotal ?? item.lineTotal ?? item.amount ?? (unitPrice * lineQty),
            image: item.itemImage || item.image || null,
          });
        });
      });
      setCartItems(allItems);
      setCartData(carts);
      setQuantities(qMap);
      setCartCount(allItems.reduce((s, it) => s + it.qty, 0));
    } else {
      setActiveOrderId(null);
      setCartItems([]);
      setCartData(null);
      setQuantities({});
      setCartCount(0);
    }
  }, [setCartCount]);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, source }

  // Derive belongsTo from the organization API response
  const belongsTo = "69b256ec99b143835b75ee69"; // Hardcoded from user request

  const setOutlet = useCallback((o) => {
    setOutletState(o);
    if (o) saveOutlet(o);
  }, []);

  const setOrderType = useCallback((type) => {
    setOrderTypeState(type);
    saveOrderType(type);
  }, []);

  // Re-fetches outlets sorted by a real resolved location (from browser
  // geolocation, a saved address, or manual pin-drop) instead of the
  // hardcoded boot default. This is the missing link that makes "Allow
  // location access" actually change what the person sees, rather than
  // just being a UI gate in front of a fixed outlet list.
  const refreshOutletsForLocation = useCallback(async ({ lat, lng, source }) => {
    if (!belongsTo || lat == null || lng == null) return;
    setUserLocation({ lat, lng, source });
    try {
      const outletsRes = await organizationApi.getOutlets(belongsTo, lat, lng);
      const list =
        outletsRes.data?.outlets ||
        (Array.isArray(outletsRes.data) ? outletsRes.data : null) ||
        outletsRes.outlets ||
        (Array.isArray(outletsRes) ? outletsRes : null) ||
        [];
      setOutlets(list);
      const nearest = list.find((o) => o.storeStatus && o.isActive) || list[0];
      if (nearest) setOutlet(nearest);
    } catch { /* keep existing outlet list on failure */ }
  }, [belongsTo, setOutlet]);

  const login = useCallback((newToken, newCustomer) => {
    saveAuth(newToken, newCustomer);
    setToken(newToken);
    setCustomer(newCustomer);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setCustomer(null);
    setCartCount(0);
    setCartData(null);
    setCartItems([]);
    setActiveOrderId(null);
    setQuantities({});
  }, []);

  // Boot: Get Organization → Get Outlets
  useEffect(() => {
    loadCachedTheme();
    (async () => {
      try {
        // API 1: POST /organization/get-org { domain: "ieyal" }
        const orgRes = await organizationApi.getOrg();
        const orgData = orgRes.data?.organization;
        setOrg(orgRes.data);

        if (orgData?.theme?.config) {
          applyTheme(orgData.theme.config);
        }

        // API 2: POST /organization/outlets/get-all { belongsTo, locationSorting, lat, lng }
        const outletsRes = await organizationApi.getOutlets(
          belongsTo,
          DEFAULT_LOCATION.lat,
          DEFAULT_LOCATION.lng
        );
        // Defensive parse — backend may return outlets in several shapes:
        // { data: { outlets: [...] } }  |  { data: [...] }  |  { outlets: [...] }  |  [...]
        const list =
          outletsRes.data?.outlets ||
          (Array.isArray(outletsRes.data) ? outletsRes.data : null) ||
          outletsRes.outlets ||
          (Array.isArray(outletsRes) ? outletsRes : null) ||
          [];
        console.log("[Outlets API] raw response:", outletsRes);
        console.log("[Outlets API] parsed list:", list, "| count:", list.length);
        setOutlets(list);

        // Auto-select outlet
        const saved = getSavedOutlet();
        const selected = saved && list.find((o) => o._id === saved._id)
          ? saved
          : list.find((o) => o.storeStatus && o.isActive) || list[0];

        if (selected) setOutlet(selected);

        const storeOpen = orgData?.isStoreOpen !== false;
        setBootState(storeOpen ? "ready" : "closed");
      } catch (e) {
        setError(e.message);
        setBootState("error");
      }
    })();
  }, [setOutlet]);

  // Load outlet-specific data: Settings, Banners, Categories, Discounts
  useEffect(() => {
    if (!outlet || !belongsTo) return;
    (async () => {
      try {
        // API 4: POST /setting/get { outletId, belongsTo }
        // API Banner: POST /banner/get-active { outletId, belongsTo }
        const [settingsRes, bannerRes] = await Promise.all([
          settingsApi.get(outlet._id, belongsTo).catch(() => null),
          bannerApi.getActive(outlet._id, belongsTo).catch(() => ({})),
        ]);
        if (settingsRes) setSettings(settingsRes.data || settingsRes);
        // Banner shape: { data: [] } OR { banners: [] } OR { data: { banners: [] } }
        const bannerList = bannerRes?.data?.banners || bannerRes?.data || bannerRes?.banners || [];
        setBanners(Array.isArray(bannerList) ? bannerList : []);

        // API Product: POST /category/getCategory { outletId, belongsTo, customerId }
        const catRes = await productApi.getCategories(
          outlet._id,
          belongsTo,
          customer?._id,
          token
        ).catch(() => ({}));
        // Category shape: { data: [] } OR { data: { categories: [] } } OR []
        const catList = catRes?.data?.categories || catRes?.data || catRes?.categories || [];
        setCategories(Array.isArray(catList) ? catList : []);

        // Discounts (requires auth)
        if (token) {
          const discRes = await discountApi.getUserDiscounts(outlet._id, token).catch(() => ({}));
          const discList = discRes?.data?.discounts || discRes?.data || discRes?.discounts || [];
          setDiscounts(Array.isArray(discList) ? discList : []);
        }
      } catch { /* non-blocking */ }
    })();
  }, [outlet, belongsTo, token, customer]);

  const value = {
    bootState,
    org,
    outlets,
    outlet,
    setOutlet,
    settings,
    token,
    customer,
    login,
    logout,
    isLoggedIn: !!token,
    orderType,
    setOrderType,
    banners,
    categories,
    setCategories,
    discounts,
    cartCount,
    setCartCount,
    belongsTo,
    cartData,
    setCartData,
    cartItems,
    setCartItems,
    activeOrderId,
    setActiveOrderId,
    quantities,
    setQuantities,
    updateCartFromCarts,
    error,
    orgName: org?.organization?.name || "OwnCart",
    orgLogo: org?.organization?.logoImage,
    isStoreOpen: org?.organization?.isStoreOpen !== false,
    isCartEnabled: org?.organization?.isCartEnabled !== false,
    hasMultipleOutlets: org?.organization?.hasMultipleOutlets,
    isDeliveryAvailable: org?.organization?.isDoorDeliveryAvailable,
    isPickupAvailable: org?.organization?.isSelfPickupAvailable,
    userLocation,
    refreshOutletsForLocation,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
