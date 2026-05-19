import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  CalendarCheck, Send, Link2, Sparkles,
  TrendingUp, ArrowUpRight, Clock, FileText
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch counts in parallel
  const [
    { count: scheduledCount },
    { count: publishedCount },
    { count: accountsCount },
    { data: recentPosts },
    { data: profile },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'scheduled'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'published'),
    supabase.from('connected_accounts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('users').select('ai_gens_this_month').eq('id', user.id).single(),
  ]);

  const stats = [
    { label: 'Scheduled Posts', value: scheduledCount ?? 0, icon: Clock,        color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
    { label: 'Published',       value: publishedCount ?? 0, icon: Send,          color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
    { label: 'Accounts',        value: accountsCount ?? 0,  icon: Link2,         color: 'text-primary-400',bg: 'bg-primary-500/10',border: 'border-primary-500/20'},
    { label: 'AI Generations',  value: profile?.ai_gens_this_month ?? 0, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  ];

  const STATUS_STYLES: Record<string, string> = {
    scheduled:  'bg-blue-500/15 text-blue-400 border-blue-500/20',
    published:  'bg-green-500/15 text-green-400 border-green-500/20',
    draft:      'bg-zinc-700/50 text-zinc-400 border-zinc-600/20',
    failed:     'bg-red-500/15 text-red-400 border-red-500/20',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">

      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 border border-primary-500/30">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <p className="text-primary-200 text-sm font-medium mb-1">Good {getGreeting()} 👋</p>
          <h1 className="text-2xl font-bold text-white mb-3">Your CreatorPost Dashboard</h1>
          <div className="flex gap-3">
            <Link href="/dashboard/compose" className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors">
              <Sparkles size={15} /> Create with AI
            </Link>
            <Link href="/dashboard/calendar" className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-medium text-sm px-4 py-2 rounded-xl hover:bg-white/20 transition-colors">
              <CalendarCheck size={15} /> View Calendar
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-2xl border ${border} ${bg} p-5`}>
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bg} border ${border} mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-3xl font-bold text-white mb-0.5">{value}</p>
            <p className="text-xs text-zinc-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent posts + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent posts table */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FileText size={16} className="text-zinc-400" /> Recent Posts
            </h3>
            <Link href="/dashboard/posts" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>

          {!recentPosts || recentPosts.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <FileText size={22} className="text-zinc-600" />
              </div>
              <p className="text-zinc-400 text-sm mb-3">No posts yet.</p>
              <Link href="/dashboard/compose" className="btn-primary text-sm py-2 px-4">
                Create your first post →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[post.status]}`}>
                        {post.status}
                      </span>
                      {(post.platforms as string[]).slice(0, 3).map((p) => (
                        <span key={p} className="text-[10px] text-zinc-500 capitalize">{p}</span>
                      ))}
                    </div>
                  </div>
                  {post.scheduled_at && (
                    <p className="text-xs text-zinc-500 whitespace-nowrap mt-0.5">
                      {new Date(post.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { href: '/dashboard/compose',   label: 'Write a new post',     icon: Sparkles,    color: 'text-primary-400' },
                { href: '/dashboard/calendar',  label: 'View content calendar', icon: CalendarCheck,color: 'text-blue-400'    },
                { href: '/dashboard/accounts',  label: 'Connect an account',   icon: Link2,       color: 'text-green-400'   },
                { href: '/dashboard/analytics', label: 'Check analytics',       icon: TrendingUp,  color: 'text-amber-400'   },
              ].map(({ href, label, icon: Icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition-colors group"
                >
                  <Icon size={16} className={color} />
                  <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{label}</span>
                  <ArrowUpRight size={13} className="ml-auto text-zinc-600 group-hover:text-zinc-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* Platform stats placeholder */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-1">Platform Reach</h3>
            <p className="text-xs text-zinc-500 mb-4">Connect accounts to see analytics.</p>
            <Link href="/dashboard/accounts" className="btn-secondary w-full text-sm py-2.5 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Connect Platforms →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
