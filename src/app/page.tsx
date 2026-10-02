'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AlertBanners from '@/components/AlertBanners';
import ItemCard from '@/components/ItemCard';
import AddonSelectorModal from '@/components/AddonSelectorModal';
import CartFloatingBar from '@/components/CartFloatingBar';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import ReviewsWall from '@/components/ReviewsWall';
import DishSuggestionPoll from '@/components/DishSuggestionPoll';
import { MenuCategory, MenuItem, OrderItem, DeliveryType } from '@/lib/types';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function Storefront() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('room');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [settingsRes, menuRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/menu'),
      ]);

      const settingsData = await settingsRes.json();
      const menuData = await menuRes.json();

      if (settingsData.success) {
        setSettings(settingsData.settings);
      }
      if (menuData.success && Array.isArray(menuData.categories)) {
        setCategories(menuData.categories);
        if (menuData.categories.length > 0 && !activeCategory) {
          setActiveCategory(menuData.categories[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching storefront data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = (item: OrderItem) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.menuItemId === item.menuItemId &&
          JSON.stringify(i.selectedAddons.map((a) => a.id).sort()) ===
            JSON.stringify(item.selectedAddons.map((a) => a.id).sort())
      );

      if (existingIndex > -1) {
        const copy = [...prev];
        const current = copy[existingIndex];
        const newQty = current.quantity + item.quantity;
        const singlePrice = current.itemTotalPrice / current.quantity;
        copy[existingIndex] = {
          ...current,
          quantity: newQty,
          itemTotalPrice: singlePrice * newQty,
        };
        return copy;
      }
      return [...prev, item];
    });
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const singlePrice = item.itemTotalPrice / item.quantity;
          return {
            ...item,
            quantity: newQty,
            itemTotalPrice: singlePrice * newQty,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.itemTotalPrice, 0);

  const isStoreOpen = settings?.isOpen ?? true;
  const isStorePaused = settings?.emergencyControls?.isPaused ?? false;
  const pauseMessage = settings?.emergencyControls?.pauseMessage;
  const highDemandActive = settings?.emergencyControls?.highDemandBanner?.enabled ?? false;
  const highDemandMessage = settings?.emergencyControls?.highDemandBanner?.message;

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-spin mb-3">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Warming up midnight kettle...</p>
      </div>
    );
  }

  const selectedCategoryObj = categories.find((c) => c.id === activeCategory) || categories[0];

  return (
    <div className="min-h-screen bg-midnight-950 selection:bg-amber-500 selection:text-slate-950">
      {/* Navbar */}
      <Navbar
        storeName={settings?.storeName}
        hostelName={settings?.hostelName}
        isOpen={isStoreOpen}
        isPaused={isStorePaused}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="max-w-xl mx-auto px-4 pt-4 pb-24 space-y-6">
        {/* Alert Banners (Pause / Delay / Off-hours) */}
        <AlertBanners
          isPaused={isStorePaused}
          pauseMessage={pauseMessage}
          isOpen={isStoreOpen}
          closedReason={settings?.closedReason}
          highDemandActive={highDemandActive}
          highDemandMessage={highDemandMessage}
          openTime={settings?.storeSchedule?.openTime}
          closeTime={settings?.storeSchedule?.closeTime}
        />

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-midnight-900 via-midnight-850 to-midnight-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Hostel Pop-Up Kitchen</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                Hot Maggi & Pasta,<br />
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Delivered To Your Room.
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 max-w-[280px] leading-relaxed">
                Cheese & Masala Penne Pasta + Midnight Maggi. Freshly cooked on the kettle and delivered to your room door.
              </p>
            </div>

            <div className="text-4xl sm:text-5xl p-3 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner shrink-0 animate-pulse-slow">
              🍜
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="text-emerald-400 font-black">Room Delivery:</span>
              <span className="text-emerald-300 font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                100% FREE 🚀
              </span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="text-amber-400 font-black">Payment:</span>
              <span className="text-amber-300 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                Pay at Room Door 🚪
              </span>
            </span>
          </div>
        </section>

        {/* Category Tabs Selection */}
        {categories.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap flex items-center space-x-2 transition-all shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'bg-midnight-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>🔥</span>
              <span>All Dishes</span>
            </button>
            {categories.map((cat) => {
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap flex items-center space-x-2 transition-all shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                      : 'bg-midnight-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span>{cat.id === 'maggi' ? '🍜' : '🍝'}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Menu Items Grid: Maggi first, and Pasta placed directly at the bottom */}
        {activeCategory === 'all' ? (
          <div className="space-y-6">
            {categories.map((category) => (
              <section key={category.id} className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                    <span className="text-base">{category.id === 'maggi' ? '🍜' : '🍝'}</span>
                    <span className="text-amber-400">{category.name}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 normal-case font-normal text-xs">
                      {category.description}
                    </span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {category.items?.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onOpenAddons={(selectedItem) => setCustomizingItem(selectedItem)}
                      onDirectAdd={handleAddToCart}
                      disabled={!isStoreOpen || isStorePaused}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <span className="text-base">{selectedCategoryObj?.id === 'maggi' ? '🍜' : '🍝'}</span>
                <span className="text-amber-400">{selectedCategoryObj?.name}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 normal-case font-normal text-xs">
                  {selectedCategoryObj?.description}
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {selectedCategoryObj?.items?.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onOpenAddons={(selectedItem) => setCustomizingItem(selectedItem)}
                  onDirectAdd={handleAddToCart}
                  disabled={!isStoreOpen || isStorePaused}
                />
              ))}
            </div>
          </section>
        )}

        {/* Dish Suggestion Poll Section */}
        <DishSuggestionPoll />

        {/* Customer Reviews Wall Section */}
        <ReviewsWall />
      </main>

      {/* Floating Bottom Cart Bar */}
      <CartFloatingBar
        totalCount={totalCartCount}
        subtotal={cartSubtotal}
        onOpen={() => setIsCartOpen(true)}
        disabled={isStorePaused || !isStoreOpen}
      />

      {/* Addon Selector Modal */}
      {customizingItem && (
        <AddonSelectorModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        deliveryType={deliveryType}
        onSetDeliveryType={setDeliveryType}
        deliveryFee={settings?.deliveryFee ?? 0}
        pickupLocation={settings?.pickupLocation || 'Room 304, Block B'}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        isStorePaused={isStorePaused}
        isStoreClosed={!isStoreOpen}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        deliveryType={deliveryType}
        deliveryFee={settings?.deliveryFee ?? 0}
        upiId={settings?.upiId || 'hostelkitchen@upi'}
        upiName={settings?.upiName || "Crave O'Clock"}
        adminPhone={settings?.adminPhone || '919876543210'}
        onOrderSuccess={() => {
          setCartItems([]);
        }}
      />
    </div>
  );
}
