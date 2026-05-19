'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Bell, PenSquare, LogOut, Settings, ChevronDown, Crown, Zap, Building2 } from 'lucide-react';
import type { User } from '@/types/database';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':           'Overview',
  '/dashboard/compose':   'Compose Post',
  '/dashboard/posts':     'My Posts',
  '/dashboard/calendar':  'Content Calendar',
  '/dashboard/accounts':  'Connected Accounts',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/settings':  'Settings',
};

const PLAN_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  free:   { label: 'Free',   icon: <Zap size={11} />,      className: 'bg-zinc-700/70 text-zinc-300 border-zinc-600/50' },
  pro:    { label: 'Pro',    icon: <Crown size={11} />,     className: 'bg-primary-500/20 text-primary-300 border-primary-500/30' },
  agency: { label: 'Agency', icon: <Building2 size={11} />, className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

interface Props {
  user: User | null;
}

export default function DashboardTopbar({ user }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const title    = PAGE_TITLES[pathname] ?? 'Dashboard';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    toast.success('Signed out successfully.');
    router.push('/login');
  }

  const plan       = user?.plan ?? 'free';
  const planConfig = PLAN_CONFIG[plan];
  const initials   = (user?.full_name ?? user?.email ?? 'U')[0].toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
      {/* Page title */}
      <div className="pl-10 lg:pl-0">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Quick compose button */}
        <Link
          href="/dashboard/compose"
          className="hidden sm:flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 glow-primary"
        >
          <PenSquare size={15} />
          New Post
        </Link>

        {/* Notifications (placeholder) */}
        <button className="relative p-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary-500" />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 p-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-all group"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-primary-400">{initials}</span>
              )}
            </div>
            {/* Name (hidden on small screens) */}
            <span className="hidden sm:block text-xs font-medium text-zinc-300 group-hover:text-white max-w-[100px] truncate">
              {user?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'}
            </span>
            <ChevronDown
              size={13}
              className={clsx('text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/40 py-1.5 z-50 animate-fade-in">
              {/* User info */}
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.full_name ?? 'Creator'}
                </p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{user?.email}</p>
                <div className={clsx(
                  'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-2',
                  planConfig.className
                )}>
                  {planConfig.icon}
                  {planConfig.label} Plan
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <Settings size={14} className="text-zinc-500" />
                  Settings
                </Link>
                {plan === 'free' && (
                  <Link
                    href="/dashboard/settings?tab=billing"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-primary-400 hover:text-primary-300 hover:bg-primary-500/5 transition-colors"
                  >
                    <Crown size={14} />
                    Upgrade to Pro
                  </Link>
                )}
              </div>

              <div className="border-t border-zinc-800 py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
