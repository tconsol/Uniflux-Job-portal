import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, DollarSign, Activity, RefreshCw, Play, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getRevenueSummary, triggerDailyJobSets } from '../api/admin.api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';

function fmt(n: number) {
  return n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['revenue'],
    queryFn: getRevenueSummary,
    staleTime: 1000 * 60,
  });

  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');

  async function handleTrigger() {
    setTriggering(true);
    setTriggerMsg('');
    try {
      const r = await triggerDailyJobSets();
      setTriggerMsg(r.message);
    } catch {
      setTriggerMsg('Trigger failed check server logs');
    } finally {
      setTriggering(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-red-500 p-6">Failed to load dashboard data.</p>;
  }

  const chartData = data.planBreakdown
    .filter((p) => !!p.planSlug)
    .map((p) => ({
      name: p.planSlug.charAt(0).toUpperCase() + p.planSlug.slice(1),
      users: p.count,
      mrr: p.mrr ?? 0,
    }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          {triggerMsg && <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">{triggerMsg}</span>}
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Trigger Daily Jobs
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={data.totalUsers.toLocaleString()}
          icon={Users}
          color="text-brand-600"
        />
        <StatCard
          title="Active Subscriptions"
          value={data.activeSubscriptions.toLocaleString()}
          sub={`${((data.activeSubscriptions / Math.max(data.totalUsers, 1)) * 100).toFixed(1)}% of users`}
          icon={Activity}
          color="text-green-600"
        />
        <StatCard
          title="Estimated MRR"
          value={fmt(data.estimatedMRR)}
          sub="Monthly recurring revenue"
          icon={DollarSign}
          color="text-amber-600"
        />
        <StatCard
          title="ARR Estimate"
          value={fmt(data.estimatedMRR * 12)}
          sub="Annual recurring revenue"
          icon={RefreshCw}
          color="text-purple-600"
        />
      </div>

      {/* Plan breakdown chart */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Users by Plan</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: 'none', fontSize: 12 }}
              />
              <Bar dataKey="users" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">MRR by Plan</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip
                formatter={(v: number) => [`₹${v}`, 'MRR']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: 'none', fontSize: 12 }}
              />
              <Bar dataKey="mrr" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent users */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Sign-ups</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-500 font-medium pb-3">Name</th>
                <th className="text-left text-xs text-gray-500 font-medium pb-3">Email</th>
                <th className="text-left text-xs text-gray-500 font-medium pb-3">Plan</th>
                <th className="text-left text-xs text-gray-500 font-medium pb-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentUsers.map((u) => (
                <tr key={u._id}>
                  <td className="py-3 text-gray-900 font-medium">{u.name}</td>
                  <td className="py-3 text-gray-500">{u.email}</td>
                  <td className="py-3"><Badge label={u.planSlug ?? undefined} /></td>
                  <td className="py-3 text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recentUsers.length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">No recent sign-ups</p>
          )}
        </div>
      </div>
    </div>
  );
}
