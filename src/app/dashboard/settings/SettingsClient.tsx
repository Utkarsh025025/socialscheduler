'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/database';
import { PLAN_LIMITS } from '@/types/database';
import {
  Loader2, User as UserIcon, CreditCard, Shield,
  CheckCircle2, Zap, Crown, Building2,
  Check, X, Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import clsx from 'clsx';

interface Props { user: User | null; }

const TABS = [
  { id: 'profile',  label: 'Profile',  icon: UserIcon   },
  { id: 'billing',  label: 'Billing',  icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield      },
];

const PLAN_CARDS = [
  {
    id: 'free',
    label: 'Free',
    price: '$0',
    period: 'forever',
    icon: Zap,
    iconColor: 'text-zinc-400',
    iconBg: 'bg-zinc-700',
    features: [
      '10 posts per month',
      '2 connected accounts',
      '20 AI caption generations',
      'Basic analytics',
    ],
    highlight: false,
  },
  {
    id: 'pro',
    label: 'Pro',
    price: '$19',
    period: '/month',
    icon: Crown,
    iconColor: 'text-primary-400',
    iconBg: 'bg-primary-500/20',
    features: [
      'Unlimited posts',
      '5 connected accounts',
      'Unlimited AI generations',
      'Advanced analytics',
      'Priority email support',
    ],
    highlight: true,
  },
  {
    id: 'agency',
    label: 'Agency',
    price: '$49',
    period: '/month',
    icon: Building2,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    features: [
      'Unlimited posts',
      '10 connected accounts',
      'Unlimited AI generations',
      'Team members',
      'White-label reports',
      'Dedicated support',
    ],
    highlight: false,
  },
];

// ── Billing Coming Soon Modal ────────────────────────────────
function BillingComingSoonModal({ plan, onClose }: { plan: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: `billing_${plan}`, email }),
      });
      setSent(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 animate-fade-in">
        {!sent && (
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
        )}
        {sent ? (
          <div className="text-center py-4">
            <CheckCircle2 size={36} className="text-green-400 mx-auto mb-3" />
            <p className="text-white font-bold mb-1">Got it! We&apos;ll notify you.</p>
            <p className="text-xs text-zinc-400">Payments via Stripe are coming soon. We&apos;ll email you when billing goes live.</p>
            <button onClick={onClose} className="mt-4 text-xs text-primary-400 hover:text-primary-300">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Bell size={20} className="text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">Payments Coming Soon</h2>
                <p className="text-xs text-zinc-500 capitalize">{plan} plan</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Stripe billing integration is being set up. Enter your email and we&apos;ll notify you the moment paid plans go live — early subscribers get a discount.
            </p>
            <form onSubmit={handleNotify} className="space-y-3">
              <input
                type="email" required autoFocus
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button type="submit" disabled={saving} className="w-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                Notify me when billing launches
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function SettingsClient({ user }: Props) {
  const supabase     = createClient();
  const searchParams = useSearchParams();

  const [tab, setTab]           = useState('profile');
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [saving, setSaving]     = useState(false);
  const [billingModal, setBillingModal] = useState<string | null>(null);

  const plan   = user?.plan ?? 'free';
  const limits = PLAN_LIMITS[plan];

  useEffect(() => {
    const tab_ = searchParams.get('tab');
    if (tab_) setTab(tab_);
  }, [searchParams]);

  // ── Save profile ────────────────────────────────────────────
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName })
      .eq('id', user!.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Profile updated!');
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      {/* Billing Coming Soon Modal */}
      {billingModal && (
        <BillingComingSoonModal plan={billingModal} onClose={() => setBillingModal(null)} />
      )}
      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === id
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ─────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-5">Profile Information</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email address</label>
              <input
                value={user?.email ?? ''}
                disabled
                className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-400 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-zinc-600 mt-1">Email cannot be changed here.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Current plan</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white capitalize font-semibold">{plan}</span>
                <span className="text-xs bg-primary-500/20 text-primary-400 border border-primary-500/20 px-2 py-0.5 rounded-full">
                  {limits.posts_per_month === -1 ? 'Unlimited posts' : `${limits.posts_per_month} posts/mo`}
                </span>
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save changes'}
            </button>
          </form>
        </div>
      )}

      {/* ── Billing Tab ─────────────────────────────────────────── */}
      {tab === 'billing' && (
        <div className="space-y-6">
          {/* Current plan banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Active Plan</p>
              <p className="text-lg font-bold text-white capitalize">{plan}</p>
              <p className="text-sm text-zinc-400 mt-0.5">
                {limits.posts_per_month === -1 ? 'Unlimited posts' : `${limits.posts_per_month} posts/month`}
                {' · '}
                {limits.accounts} connected account{limits.accounts !== 1 ? 's' : ''}
              </p>
            </div>
            <span className="text-xs bg-amber-500/10 border border-amber-500/25 text-amber-400 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5">
              <Bell size={12} /> Payments coming soon
            </span>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLAN_CARDS.map((card) => {
              const isCurrent = plan === card.id;
              const PlanIcon  = card.icon;

              return (
                <div
                  key={card.id}
                  className={clsx(
                    'relative rounded-2xl p-5 border flex flex-col',
                    isCurrent
                      ? 'border-primary-500/60 bg-primary-500/5'
                      : card.highlight
                      ? 'border-zinc-600 bg-zinc-800/60'
                      : 'border-zinc-800 bg-zinc-900'
                  )}
                >
                  {/* Most popular badge */}
                  {card.highlight && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-primary-500/30">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={10} /> CURRENT
                      </span>
                    </div>
                  )}

                  {/* Icon + name */}
                  <div className="flex items-center gap-2.5 mb-4 mt-2">
                    <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', card.iconBg)}>
                      <PlanIcon size={16} className={card.iconColor} />
                    </div>
                    <span className="font-semibold text-white text-sm">{card.label}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-white">{card.price}</span>
                    <span className="text-zinc-400 text-sm">{card.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {card.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                        <Check size={13} className="text-green-400 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <div className="text-center text-xs text-primary-400 font-semibold py-2">
                      ✓ Current plan
                    </div>
                  ) : (
                    <button
                      onClick={() => setBillingModal(card.id)}
                      className={clsx(
                        'w-full text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border',
                        card.id === 'free'
                          ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 cursor-not-allowed opacity-50'
                          : card.highlight
                          ? 'bg-primary-500/15 border-primary-500/40 text-primary-300 hover:bg-primary-500/25'
                          : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25',
                      )}
                      disabled={card.id === 'free'}
                    >
                      <Bell size={12} />
                      {card.id === 'free' ? 'Current plan' : `Notify me — ${card.label}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-zinc-600">
            Payments are processed securely by Stripe. Cancel anytime.
          </p>
        </div>
      )}

      {/* ── Security Tab ─────────────────────────────────────────── */}
      {tab === 'security' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-white">Security</h2>

          <div className="flex items-start gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
            <CheckCircle2 size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-300">Account secured</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Your account is protected by Supabase Auth.
                {' '}If you signed in with Google, your password is managed by Google.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Active Sessions</h3>
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Current session</p>
                <p className="text-xs text-zinc-400 mt-0.5">{user?.email}</p>
              </div>
              <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/25 px-2.5 py-1 rounded-full font-medium">
                Active
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">Password</h3>
            <p className="text-xs text-zinc-500 mb-3">
              To change your password, use the "Forgot password?" link on the login page.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-4 py-2.5 rounded-xl transition-colors"
            >
              Go to login page
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
