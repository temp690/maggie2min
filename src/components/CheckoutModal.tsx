'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { OrderItem, DeliveryType, Order } from '@/lib/types';
import { formatINR } from '@/lib/utils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  deliveryType: DeliveryType;
  deliveryFee: number;
  upiId?: string;
  upiName?: string;
  adminPhone?: string;
  onOrderSuccess: (order: Order, adminWhatsAppUrl: string) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  deliveryType,
  deliveryFee,
  onOrderSuccess,
}: CheckoutModalProps) {
  const router = useRouter();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');

  // UI flow states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string>('');

  const subtotal = items.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const actualDeliveryFee = deliveryType === 'room' ? deliveryFee : 0;
  const grandTotal = subtotal + actualDeliveryFee;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!roomNumber.trim()) {
      setErrorMessage('Please enter your hostel block and room number (e.g. Block B, Room 304).');
      return;
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit WhatsApp phone number.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          roomNumber: roomNumber.trim(),
          phoneNumber: cleanPhone,
          notes: notes.trim(),
          deliveryType: 'room',
          items,
          paymentMethod: 'cash_on_delivery',
          paymentRef: undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order.');
      }

      setCreatedOrder(data.order);
      setWhatsAppUrl(data.adminWhatsAppUrl);
      onOrderSuccess(data.order, data.adminWhatsAppUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-midnight-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">
              {createdOrder ? 'Order Confirmed! 🎉' : 'Room Delivery Details'}
            </h3>
            <p className="text-xs text-slate-400">
              {createdOrder
                ? `Order #${createdOrder.id} is queued for kitchen prep`
                : `Room Delivery • Pay ${formatINR(grandTotal)} upon arrival at door`}
            </p>
          </div>
          {!createdOrder && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Success View */}
        {createdOrder ? (
          <div className="py-6 space-y-5 text-center flex-1 overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 block mb-1">
                Your Midnight Order ID
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider">
                #{createdOrder.id}
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-white">{createdOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="font-bold text-amber-300">
                  Room Delivery to {createdOrder.roomNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment:</span>
                <span className="font-semibold text-emerald-400">
                  Pay at Room Door (Cash / UPI)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Due:</span>
                <span className="font-black text-amber-400 text-sm">
                  {formatINR(createdOrder.total)}
                </span>
              </div>
            </div>

            {/* Prompt to ping admin on WhatsApp for lightning response */}
            {whatsAppUrl && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Notify Kitchen on WhatsApp (Instant)</span>
              </a>
            )}

            <button
              onClick={() => {
                onClose();
                router.push(`/order/${createdOrder.id}`);
              }}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all"
            >
              <span>View Live Order Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Your Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Room / Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Hostel Room / Block <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block B, 304"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  WhatsApp Number <span className="text-amber-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Delivery / Cooking Preferences */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Cooking / Delivery Note <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Extra spicy, don't knock (call on phone)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Payment at Room Door Section */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Payment at Room Door</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Pay When Delivered 🚪
                </span>
              </div>

              {/* Informational Card */}
              <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl space-y-2.5">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-lg">
                    💵
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Pay When Runner Reaches Your Room
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      No upfront online payment required! You can pay comfortably by <strong>UPI (GPay / PhonePe / Paytm scanner on runner&apos;s phone)</strong> or in <strong>Cash</strong> when the food arrives hot at your room door.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Total payable at door:</span>
                  <span className="text-base font-black text-amber-400">{formatINR(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500 hover:from-emerald-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Confirming Room Delivery Order...</span>
                ) : (
                  <>
                    <span>Confirm Order • Pay at Room</span>
                    <span>•</span>
                    <span>{formatINR(grandTotal)}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
