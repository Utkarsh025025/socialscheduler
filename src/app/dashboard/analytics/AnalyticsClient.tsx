'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FileText, Send, Clock, AlertCircle, TrendingUp, BarChart2 } from 'lucide-react';
import type { Post, Platform } from '@/types/database';
import clsx from 'clsx';

// ── Types ────────────────────────────────────────────────────
interface WeekBucket {
  week: string;
  published: number;
  scheduled: number;
  draft: number;
}

interface PlatformSlice {
  name: string;
  value: number;
  color: string;
}

// ── Platform colors ──────────────────────────────────────────
const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: '#ec4899',
  tiktok:    '#22d3ee',
  linkedin:  '#60a5fa',
  youtube:   '#f87171',
  facebook:  '#93c5fd',
  pinterest: '#fb7185',
};

// ── Custom Tooltip ───────────────────────────────────────────
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-zinc-400 font-medium mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-zinc-300 capitalize">{p.dataKey}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-zinc-300 font-semibold capitalize">{payload[0].name}</p>
      <p className="text-white font-bold mt-0.5">{payload[0].value} posts</p>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  published: 'bg-green-500/15 text-green-400 border-green-500/25',
  draft:     'bg-zinc-700/40 text-zinc-400 border-zinc-600/25',
  failed:    'bg-red-500/15 text-red-400 border-red-500/25',
};

// ── Build last-4-weeks bar data ───────────────────────────────
function buildWeeklyData(posts: Post[]): WeekBucket[] {
  const now = new Date();
  const buckets: WeekBucket[] = [];

  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const label = i === 0
      ? 'This week'
      : i === 1
      ? 'Last week'
      : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const inWeek = posts.filter((p) => {
      const d = new Date(p.created_at);
      return d >= weekStart && d <= weekEnd;
    });

    buckets.push({
      week: label,
      published: inWeek.filter((p) => p.status === 'published').length,
      scheduled: inWeek.filter((p) => p.status === 'scheduled').length,
      draft:     inWeek.filter((p) => p.status === 'draft').length,
    });
  }
  return buckets;
}

// ── Build platform distribution ───────────────────────────────
function buildPlatformData(posts: Post[]): PlatformSlice[] {
  const count: Partial<Record<Platform, number>> = {};
  posts.forEach((p) => {
    (p.platforms as Platform[]).forEach((platform) => {
      count[platform] = (count[platform] ?? 0) + 1;
    });
  });
  return Object.entries(count).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
    color: PLATFORM_COLORS[name as Platform] ?? '#6366f1',
  }));
}

// ── Main AnalyticsClient ──────────────────────────────────────
export default function AnalyticsClient({ posts }: { posts: Post[] }) {
  const totalPosts     = posts.length;
  const published      = posts.filter(p => p.status === 'published').length;
  const scheduled      = posts.filter(p => p.status === 'scheduled').length;
  const failed         = posts.filter(p => p.status === 'failed').length;

  const weeklyData     = buildWeeklyData(posts);
  const platformData   = buildPlatformData(posts);

  const statCards = [
    { label: 'Total Posts',     value: totalPosts, icon: FileText,     color: 'text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
    { label: 'Published',       value: published,  icon: Send,         color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20'   },
    { label: 'Scheduled',       value: scheduled,  icon: Clock,        color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
    { label: 'Failed',          value: failed,     icon: AlertCircle,  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
  ];

  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-sm text-zinc-400">Performance overview across all your posts and platforms.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={clsx('rounded-2xl border p-5', bg, border)}>
            <div className={clsx('inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3', bg, `border ${border}`)}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-3xl font-bold text-white mb-0.5">{value}</p>
            <p className="text-xs text-zinc-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly bar chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 size={16} className="text-primary-400" />
            <h2 className="font-semibold text-white">Posts Over Time</h2>
            <span className="text-xs text-zinc-500 ml-auto">Last 4 weeks</span>
          </div>

          {totalPosts === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-zinc-600">
              <BarChart2 size={32} className="mb-2" />
              <p className="text-sm">No post data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} barSize={12} barGap={4}>
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="published" fill="#4ade80" radius={[4, 4, 0, 0]} />
                <Bar dataKey="scheduled" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="draft"     fill="#52525b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4">
            {[
              { color: '#4ade80', label: 'Published' },
              { color: '#60a5fa', label: 'Scheduled' },
              { color: '#52525b', label: 'Draft'     },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-xs text-zinc-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform pie chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-primary-400" />
            <h2 className="font-semibold text-white">By Platform</h2>
          </div>

          {platformData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-zinc-600">
              <TrendingUp size={32} className="mb-2" />
              <p className="text-sm">No data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {platformData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {platformData.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-xs text-zinc-400 capitalize">{name}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Posts table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <FileText size={16} className="text-zinc-400" /> Recent Posts
        </h2>

        {recentPosts.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={32} className="mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-400 text-sm">No posts yet. Head to Compose to create your first post.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Caption', 'Platforms', 'Status', 'Scheduled / Published', 'Created'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide pb-3 pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Caption */}
                    <td className="py-3 pr-4 max-w-[220px]">
                      <p className="text-zinc-200 truncate text-xs">{post.content}</p>
                    </td>
                    {/* Platforms */}
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {(post.platforms as Platform[]).slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="text-[10px] font-medium capitalize px-1.5 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="py-3 pr-4">
                      <span className={clsx('text-[10px] font-medium px-2 py-1 rounded-full border capitalize', STATUS_STYLES[post.status])}>
                        {post.status}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="py-3 pr-4">
                      <p className="text-xs text-zinc-400">
                        {post.scheduled_at
                          ? new Date(post.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : post.published_at
                          ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </p>
                    </td>
                    {/* Created */}
                    <td className="py-3">
                      <p className="text-xs text-zinc-500">
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
