'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface WatchlistItem {
  id: string;
  url: string;
  type: 'self' | 'competitor';
  label: string;
  active: boolean;
  last_score?: number;
  last_scan_at?: string;
}

interface ComparisonItem extends WatchlistItem {
  current_score?: number;
  history: Array<{ score: number; scanned_at: string }>;
}

export default function MonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [addingType, setAddingType] = useState<'self' | 'competitor' | null>(null);
  const [scanning, setScanning] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const router = useRouter();
  const supabase = createClient();

  function showStatusMessage(message: string, type: 'success' | 'error' = 'success') {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => setStatusMessage(''), 3000);
  }

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  async function checkAuthAndLoadData() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/signin');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Check if user is Pro
      const dashboardResponse = await fetch('/api/v1/dashboard', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setIsProUser(dashboardData.tier === 'pro');

        if (dashboardData.tier === 'pro') {
          await loadWatchlist();
          await loadComparison();
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadWatchlist() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/v1/monitoring/watchlist', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist || []);
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    }
  }

  async function loadComparison() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/v1/monitoring/comparison', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setComparison(data.comparison || []);
      }
    } catch (error) {
      console.error('Failed to load comparison:', error);
    }
  }

  async function addToWatchlist() {
    if (!newUrl.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/v1/monitoring/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          url: newUrl.trim(),
          type: addingType
        })
      });

      if (response.ok) {
        setNewUrl('');
        setAddingType(null);
        await loadWatchlist();
        await loadComparison();
      } else {
        const error = await response.text();
        showStatusMessage('Failed to add URL: ' + error, 'error');
      }
    } catch (error) {
      showStatusMessage('Failed to add URL: ' + error, 'error');
    }
  }

  async function removeFromWatchlist(itemId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/v1/monitoring/watchlist/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });

      if (response.ok) {
        await loadWatchlist();
        await loadComparison();
      }
    } catch (error) {
      console.error('Failed to remove URL:', error);
    }
  }

  async function scanNow() {
    setScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/v1/monitoring/scan-now', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });

      if (response.ok) {
        await loadWatchlist();
        await loadComparison();
        showStatusMessage('Scans completed successfully!', 'success');
      } else {
        showStatusMessage('Failed to trigger scans', 'error');
      }
    } catch (error) {
      showStatusMessage('Failed to trigger scans: ' + error, 'error');
    } finally {
      setScanning(false);
    }
  }

  function renderChart() {
    if (comparison.length === 0) return null;

    const chartWidth = 600;
    const chartHeight = 200;
    const padding = 40;
    const colors = {
      self: '#22d3ee', // text-cyan-400
      competitor: '#fbbf24' // text-amber-400
    };

    // Get max history length
    const maxPoints = Math.max(...comparison.map(item => item.history.length));
    if (maxPoints === 0) return null;

    return (
      <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6 mt-6">
        <h3 className="text-white text-lg font-medium mb-4">Score History (last 12 weeks)</h3>
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="60" height="40" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 40" fill="none" stroke="#252b3a" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map(score => (
            <g key={score}>
              <text
                x={padding - 10}
                y={chartHeight - padding - (score / 100) * (chartHeight - 2 * padding) + 5}
                fill="#64748b"
                fontSize="12"
                textAnchor="end"
              >
                {score}
              </text>
              <line
                x1={padding}
                y1={chartHeight - padding - (score / 100) * (chartHeight - 2 * padding)}
                x2={chartWidth - padding}
                y2={chartHeight - padding - (score / 100) * (chartHeight - 2 * padding)}
                stroke="#252b3a"
                strokeWidth="1"
                opacity="0.5"
              />
            </g>
          ))}

          {/* Plot lines for each URL */}
          {comparison.map((item, index) => {
            if (item.history.length === 0) return null;

            const points = item.history.map((point, pointIndex) => {
              const x = padding + (pointIndex / (maxPoints - 1)) * (chartWidth - 2 * padding);
              const y = chartHeight - padding - (point.score / 100) * (chartHeight - 2 * padding);
              return `${x},${y}`;
            }).join(' ');

            const color = item.type === 'self' ? colors.self :
                         index === 1 ? '#22d3ee' : colors.competitor;

            return (
              <g key={item.id}>
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  points={points}
                />
                {/* Data points */}
                {item.history.map((point, pointIndex) => {
                  const x = padding + (pointIndex / (maxPoints - 1)) * (chartWidth - 2 * padding);
                  const y = chartHeight - padding - (point.score / 100) * (chartHeight - 2 * padding);
                  return (
                    <circle
                      key={pointIndex}
                      cx={x}
                      cy={y}
                      r="3"
                      fill={color}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex gap-6 mt-4">
          {comparison.map((item, index) => {
            const color = item.type === 'self' ? 'text-cyan-400' :
                         index === 1 ? 'text-cyan-400' : 'text-amber-400';
            return (
              <div key={item.id} className={`flex items-center gap-2 ${color}`}>
                <div className={`w-3 h-3 rounded-full bg-current`}></div>
                <span className="text-sm">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#0a0e17] min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isProUser) {
    return (
      <div className="bg-[#0a0e17] min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-8 text-center">
            <h1 className="text-white text-2xl font-bold mb-4">Pro Feature</h1>
            <p className="text-slate-300 mb-6">
              Monitoring requires a Pro subscription. Track your site and up to 2 competitors with weekly automated scans and score drop alerts.
            </p>
            <a
              href="/pricing"
              className="inline-block bg-teal-400 text-[#0a0e17] px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              Upgrade to Pro
            </a>
          </div>
        </div>
      </div>
    );
  }

  const selfSite = watchlist.find(item => item.type === 'self');
  const competitors = watchlist.filter(item => item.type === 'competitor');

  return (
    <div className="bg-[#0a0e17] min-h-screen">
      {statusMessage && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-sm z-50 ${
          statusType === 'error'
            ? 'bg-[#111827] border border-[#dc2626] text-red-400'
            : 'bg-[#111827] border border-[#252b3a] text-teal-400'
        }`}>
          {statusMessage}
        </div>
      )}
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Monitoring</h1>
          <button
            onClick={scanNow}
            disabled={scanning || watchlist.length === 0}
            className="bg-teal-400 text-[#0a0e17] px-4 py-2 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {scanning ? 'Scanning...' : 'Scan Now'}
          </button>
        </div>

        {/* Watchlist Management */}
        <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6 mb-6">
          <h2 className="text-white text-xl font-medium mb-6">Your Watchlist</h2>

          {/* Your Site */}
          <div className="mb-6">
            <h3 className="text-slate-300 font-medium mb-3">Your Site</h3>
            {selfSite ? (
              <div className="bg-[#1a1f2e] border border-[#252b3a] rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">{selfSite.label}</div>
                  <div className="text-slate-400 text-sm">
                    Score: {selfSite.last_score || 'Not scanned'}
                    {selfSite.last_scan_at && (
                      <span> · {new Date(selfSite.last_scan_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFromWatchlist(selfSite.id)}
                  className="text-red-400 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                {addingType === 'self' ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter your website URL"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="flex-1 bg-[#1a1f2e] border border-[#252b3a] rounded-lg px-4 py-2 text-white text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
                    />
                    <button
                      onClick={addToWatchlist}
                      className="bg-teal-400 text-[#0a0e17] px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAddingType(null); setNewUrl(''); }}
                      className="text-slate-400 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingType('self')}
                    className="text-teal-400 text-sm hover:underline"
                  >
                    + Add your site
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Competitors */}
          <div>
            <h3 className="text-slate-300 font-medium mb-3">Competitors</h3>
            <div className="space-y-3">
              {competitors.map((competitor) => (
                <div key={competitor.id} className="bg-[#1a1f2e] border border-[#252b3a] rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="text-white font-medium">{competitor.label}</div>
                    <div className="text-slate-400 text-sm">
                      Score: {competitor.last_score || 'Not scanned'}
                      {competitor.last_scan_at && (
                        <span> · {new Date(competitor.last_scan_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(competitor.id)}
                    className="text-red-400 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}

              {competitors.length < 2 && (
                <div>
                  {addingType === 'competitor' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter competitor URL"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="flex-1 bg-[#1a1f2e] border border-[#252b3a] rounded-lg px-4 py-2 text-white text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
                      />
                      <button
                        onClick={addToWatchlist}
                        className="bg-teal-400 text-[#0a0e17] px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setAddingType(null); setNewUrl(''); }}
                        className="text-slate-400 px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingType('competitor')}
                      className="text-teal-400 text-sm hover:underline"
                    >
                      + Add competitor
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Score Comparison */}
        {comparison.length > 0 && (
          <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6 mb-6">
            <h3 className="text-white text-lg font-medium mb-4">Score Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#252b3a]">
                    <th className="text-left text-slate-400 font-medium py-2">Site</th>
                    <th className="text-left text-slate-400 font-medium py-2">Current</th>
                    <th className="text-left text-slate-400 font-medium py-2">Change</th>
                    <th className="text-left text-slate-400 font-medium py-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((item) => {
                    const current = item.current_score || 0;
                    const previous = item.history.length > 1 ? item.history[item.history.length - 2]?.score || 0 : current;
                    const change = current - previous;
                    const trend = change > 2 ? '↗' : change < -2 ? '↘' : '→';
                    const changeColor = change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-slate-400';

                    return (
                      <tr key={item.id} className="border-b border-[#252b3a] last:border-b-0">
                        <td className="py-3 text-white">{item.label}</td>
                        <td className="py-3 text-white">{current}</td>
                        <td className={`py-3 ${changeColor}`}>
                          {change > 0 ? '+' : ''}{change}
                        </td>
                        <td className="py-3 text-white text-lg">{trend}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Score History Chart */}
        {renderChart()}
      </div>
    </div>
  );
}