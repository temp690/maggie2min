import fs from 'fs';
import path from 'path';
import {
  MenuCategory,
  MenuItem,
  Order,
  OrderStatus,
  PaymentStatus,
  StoreSettings,
  CustomerReview,
  DishSuggestion,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const SUGGESTIONS_FILE = path.join(DATA_DIR, 'suggestions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function safeReadJSON<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      safeWriteJSON(filePath, fallback);
      return fallback;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return fallback;
  }
}

function safeWriteJSON<T>(filePath: string, data: T): void {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (_) {}
    }
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

// ----------------- SETTINGS -----------------

export function getSettings(): StoreSettings {
  return safeReadJSON<StoreSettings>(SETTINGS_FILE, {
    storeName: "Crave O'Clock",
    tagline: "Hot Maggi & Midnight Pasta Delivered To Your Room Door",
    hostelName: "Boys Hostel 2 / Campus Residences",
    pickupLocation: "Room 304, 3rd Floor, Block B",
    adminPhone: "919876543210",
    adminPin: "hostel123",
    upiId: "hostelkitchen@upi",
    upiName: "Crave O'Clock",
    deliveryFee: 0,
    storeSchedule: {
      autoScheduleEnabled: false,
      openTime: "22:00",
      closeTime: "04:00",
    },
    statusOverride: {
      isManualOverride: true,
      isOpen: true,
    },
    emergencyControls: {
      isPaused: false,
      pauseTitle: "Orders Temporarily Paused",
      pauseMessage: "We are boiling water for the next batch! Resuming orders in 15 minutes 🍳",
      highDemandBanner: {
        enabled: false,
        message: "🔥 High demand rush! Maggi prep time is currently ~20-25 mins.",
      },
    },
    whatsappWebhookUrl: "",
  });
}

export function updateSettings(partial: Partial<StoreSettings>): StoreSettings {
  const current = getSettings();
  const updated: StoreSettings = {
    ...current,
    ...partial,
    storeSchedule: {
      ...current.storeSchedule,
      ...(partial.storeSchedule || {}),
    },
    statusOverride: {
      ...current.statusOverride,
      ...(partial.statusOverride || {}),
    },
    emergencyControls: {
      ...current.emergencyControls,
      ...(partial.emergencyControls || {}),
      highDemandBanner: {
        ...current.emergencyControls?.highDemandBanner,
        ...(partial.emergencyControls?.highDemandBanner || {}),
      },
    },
  };
  safeWriteJSON(SETTINGS_FILE, updated);
  return updated;
}

export function checkIsStoreOpen(settings: StoreSettings): { isOpen: boolean; reason?: string } {
  if (settings.statusOverride?.isManualOverride) {
    if (!settings.statusOverride.isOpen) {
      return { isOpen: false, reason: "Store is currently marked closed by kitchen admin." };
    }
    return { isOpen: true };
  }

  if (settings.storeSchedule?.autoScheduleEnabled) {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    const { openTime, closeTime } = settings.storeSchedule;

    let inSchedule = false;
    if (openTime > closeTime) {
      inSchedule = currentTimeStr >= openTime || currentTimeStr <= closeTime;
    } else {
      inSchedule = currentTimeStr >= openTime && currentTimeStr <= closeTime;
    }

    if (!inSchedule) {
      return {
        isOpen: false,
        reason: `Midnight kitchen operates from ${openTime} to ${closeTime}. See you tonight! 🌙`,
      };
    }
  }

  return { isOpen: true };
}

// ----------------- MENU -----------------

export function getMenu(): { categories: MenuCategory[] } {
  return safeReadJSON<{ categories: MenuCategory[] }>(MENU_FILE, { categories: [] });
}

export function updateMenuItem(itemId: string, updates: Partial<MenuItem>): MenuItem | null {
  const menuData = safeReadJSON<{ categories: MenuCategory[] }>(MENU_FILE, { categories: [] });
  let updatedItem: MenuItem | null = null;

  for (const cat of menuData.categories) {
    for (let i = 0; i < cat.items.length; i++) {
      if (cat.items[i].id === itemId) {
        cat.items[i] = {
          ...cat.items[i],
          ...updates,
          // ensure basePrice is numeric
          basePrice: updates.basePrice !== undefined ? Number(updates.basePrice) : cat.items[i].basePrice,
        };
        updatedItem = cat.items[i];
        break;
      }
    }
    if (updatedItem) break;
  }

  if (updatedItem) {
    safeWriteJSON(MENU_FILE, menuData);
  }
  return updatedItem;
}

// ----------------- ORDERS -----------------

export function getOrders(): Order[] {
  return safeReadJSON<Order[]>(ORDERS_FILE, []);
}

export function getOrderById(id: string): Order | null {
  const orders = getOrders();
  return orders.find((o) => o.id.toUpperCase() === id.toUpperCase()) || null;
}

export function createOrder(
  orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Order {
  const orders = getOrders();
  const nextNumber = orders.length + 1;
  const shortId = `HNB-${1000 + nextNumber}`;

  const newOrder: Order = {
    ...orderPayload,
    id: shortId,
    orderNumber: nextNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.unshift(newOrder); // newest first
  safeWriteJSON(ORDERS_FILE, orders);
  return newOrder;
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus,
  paymentStatus?: PaymentStatus
): Order | null {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id.toUpperCase() === id.toUpperCase());

  if (index === -1) return null;

  const current = orders[index];
  const updated: Order = {
    ...current,
    status,
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(paymentStatus === 'paid' && !current.verifiedAt ? { verifiedAt: new Date().toISOString() } : {}),
    updatedAt: new Date().toISOString(),
  };

  orders[index] = updated;
  safeWriteJSON(ORDERS_FILE, orders);
  return updated;
}

// ----------------- REVIEWS -----------------

export function getReviews(): CustomerReview[] {
  return safeReadJSON<CustomerReview[]>(REVIEWS_FILE, []);
}

export function addReview(reviewPayload: Omit<CustomerReview, 'id' | 'createdAt'>): CustomerReview {
  const reviews = getReviews();
  const newReview: CustomerReview = {
    ...reviewPayload,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  reviews.unshift(newReview);
  safeWriteJSON(REVIEWS_FILE, reviews);
  return newReview;
}

// ----------------- DISH SUGGESTIONS -----------------

export function getSuggestions(): DishSuggestion[] {
  return safeReadJSON<DishSuggestion[]>(SUGGESTIONS_FILE, []);
}

export function voteSuggestion(suggestionId: string): DishSuggestion | null {
  const suggestions = getSuggestions();
  const item = suggestions.find((s) => s.id === suggestionId);
  if (!item) return null;

  item.votes = (item.votes || 0) + 1;
  safeWriteJSON(SUGGESTIONS_FILE, suggestions);
  return item;
}

export function addCustomSuggestion(title: string, suggestedBy?: string, icon?: string, description?: string): DishSuggestion {
  const suggestions = getSuggestions();
  const newSug: DishSuggestion = {
    id: `sug-${Date.now()}`,
    title: title.trim(),
    description: description ? description.trim() : undefined,
    votes: 1,
    suggestedBy: (suggestedBy || '').trim() || 'Anonymous Student',
    icon: icon ? icon.trim() : '✨',
  };
  suggestions.push(newSug);
  safeWriteJSON(SUGGESTIONS_FILE, suggestions);
  return newSug;
}

export function updateSuggestion(id: string, updates: Partial<DishSuggestion>): DishSuggestion | null {
  const suggestions = getSuggestions();
  const index = suggestions.findIndex((s) => s.id === id);
  if (index === -1) return null;

  suggestions[index] = {
    ...suggestions[index],
    ...updates,
    votes: updates.votes !== undefined ? Number(updates.votes) : suggestions[index].votes,
  };
  safeWriteJSON(SUGGESTIONS_FILE, suggestions);
  return suggestions[index];
}

export function deleteSuggestion(id: string): boolean {
  const suggestions = getSuggestions();
  const filtered = suggestions.filter((s) => s.id !== id);
  if (filtered.length === suggestions.length) return false;
  safeWriteJSON(SUGGESTIONS_FILE, filtered);
  return true;
}
