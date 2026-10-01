'use client';

import React, { useState } from 'react';
import { X, Star, MessageSquare, CheckCircle, Send } from 'lucide-react';

interface ReviewModalProps {
  orderId?: string;
  defaultName?: string;
  defaultRoom?: string;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

export default function ReviewModal({
  orderId,
  defaultName = '',
  defaultRoom = '',
  onClose,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState(defaultName);
  const [roomNumber, setRoomNumber] = useState(defaultRoom);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please write a brief feedback comment.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerName: customerName.trim() || 'Hostel Mate',
          roomNumber: roomNumber.trim() || undefined,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        if (onReviewSubmitted) onReviewSubmitted();
      } else {
        setError(data.error || 'Failed to submit review.');
      }
    } catch {
      setError('Network error submitting review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-midnight-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Thank You for Your Feedback!</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Your review helps our hostel kitchen keep the midnight Maggi & Pasta top-notch!
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400"
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Rate Your Midnight Bite</h3>
                <p className="text-xs text-slate-400">How was the taste and delivery?</p>
              </div>
            </div>

            {error && (
              <div className="p-2.5 mb-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating */}
              <div className="text-center py-2 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Overall Rating
                </span>
                <div className="flex justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-2xl transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Your Review / Suggestions
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Cheese Maggi was perfectly melted! Loved the fast delivery."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Student Name & Room */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Room No.</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. Room 314"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Submitting...' : 'Submit Midnight Review'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
