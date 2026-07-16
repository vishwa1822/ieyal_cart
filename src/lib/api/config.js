export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://backend2.owct.me";
export const ORG_DOMAIN = import.meta.env.VITE_ORG_DOMAIN || "ieyal";

export const ENDPOINTS = {
  organization: {
    getOrg: "/organization/get-org",
    getOutlets: "/organization/outlets/get-all",
    getStoreStatus: (orgId) => `/organization/get-store-status/${orgId}`,
  },
  settings: {
    get: "/setting/get",
  },
  customer: {
    login: "/customer/login",
    verifyOtp: "/customer/verify-otp",
    getAddresses: "/customer/get-addresses",
    createAddress: "/customer/create-address",
  },
  location: {
    geoLocation: "/location/customer-geo-location",
    getLatLng: "/location/customer-get-latlng",
  },
  product: {
    getCategories: "/category/getCategory",
    getItemDetail: "/item/getItemDetail",
  },
  cart: {
    getDetails: "/cart/get-cart-details",
    create: "/cart/create",
    update: "/cart/update",
    updateAddon: "/cart/update-addon",
    updateVariation: "/cart/update-variation",
    customizeAddon: "/cart/customize-addon",
    deleteItem: "/cart/delete",
    updateInstruction: "/cart/update-instruction",
    updateOrderType: "/cart/update-order-type",
  },
  discount: {
    getUserDiscounts: "/discount/get-user-discounts",
    applyToCart: "/discount/applyToCart",
  },
  banner: {
    getActive: "/banner/get-active",
  },
  order: {
    getAllByCustomer: "/order/get-all-order-by-customer",
  },
};
