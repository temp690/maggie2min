'use client';

import React from 'react';
import { Check, ClipboardCheck, ChefHat, Bike, DoorOpen, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { OrderStatus, PaymentStatus } from '@/lib/types';

interface StatusStepperProps {
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryType: 'room' | 'pickup';
  paymentRef?: string;
}

interface StepInfo {
  key: OrderStatus;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export default function StatusStepper({
  currentStatus,
  paymentStatus,
  deliveryType,
  paymentRef,
}: StatusStepperProps) {
  const isPendingVerification = paymentStatus === 'pending_verification';

  const steps: StepInfo[] = [
    {
      key: 'received',
      title: 'Order Confirmed',
      desc: isPendingVerification
        ? 'Awaiting kitchen payment check'
        : 'Order confirmed & queued in kitchen',
      icon: <ClipboardCheck className="w-5 h-5" />,
    },
    {
      key: 'preparing',
      title: 'Cooking in Progress',
      desc: 'Pan sizzling, fresh Maggi & Pasta boiling 🍳',
      icon: <ChefHat className="w-5 h-5" />,
    },
    {
      key: 'on_the_way',
      title: 'On The Way to Your Room',
      desc: 'Runner is heading up the hostel stairs 🏃‍♂️',
      icon: <Bike className="w-5 h-5" />,
    },
    {
      key: 'delivered',
      title: 'Arrived at Room Door',
      desc: 'Food delivered! Please pay at the door (Cash / UPI) 🍜',
      icon: <DoorOpen className="w-5 h-5" />,
    },
  ];

  if (currentStatus === 'cancelled') {
    return (
      <div className="bg-rose-950/40 border border-rose-500/30 rounded-3xl p-6 text-center text-rose-300">
        <XCircle className="w-12 h-12 mx-auto text-rose-400 mb-2" />
        <h4 className="text-lg font-bold text-white">Order Cancelled</h4>
        <p className="text-xs text-rose-300/80 mt-1">
          This order was cancelled by the kitchen. Please reach out to the admin on WhatsApp if you have questions.
        </p>
      </div>
    );
  }

  const orderIndexMap: Record<OrderStatus, number> = {
    received: 0,
    preparing: 1,
    on_the_way: 2,
    delivered: 3,
    cancelled: -1,
  };

  const currentIndex = orderIndexMap[currentStatus] ?? 0;

  return (
    <div className="bg-midnight-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-5">
      {/* Payment at Room Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center space-x-2.5 text-emerald-200 text-xs">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-semibold text-emerald-300">
          ✓ Order Active • Room Delivery (Pay upon delivery via Cash / UPI)
        </span>
      </div>

      {/* Glow backdrop */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
        <span>Live Kitchen Progress</span>
        <span className="flex items-center text-amber-400 text-xs normal-case">
          <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5 animate-ping" />
          Live Tracking Active
        </span>
      </h4>

      <div className="relative pl-6 sm:pl-8 space-y-7">
        {/* Continuous connector line */}
        <div className="absolute left-[23px] sm:left-[31px] top-4 bottom-5 w-0.5 bg-slate-800" />

        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="relative flex items-start group">
              {/* Step indicator node */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0.5 w-8 h-8 rounded-2xl flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/20 animate-pulse'
                    : 'bg-slate-900 border border-slate-700/60 text-slate-600'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : step.icon}
              </div>

              {/* Step details */}
              <div className="pl-4">
                <div className="flex items-center space-x-2">
                  <h5
                    className={`text-sm font-bold tracking-tight ${
                      isDone
                        ? 'text-slate-200'
                        : isCurrent
                        ? 'text-amber-400 text-base'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </h5>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      In Progress
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    isCurrent ? 'text-slate-300' : isDone ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
