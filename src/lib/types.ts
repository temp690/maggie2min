export type OrderStatus = 'received' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending_verification' | 'paid' | 'cod_verified' | 'cancelled';
export type PaymentMethod = 'upi' | 'cash_on_delivery' | 'mock_paid';
export type DeliveryType = 'room' | 'pickup';

export interface Addon {
  id: string;
  name: string;
  price: number;
  type: 'flavor' | 'topping' | 'free_seasoning';
  icon?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  category: 'maggi' | 'pasta' | string;
  available: boolean;
  tag?: string;
  image?: string;
  description: string;
  addons?: Addon[];
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  description: string;
  items: MenuItem[];
}

export interface OrderItem {
  id: string; // unique item instance id in cart
  menuItemId: string;
  name: string;
  basePrice: number;
  selectedAddons: Addon[];
  quantity: number;
  itemTotalPrice: number;
}

export interface Order {
  id: string; // e.g. "HNB-1001"
  orderNumber: number;
  customerName: string;
  roomNumber: string;
  phoneNumber: string;
  notes?: string;
  deliveryType: DeliveryType;
  deliveryFee: number;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerReview {
  id: string;
  orderId?: string;
  customerName: string;
  roomNumber?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface DishSuggestion {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  votes: number;
  suggestedBy?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  hostelName: string;
  pickupLocation: string;
  adminPhone: string;
  adminPin: string;
  upiId: string;
  upiName: string;
  deliveryFee: number;
  currentDay?: number;
  phase?: number;
  storeSchedule: {
    autoScheduleEnabled: boolean;
    openTime: string;
    closeTime: string;
  };
  statusOverride: {
    isManualOverride: boolean;
    isOpen: boolean;
  };
  emergencyControls: {
    isPaused: boolean;
    pauseTitle: string;
    pauseMessage: string;
    highDemandBanner: {
      enabled: boolean;
      message: string;
    };
  };
  whatsappWebhookUrl?: string;
}
