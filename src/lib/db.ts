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

// ============================================================================
// 1. DATA DIRECTORY & FILE FALLBACKS (Used locally or when Upstash is unset)
// ============================================================================
const DATA_DIR = path.join(process.cwd(), 'data');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const SUGGESTIONS_FILE = path.join(DATA_DIR, 'suggestions.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (_) {}
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
  try {
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// ============================================================================
// 2. UPSTASH REDIS REST API CLIENT (Zero dependencies, works natively on Vercel)
// Vercel auto-populates UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// (or KV_REST_API_URL and KV_REST_API_TOKEN)
// ============================================================================
const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  '';

const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  '';

const isRedisAvailable = Boolean(REDIS_URL && REDIS_TOKEN);

async function redisCommand<T>(command: any[]): Promise<T | null> {
  if (!isRedisAvailable) return null;
  try {
    const res = await fetch(`${REDIS_URL.replace(/\/$/, '')}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`Redis command error: ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return (data.result as T) ?? null;
  } catch (error) {
    console.error('Upstash Redis request failed:', error);
    return null;
  }
}

// Low-level helper: Get with fallback to local JSON file
async function getStoredValue<T>(key: string, fileFallback: T): Promise<T> {
  if (isRedisAvailable) {
    const raw = await redisCommand<any>(['GET', key]);
    if (raw !== null && raw !== undefined) {
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw) as T;
        } catch (_) {
          return raw as any;
        }
      }
      return raw as T;
    }
    // Seed initial data from local file into Redis if key is empty
    if (fileFallback !== null && fileFallback !== undefined) {
      setStoredValue(key, fileFallback).catch(() => {});
    }
  }
  return fileFallback;
}

// Low-level helper: Set with write-through to local file
async function setStoredValue<T>(key: string, value: T, filePath?: string): Promise<void> {
  if (filePath) {
    safeWriteJSON(filePath, value);
  }
  if (isRedisAvailable) {
    await redisCommand(['SET', key, JSON.stringify(value)]);
  }
}

// ============================================================================
// 3. SETTINGS
// ============================================================================
export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Crave O'Clock",
  tagline: "Hot Maggi & Midnight Pasta Delivered To Your Room Door",
  hostelName: "Boys Hostel 2 / Campus Residences",
  pickupLocation: "Room 304, 3rd Floor, Block B",
  adminPhone: "919322908622",
  adminPin: "hostel123",
  upiId: "8208500480@ybl",
  upiName: "Gunjan",
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
    pauseMessage: "Orders are temporarily paused. Resuming soon! 🍳",
    highDemandBanner: {
      enabled: false,
      message: "🔥 High demand rush! Prep time is currently ~20-25 mins.",
    },
  },
  whatsappWebhookUrl: "",
};

export async function getSettings(): Promise<StoreSettings> {
  const local = safeReadJSON<StoreSettings>(SETTINGS_FILE, DEFAULT_SETTINGS);
  return getStoredValue<StoreSettings>('settings', local);
}

export async function updateSettings(partial: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getSettings();
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
  await setStoredValue('settings', updated, SETTINGS_FILE);
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

// ============================================================================
// 4. MENU
// ============================================================================
export async function getMenu(): Promise<{ categories: MenuCategory[] }> {
  const local = safeReadJSON<{ categories: MenuCategory[] }>(MENU_FILE, { categories: [] });
  return getStoredValue<{ categories: MenuCategory[] }>('menu', local);
}

export async function updateMenuItem(itemId: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
  const menuData = await getMenu();
  let updatedItem: MenuItem | null = null;

  for (const cat of menuData.categories) {
    for (let i = 0; i < cat.items.length; i++) {
      if (cat.items[i].id === itemId) {
        cat.items[i] = {
          ...cat.items[i],
          ...updates,
          basePrice: updates.basePrice !== undefined ? Number(updates.basePrice) : cat.items[i].basePrice,
        };
        updatedItem = cat.items[i];
        break;
      }
    }
    if (updatedItem) break;
  }

  if (updatedItem) {
    await setStoredValue('menu', menuData, MENU_FILE);
  }
  return updatedItem;
}

// ============================================================================
// 5. ORDERS
// ============================================================================
export async function getOrders(): Promise<Order[]> {
  const local = safeReadJSON<Order[]>(ORDERS_FILE, []);
  return getStoredValue<Order[]>('orders', local);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find((o) => o.id.toUpperCase() === id.toUpperCase()) || null;
}

export async function createOrder(
  orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  const orders = await getOrders();
  const nextNumber = orders.length + 1;
  const shortId = `HNB-${1000 + nextNumber}`;

  const newOrder: Order = {
    ...orderPayload,
    id: shortId,
    orderNumber: nextNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  await setStoredValue('orders', orders, ORDERS_FILE);
  return newOrder;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  paymentStatus?: PaymentStatus
): Promise<Order | null> {
  const orders = await getOrders();
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
  await setStoredValue('orders', orders, ORDERS_FILE);
  return updated;
}

// ============================================================================
// 6. REVIEWS
// ============================================================================
export async function getReviews(): Promise<CustomerReview[]> {
  const local = safeReadJSON<CustomerReview[]>(REVIEWS_FILE, []);
  return getStoredValue<CustomerReview[]>('reviews', local);
}

export async function addReview(
  reviewPayload: Omit<CustomerReview, 'id' | 'createdAt'>
): Promise<CustomerReview> {
  const reviews = await getReviews();
  const newReview: CustomerReview = {
    ...reviewPayload,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  reviews.unshift(newReview);
  await setStoredValue('reviews', reviews, REVIEWS_FILE);
  return newReview;
}

// ============================================================================
// 7. DISH SUGGESTIONS
// ============================================================================
export async function getSuggestions(): Promise<DishSuggestion[]> {
  const local = safeReadJSON<DishSuggestion[]>(SUGGESTIONS_FILE, []);
  return getStoredValue<DishSuggestion[]>('suggestions', local);
}

export async function voteSuggestion(suggestionId: string): Promise<DishSuggestion | null> {
  const suggestions = await getSuggestions();
  const item = suggestions.find((s) => s.id === suggestionId);
  if (!item) return null;

  item.votes = (item.votes || 0) + 1;
  await setStoredValue('suggestions', suggestions, SUGGESTIONS_FILE);
  return item;
}

export async function addCustomSuggestion(
  title: string,
  suggestedBy?: string,
  icon?: string,
  description?: string
): Promise<DishSuggestion> {
  const suggestions = await getSuggestions();
  const newSug: DishSuggestion = {
    id: `sug-${Date.now()}`,
    title: title.trim(),
    description: description ? description.trim() : undefined,
    votes: 1,
    suggestedBy: (suggestedBy || '').trim() || 'Anonymous Student',
    icon: icon ? icon.trim() : '✨',
  };
  suggestions.push(newSug);
  await setStoredValue('suggestions', suggestions, SUGGESTIONS_FILE);
  return newSug;
}

export async function updateSuggestion(
  id: string,
  updates: Partial<DishSuggestion>
): Promise<DishSuggestion | null> {
  const suggestions = await getSuggestions();
  const index = suggestions.findIndex((s) => s.id === id);
  if (index === -1) return null;

  suggestions[index] = {
    ...suggestions[index],
    ...updates,
    votes: updates.votes !== undefined ? Number(updates.votes) : suggestions[index].votes,
  };
  await setStoredValue('suggestions', suggestions, SUGGESTIONS_FILE);
  return suggestions[index];
}

export async function deleteSuggestion(id: string): Promise<boolean> {
  const suggestions = await getSuggestions();
  const filtered = suggestions.filter((s) => s.id !== id);
  if (filtered.length === suggestions.length) return false;
  await setStoredValue('suggestions', filtered, SUGGESTIONS_FILE);
  return true;
}
