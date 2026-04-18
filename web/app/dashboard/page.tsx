'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface DashboardData {
  tier: 'free' | 'pro';
  subscription: any;
  scans: any[];
  purchases: any[];
  scan_count: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuthAndFetchData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/signin');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session exists:', !!session);
        console.log('Access token exists:', !!session?.access_token);

        const response = await fetch('/api/v1/dashboard', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.ok) {
          const dashboardData = await response.json();
          console.log('Dashboard data received:', dashboardData);
          setData(dashboardData);
        } else {
          const errorText = await response.text();
          console.error('Dashboard API error:', response.status, response.statusText, errorText);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndFetchData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="bg-[#0a0e17] min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#0a0e17] min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-white">Failed to load dashboard data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0e17] min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold mb-2">Dashboard</h1>
          <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-4">
            <div className="text-white font-medium">
              Plan: <span className="text-teal-400">{data.tier === 'pro' ? 'Pro' : 'Free'}</span>
            </div>
          </div>
        </div>

        {data.tier === 'free' && (
          <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6 mb-8">
            <h2 className="text-white text-xl font-bold mb-2">Upgrade to Pro</h2>
            <p className="text-slate-300 mb-4">Get unlimited scans, monitoring, and premium features</p>
            <Link href="/pricing" className="inline-block bg-teal-400 text-white px-4 py-2 rounded-xl hover:opacity-90 transition">
              View Pro Plans
            </Link>
          </div>
        )}

        {data.tier === 'pro' && (
          <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Monitoring</h3>
              <Link href="/dashboard/monitoring" className="text-teal-400 text-sm hover:underline">
                Manage watchlist →
              </Link>
            </div>
            <p className="text-slate-400 text-sm">
              Track your site and up to 2 competitors. Weekly automated scans with email alerts.
            </p>
          </div>
        )}

        {data.tier === 'free' && (
          <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6 mb-8 opacity-60">
            <h3 className="text-lg font-medium text-white mb-2">Monitoring</h3>
            <p className="text-slate-400 text-sm">
              Pro feature: Track your site + 2 competitors with weekly scans and score drop alerts.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6">
            <h2 className="text-white text-xl font-bold mb-4">Recent Scans ({data.scan_count})</h2>
            {data.scans.length > 0 ? (
              <div className="space-y-3">
                {data.scans.slice(0, 5).map((scan: any, index: number) => (
                  <div key={index} className="border-b border-[#252b3a] pb-3 last:border-b-0">
                    <div className="text-white font-medium">{scan.url}</div>
                    <div className="text-slate-400 text-sm">Score: {scan.overall_score}/100</div>
                    <div className="text-slate-400 text-sm">
                      {new Date(scan.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400">No scans yet</div>
            )}
          </div>

          <div className="bg-[#111827] border border-[#252b3a] rounded-xl p-6">
            <h2 className="text-white text-xl font-bold mb-4">Purchase History</h2>
            {data.purchases.length > 0 ? (
              <div className="space-y-3">
                {data.purchases.map((purchase: any, index: number) => (
                  <div key={index} className="border-b border-[#252b3a] pb-3 last:border-b-0">
                    <div className="text-white font-medium">{purchase.product_name || 'PDF Report'}</div>
                    <div className="text-slate-400 text-sm">
                      ${purchase.amount} - {new Date(purchase.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400">No purchases yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}