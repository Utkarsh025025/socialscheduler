'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Trash2, ExternalLink, Clock, Send,
  FileText, AlertCircle, CheckCircle2, Filter,
  Instagram, Linkedin, Youtube, Facebook, Loader2,
  Calendar, ChevronDown, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Post, Platform, PostStatus } from '@/types/database';
import clsx from 'clsx';

// ── Platform icons ────────────────────────────────────────────
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

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: 'text-pink-400',
  tiktok:    'text-cyan-400',
  linkedin:  'text-blue-400',
  youtube:   'text-red-400',
  facebook:  'text-blue-300',
  pinterest: 'text-rose-400',
};

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG: Record<PostStatus, {
  label: string; color: string; bg: string; border: string; dot: string; icon: React.ElementType;
}> = {
  scheduled: { label: 'Scheduled', color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/25',  dot: 'bg-blue-400',  icon: Clock        },
  published: { label: 'Published', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/25', dot: 'bg-green-400', icon: CheckCircle2 },
  draft:     { label: 'Draft',     color: 'text-zinc-400',  bg: 'bg-zinc-700/30',  border: 'border-zinc-600/25',  dot: 'bg-zinc-500',  icon: FileText     },
  failed:    { label: 'Failed',    color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/25',   dot: 'bg-red-400',   icon: AlertCircle  },
};

const ALL_STATUSES: PostStatus[] = ['scheduled', 'published', 'draft', 'failed'];

// ── Delete Confirm Dialog ─────────────────────────────────────
function DeleteConfirm({
  post, onConfirm, onCancel, deleting,
}: {
  post: Post;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <h3 className="text-white font-semibold text-center mb-2">Delete Post?</h3>
        <p className="text-zinc-400 text-sm text-center mb-5 leading-relaxed">
          This will permanently delete this post. This action cannot be undone.
        </p>
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 mb-5">
          <p className="text-xs text-zinc-300 line-clamp-2">{post.content}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────
function PostCard({
  post,
  onDelete,
}: {
  post: Post;
  onDelete: (post: Post) => void;
}) {
  const cfg = STATUS_CONFIG[post.status];
  const StatusIcon = cfg.icon;

  const dateStr = post.scheduled_at
    ? new Date(post.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const timeLabel = post.scheduled_at
    ? `Scheduled: ${dateStr}`
    : post.published_at
    ? `Published: ${dateStr}`
    : `Created: ${dateStr}`;

  return (
    <div className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition-all duration-200 flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-100 leading-relaxed line-clamp-3">
            {post.content}
          </p>
        </div>
        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post media"
            className="w-16 h-16 rounded-xl object-cover border border-zinc-700 flex-shrink-0"
          />
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: status + platforms + date */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx(
            'inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border',
            cfg.bg, cfg.border, cfg.color
          )}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {cfg.label}
          </span>

          {(post.platforms as Platform[]).map((p) => (
            <span
              key={p}
              className={clsx(
                'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 capitalize',
                PLATFORM_COLORS[p]
              )}
            >
              {PlatformIcon[p]} {p}
            </span>
          ))}

          <span className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Calendar size={10} />
            {timeLabel}
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href="/dashboard/compose"
            title="Reuse in Composer"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-primary-500/20 border border-zinc-700 hover:border-primary-500/30 text-zinc-400 hover:text-primary-400 transition-all"
          >
            <ExternalLink size={13} />
          </Link>
          <button
            onClick={() => onDelete(post)}
            title="Delete post"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/15 border border-zinc-700 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Error message */}
      {post.error_message && (
        <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">
          <AlertCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-300 leading-relaxed">{post.error_message}</p>
        </div>
      )}
    </div>
  );
}

// ── Main PostsClient ──────────────────────────────────────────
export default function PostsClient({ initialPosts }: { initialPosts: Post[] }) {
  const router = useRouter();
  const [posts, setPosts]           = useState<Post[]>(initialPosts);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [confirmPost, setConfirmPost]   = useState<Post | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // ── Filter logic ──────────────────────────────────────────
  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchSearch = !search || p.content.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [posts, search, statusFilter]);

  // ── Status counts ─────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: posts.length };
    ALL_STATUSES.forEach((s) => {
      c[s] = posts.filter((p) => p.status === s).length;
    });
    return c;
  }, [posts]);

  // ── Delete ────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirmPost) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${confirmPost.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setPosts((prev) => prev.filter((p) => p.id !== confirmPost.id));
      toast.success('Post deleted.');
      setConfirmPost(null);
    } catch (err: any) {
      toast.error(err.message ?? 'Could not delete post.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Posts</h1>
          <p className="text-sm text-zinc-400">
            {posts.length} post{posts.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/dashboard/compose"
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
        >
          <Plus size={15} /> New Post
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary-500/60 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex-wrap">
          {(['all', ...ALL_STATUSES] as const).map((s) => {
            const isActive = statusFilter === s;
            const cfg = s !== 'all' ? STATUS_CONFIG[s] : null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? s === 'all'
                      ? 'bg-primary-500 text-white'
                      : `${cfg!.bg} ${cfg!.color} border ${cfg!.border}`
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {s === 'all' ? (
                  <Filter size={11} />
                ) : (
                  <span className={clsx('w-1.5 h-1.5 rounded-full', cfg!.dot)} />
                )}
                <span className="capitalize">{s}</span>
                <span className={clsx(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-white/15' : 'bg-zinc-800'
                )}>
                  {counts[s]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
            <FileText size={26} className="text-zinc-600" />
          </div>
          <h3 className="text-white font-semibold mb-2">
            {search || statusFilter !== 'all' ? 'No posts match your filters' : 'No posts yet'}
          </h3>
          <p className="text-zinc-400 text-sm mb-6">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Create your first post using the AI composer.'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link
              href="/dashboard/compose"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Plus size={15} /> Create your first post
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">
            Showing {filtered.length} of {posts.length} post{posts.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' && ` · filtered by "${statusFilter}"`}
            {search && ` · matching "${search}"`}
          </p>
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={setConfirmPost}
              />
            ))}
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      {confirmPost && (
        <DeleteConfirm
          post={confirmPost}
          onConfirm={handleDelete}
          onCancel={() => setConfirmPost(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
