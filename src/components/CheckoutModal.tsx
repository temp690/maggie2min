'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import {
  X,
  CreditCard,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import { OrderItem, DeliveryType, PaymentMethod, Order } from '@/lib/types';
import { formatINR, generateUPILink } from '@/lib/utils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  deliveryType: DeliveryType;
  deliveryFee: number;
  upiId: string;
  upiName: string;
  adminPhone: string;
  onOrderSuccess: (order: Order, adminWhatsAppUrl: string) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  deliveryType,
  deliveryFee,
  upiId,
  upiName,
  adminPhone,
  onOrderSuccess,
}: CheckoutModalProps) {
  const router = useRouter();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [paymentRef, setPaymentRef] = useState('');
  const [copied, setCopied] = useState(false);

  // UI flow states
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string>('');

  const subtotal = items.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const actualDeliveryFee = deliveryType === 'room' ? deliveryFee : 0;
  const grandTotal = subtotal + actualDeliveryFee;

  // Generate dynamic UPI QR Code
  useEffect(() => {
    if (isOpen && upiId && grandTotal > 0) {
      const upiUrl = generateUPILink(upiId, upiName, grandTotal, 'MIDNIGHT');
      QRCode.toDataURL(upiUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [isOpen, upiId, upiName, grandTotal]);

  if (!isOpen) return null;

  const upiIntentLink = generateUPILink(upiId, upiName, grandTotal, 'MIDNIGHT');

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
          deliveryType,
          items,
          paymentMethod,
          paymentRef: paymentRef.trim() || undefined,
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
              {createdOrder ? 'Order Confirmed! 🎉' : 'Checkout & Delivery'}
            </h3>
            <p className="text-xs text-slate-400">
              {createdOrder
                ? `Order #${createdOrder.id} is queued for kitchen prep`
                : `${deliveryType === 'room' ? (actualDeliveryFee > 0 ? `Room Delivery (+₹${actualDeliveryFee})` : 'FREE Room Delivery 🚀') : 'Hostel Pickup'} • ${formatINR(grandTotal)}`}
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
                  {createdOrder.deliveryType === 'room'
                    ? `Room Delivery to ${createdOrder.roomNumber}`
                    : 'Hostel Pickup'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Paid:</span>
                <span className="font-black text-emerald-400 text-sm">
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

            {/* Payment Section (Online Payment Only) */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>Online Payment (UPI Only)</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Instant Verification
                </span>
              </div>

              {/* Informational Note */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start space-x-2.5 text-xs text-amber-200/90 leading-relaxed">
                <span className="text-base shrink-0 leading-none mt-0.5">📌</span>
                <div>
                  <span className="font-bold text-amber-300 block mb-0.5">Online Payment Only</span>
                  <span className="text-slate-300 text-[11px]">
                    We accept online payment only via UPI (GPay, PhonePe, Paytm). No cash on delivery. Your order is queued and prepared hot right after payment verification.
                  </span>
                </div>
              </div>

              {/* UPI Payment Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 text-center">
                {/* 1-Tap UPI App Button for Mobile Phone Users */}
                <div className="pb-1">
                  <a
                    href={upiIntentLink}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all text-xs sm:text-sm"
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>Pay with UPI App (GPay / PhonePe / Paytm)</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                  </a>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    💡 Paying on this phone? Tap the green button to open your installed UPI app directly!
                  </p>
                </div>

                <div className="relative flex items-center justify-center my-1">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-slate-950 px-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest absolute">
                    or scan QR / copy UPI ID
                  </span>
                </div>

                <div className="flex flex-col items-center pt-1">
                  {qrDataUrl ? (
                    <div className="p-2.5 bg-white rounded-2xl shadow-md inline-block">
                      <img
                        src={qrDataUrl}
                        alt="UPI Payment QR"
                        className="w-36 h-36 object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 bg-slate-900 rounded-2xl flex items-center justify-center text-xs text-slate-500">
                      Generating QR...
                    </div>
                  )}

                  {/* UPI ID with Copy Button */}
                  <div className="mt-2.5 flex items-center justify-center space-x-2">
                    <span className="text-xs text-slate-400">UPI ID:</span>
                    <span className="font-mono text-amber-400 font-bold text-xs bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      {upiId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(upiId);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-[10px] flex items-center space-x-1 px-2 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Optional UTR / Reference */}
                <div className="text-left pt-2 border-t border-slate-900">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    UPI Transaction ID / UTR <span className="text-slate-500 font-normal">(Optional, helps instant verification)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12-digit UTR or last 4 digits"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Demo Pay Helper */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-friction 8-day hostel checkout</span>
              </span>
              <button
                type="button"
                onClick={() => setPaymentMethod('mock_paid')}
                className="text-amber-400 hover:underline font-semibold"
              >
                Instant Mock Pay ⚡
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Securing Midnight Order...</span>
                ) : (
                  <>
                    <span>Place Order</span>
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
