'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Moon, Clock, Search, ShieldCheck, ShoppingBag } from 'lucide-react';
import TrackOrderModal from './TrackOrderModal';

interface NavbarProps {
  storeName?: string;
  hostelName?: string;
  isOpen: boolean;
  isPaused: boolean;
  cartCount: number;
  onOpenCart: () => void;
}

export default function Navbar({
  storeName = "Crave O'Clock",
  hostelName = 'Boys Hostel 2',
  isOpen,
  isPaused,
  cartCount,
  onOpenCart,
}: NavbarProps) {
  const [isTrackOpen, setIsTrackOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-midnight-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              🍜
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg text-white tracking-tight">
                  {storeName}
                </span>
                {/* Live Store status pill */}
                {isPaused ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse" />
                    Paused
                  </span>
                ) : isOpen ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    Kitchen Open
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
                    Closed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center">
                <span>{hostelName}</span>
                <span className="mx-1.5 text-slate-600">•</span>
                <span className="text-amber-400/90 font-medium">Midnight Delivery</span>
              </p>
            </div>
          </Link>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Track Order Button */}
            <button
              onClick={() => setIsTrackOpen(true)}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all"
              title="Track My Order"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Track Order</span>
            </button>

            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center shadow-md shadow-amber-500/25 active:scale-95 transition-all"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-midnight-950 shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Portal Link */}
            <Link
              href="/admin"
              className="p-2 text-slate-400 hover:text-amber-400 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
              title="Admin Control Center"
            >
              <ShieldCheck className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Track Order Modal */}
      {isTrackOpen && (
        <TrackOrderModal onClose={() => setIsTrackOpen(false)} />
      )}
    </>
  );
}
