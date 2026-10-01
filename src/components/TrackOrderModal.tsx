'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, ArrowRight, Clock } from 'lucide-react';

interface TrackOrderModalProps {
  onClose: () => void;
}

export default function TrackOrderModal({ onClose }: TrackOrderModalProps) {
  const [orderQuery, setOrderQuery] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = orderQuery.trim().toUpperCase();
    if (!clean) {
      setError('Please enter your Order ID');
      return;
    }

    const formattedId = clean.startsWith('HNB-') ? clean : `HNB-${clean}`;
    router.push(`/order/${formattedId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-midnight-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Track Midnight Order</h3>
            <p className="text-xs text-slate-400">Check live cooking & runner progress</p>
          </div>
        </div>

        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter Order ID
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. HNB-1001 or 1001"
                value={orderQuery}
                onChange={(e) => {
                  setOrderQuery(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 uppercase font-mono tracking-wider"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
          </div>

          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Your Order ID was shown on checkout and starts with <strong className="text-slate-300">HNB-</strong>.
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
          >
            <span>Track Live Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
