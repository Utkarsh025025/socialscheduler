'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, X, Instagram, Linkedin,
  Youtube, Facebook, Plus, CalendarDays, Clock, Send,
  CheckCircle2, AlertCircle, FileText, ExternalLink,
} from 'lucide-react';
import type { Post, Platform } from '@/types/database';
import clsx from 'clsx';

// ── Platform icon map ────────────────────────────────────────
const PlatformIcon: Record<Platform, React.ReactNode> = {
  instagram: <Instagram size={11} />,
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.56V6.8a4.85 4.85 0 01-1.07-.11z" />
    </svg>
  ),
  linkedin: <Linkedin size={11} />,
  youtube: <Youtube size={11} />,
  facebook: <Facebook size={11} />,
  pinterest: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  ),
};

// ── Status config ────────────────────────────────────────────
const STATUS_CONFIG = {
  scheduled:  { label: 'Scheduled',  color: 'text-blue-400',  bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   dot: 'bg-blue-400',   icon: Clock        },
  published:  { label: 'Published',  color: 'text-green-400', bg: 'bg-green-500/15',  border: 'border-green-500/30',  dot: 'bg-green-400',  icon: CheckCircle2 },
  draft:      { label: 'Draft',      color: 'text-zinc-400',  bg: 'bg-zinc-700/30',   border: 'border-zinc-600/30',   dot: 'bg-zinc-500',   icon: FileText     },
  failed:     { label: 'Failed',     color: 'text-red-400',   bg: 'bg-red-500/15',    border: 'border-red-500/30',    dot: 'bg-red-400',    icon: AlertCircle  },
};

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: 'text-pink-400',
  tiktok:    'text-cyan-400',
  linkedin:  'text-blue-400',
  youtube:   'text-red-400',
  facebook:  'text-blue-300',
  pinterest: 'text-rose-400',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Helpers ──────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ── Post Drawer ───────────────────────────────────────────────
function PostDrawer({ post, onClose }: { post: Post; onClose: () => void }) {
  const cfg = STATUS_CONFIG[post.status];
  const StatusIcon = cfg.icon;

  return (
    <AnimatePresence>
      {post && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className={clsx('w-2 h-2 rounded-full', cfg.dot)} />
                <span className={clsx('text-sm font-semibold', cfg.color)}>{cfg.label}</span>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Platforms */}
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Platforms</p>
                <div className="flex flex-wrap gap-2">
                  {(post.platforms as Platform[]).map((p) => (
                    <span
                      key={p}
                      className={clsx(
                        'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700',
                        PLATFORM_COLORS[p]
                      )}
                    >
                      {PlatformIcon[p]}
                      <span className="capitalize">{p}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Caption</p>
                <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
                  <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>
              </div>

              {/* Image */}
              {post.image_url && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Media</p>
                  <img
                    src={post.image_url}
                    alt="Post media"
                    className="w-full rounded-xl object-cover max-h-64 border border-zinc-800"
                  />
                </div>
              )}

              {/* Schedule info */}
              <div className="grid grid-cols-2 gap-4">
                {post.scheduled_at && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Scheduled for</p>
                    <p className="text-sm text-white font-medium">
                      {new Date(post.scheduled_at).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(post.scheduled_at).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
                {post.published_at && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Published</p>
                    <p className="text-sm text-green-400 font-medium">
                      {new Date(post.published_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Created</p>
                  <p className="text-sm text-zinc-300">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Error message */}
              {post.error_message && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1.5">
                    <AlertCircle size={13} /> Publish Error
                  </p>
                  <p className="text-xs text-red-300 leading-relaxed">{post.error_message}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-800 px-6 py-4">
              <Link
                href="/dashboard/compose"
                className="flex items-center justify-center gap-2 w-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                <ExternalLink size={14} /> Create New Post
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Calendar Cell ─────────────────────────────────────────────
function CalendarCell({
  day, month, year, posts, today, onPostClick,
}: {
  day: number;
  month: number;
  year: number;
  posts: Post[];
  today: Date;
  onPostClick: (post: Post) => void;
}) {
  const isToday =
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  const MAX_VISIBLE = 3;
  const visible = posts.slice(0, MAX_VISIBLE);
  const overflow = posts.length - MAX_VISIBLE;

  return (
    <div
      className={clsx(
        'min-h-[110px] p-2 border-b border-r border-zinc-800 transition-colors group relative',
        isToday ? 'bg-primary-500/5' : 'hover:bg-zinc-800/30'
      )}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={clsx(
            'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
            isToday
              ? 'bg-primary-500 text-white'
              : 'text-zinc-400 group-hover:text-zinc-200'
          )}
        >
          {day}
        </span>
        <Link
          href="/dashboard/compose"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-primary-400"
        >
          <Plus size={13} />
        </Link>
      </div>

      {/* Post pills */}
      <div className="space-y-1">
        {visible.map((post) => {
          const cfg = STATUS_CONFIG[post.status];
          return (
            <button
              key={post.id}
              onClick={() => onPostClick(post)}
              className={clsx(
                'w-full text-left text-[10px] font-medium px-2 py-1 rounded-md border truncate flex items-center gap-1 transition-opacity hover:opacity-80',
                cfg.bg, cfg.border, cfg.color
              )}
            >
              <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
              <span className="truncate">{post.content}</span>
            </button>
          );
        })}
        {overflow > 0 && (
          <p className="text-[10px] text-zinc-500 pl-2">+{overflow} more</p>
        )}
      </div>
    </div>
  );
}

// ── Main CalendarClient ───────────────────────────────────────
export default function CalendarClient({ allPosts }: { allPosts: Post[] }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // Build a map: dayNumber → posts[]
  // Only show scheduled and published posts — drafts have no meaningful calendar date
  const postsByDay = useMemo(() => {
    const map: Record<number, Post[]> = {};
    allPosts
      .filter((post) => post.status === 'scheduled' || post.status === 'published' || post.status === 'failed')
      .forEach((post) => {
        const dateStr = post.scheduled_at || post.published_at;
        if (!dateStr) return; // skip posts with no date
        const d = new Date(dateStr);
        if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          map[day].push(post);
        }
      });
    return map;
  }, [allPosts, viewYear, viewMonth]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Cells: leading blanks + actual days
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete the last week row
  while (cells.length % 7 !== 0) cells.push(null);

  // Monthly post stats
  const monthPosts = Object.values(postsByDay).flat();
  const stats = {
    scheduled: monthPosts.filter(p => p.status === 'scheduled').length,
    published:  monthPosts.filter(p => p.status === 'published').length,
    draft:      monthPosts.filter(p => p.status === 'draft').length,
    failed:     monthPosts.filter(p => p.status === 'failed').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Month nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="min-w-[180px] text-center">
              <h1 className="text-xl font-bold text-white">
                {MONTHS[viewMonth]} {viewYear}
              </h1>
            </div>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Today button */}
          <button
            onClick={() => { setViewMonth(now.getMonth()); setViewYear(now.getFullYear()); }}
            className="text-xs font-medium text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Stats pills */}
        <div className="flex flex-wrap items-center gap-2">
          {([
            ['scheduled', 'bg-blue-500/15 text-blue-400 border-blue-500/25'],
            ['published',  'bg-green-500/15 text-green-400 border-green-500/25'],
            ['draft',      'bg-zinc-700/40 text-zinc-400 border-zinc-600/25'],
            ['failed',     'bg-red-500/15 text-red-400 border-red-500/25'],
          ] as const).map(([status, cls]) => (
            stats[status] > 0 && (
              <span key={status} className={clsx('text-xs font-medium px-2.5 py-1 rounded-full border capitalize', cls)}>
                {stats[status]} {status}
              </span>
            )
          ))}
        </div>

        <Link
          href="/dashboard/compose"
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          <Plus size={15} /> New Post
        </Link>
      </div>

      {/* Calendar grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-zinc-500 tracking-wide uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            day === null ? (
              <div key={`blank-${i}`} className="min-h-[110px] border-b border-r border-zinc-800 bg-zinc-950/30" />
            ) : (
              <CalendarCell
                key={day}
                day={day}
                month={viewMonth}
                year={viewYear}
                posts={postsByDay[day] ?? []}
                today={now}
                onPostClick={(post) => setSelectedPost(post)}
              />
            )
          ))}
        </div>
      </div>

      {/* Empty state */}
      {monthPosts.length === 0 && (
        <div className="text-center py-8">
          <CalendarDays size={36} className="mx-auto mb-3 text-zinc-700" />
          <p className="text-zinc-400 text-sm mb-4">No posts scheduled for {MONTHS[viewMonth]}.</p>
          <Link
            href="/dashboard/compose"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Send size={14} /> Schedule your first post
          </Link>
        </div>
      )}

      {/* Post detail drawer */}
      {selectedPost && (
        <PostDrawer post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
