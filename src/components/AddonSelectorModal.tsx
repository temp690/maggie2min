'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { MenuItem, Addon, OrderItem } from '@/lib/types';
import { formatINR } from '@/lib/utils';

interface AddonSelectorModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (orderItem: OrderItem) => void;
}

export default function AddonSelectorModal({
  item,
  onClose,
  onAddToCart,
}: AddonSelectorModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [quantity, setQuantity] = useState(1);

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const isSelected = (addonId: string) => selectedAddons.some((a) => a.id === addonId);

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const singleItemPrice = item.basePrice + addonsTotal;
  const totalPrice = singleItemPrice * quantity;

  const handleAdd = () => {
    const orderItem: OrderItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: item.id,
      name: item.name,
      basePrice: item.basePrice,
      selectedAddons,
      quantity,
      itemTotalPrice: totalPrice,
    };
    onAddToCart(orderItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-midnight-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="text-3xl p-2 bg-slate-800/80 rounded-2xl border border-slate-700/50">
              {item.image || '🍜'}
            </span>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{item.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Base Price: {formatINR(item.basePrice)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* Customization Section */}
          {item.addons && item.addons.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Customize Your Bowl
                </span>
                <span className="text-[11px] text-slate-400">Select any you like</span>
              </div>

              <div className="space-y-2">
                {item.addons.map((addon) => {
                  const active = isSelected(addon.id);
                  const isFree = addon.price === 0;

                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                        active
                          ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs font-bold transition-all ${
                            active
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-slate-900 border-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold flex items-center">
                            {addon.icon && <span className="mr-2">{addon.icon}</span>}
                            <span>{addon.name}</span>
                          </div>
                          {isFree && (
                            <span className="text-[10px] text-emerald-400 font-medium">Free Seasoning</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {isFree ? (
                          <span className="text-xs font-bold text-emerald-400">FREE</span>
                        ) : (
                          <span className="text-xs font-bold text-amber-400">+{formatINR(addon.price)}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-white block">Quantity</span>
              <span className="text-xs text-slate-400">Single or double pack</span>
            </div>

            <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors disabled:opacity-50"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center text-sm font-black text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Price and Add to Cart */}
        <div className="pt-3 border-t border-slate-800 flex items-center space-x-3">
          <div className="shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total</span>
            <span className="text-xl font-black text-amber-400">{formatINR(totalPrice)}</span>
          </div>

          <button
            onClick={handleAdd}
            className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all"
          >
            <span>Add to Midnight Cart</span>
            <span>•</span>
            <span>{formatINR(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
