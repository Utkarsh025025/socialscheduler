'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/database';
import {
  LayoutDashboard,
  PenSquare,
  CalendarDays,
  Link2,
  BarChart2,
  Settings,
  Layers,
  LogOut,
  ChevronRight,
  Zap,
  Menu,
  X,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Overview',    icon: LayoutDashboard },
  { href: '/dashboard/compose',    label: 'Compose',     icon: PenSquare       },
  { href: '/dashboard/posts',      label: 'My Posts',    icon: FileText        },
  { href: '/dashboard/calendar',   label: 'Calendar',    icon: CalendarDays    },
  { href: '/dashboard/accounts',   label: 'Accounts',    icon: Link2           },
  { href: '/dashboard/analytics',  label: 'Analytics',   icon: BarChart2       },
  { href: '/dashboard/settings',   label: 'Settings',    icon: Settings        },
];

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  free:   { label: 'Free',   className: 'bg-zinc-700 text-zinc-300'         },
  pro:    { label: 'Pro',    className: 'bg-primary-500/20 text-primary-400' },
  agency: { label: 'Agency', className: 'bg-amber-500/20 text-amber-400'    },
};

interface Props {
  user: User | null;
}

export default function DashboardSidebar({ user }: Props) {
  const pathname  = usePathname();
  const router    = useRouter();
  const supabase  = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    toast.success('Signed out successfully.');
  }

  const plan = user?.plan ?? 'free';
  const badge = PLAN_BADGE[plan];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
          <Layers size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold text-white">CreatorPost</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
              )}
            >
              <Icon size={17} className={isActive ? 'text-primary-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
              {label}
              {isActive && (
                <ChevronRight size={14} className="ml-auto text-primary-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade banner (for free users) */}
      {plan === 'free' && (
        <div className="mx-3 mb-3">
          <div className="bg-gradient-to-br from-primary-500/20 to-primary-700/10 border border-primary-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-primary-400" />
              <span className="text-xs font-semibold text-primary-300">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Unlimited posts, 5 accounts, and unlimited AI generations.
            </p>
            <Link
              href="/dashboard/settings?tab=billing"
              className="block text-center text-xs font-semibold bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg transition-colors"
            >
              Upgrade — $19/mo
            </Link>
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="border-t border-zinc-800 px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary-400">
                {(user?.full_name ?? user?.email ?? 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user?.full_name ?? 'Creator'}
            </p>
            <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded-md', badge.className)}>
              {badge.label}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-zinc-500 hover:text-red-400 transition-colors p-1"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[260px] bg-zinc-900 border-r border-zinc-800 flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-full w-[260px] bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
