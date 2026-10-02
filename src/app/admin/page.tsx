'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Shield,
  Clock,
  PauseCircle,
  Flame,
  CheckCircle2,
  Truck,
  ChefHat,
  DoorOpen,
  RefreshCw,
  Phone,
  MessageSquare,
  Lock,
  Sliders,
  Volume2,
  VolumeX,
  ExternalLink,
  Store,
  DollarSign,
  Star,
  ThumbsUp,
  HelpCircle,
  QrCode,
  Smartphone,
  Save,
  Check,
  Edit,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, StoreSettings, MenuCategory, CustomerReview, DishSuggestion } from '@/lib/types';
import { formatINR, formatTimestamp, buildCustomerStatusUpdateUrl } from '@/lib/utils';

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'menu_edit' | 'controls' | 'reviews' | 'poll' | 'setup_guide'>('orders');

  // Core Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [suggestions, setSuggestions] = useState<DishSuggestion[]>([]);

  // Sound & Alerts
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousOrderCountRef = useRef<number>(0);
  const [newOrderNotice, setNewOrderNotice] = useState<string | null>(null);

  // Filter
  const [orderFilter, setOrderFilter] = useState<'active' | 'unverified' | 'delivered' | 'all'>('active');

  // Controls form state
  const [isPaused, setIsPaused] = useState(false);
  const [pauseMessage, setPauseMessage] = useState('');
  const [highDemandEnabled, setHighDemandEnabled] = useState(false);
  const [highDemandMessage, setHighDemandMessage] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  // Settings form state
  const [adminPhone, setAdminPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(3);
  const [pickupLocation, setPickupLocation] = useState('');

  // UI feedback
  const [actionNotice, setActionNotice] = useState('');
  const [loading, setLoading] = useState(false);

  // Price editor state (itemId -> current draft price)
  const [priceDrafts, setPriceDrafts] = useState<Record<string, number>>({});

  // Suggestion management state
  const [editingSuggestion, setEditingSuggestion] = useState<DishSuggestion | null>(null);
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('🍽️');

  // Review management state
  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);

  useEffect(() => {
    const savedPin = localStorage.getItem('hnb_admin_pin');
    if (savedPin) {
      setPin(savedPin);
      verifyPin(savedPin);
    }
  }, []);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.15); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio blocked:', e);
    }
  };

  const verifyPin = async (testPin: string) => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/orders', {
        headers: { 'x-admin-pin': testPin },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('hnb_admin_pin', testPin);
        setOrders(data.orders || []);
        previousOrderCountRef.current = (data.orders || []).length;
        loadAllData(testPin);
      } else {
        setAuthError('Incorrect PIN. Please try again.');
        setIsAuthenticated(false);
      }
    } catch {
      setAuthError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async (activePin: string) => {
    try {
      const [settingsRes, menuRes, revRes, sugRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/menu'),
        fetch('/api/reviews'),
        fetch('/api/suggestions'),
      ]);

      const sData = await settingsRes.json();
      const mData = await menuRes.json();
      const rData = await revRes.json();
      const gData = await sugRes.json();

      if (sData.success && sData.settings) {
        const s = sData.settings;
        setSettings(s);
        setIsPaused(s.emergencyControls?.isPaused ?? false);
        setPauseMessage(s.emergencyControls?.pauseMessage ?? '');
        setHighDemandEnabled(s.emergencyControls?.highDemandBanner?.enabled ?? false);
        setHighDemandMessage(s.emergencyControls?.highDemandBanner?.message ?? '');
        setIsStoreOpen(s.statusOverride?.isOpen ?? true);
        setAdminPhone(s.adminPhone ?? '');
        setUpiId(s.upiId ?? '');
        setUpiName(s.upiName ?? '');
        setDeliveryFee(s.deliveryFee ?? 3);
        setPickupLocation(s.pickupLocation ?? '');
      }

      if (mData.success && mData.categories) {
        setMenuCategories(mData.categories);
        const drafts: Record<string, number> = {};
        mData.categories.forEach((cat: MenuCategory) => {
          cat.items.forEach((item) => {
            drafts[item.id] = item.basePrice;
          });
        });
        setPriceDrafts(drafts);
      }

      if (rData.success) setReviews(rData.reviews || []);
      if (gData.success) setSuggestions(gData.suggestions || []);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  // Instant order reflection: poll every 3 seconds
  const pollOrders = async () => {
    if (!isAuthenticated || !pin) return;
    try {
      const res = await fetch('/api/orders', {
        headers: { 'x-admin-pin': pin },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const newOrders: Order[] = data.orders;
        if (newOrders.length > previousOrderCountRef.current) {
          playChime();
          const newest = newOrders[0];
          setNewOrderNotice(`🚨 New Order #${newest.id} received from Room ${newest.roomNumber}!`);
          setTimeout(() => setNewOrderNotice(null), 8000);
        }
        previousOrderCountRef.current = newOrders.length;
        setOrders(newOrders);
      }
    } catch (e) {
      console.error('Order poll error:', e);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(pollOrders, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated, pin]);

  // 1-Click Status & Payment Progression
  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    newPaymentStatus?: PaymentStatus
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
        },
        body: JSON.stringify({ status: newStatus, paymentStatus: newPaymentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        setActionNotice(`Order #${orderId} updated to ${newStatus.replace('_', ' ')}!`);
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (e) {
      console.error('Update failed:', e);
    }
  };

  // 1-Click Verify Payment
  const handleVerifyPayment = async (orderId: string) => {
    await handleUpdateStatus(orderId, 'preparing', 'paid');
  };

  // 1-Click In-Stock / Out of Stock toggle
  const handleToggleStock = async (itemId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/menu', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
        },
        body: JSON.stringify({ itemId, available: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setMenuCategories((prev) =>
          prev.map((c) => ({
            ...c,
            items: c.items.map((i) => (i.id === itemId ? { ...i, available: !currentStatus } : i)),
          }))
        );
        setActionNotice('Item availability updated!');
        setTimeout(() => setActionNotice(''), 2500);
      }
    } catch (e) {
      console.error('Stock toggle failed:', e);
    }
  };

  // Visual Price Editor: Save new price
  const handleSavePrice = async (itemId: string) => {
    const newPrice = priceDrafts[itemId];
    if (newPrice === undefined || isNaN(newPrice) || newPrice < 0) return;

    try {
      const res = await fetch('/api/menu', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
        },
        body: JSON.stringify({ itemId, basePrice: newPrice }),
      });
      const data = await res.json();
      if (data.success) {
        setMenuCategories((prev) =>
          prev.map((c) => ({
            ...c,
            items: c.items.map((i) => (i.id === itemId ? { ...i, basePrice: newPrice } : i)),
          }))
        );
        setActionNotice(`Price updated to ₹${newPrice}!`);
        setTimeout(() => setActionNotice(''), 2500);
      }
    } catch (e) {
      console.error('Price save failed:', e);
    }
  };

  // Save Settings & Controls
  const handleSaveControls = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
        },
        body: JSON.stringify({
          statusOverride: {
            isManualOverride: true,
            isOpen: isStoreOpen,
          },
          emergencyControls: {
            isPaused,
            pauseTitle: 'Orders Temporarily Paused',
            pauseMessage,
            highDemandBanner: {
              enabled: highDemandEnabled,
              message: highDemandMessage,
            },
          },
          adminPhone,
          upiId,
          upiName,
          deliveryFee: Number(deliveryFee),
          pickupLocation,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setActionNotice('Store controls and settings saved! ✅');
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // Suggestion CRUD handlers
  const handleUpdateSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSuggestion) return;
    try {
      const res = await fetch('/api/suggestions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
        },
        body: JSON.stringify({
          id: editingSuggestion.id,
          title: editingSuggestion.title,
          description: editingSuggestion.description,
          icon: editingSuggestion.icon,
          votes: Number(editingSuggestion.votes),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === editingSuggestion.id ? data.suggestion : s))
        );
        setEditingSuggestion(null);
        setActionNotice('Dish suggestion updated! ✅');
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (err) {
      console.error('Update suggestion error:', err);
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dish suggestion?')) return;
    try {
      const res = await fetch(`/api/suggestions?id=${id}&adminPin=${pin}`, {
        method: 'DELETE',
        headers: {
          'x-admin-pin': pin,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        setActionNotice('Suggestion deleted! 🗑️');
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (err) {
      console.error('Delete suggestion error:', err);
    }
  };

  const handleCreateSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
          icon: newIcon.trim() || '🍽️',
          suggestedBy: 'Kitchen Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestions((prev) => [data.suggestion, ...prev]);
        setIsAddingSuggestion(false);
        setNewTitle('');
        setNewDesc('');
        setNewIcon('🍽️');
        setActionNotice('New suggestion added to poll! ✨');
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (err) {
      console.error('Create suggestion error:', err);
    }
  };

  // Review CRUD handlers
  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
        },
        body: JSON.stringify({
          id: editingReview.id,
          customerName: editingReview.customerName,
          roomNumber: editingReview.roomNumber,
          rating: Number(editingReview.rating),
          comment: editingReview.comment,
        }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        setReviews((prev) =>
          prev.map((r) => (r.id === editingReview.id ? data.review : r))
        );
        setEditingReview(null);
        setActionNotice('Review updated! ✅');
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (err) {
      console.error('Update review error:', err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`/api/reviews?id=${id}&adminPin=${pin}`, {
        method: 'DELETE',
        headers: {
          'x-admin-pin': pin,
        },
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        setActionNotice('Review deleted! 🗑️');
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (err) {
      console.error('Delete review error:', err);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-midnight-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-midnight-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-black text-white">Kitchen Admin Portal</h2>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Enter your secret kitchen PIN to open the command dashboard.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyPin(pin);
            }}
            className="space-y-4"
          >
            <div>
              <input
                type="password"
                placeholder="Enter PIN (default: hostel123)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setAuthError('');
                }}
                className="w-full text-center tracking-widest text-lg font-mono bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                autoFocus
              />
              {authError && <p className="text-xs text-rose-400 mt-2">{authError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Unlocking...' : 'Open Kitchen Dashboard'}
            </button>

            <Link
              href="/"
              className="block text-xs text-slate-500 hover:text-slate-300 mt-3 transition-colors"
            >
              ← Back to Customer Storefront
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // Filter orders
  const unverifiedOrders = orders.filter((o) => o.paymentStatus === 'pending_verification');
  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );

  const displayedOrders = orders.filter((o) => {
    if (orderFilter === 'unverified') return o.paymentStatus === 'pending_verification';
    if (orderFilter === 'active') return o.status !== 'delivered' && o.status !== 'cancelled';
    if (orderFilter === 'delivered') return o.status === 'delivered';
    return true;
  });

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled' && (o.paymentStatus === 'paid' || o.paymentStatus === 'cod_verified' || o.status === 'delivered'))
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-midnight-950 text-slate-100 pb-20 selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-midnight-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-md">
              👨‍🍳
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black text-white">Kitchen Command Center</h1>
                {isPaused ? (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.2 rounded-full">
                    PAUSED
                  </span>
                ) : isStoreOpen ? (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                    OPEN
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.2 rounded-full">
                    CLOSED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {settings?.hostelName || 'Hostel'} • Live Auto-Sync Every 3s
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Chime Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playChime();
              }}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1 transition-all ${
                soundEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={soundEnabled ? 'Chime Alert Active' : 'Chime Alert Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={pollOrders}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Customer Store Link */}
            <Link
              href="/"
              target="_blank"
              className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-sm transition-all"
              title="Open Customer Storefront in New Tab"
            >
              <Store className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {newOrderNotice && (
          <div className="max-w-4xl mx-auto mt-2 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center justify-between animate-bounce">
            <span>{newOrderNotice}</span>
            <button onClick={() => setNewOrderNotice(null)} className="font-bold underline text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        {actionNotice && (
          <div className="max-w-4xl mx-auto mt-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-xl text-xs font-bold text-center">
            {actionNotice}
          </div>
        )}

        {/* Tabs Bar */}
        <div className="max-w-4xl mx-auto flex items-center space-x-2 mt-3 overflow-x-auto scrollbar-none pt-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Orders Queue</span>
            {activeOrders.length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('menu_edit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'menu_edit'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Menu & Price Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'controls'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Store Controls & Pause</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'reviews'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Reviews ({reviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('poll')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'poll'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Dish Votes</span>
          </button>

          <button
            onClick={() => setActiveTab('setup_guide')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'setup_guide'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>WhatsApp & UPI Guide</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-5">
        {/* ============================================================ */}
        {/* TAB 1: ORDERS QUEUE */}
        {/* ============================================================ */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-midnight-900/90 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Pending Orders</span>
                <span className="text-2xl font-black text-amber-400">{activeOrders.length}</span>
              </div>
              <div className="bg-midnight-900/90 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Unverified UPI</span>
                <span className="text-2xl font-black text-rose-400">{unverifiedOrders.length}</span>
              </div>
              <div className="bg-midnight-900/90 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Verified Revenue</span>
                <span className="text-2xl font-black text-emerald-400">{formatINR(totalRevenue)}</span>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 overflow-x-auto">
              <button
                onClick={() => setOrderFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orderFilter === 'active'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active Kitchen Queue ({activeOrders.length})
              </button>

              <button
                onClick={() => setOrderFilter('unverified')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orderFilter === 'unverified'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Needs Verification ({unverifiedOrders.length})
              </button>

              <button
                onClick={() => setOrderFilter('delivered')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orderFilter === 'delivered'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Delivered ({orders.filter((o) => o.status === 'delivered').length})
              </button>

              <button
                onClick={() => setOrderFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orderFilter === 'all'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Orders ({orders.length})
              </button>
            </div>

            {/* Orders Feed */}
            {displayedOrders.length === 0 ? (
              <div className="bg-midnight-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-2">
                <span className="text-4xl block">🥣</span>
                <h4 className="text-base font-bold text-slate-400">No {orderFilter} orders right now</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  When a student places an order on their phone, it will instantly pop up here with an audio alert.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedOrders.map((order) => {
                  const studentWhatsAppUrl = buildCustomerStatusUpdateUrl(order.phoneNumber, order);
                  const isUnverified = order.paymentStatus === 'pending_verification';

                  return (
                    <div
                      key={order.id}
                      className={`bg-midnight-900 border rounded-3xl p-5 shadow-xl transition-all relative flex flex-col justify-between ${
                        isUnverified
                          ? 'border-rose-500/80 ring-2 ring-rose-500/20 shadow-rose-500/10'
                          : order.status === 'received'
                          ? 'border-amber-500/60'
                          : order.status === 'preparing'
                          ? 'border-indigo-500/50'
                          : order.status === 'on_the_way'
                          ? 'border-emerald-500/50'
                          : 'border-slate-800 opacity-80'
                      }`}
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-base font-mono font-black text-amber-400">
                                #{order.id}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  isUnverified
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                    : order.paymentStatus === 'paid'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                                }`}
                              >
                                {isUnverified
                                  ? '⚠️ Unverified Payment'
                                  : order.paymentStatus === 'paid'
                                  ? '✓ Paid & Verified'
                                  : '💵 Pay at Room Door'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {formatTimestamp(order.createdAt)} • {order.deliveryType === 'room' ? 'Room Delivery' : 'Pickup'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-black text-amber-400 block">
                              {formatINR(order.total)}
                            </span>
                            {order.paymentRef && (
                              <span className="text-[10px] font-mono text-slate-400 block">
                                UTR: {order.paymentRef}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Customer & Room Box */}
                        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 mb-3 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-white text-sm block">
                                {order.customerName}
                              </span>
                              <span className="font-semibold text-amber-300 block mt-0.5">
                                🚪 Room: {order.roomNumber}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              {/* WhatsApp Ping */}
                              <a
                                href={studentWhatsAppUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition-all border border-emerald-500/30"
                                title="Send WhatsApp Update to Student"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                              {/* Call */}
                              <a
                                href={`tel:${order.phoneNumber}`}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
                                title="Call Student"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            </div>
                          </div>

                          {order.notes && (
                            <div className="mt-2 text-[11px] text-slate-400 bg-slate-900 p-2 rounded-xl border border-slate-800 italic">
                              Note: &ldquo;{order.notes}&rdquo;
                            </div>
                          )}
                        </div>

                        {/* Items with Add-ons */}
                        <div className="space-y-1.5 mb-4">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 flex items-start justify-between"
                            >
                              <div>
                                <span className="font-bold text-white">
                                  {item.name} <span className="text-amber-400">×{item.quantity}</span>
                                </span>
                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.selectedAddons.map((addon) => (
                                      <span
                                        key={addon.id}
                                        className="text-[10px] bg-slate-900 text-amber-300 border border-slate-700 px-1.5 py-0.2 rounded"
                                      >
                                        + {addon.name} (₹{addon.price})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span className="font-semibold text-slate-300">
                                {formatINR(item.itemTotalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Noob-Proof 1-Click Action Steppers */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        {/* 1-Click Payment Verification Button */}
                        {isUnverified && (
                          <button
                            onClick={() => handleVerifyPayment(order.id)}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg active:scale-95 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>1-Click: ✓ Verify Payment & Start Cooking</span>
                          </button>
                        )}

                        {/* Normal Progression if Verified */}
                        {!isUnverified && order.status === 'received' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all"
                          >
                            <ChefHat className="w-4 h-4" />
                            <span>1-Click: Start Cooking 🍳</span>
                          </button>
                        )}

                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'on_the_way')}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all"
                          >
                            <Truck className="w-4 h-4" />
                            <span>1-Click: Send Runner to Room 🏃‍♂️</span>
                          </button>
                        )}

                        {order.status === 'on_the_way' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'delivered', 'paid')}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all"
                          >
                            <DoorOpen className="w-4 h-4" />
                            <span>1-Click: Mark Delivered & Completed 🚪</span>
                          </button>
                        )}

                        {order.status === 'delivered' && (
                          <div className="text-center py-1 text-xs text-emerald-400 font-bold flex items-center justify-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Order Delivered & Completed</span>
                          </div>
                        )}

                        {/* Customer View Link */}
                        <div className="flex justify-between items-center pt-1 text-[11px]">
                          <button
                            onClick={() => {
                              if (confirm(`Cancel Order #${order.id}?`)) {
                                handleUpdateStatus(order.id, 'cancelled');
                              }
                            }}
                            className="text-rose-400 hover:underline"
                          >
                            Cancel
                          </button>
                          <Link
                            href={`/order/${order.id}`}
                            target="_blank"
                            className="text-slate-400 hover:text-white flex items-center space-x-1"
                          >
                            <span>Live Customer View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: VISUAL MENU & PRICE EDITOR (NOOB-PROOF) */}
        {/* ============================================================ */}
        {activeTab === 'menu_edit' && (
          <div className="space-y-5 max-w-2xl">
            <div className="bg-midnight-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Visual Menu & Price Editor</h3>
                <p className="text-xs text-slate-400">
                  Easily edit item prices and toggle stock without touching any code.
                </p>
              </div>

              <div className="space-y-3">
                {menuCategories.map((cat) => (
                  <div key={cat.id} className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1">
                      {cat.name}
                    </h4>

                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl p-2 bg-slate-900 rounded-xl">{item.image || '🍜'}</span>
                          <div>
                            <span className="text-sm font-bold text-white block">{item.name}</span>
                            <span className="text-xs text-slate-400">Current Base: ₹{item.basePrice}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Price Input */}
                          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2 py-1">
                            <span className="text-xs text-slate-400 font-bold mr-1">₹</span>
                            <input
                              type="number"
                              value={priceDrafts[item.id] ?? item.basePrice}
                              onChange={(e) =>
                                setPriceDrafts({
                                  ...priceDrafts,
                                  [item.id]: Number(e.target.value),
                                })
                              }
                              className="w-14 bg-transparent text-white font-mono text-sm font-bold focus:outline-none"
                            />
                          </div>

                          <button
                            onClick={() => handleSavePrice(item.id)}
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1"
                            title="Save new price"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>

                          {/* Stock Toggle */}
                          <button
                            onClick={() => handleToggleStock(item.id, item.available)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                              item.available
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {item.available ? 'In Stock' : 'Sold Out'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: STORE CONTROLS & PAUSE */}
        {/* ============================================================ */}
        {activeTab === 'controls' && (
          <div className="space-y-5 max-w-2xl">
            {/* Open / Close Toggle */}
            <div className="bg-midnight-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Kitchen Open / Closed State</h3>
                <p className="text-xs text-slate-400">
                  Currently: {isStoreOpen ? '🟢 Accepting Orders' : '🔴 Closed'}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsStoreOpen(true)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    isStoreOpen ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Open Kitchen
                </button>
                <button
                  type="button"
                  onClick={() => setIsStoreOpen(false)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    !isStoreOpen ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Close Kitchen
                </button>
              </div>
            </div>

            {/* Emergency Pause Toggle */}
            <div className="bg-midnight-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Emergency Pause Orders</h3>
                  <p className="text-xs text-slate-400">
                    Disables checkout when out of stock or boiling water
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-all ${
                    isPaused ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-all ${
                      isPaused ? 'translate-x-6 bg-slate-950' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isPaused && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label className="block text-xs font-bold text-amber-300">
                    Message Shown to Students:
                  </label>
                  <textarea
                    rows={2}
                    value={pauseMessage}
                    onChange={(e) => setPauseMessage(e.target.value)}
                    placeholder="e.g. Boiling water for next batch, back in 15 mins 🍳"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  />
                </div>
              )}
            </div>

            {/* High Demand Rush Banner */}
            <div className="bg-midnight-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">High-Demand Rush Delay Alert</h3>
                  <p className="text-xs text-slate-400">
                    Displays surge delay notice to students on storefront
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setHighDemandEnabled(!highDemandEnabled)}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-all ${
                    highDemandEnabled ? 'bg-orange-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-all ${
                      highDemandEnabled ? 'translate-x-6 bg-slate-950' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {highDemandEnabled && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={highDemandMessage}
                    onChange={(e) => setHighDemandMessage(e.target.value)}
                    placeholder="🔥 High order rush! Delivery may take 20-25 mins."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSaveControls}
              disabled={loading}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg transition-all"
            >
              {loading ? 'Saving...' : 'Save Store Controls'}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: REVIEWS & FEEDBACK */}
        {/* ============================================================ */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Student Reviews & Ratings</h3>
                <p className="text-xs text-slate-400">
                  Manage student reviews. You can edit comments, ratings or remove outdated/inappropriate reviews:
                </p>
              </div>
            </div>

            {/* Edit Review Modal */}
            {editingReview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-md bg-midnight-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Edit className="w-4 h-4 text-amber-400" />
                      <span>Edit Student Review</span>
                    </h4>
                    <button
                      onClick={() => setEditingReview(null)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateReview} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">Student Name</label>
                        <input
                          type="text"
                          required
                          value={editingReview.customerName}
                          onChange={(e) => setEditingReview({ ...editingReview, customerName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Room No.</label>
                        <input
                          type="text"
                          value={editingReview.roomNumber || ''}
                          onChange={(e) => setEditingReview({ ...editingReview, roomNumber: e.target.value })}
                          placeholder="e.g. Room 314"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Rating (1 to 5 Stars)</label>
                      <div className="flex items-center space-x-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditingReview({ ...editingReview, rating: star })}
                            className="p-0.5"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                editingReview.rating >= star
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-amber-400 font-bold ml-2">({editingReview.rating} / 5)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Review Comment</label>
                      <textarea
                        required
                        rows={3}
                        value={editingReview.comment}
                        onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingReview(null)}
                        className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center space-x-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500">No reviews submitted yet.</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="bg-midnight-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-2 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm">{rev.customerName}</span>
                      {rev.roomNumber && (
                        <span className="text-xs text-amber-400 ml-2 font-mono">({rev.roomNumber})</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingReview({ ...rev })}
                        className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors ml-2"
                        title="Edit review"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 italic">&ldquo;{rev.comment}&rdquo;</p>
                  <span className="text-[10px] text-slate-500 block">
                    {formatTimestamp(rev.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: DISH SUGGESTION VOTES & EDITING */}
        {/* ============================================================ */}
        {activeTab === 'poll' && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Dish Poll Leaderboard & Editor</h3>
                <p className="text-xs text-slate-400">
                  Manage dishes students vote on. Edit titles, descriptions, emojis or add new dishes:
                </p>
              </div>
              <button
                onClick={() => setIsAddingSuggestion(!isAddingSuggestion)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-md transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingSuggestion ? 'Cancel' : 'Add Dish'}</span>
              </button>
            </div>

            {/* Add New Suggestion Form */}
            {isAddingSuggestion && (
              <form onSubmit={handleCreateSuggestion} className="bg-slate-950/80 border border-amber-500/40 rounded-2xl p-4 space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Add New Dish for Students to Vote On</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[10px] text-slate-400 mb-1">Emoji</label>
                    <input
                      type="text"
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-center text-lg text-white"
                      placeholder="🍟"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[10px] text-slate-400 mb-1">Dish Name</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      placeholder="e.g. Peri Peri French Fries"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    placeholder="e.g. Crispy golden fries with spicy peri peri seasoning"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingSuggestion(false)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    Add to Poll
                  </button>
                </div>
              </form>
            )}

            {/* Edit Suggestion Modal */}
            {editingSuggestion && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-md bg-midnight-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Edit className="w-4 h-4 text-amber-400" />
                      <span>Edit Dish Suggestion</span>
                    </h4>
                    <button
                      onClick={() => setEditingSuggestion(null)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateSuggestion} className="space-y-3 text-xs">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-1">
                        <label className="block text-slate-400 mb-1">Emoji Icon</label>
                        <input
                          type="text"
                          value={editingSuggestion.icon || ''}
                          onChange={(e) => setEditingSuggestion({ ...editingSuggestion, icon: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-center text-lg text-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-slate-400 mb-1">Dish Title</label>
                        <input
                          type="text"
                          required
                          value={editingSuggestion.title}
                          onChange={(e) => setEditingSuggestion({ ...editingSuggestion, title: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={editingSuggestion.description || ''}
                        onChange={(e) => setEditingSuggestion({ ...editingSuggestion, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Current Votes</label>
                      <input
                        type="number"
                        min={0}
                        value={editingSuggestion.votes ?? 0}
                        onChange={(e) => setEditingSuggestion({ ...editingSuggestion, votes: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingSuggestion(null)}
                        className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center space-x-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List of Dish Suggestions */}
            <div className="space-y-2.5">
              {suggestions.map((sug, idx) => (
                <div
                  key={sug.id}
                  className="bg-midnight-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0 pr-3">
                    <span className="text-sm font-black text-amber-400 w-5 shrink-0">#{idx + 1}</span>
                    <span className="text-2xl shrink-0">{sug.icon || '🍽️'}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{sug.title}</h4>
                      {sug.description && (
                        <p className="text-[10px] text-slate-400 line-clamp-1">{sug.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl font-black text-xs text-amber-400">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{sug.votes || 0}</span>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => setEditingSuggestion({ ...sug })}
                      className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
                      title="Edit dish details & votes"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSuggestion(sug.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
                      title="Delete dish from poll"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: HOW TO SET UP WHATSAPP & UPI QR */}
        {/* ============================================================ */}
        {activeTab === 'setup_guide' && (
          <div className="space-y-5 max-w-2xl">
            <div className="bg-midnight-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">How to Receive Orders on WhatsApp & Set UPI QR</h3>

              {/* Settings Form */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                  Your Kitchen Contact & UPI Settings
                </h4>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Your WhatsApp Phone Number (with country code 91)
                  </label>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="e.g. 919876543210"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    When students tap &quot;Notify Kitchen&quot;, this is the number their order summary sends to.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Your UPI ID (GPay / PhonePe)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@okaxis"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">UPI Payee Name</label>
                    <input
                      type="text"
                      value={upiName}
                      onChange={(e) => setUpiName(e.target.value)}
                      placeholder="e.g. Hostel Night Bites"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveControls}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
                >
                  Save UPI & WhatsApp Settings
                </button>
              </div>

              {/* Explanatory Guide Cards */}
              <div className="space-y-3 text-xs text-slate-300">
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span>How WhatsApp Notifications Work:</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    1. When a student places an order, the system instantly generates an official WhatsApp URL pre-filled with the order ticket:
                    <br />
                    <span className="font-mono text-amber-300 bg-slate-900 px-1 py-0.5 rounded text-[10px] block mt-1">
                      &quot;🚨 NEW MIDNIGHT ORDER #HNB-1001: Plain Maggi x2 + Schezwan, Room: B-302, Total: ₹73&quot;
                    </span>
                    2. The student is prompted to click <strong>&quot;Notify Kitchen on WhatsApp&quot;</strong>, which opens WhatsApp directly on your phone with the full order.
                    <br />
                    3. On your Admin Dashboard, clicking the green WhatsApp icon beside any order automatically opens a chat to that student with their status update!
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold">
                    <DoorOpen className="w-4 h-4" />
                    <span>How Room Delivery & Payment at Door Work:</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    1. Students order directly to their hostel room with zero checkout friction (no failed online UPI payment blocks).
                    <br />
                    2. When their order is cooked, the runner takes the hot food up to their room door.
                    <br />
                    3. The runner collects payment directly at their door via <strong>Cash</strong> or by showing their <strong>UPI QR code on their phone</strong>.
                    <br />
                    4. Once delivered and collected, tap <strong>&quot;1-Click: Mark Delivered &amp; Completed&quot;</strong> in your admin queue!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
