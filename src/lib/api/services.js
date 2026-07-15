import { apiRequest } from "./client";
import { ENDPOINTS, ORG_DOMAIN } from "./config";

// ── Shared cart response parser ────────────────────────────────────────────
// The backend returns carts in many different shapes depending on endpoint:
//   { data: [...] }  |  { data: { orders: [...] } }  |  { orders: [...] }  |
//   [...]  |  { items: [...] }  (a single cart object)
export function extractCarts(resObj) {
  if (!resObj) return [];
  // Direct array
  if (Array.isArray(resObj)) return resObj;
  // Wrapped in .data
  if (resObj.data !== undefined) {
    if (Array.isArray(resObj.data)) return resObj.data;
    if (resObj.data && typeof resObj.data === "object") {
      if (Array.isArray(resObj.data.orders)) return resObj.data.orders;
      if (Array.isArray(resObj.data.carts)) return resObj.data.carts;
      // Single cart object with items array
      if (Array.isArray(resObj.data.items)) return [resObj.data];
    }
  }
  // Not wrapped — top-level arrays
  if (Array.isArray(resObj.orders)) return resObj.orders;
  if (Array.isArray(resObj.carts)) return resObj.carts;
  // Single cart object at top level
  if (Array.isArray(resObj.items)) return [resObj];
  return [];
}

// ── Organization ──────────────────────────────────────────────────────────
export const organizationApi = {
  // POST /organization/get-org  { domain: "ieyal" }
  getOrg: () => apiRequest(ENDPOINTS.organization.getOrg, { body: { domain: ORG_DOMAIN } }),

  // POST /organization/outlets/get-all  { belongsTo, locationSorting, lat, lng }
  getOutlets: (belongsTo, lat, lng) =>
    apiRequest(ENDPOINTS.organization.getOutlets, {
      body: { belongsTo, locationSorting: true, lat, lng },
    }),

  // POST /organization/get-store-status/:orgId  { outletId, belongsTo }
  getStoreStatus: (orgId, outletId, belongsTo) =>
    apiRequest(ENDPOINTS.organization.getStoreStatus(orgId), {
      body: { outletId, belongsTo },
    }),
};

// ── Settings ──────────────────────────────────────────────────────────────
export const settingsApi = {
  // POST /setting/get  { outletId, belongsTo }
  get: (outletId, belongsTo) =>
    apiRequest(ENDPOINTS.settings.get, { body: { outletId, belongsTo } }),
};

// ── Customer ──────────────────────────────────────────────────────────────
export const customerApi = {
  // POST /customer/login  { phone, belongsTo, mode: "otp" }
  login: (phone, belongsTo) =>
    apiRequest(ENDPOINTS.customer.login, { body: { phone, belongsTo, mode: "otp" } }),

  // POST /customer/verify-otp  { phone, belongsTo, otp }
  verifyOtp: (phone, belongsTo, otp) =>
    apiRequest(ENDPOINTS.customer.verifyOtp, { body: { phone, belongsTo, otp } }),

  // POST /customer/get-addresses?page=1&limit=20  { customerPhoneNo, lat, lng }
  getAddresses: (customerPhoneNo, lat, lng, token) =>
    apiRequest(ENDPOINTS.customer.getAddresses, {
      body: { customerPhoneNo, lat, lng },
      token,
      params: { page: 1, limit: 20 },
    }),

  // POST /customer/create-address  { address1, address2, city, state, country, pincode, latitude, longitude, landMark, type }
  createAddress: (payload, token) =>
    apiRequest(ENDPOINTS.customer.createAddress, { body: payload, token }),
};

// ── Location ──────────────────────────────────────────────────────────────
export const locationApi = {
  // POST /location/customer-geo-location  { latitude, longitude, belongsTo }
  geoLocation: (latitude, longitude, belongsTo) =>
    apiRequest(ENDPOINTS.location.geoLocation, {
      body: { latitude, longitude, belongsTo },
    }),

  // POST /location/customer-get-latlng  { enteredAddress, belongsTo }
  getLatLng: (enteredAddress, belongsTo) =>
    apiRequest(ENDPOINTS.location.getLatLng, {
      body: { enteredAddress, belongsTo },
    }),
};

// ── Product ───────────────────────────────────────────────────────────────
export const productApi = {
  // POST /category/getCategory  { outletId, belongsTo, customerId }
  getCategories: (outletId, belongsTo, customerId, token) =>
    apiRequest(ENDPOINTS.product.getCategories, {
      body: { outletId, belongsTo, customerId: customerId || "" },
      token,
    }),

  // POST /item/getItemDetail  { itemId, outletId, variationid? }
  getItemDetail: (itemId, outletId, variationId, token) =>
    apiRequest(ENDPOINTS.product.getItemDetail, {
      body: { itemId, outletId, ...(variationId ? { variationid: variationId } : {}) },
      token,
    }),
};

// ── Cart ──────────────────────────────────────────────────────────────────
export const cartApi = {
  // POST /cart/get-cart-details  { customerPhoneNo, outletId }
  getDetails: (customerPhoneNo, outletId, token) =>
    apiRequest(ENDPOINTS.cart.getDetails, {
      body: { customerPhoneNo, outletId },
      token,
    }),

  // POST /cart/create  { items[], deliveryType, orderType, customerName, customerPhoneNo, instruction, addressId, outletId }
  create: (payload, token) =>
    apiRequest(ENDPOINTS.cart.create, { body: payload, token }),

  // POST /cart/update  { orderId, items[], outletId }
  update: (payload, token) =>
    apiRequest(ENDPOINTS.cart.update, { body: payload, token }),

  // POST /cart/delete/item  { orderId, itemId, outletId }
  deleteItem: (payload, token) =>
    apiRequest(ENDPOINTS.cart.deleteItem, { body: payload, token }),

  // POST /cart/update-instruction  { orderId, instruction, outletId }
  updateInstruction: (payload, token) =>
    apiRequest(ENDPOINTS.cart.updateInstruction, { body: payload, token }),

  // POST /cart/update-order-type  { orderId, orderType, outletId }
  updateOrderType: (payload, token) =>
    apiRequest(ENDPOINTS.cart.updateOrderType, { body: payload, token }),
};

// ── Discount ──────────────────────────────────────────────────────────────
export const discountApi = {
  // POST /discount/get-user-discounts  { outletId }
  getUserDiscounts: (outletId, token) =>
    apiRequest(ENDPOINTS.discount.getUserDiscounts, { body: { outletId }, token }),

  // POST /discount/applyToCart  { orderId, discountCode, outletId }
  applyToCart: (payload, token) =>
    apiRequest(ENDPOINTS.discount.applyToCart, { body: payload, token }),
};

// ── Banner ────────────────────────────────────────────────────────────────
export const bannerApi = {
  // POST /banner/get-active  { outletId, belongsTo }
  getActive: (outletId, belongsTo) =>
    apiRequest(ENDPOINTS.banner.getActive, { body: { outletId, belongsTo } }),
};

// ── Order ─────────────────────────────────────────────────────────────────
export const orderApi = {
  // POST /order/get-all-order-by-customer?page=1&limit=20  {}
  getAllByCustomer: (token, page = 1, limit = 20) =>
    apiRequest(ENDPOINTS.order.getAllByCustomer, {
      body: {},
      token,
      params: { page, limit },
    }),
};
