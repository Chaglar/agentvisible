'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugSubscription() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDebugData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/v1/debug-subscriptions', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const debugData = await response.json();
          setData(debugData);
        } else {
          const errorText = await response.text();
          setError(`API Error: ${response.status} - ${errorText}`);
        }
      } catch (err) {
        setError(`Error: ${err}`);
      } finally {
        setLoading(false);
      }
    }

    fetchDebugData();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0a0e17] min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-white">Loading debug data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0a0e17] min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0e17] min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-white text-2xl font-bold mb-6">Subscription Debug Info</h1>

        <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6 mb-6">
          <h2 className="text-white text-lg font-medium mb-4">User Info</h2>
          <p className="text-slate-300">User ID: <span className="text-teal-400">{data?.user_id}</span></p>
          <p className="text-slate-300">Subscription Count: <span className="text-teal-400">{data?.subscription_count}</span></p>
          <p className="text-slate-300">Purchase Count: <span className="text-teal-400">{data?.purchase_count}</span></p>
        </div>

        <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6 mb-6">
          <h2 className="text-white text-lg font-medium mb-4">Subscriptions</h2>
          <pre className="text-slate-300 text-sm overflow-x-auto">
            {JSON.stringify(data?.all_subscriptions, null, 2)}
          </pre>
        </div>

        <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6">
          <h2 className="text-white text-lg font-medium mb-4">Purchases</h2>
          <pre className="text-slate-300 text-sm overflow-x-auto">
            {JSON.stringify(data?.all_purchases, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}