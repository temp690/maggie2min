'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  Clock,
  DoorClosed,
  CheckCircle,
  Copy,
  AlertCircle,
  UtensilsCrossed,
  Star,
  ShieldCheck,
} from 'lucide-react';
import StatusStepper from '@/components/StatusStepper';
import ReviewModal from '@/components/ReviewModal';
import { Order } from '@/lib/types';
import { formatINR, formatTimestamp } from '@/lib/utils';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [storePhone, setStorePhone] = useState('919876543210');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [hasPromptedReview, setHasPromptedReview] = useState(false);

  const fetchOrder = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Order not found');
      }

      const currentOrder: Order = data.order;
      setOrder(currentOrder);
      if (data.storePhone) setStorePhone(data.storePhone);
      setError('');

      // When the order status is 'delivered', prompt the customer for review
      if (currentOrder.status === 'delivered') {
        const reviewDismissedKey = `hnb_reviewed_${currentOrder.id}`;
        const alreadyDismissed = typeof window !== 'undefined' && localStorage.getItem(reviewDismissedKey);
        if (!alreadyDismissed && !hasPromptedReview) {
          setHasPromptedReview(true);
          setIsReviewOpen(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load order status.');
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchOrder();

    // Auto-poll every 3 seconds for live verification & kitchen progress
    const interval = setInterval(() => {
      fetchOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  const handleCopyId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-spin mb-3">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Connecting to Hostel Kitchen...</p>
        <p className="text-xs text-slate-500 mt-1">Fetching Order #{id}</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-midnight-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-midnight-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Order Not Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              We couldn&apos;t find an active order with ID <span className="font-mono text-amber-400">{id}</span>.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl shadow text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Storefront</span>
          </Link>
        </div>
      </div>
    );
  }

  const cleanStorePhone = storePhone.replace(/[^0-9]/g, '');
  const whatsAppMsg = encodeURIComponent(
    `Hi Hostel Kitchen! Checking on my midnight order #${order.id} for Room ${order.roomNumber}. Total: ₹${order.total}.`
  );
  const adminWhatsAppUrl = `https://wa.me/${cleanStorePhone}?text=${whatsAppMsg}`;

  const isPendingVerification = order.paymentStatus === 'pending_verification';

  return (
    <div className="min-h-screen bg-midnight-950 pb-16">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-midnight-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Storefront</span>
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchOrder(true)}
              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Refresh live status"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
              #{order.id}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 pt-5 space-y-5">
        {/* Order Header Card */}
        <div className="bg-midnight-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">
              Live Order Status
            </span>
            <h2 className="text-xl font-black text-white flex items-center space-x-2">
              <span>Order #{order.id}</span>
              <button
                onClick={handleCopyId}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                title="Copy Order ID"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Placed at {formatTimestamp(order.createdAt)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Bill</span>
            <span className="text-xl font-black text-amber-400">{formatINR(order.total)}</span>
            <span
              className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 border ${
                order.paymentStatus === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : isPendingVerification
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
              }`}
            >
              {order.paymentStatus === 'paid'
                ? '✓ Paid & Verified'
                : isPendingVerification
                ? '⏳ Awaiting Verification'
                : 'Pay on Delivery'}
            </span>
          </div>
        </div>

        {/* Live Stepper with Verification banner */}
        <StatusStepper
          currentStatus={order.status}
          paymentStatus={order.paymentStatus}
          deliveryType={order.deliveryType}
          paymentRef={order.paymentRef}
        />

        {/* Delivered Celebration & Review Prompt Card */}
        {order.status === 'delivered' && (
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/40 rounded-3xl p-5 shadow-xl text-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl shadow">
              🎉
            </div>
            <div>
              <h3 className="text-base font-black text-white">Your Order Has Arrived!</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                Hope you enjoy your hot midnight bite! Please take 10 seconds to rate the food & service.
              </p>
            </div>
            <button
              onClick={() => setIsReviewOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 mx-auto shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
            >
              <Star className="w-4 h-4 fill-slate-950" />
              <span>Rate & Review Food Now</span>
            </button>
          </div>
        )}

        {/* Room / Delivery Destination */}
        <div className="bg-midnight-900/90 border border-slate-800 rounded-3xl p-5 shadow-md space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
            <DoorClosed className="w-4 h-4 mr-1.5 text-amber-400" />
            Delivery Destination
          </h4>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-start justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Student & Room:</span>
              <span className="text-base font-bold text-white block mt-0.5">{order.customerName}</span>
              <span className="text-sm font-semibold text-amber-400 block mt-0.5">
                {order.deliveryType === 'room' ? `Room: ${order.roomNumber}` : 'Hostel Kitchen Pickup'}
              </span>
              {order.notes && (
                <p className="text-xs text-slate-400 mt-2 italic bg-slate-900/70 p-2 rounded-xl border border-slate-800">
                  &ldquo;{order.notes}&rdquo;
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400">{order.phoneNumber}</span>
            </div>
          </div>
        </div>

        {/* Order Items Receipt */}
        <div className="bg-midnight-900/90 border border-slate-800 rounded-3xl p-5 shadow-md space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
            <UtensilsCrossed className="w-4 h-4 mr-1.5 text-amber-400" />
            Midnight Snack Receipt
          </h4>

          <div className="space-y-2.5">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between text-xs py-2 border-b border-slate-800/60 last:border-none"
              >
                <div>
                  <span className="font-bold text-white text-sm">
                    {item.name} <span className="text-amber-400">×{item.quantity}</span>
                  </span>
                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selectedAddons.map((addon) => (
                        <span
                          key={addon.id}
                          className="bg-slate-950 text-amber-300 border border-slate-800 px-1.5 py-0.5 rounded text-[10px]"
                        >
                          {addon.name} (+₹{addon.price})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-bold text-slate-200 text-sm">{formatINR(item.itemTotalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Room Delivery Fee</span>
              <span>{order.deliveryFee > 0 ? `+${formatINR(order.deliveryFee)}` : 'FREE'}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800">
              <span>Grand Total</span>
              <span className="text-amber-400 text-base">{formatINR(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Review & WhatsApp Action Buttons */}
        <div className="pt-1 space-y-2.5">
          <button
            onClick={() => setIsReviewOpen(true)}
            className="w-full py-3.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-2xl flex items-center justify-center space-x-2 text-sm transition-all shadow-md"
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Rate & Review Your Midnight Food</span>
          </button>

          <a
            href={adminWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat with Kitchen on WhatsApp</span>
          </a>

          <Link
            href="/"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold rounded-2xl flex items-center justify-center space-x-2 text-xs transition-colors"
          >
            <span>Order Another Snack</span>
          </Link>
        </div>
      </main>

      {/* Review Modal */}
      {isReviewOpen && (
        <ReviewModal
          orderId={order.id}
          defaultName={order.customerName}
          defaultRoom={order.roomNumber}
          onClose={() => setIsReviewOpen(false)}
        />
      )}
    </div>
  );
}
