'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, Quote } from 'lucide-react';
import { CustomerReview } from '@/lib/types';
import ReviewModal from './ReviewModal';

export default function ReviewsWall() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (e) {
      console.error('Failed to load reviews:', e);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <>
      <section className="bg-midnight-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-white">Hostel Reviews</span>
              <div className="flex items-center space-x-1 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs font-bold text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{averageRating}</span>
                <span className="text-slate-400 font-normal">({reviews.length})</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">What wingmates say about our midnight snacks</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-amber-400 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Review Us</span>
          </button>
        </div>

        {/* Reviews Cards List */}
        <div className="space-y-2.5">
          {reviews.slice(0, 3).map((rev) => (
            <div
              key={rev.id}
              className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">{rev.customerName}</span>
                  {rev.roomNumber && (
                    <span className="text-[10px] text-amber-400/90 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-mono">
                      {rev.roomNumber}
                    </span>
                  )}
                </div>

                <div className="flex text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed italic">
                &ldquo;{rev.comment}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>

      {isModalOpen && (
        <ReviewModal
          onClose={() => setIsModalOpen(false)}
          onReviewSubmitted={() => {
            fetchReviews();
          }}
        />
      )}
    </>
  );
}
