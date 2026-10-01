'use client';

import React from 'react';
import { Plus, Check, SlidersHorizontal } from 'lucide-react';
import { MenuItem, OrderItem } from '@/lib/types';
import { formatINR } from '@/lib/utils';

interface ItemCardProps {
  item: MenuItem;
  onOpenAddons: (item: MenuItem) => void;
  onDirectAdd: (orderItem: OrderItem) => void;
  disabled?: boolean;
}

export default function ItemCard({
  item,
  onOpenAddons,
  onDirectAdd,
  disabled = false,
}: ItemCardProps) {
  const hasAddons = item.addons && item.addons.length > 0;
  const isOutOfStock = !item.available;

  const handleAddClick = () => {
    if (disabled || isOutOfStock) return;

    if (hasAddons) {
      onOpenAddons(item);
    } else {
      // Add directly without modal for simple items (Chips, Drinks)
      const orderItem: OrderItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        menuItemId: item.id,
        name: item.name,
        basePrice: item.basePrice,
        selectedAddons: [],
        quantity: 1,
        itemTotalPrice: item.basePrice,
      };
      onDirectAdd(orderItem);
    }
  };

  return (
    <div
      className={`group relative bg-midnight-900/90 border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between ${
        isOutOfStock
          ? 'border-slate-800 opacity-60'
          : 'border-slate-800/80 hover:border-slate-700 hover:shadow-lg hover:shadow-amber-500/5'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-2">
          {item.tag && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {item.tag}
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 ml-auto">
              Sold Out
            </span>
          )}
        </div>

        {/* Item Info */}
        <div className="flex items-start space-x-3.5 mb-3">
          <div className="text-3xl p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {item.image || '🍜'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
              {item.name}
            </h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing & Add Action */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Price</span>
          <span className="text-lg font-black text-amber-400">{formatINR(item.basePrice)}</span>
        </div>

        <button
          type="button"
          onClick={handleAddClick}
          disabled={disabled || isOutOfStock}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow ${
            isOutOfStock || disabled
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : hasAddons
              ? 'bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/40 active:scale-95'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
          }`}
        >
          {hasAddons ? (
            <>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Customize</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
