'use client';

import React from 'react';
import { Flame, AlertTriangle, Moon, Clock } from 'lucide-react';

interface AlertBannersProps {
  isPaused: boolean;
  pauseMessage?: string;
  isOpen: boolean;
  closedReason?: string | null;
  highDemandActive: boolean;
  highDemandMessage?: string;
  openTime?: string;
  closeTime?: string;
}

export default function AlertBanners({
  isPaused,
  pauseMessage,
  isOpen,
  closedReason,
  highDemandActive,
  highDemandMessage,
  openTime = '22:00',
  closeTime = '04:00',
}: AlertBannersProps) {
  return (
    <div className="space-y-2 mb-4">
      {/* 1. Store Paused Banner (Critical) */}
      {isPaused && (
        <div className="bg-gradient-to-r from-amber-950/80 to-amber-900/60 border border-amber-500/40 rounded-2xl p-4 shadow-lg shadow-amber-950/30 flex items-start space-x-3 text-amber-200">
          <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-300">Kitchen Temporarily Paused</h4>
            <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
              {pauseMessage || 'We are temporarily pausing orders to catch up on current kitchen batches. We will be right back!'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Store Closed Banner */}
      {!isOpen && !isPaused && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950/70 border border-indigo-500/30 rounded-2xl p-4 shadow-lg flex items-start space-x-3 text-indigo-200">
          <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-300">Store is Currently Resting</h4>
            <p className="text-xs text-indigo-200/80 mt-0.5 leading-relaxed">
              {closedReason || `Operating midnight hours are ${openTime} to ${closeTime}. Browse the menu and come back tonight!`}
            </p>
          </div>
        </div>
      )}

      {/* 3. High Demand Delay Alert */}
      {isOpen && !isPaused && highDemandActive && (
        <div className="bg-gradient-to-r from-orange-950/80 to-red-950/60 border border-orange-500/40 rounded-2xl p-3.5 shadow-md flex items-center space-x-3 text-orange-200">
          <div className="p-2 bg-orange-500/20 rounded-xl text-orange-400 shrink-0">
            <Flame className="w-5 h-5 animate-bounce" />
          </div>
          <div className="text-xs flex-1">
            <span className="font-bold text-orange-300 mr-1.5">Midnight Rush Surge!</span>
            <span className="text-orange-200/90">
              {highDemandMessage || 'High order volume right now. Delivery may take an extra 15-20 minutes.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
