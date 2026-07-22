export interface CheckOutSettings {
  showRewards: boolean;
  calculateLoyality: boolean;
  applyDiscount: boolean;
  enableDiscounts: boolean;
  loyaltyMinimumAmount: number;
}

export interface BannerSettings {
  enable: boolean;
  autoScroll: boolean;
}

export interface OutletSettings {
  preBookingEnabled: boolean;
  checkOutSettings: CheckOutSettings;
  paymentMode: string[];
  defaultPaymentMode: string;
  banner: BannerSettings;
  isInvoicePdfGenerated: boolean;
  pos: string;
  deliveryPoints: boolean;
}
