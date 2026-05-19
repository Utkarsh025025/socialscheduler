'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ConnectedAccount, Platform } from '@/types/database';
import { PLAN_LIMITS } from '@/types/database';
import {
  Instagram, Linkedin, Youtube, Facebook,
  CheckCircle2, Link2, Loader2, Trash2, Zap, User, X, Bell, Mail,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ── Platform definitions ──────────────────────────────────────
interface PlatformDef {
  id: Platform;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  /** If true → "Request Early Access" instead of Connect */
  comingSoon?: boolean;
}

const PLATFORMS: PlatformDef[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Share photos, videos, Reels & Stories',
    icon: <Instagram size={22} />,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/25',
    comingSoon: true,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    description: 'Post short-form videos to your audience',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.56V6.8a4.85 4.85 0 01-1.07-.11z" />
      </svg>
    ),
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/25',
    comingSoon: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    description: 'Publish professional content & articles',
    icon: <Linkedin size={22} />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    comingSoon: true,
  },
  {
    id: 'youtube',
    label: 'YouTube',
    description: 'Upload videos and manage your channel',
    icon: <Youtube size={22} />,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    comingSoon: true,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    description: 'Post to pages and manage your presence',
    icon: <Facebook size={22} />,
    color: 'text-blue-300',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/25',
    comingSoon: true,
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    description: 'Pin ideas and grow your visual audience',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    ),
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/25',
    comingSoon: true,
  },
];

// ── Early Access Modal ────────────────────────────────────────
function EarlyAccessModal({
  platform,
  defaultEmail,
  onClose,
  onSubmitted,
}: {
  platform: PlatformDef;
  defaultEmail: string;
  onClose: () => void;
  onSubmitted: (platform: Platform) => void;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platform.id, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDone(true);
      onSubmitted(platform.id);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to submit. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 animate-fade-in">
        {!done && (
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        )}

        {done ? (
          /* ── Success state ─────────────────────────────── */
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">You&apos;re on the list!</h2>
            <p className="text-sm text-zinc-400">
              We&apos;ll notify <span className="text-white font-medium">{email}</span> when{' '}
              <span className={clsx('font-semibold', platform.color)}>{platform.label}</span> integration launches.
            </p>
          </div>
        ) : (
          /* ── Form ─────────────────────────────────────── */
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center border', platform.bg, platform.border)}>
                <span className={platform.color}>{platform.icon}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Request Early Access
                </h2>
                <p className="text-xs text-zinc-500">{platform.label} integration</p>
              </div>
            </div>

            {/* Info banner */}
            <div className="bg-zinc-800/70 border border-zinc-700/50 rounded-xl p-3 mb-5">
              <p className="text-xs text-zinc-400 leading-relaxed">
                <Bell size={12} className="inline mr-1 text-primary-400" />
                Real {platform.label} OAuth requires Meta/platform API approval, which is in progress.
                Drop your email and we&apos;ll notify you the moment it&apos;s live — you&apos;ll be first in line.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Your email address
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !email.trim()}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all border text-sm',
                  'bg-primary-500/15 border-primary-500/40 text-primary-300',
                  'hover:bg-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {saving ? (
                  <><Loader2 size={15} className="animate-spin" /> Submitting...</>
                ) : (
                  <><Bell size={15} /> Notify me when {platform.label} launches</>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main AccountsClient ───────────────────────────────────────
export default function AccountsClient({
  connectedAccounts,
  plan,
  userEmail,
}: {
  connectedAccounts: ConnectedAccount[];
  plan: string;
  userEmail?: string;
}) {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(connectedAccounts);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [earlyAccessPlatform, setEarlyAccessPlatform] = useState<PlatformDef | null>(null);
  /** Platforms user already requested early access for (shown in UI) */
  const [notifyRequested, setNotifyRequested] = useState<Set<Platform>>(new Set());

  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
  const maxAccounts = limits.accounts;
  const connectedCount = accounts.length;
  const atLimit = maxAccounts !== -1 && connectedCount >= maxAccounts;

  async function handleDisconnect(account: ConnectedAccount) {
    setDisconnecting(account.id);
    const { error } = await supabase
      .from('connected_accounts')
      .delete()
      .eq('id', account.id);

    if (error) {
      toast.error('Failed to disconnect account');
    } else {
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      toast.success(`${account.platform} disconnected.`);
    }
    setDisconnecting(null);
  }

  function handleNotifySubmitted(platform: Platform) {
    setNotifyRequested((prev) => new Set([...prev, platform]));
    toast.success('You\'re on the early access list! 🎉');
  }

  return (
    <>
      {/* Early Access Modal */}
      {earlyAccessPlatform && (
        <EarlyAccessModal
          platform={earlyAccessPlatform}
          defaultEmail={userEmail ?? ''}
          onClose={() => setEarlyAccessPlatform(null)}
          onSubmitted={handleNotifySubmitted}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Connected Accounts</h1>
            <p className="text-zinc-400 text-sm">
              Connect your social media accounts to start scheduling posts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={clsx(
              'flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-xl border',
              atLimit
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            )}>
              <Link2 size={14} />
              {connectedCount} / {maxAccounts === -1 ? '∞' : maxAccounts} accounts
            </div>
          </div>
        </div>

        {/* Notice banner */}
        <div className="bg-primary-500/5 border border-primary-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Bell size={18} className="text-primary-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary-300">Platform integrations coming soon</p>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Real OAuth connections require approval from each platform (Meta, LinkedIn, etc.), which is in progress.
              Use the <span className="text-primary-300 font-medium">&quot;Notify Me&quot;</span> button on any platform to be first in line when it launches.
            </p>
          </div>
        </div>

        {/* At-limit warning */}
        {atLimit && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-start gap-3">
            <Zap size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Account limit reached</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                You&apos;re on the <span className="font-semibold capitalize">{plan}</span> plan which supports up to {maxAccounts} account{maxAccounts !== 1 ? 's' : ''}.{' '}
                <Link href="/dashboard/settings?tab=billing" className="underline hover:text-amber-300">Upgrade to connect more.</Link>
              </p>
            </div>
          </div>
        )}

        {/* Platform grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLATFORMS.map((platform) => {
            const connected = accounts.find((a) => a.platform === platform.id);
            const isConnected = !!connected;
            const isNotified = notifyRequested.has(platform.id);

            return (
              <div
                key={platform.id}
                className={clsx(
                  'bg-zinc-900 border rounded-2xl p-5 transition-all duration-200',
                  isConnected
                    ? `${platform.border} bg-zinc-900`
                    : 'border-zinc-800 hover:border-zinc-700'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Icon + info */}
                  <div className="flex items-start gap-4">
                    <div className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      isConnected
                        ? `${platform.bg} border ${platform.border}`
                        : 'bg-zinc-800 border border-zinc-700'
                    )}>
                      <span className={isConnected ? platform.color : 'text-zinc-500'}>
                        {platform.icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white text-sm">{platform.label}</p>
                        {isConnected && (
                          <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                        )}
                        {!isConnected && (
                          <span className="text-[10px] font-medium bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded-md">
                            Coming soon
                          </span>
                        )}
                        {isNotified && !isConnected && (
                          <span className="text-[10px] font-medium bg-primary-500/15 border border-primary-500/30 text-primary-400 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Bell size={9} /> Notified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{platform.description}</p>

                      {/* Connected account info */}
                      {connected && (
                        <div className="flex items-center gap-2 mt-2">
                          {connected.account_avatar ? (
                            <img
                              src={connected.account_avatar}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                              <User size={10} className="text-zinc-400" />
                            </div>
                          )}
                          <span className="text-xs text-zinc-300 font-medium truncate max-w-[140px]">
                            {connected.account_name ?? 'Connected Account'}
                          </span>
                          <span className="text-xs text-zinc-600">·</span>
                          <span className="text-xs text-green-400">Active</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="flex-shrink-0">
                    {isConnected ? (
                      <button
                        onClick={() => handleDisconnect(connected)}
                        disabled={disconnecting === connected.id}
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/40 bg-zinc-800 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        {disconnecting === connected.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Disconnect
                      </button>
                    ) : isNotified ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-primary-400 border border-primary-500/25 bg-primary-500/10 px-3 py-1.5 rounded-lg">
                        <Bell size={12} /> On waitlist
                      </span>
                    ) : (
                      <button
                        onClick={() => setEarlyAccessPlatform(platform)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-primary-500/50 hover:text-primary-300 hover:bg-primary-500/10"
                      >
                        <Bell size={12} />
                        Notify me
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Link2 size={16} className="text-zinc-400" /> How account connections work
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Connect', desc: 'Authorize CreatorPost via the platform\'s official OAuth flow (launching soon).' },
              { step: '2', title: 'Compose',  desc: 'Write your post in the composer and select your platforms.' },
              { step: '3', title: 'Schedule', desc: 'Set a date & time — we\'ll publish it automatically.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary-500/15 border border-primary-500/25 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-400">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
