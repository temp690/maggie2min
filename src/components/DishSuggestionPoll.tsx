'use client';

import React, { useState, useEffect } from 'react';
import { ThumbsUp, Plus, Sparkles, Check, Flame } from 'lucide-react';
import { DishSuggestion } from '@/lib/types';

export default function DishSuggestionPoll() {
  const [suggestions, setSuggestions] = useState<DishSuggestion[]>([]);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [suggestedBy, setSuggestedBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/suggestions');
      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error('Failed to load suggestions:', e);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    const saved = localStorage.getItem('hnb_voted_dishes');
    if (saved) {
      try {
        setVotedIds(JSON.parse(saved));
      } catch (_) {}
    }
  }, []);

  const handleVote = async (id: string) => {
    if (votedIds.includes(id)) return;

    // optimistic update
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, votes: (s.votes || 0) + 1 } : s))
    );
    const updatedVotes = [...votedIds, id];
    setVotedIds(updatedVotes);
    localStorage.setItem('hnb_voted_dishes', JSON.stringify(updatedVotes));

    try {
      await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId: id }),
      });
    } catch (e) {
      console.error('Vote failed:', e);
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          suggestedBy: suggestedBy.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.suggestion) {
        setSuggestions((prev) => [data.suggestion, ...prev]);
        setNewTitle('');
        setSuggestedBy('');
        setShowAddForm(false);
        setSuccessMsg('Dish suggestion added! Your hostel mates can now vote for it. 🎉');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error('Submission failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-midnight-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mb-1">
            <Flame className="w-3 h-3" />
            <span>Hostel Poll</span>
          </div>
          <h3 className="text-base font-bold text-white">Vote for Next Midnight Dishes!</h3>
          <p className="text-xs text-slate-400">
            Which items should our hostel kitchen add to the menu next?
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 text-xs font-bold text-amber-400 bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-xl flex items-center space-x-1 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Suggest New</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 text-center font-semibold animate-in fade-in">
          {successMsg}
        </div>
      )}

      {/* Suggest New Dish Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleAddCustom}
          className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in"
        >
          <h4 className="text-xs font-bold text-amber-300">Suggest a Dish to the Kitchen:</h4>
          <div>
            <input
              type="text"
              required
              placeholder="e.g. Cheese Garlic Toast, Paneer Maggi, Cold Milo..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Your name or room (Optional)"
              value={suggestedBy}
              onChange={(e) => setSuggestedBy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs whitespace-nowrap"
            >
              {loading ? 'Adding...' : 'Submit'}
            </button>
          </div>
        </form>
      )}

      {/* Curated Suggestions Voting Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {suggestions.map((sug) => {
          const hasVoted = votedIds.includes(sug.id);

          return (
            <div
              key={sug.id}
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                hasVoted
                  ? 'bg-amber-500/10 border-amber-500/40 text-white'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                <span className="text-2xl p-1 bg-slate-900 rounded-xl shrink-0">
                  {sug.icon || '🍽️'}
                </span>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-white truncate">{sug.title}</h5>
                  {sug.description && (
                    <p className="text-[10px] text-slate-400 truncate">{sug.description}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleVote(sug.id)}
                disabled={hasVoted}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shrink-0 ${
                  hasVoted
                    ? 'bg-amber-500 text-slate-950 shadow-sm cursor-default'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 active:scale-95'
                }`}
                title={hasVoted ? 'You voted!' : 'Vote for this item'}
              >
                {hasVoted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                <span>{sug.votes || 0}</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
