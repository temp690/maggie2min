'use client';

import React from 'react';
import { X, Trash2, Plus, Minus, DoorClosed, MapPin, ArrowRight, ShoppingBag } from 'lucide-react';
import { OrderItem, DeliveryType } from '@/lib/types';
import { formatINR } from '@/lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  deliveryType: DeliveryType;
  onSetDeliveryType: (type: DeliveryType) => void;
  deliveryFee: number;
  pickupLocation: string;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  isStorePaused?: boolean;
  isStoreClosed?: boolean;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  deliveryType,
  onSetDeliveryType,
  deliveryFee,
  pickupLocation,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  isStorePaused = false,
  isStoreClosed = false,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const actualDeliveryFee = deliveryType === 'room' ? deliveryFee : 0;
  const grandTotal = subtotal + actualDeliveryFee;
  const canCheckout = items.length > 0 && !isStorePaused && !isStoreClosed;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-midnight-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Midnight Fuel Cart</h3>
              <p className="text-xs text-slate-400">{items.length} unique item{items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <span className="text-4xl mb-3">🥣</span>
              <p className="font-semibold text-slate-400 text-sm">Your midnight bowl is empty!</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                Add some steaming Maggi with Schezwan or Cheese to satisfy those cravings.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    {/* Addons List */}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedAddons.map((addon) => (
                          <span
                            key={addon.id}
                            className="inline-flex items-center text-[10px] bg-slate-900 text-amber-300 border border-slate-700/60 px-1.5 py-0.5 rounded-md"
                          >
                            {addon.icon && <span className="mr-1">{addon.icon}</span>}
                            {addon.name}
                            {addon.price > 0 && ` (+₹${addon.price})`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-900"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Price & Quantity Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-sm font-black text-amber-400">
                    {formatINR(item.itemTotalPrice)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Delivery Mode & Bill Footer */}
        {items.length > 0 && (
          <div className="p-4 bg-midnight-950 border-t border-slate-800 space-y-3.5">
            {/* Room Delivery Info */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                  <DoorClosed className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Room Delivery Only</span>
                  <span className="text-[10px] text-amber-300/90">Direct to your hostel room door</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {deliveryFee > 0 ? `+${formatINR(deliveryFee)}` : 'FREE 🚀'}
              </span>
            </div>

            {/* Price Breakdown */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-200">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Room Delivery Fee</span>
                {deliveryFee > 0 ? (
                  <span className="font-semibold text-amber-400">+{formatINR(deliveryFee)}</span>
                ) : (
                  <span className="font-semibold text-emerald-400 uppercase font-bold">FREE</span>
                )}
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white">
                <span>Total to Pay at Room</span>
                <span className="text-amber-400 text-base">{formatINR(grandTotal)}</span>
              </div>
            </div>

            {/* Status alerts if paused */}
            {isStorePaused && (
              <p className="text-[11px] text-amber-400 text-center font-medium bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                ⚠️ Kitchen orders are currently paused. Please hold on!
              </p>
            )}

            {/* Checkout Action Button */}
            <button
              onClick={onProceedToCheckout}
              disabled={!canCheckout}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Proceed to Room Delivery</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
