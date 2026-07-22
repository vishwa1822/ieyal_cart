export interface TimeSlot {
  _id: string;
  from: string;
  to: string;
}

export interface WorkingDay {
  _id: string;
  day: string;
  times: TimeSlot[];
}

export interface WorkingHours {
  isHolidayMode: boolean;
  isWorkingHoursEnabled: boolean;
  days: WorkingDay[];
}

export interface OutletDetails {
  outletName: string;
  contact: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface SetupProgress {
  percentage: number;
  basicDetails: number;
  operatingHours: number;
  deliverySettings: number;
  paymentSettings: number;
  posSettings: number;
}

export interface LocationData {
  type: string;
  coordinates: [number, number];
}

export interface AlertSentInfo {
  date: string | null;
  slot: string | null;
}

export interface Outlet {
  _id: string;
  outletName: string;
  storeStatus: boolean;
  latitude: number;
  longitude: number;
  address: string;
  googleMapUrl: string;
  googleReviewUrl: string;
  outletDetails: OutletDetails;
  isCartEnabled: boolean;
  isDefault?: boolean;
  belongsTo: string;
  location: LocationData;
  wh: WorkingHours;
  setupProgress: SetupProgress;
  posStoreStatus: boolean;
  lastAlertSentInfo: AlertSentInfo;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  isActive: boolean;
  manualOverrideType: string | null;
  overrideEndTime: string | null;
  distance: number;
  currencySymbol: string;
  currencyCode: string;
  orderType: string[]; // e.g., ["Door Delivery", "Self Pickup", "Dine In"]
  deliveryPoints: boolean;
  addressRequiredAtCheckout: boolean;
  deliveryPartner: string;
  selfManageDeliveryType: string;
  defaultOrderType: string | null;
}
