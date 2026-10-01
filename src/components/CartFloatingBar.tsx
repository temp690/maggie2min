'use client';

import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface CartFloatingBarProps {
  totalCount: number;
  subtotal: number;
  onOpen: () => void;
  disabled?: boolean;
}

export default function CartFloatingBar({
  totalCount,
  subtotal,
  onOpen,
  disabled = false,
}: CartFloatingBarProps) {
  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-30 px-4 max-w-lg mx-auto animate-in slide-in-from-bottom duration-300">
      <button
        onClick={onOpen}
        disabled={disabled}
        className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 p-3.5 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-between font-bold active:scale-[0.99] transition-all disabled:opacity-60"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center font-black text-xs">
            {totalCount}
          </div>
          <div className="text-left">
            <span className="text-xs uppercase font-extrabold tracking-wider block text-slate-900/80">
              Midnight Fuel Cart
            </span>
            <span className="text-base font-black text-slate-950">{formatINR(subtotal)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-black tracking-wide bg-slate-950 text-amber-400 px-3.5 py-2 rounded-xl shadow-sm">
          <span>Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
}
