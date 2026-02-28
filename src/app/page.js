'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUS_TABS = [
  { key: 'active', label: 'Active', color: 'bg-violet-600' },
  { key: 'new', label: 'New', color: 'bg-emerald-600' },
  { key: 'drafted', label: 'Drafted', color: 'bg-amber-600' },
  { key: 'sent', label: 'Sent', color: 'bg-sky-600' },
  { key: 'archived', label: 'Archived', color: 'bg-slate-600' },
];

export default function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [subredditFilter, setSubredditFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [draftText, setDraftText] = useState('');

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: activeTab, limit: '100' });
      if (subredditFilter !== 'all') params.set('subreddit', subredditFilter);
      const res = await fetch(`/api/matches?${params}`);
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, subredditFilter]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Get unique subreddits from current matches for filter dropdown
  const subreddits = [...new Set(matches.map((m) => m.subreddit))].sort();

  async function updateMatch(id, updates) {
    try {
      await fetch('/api/matches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      fetchMatches();
    } catch (err) {
      console.error('Update failed:', err);
    }
  }

  async function deleteMatch(id) {
    try {
      await fetch(`/api/matches?id=${id}`, { method: 'DELETE' });
      setMatches((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  function saveDraft(id) {
    updateMatch(id, { draft_response: draftText, status: 'drafted' });
    setExpandedId(null);
    setDraftText('');
  }

  function markSent(id) {
    updateMatch(id, { status: 'sent' });
  }

  function archiveMatch(id) {
    updateMatch(id, { status: 'archived' });
  }

  function timeAgo(dateStr) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function relevanceBadge(score) {
    if (score >= 5) return { label: 'High', className: 'bg-emerald-900/60 text-emerald-300 border-emerald-800' };
    if (score >= 3) return { label: 'Medium', className: 'bg-amber-900/60 text-amber-300 border-amber-800' };
    return { label: 'Low', className: 'bg-slate-800 text-slate-400 border-slate-700' };
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(145deg, #020617 0%, #0f0a1e 50%, #020617 100%)' }}>
      {/* Header */}
      <header className="border-b border-slate-800/60 backdrop-blur-sm sticky top-0 z-10" style={{ background: 'rgba(2,6,23,0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              <span className="text-violet-400 text-xl font-bold tracking-tight">Work</span>
              <span className="text-slate-300 text-xl font-semibold tracking-tight">Central</span>
            </div>
            <span className="text-slate-600 text-xl font-light">|</span>
            <span className="text-slate-400 text-sm font-medium tracking-wide uppercase">Reddit Monitor</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{matches.length} results</span>
            <button
              onClick={fetchMatches}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md border border-slate-700 transition-colors cursor-pointer"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Status tabs */}
          <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800/60">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-700/50'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subreddit filter */}
          <select
            value={subredditFilter}
            onChange={(e) => setSubredditFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:ring-violet-600 focus:border-violet-600"
          >
            <option value="all">All subreddits</option>
            {subreddits.map((sub) => (
              <option key={sub} value={sub}>r/{sub}</option>
            ))}
          </select>
        </div>

        {/* Match list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-500 text-sm">Loading matches...</div>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <div className="text-slate-500 text-sm">No matches found</div>
            <div className="text-slate-600 text-xs">Try a different filter or wait for new scans</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map((match) => {
              const rel = relevanceBadge(match.relevance_score);
              const isExpanded = expandedId === match.id;

              return (
                <div
                  key={match.id}
                  className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 hover:border-slate-700/80 transition-all group"
                >
                  {/* Top row: subreddit, relevance, time */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="bg-violet-950/60 text-violet-300 border border-violet-900/50 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      r/{match.subreddit}
                    </span>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${rel.className}`}>
                      {rel.label}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-auto flex items-center gap-3">
                      <span>{match.num_comments} comments</span>
                      <span>↑ {match.score}</span>
                      <span>{timeAgo(match.reddit_created_at)}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] font-semibold text-slate-100 mb-2 leading-snug">
                    {match.title}
                  </h3>

                  {/* Snippet */}
                  {match.selftext_snippet && (
                    <p className="text-sm text-slate-400 leading-relaxed mb-3 line-clamp-3">
                      {match.selftext_snippet}
                    </p>
                  )}

                  {/* Matched keywords */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {match.matched_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="bg-slate-800/80 text-violet-300/80 text-[11px] px-2 py-0.5 rounded border border-slate-700/50"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>

                  {/* Draft response area */}
                  {match.draft_response && !isExpanded && (
                    <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 mb-3">
                      <div className="text-[11px] text-amber-400/70 font-medium mb-1">Draft Response</div>
                      <p className="text-xs text-slate-400 line-clamp-2">{match.draft_response}</p>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mb-3">
                      <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        placeholder="Draft your response here..."
                        rows={6}
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:ring-violet-600 focus:border-violet-600 focus:outline-none resize-y"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveDraft(match.id)}
                          className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium px-4 py-1.5 rounded-md transition-colors cursor-pointer"
                        >
                          Save Draft
                        </button>
                        <button
                          onClick={() => { setExpandedId(null); setDraftText(''); }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-1.5 rounded-md border border-slate-700 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={match.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium px-3 py-1.5 rounded-md border border-violet-700/40 transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>↗</span> Open in Reddit
                    </a>
                    {!isExpanded && (
                      <button
                        onClick={() => {
                          setExpandedId(match.id);
                          setDraftText(match.draft_response || '');
                        }}
                        className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-700/40 transition-colors cursor-pointer"
                      >
                        ✎ Draft Response
                      </button>
                    )}
                    {match.status !== 'sent' && (
                      <button
                        onClick={() => markSent(match.id)}
                        className="bg-slate-800/60 hover:bg-emerald-900/40 text-slate-400 hover:text-emerald-300 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-700/40 transition-colors cursor-pointer"
                      >
                        ✓ Mark Sent
                      </button>
                    )}
                    <button
                      onClick={() => archiveMatch(match.id)}
                      className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-700/40 transition-colors cursor-pointer"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => deleteMatch(match.id)}
                      className="bg-slate-800/60 hover:bg-red-900/30 text-slate-500 hover:text-red-400 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-700/40 transition-colors ml-auto cursor-pointer"
                    >
                      ✕ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
