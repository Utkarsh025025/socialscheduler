'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Sparkles, Upload, X, Instagram, Linkedin, Youtube,
  Facebook, Clock, Send, ChevronDown, Copy, RefreshCw,
  CheckCircle2, Image as ImageIcon, Loader2, Calendar, Zap,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { User } from '@/types/database';
import { PLAN_LIMITS } from '@/types/database';

type Platform = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'facebook' | 'pinterest';
type Tone = 'casual' | 'professional' | 'funny' | 'inspirational' | 'educational';

interface PlatformConfig {
  id: Platform;
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  charLimit: number;
}

const PLATFORMS: PlatformConfig[] = [
  { id: 'instagram', label: 'Instagram', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30', charLimit: 2200, icon: <Instagram size={16} /> },
  { id: 'tiktok', label: 'TikTok', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30', charLimit: 2200, icon: (<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.56V6.8a4.85 4.85 0 01-1.07-.11z" /></svg>) },
  { id: 'linkedin', label: 'LinkedIn', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', charLimit: 3000, icon: <Linkedin size={16} /> },
  { id: 'youtube', label: 'YouTube', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', charLimit: 5000, icon: <Youtube size={16} /> },
  { id: 'facebook', label: 'Facebook', color: 'text-blue-300', bg: 'bg-blue-400/10 border-blue-400/30', charLimit: 63206, icon: <Facebook size={16} /> },
  { id: 'pinterest', label: 'Pinterest', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', charLimit: 500, icon: (<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" /></svg>) },
];

const TONES: { id: Tone; label: string; emoji: string }[] = [
  { id: 'casual', label: 'Casual', emoji: '😊' },
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'funny', label: 'Funny', emoji: '😂' },
  { id: 'inspirational', label: 'Inspirational', emoji: '✨' },
  { id: 'educational', label: 'Educational', emoji: '📚' },
];

function PlatformPreview({ platform, caption, imagePreview }: { platform: PlatformConfig; caption: string; imagePreview: string | null }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${platform.bg} border ${platform.color}`}>
          <span className={platform.color}>{platform.icon}</span>
        </div>
        <span className="text-sm font-medium text-zinc-300">{platform.label} Preview</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-zinc-700" />
          <div>
            <div className="text-xs font-semibold text-white">Your Account</div>
            <div className="text-[10px] text-zinc-500">Just now</div>
          </div>
        </div>
        {imagePreview && (
          <div className="rounded-xl overflow-hidden mb-3 aspect-video bg-zinc-800">
            <img src={imagePreview} alt="Post" className="w-full h-full object-cover" />
          </div>
        )}
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {caption || <span className="text-zinc-600 italic">Your caption will appear here...</span>}
        </p>
      </div>
    </div>
  );
}

// ── Usage Banner ───────────────────────────────────────────────
function UsageBanner({ user }: { user: User | null }) {
  if (!user) return null;
  const plan = user.plan ?? 'free';
  const limits = PLAN_LIMITS[plan];
  if (limits.posts_per_month === -1 && limits.ai_gens_per_month === -1) return null;

  const postsLeft = limits.posts_per_month === -1 ? null : Math.max(0, limits.posts_per_month - (user.posts_this_month ?? 0));
  const aiLeft = limits.ai_gens_per_month === -1 ? null : Math.max(0, limits.ai_gens_per_month - (user.ai_gens_this_month ?? 0));
  const nearLimit = (postsLeft !== null && postsLeft <= 2) || (aiLeft !== null && aiLeft <= 3);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 mb-6 ${nearLimit ? 'bg-amber-500/8 border-amber-500/25' : 'bg-zinc-900 border-zinc-800'}`}>
      <div className="flex items-center gap-4 flex-wrap">
        {postsLeft !== null && (
          <span className="text-xs text-zinc-400">
            <span className={`font-semibold ${postsLeft <= 2 ? 'text-amber-400' : 'text-white'}`}>{postsLeft}</span> posts left this month
          </span>
        )}
        {aiLeft !== null && (
          <span className="text-xs text-zinc-400">
            <span className={`font-semibold ${aiLeft <= 3 ? 'text-amber-400' : 'text-white'}`}>{aiLeft}</span> AI generations left
          </span>
        )}
      </div>
      {nearLimit && (
        <Link href="/dashboard/settings?tab=billing" className="flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors">
          <Zap size={12} /> Upgrade for more
        </Link>
      )}
    </div>
  );
}

export default function ComposeClient({ user }: { user: User | null }) {
  const [topic, setTopic] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram']);
  const [previewPlatform, setPreviewPlatform] = useState<Platform>('instagram');
  const [tone, setTone] = useState<Tone>('casual');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmoji, setIncludeEmoji] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [postStatus, setPostStatus] = useState<'draft' | 'scheduled'>('draft');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (id: Platform) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    setPreviewPlatform(id);
  };

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const generateCaption = async () => {
    if (!topic && !imageBase64) { toast.error('Enter a topic or upload an image'); return; }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform: selectedPlatforms[0] || 'instagram', tone, includeHashtags, includeEmoji, imageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCaption(data.caption);
      toast.success('Caption generated! ✨');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate caption');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const savePost = async (status: 'draft' | 'scheduled') => {
    if (!caption) { toast.error('Please generate or write a caption first'); return; }
    if (selectedPlatforms.length === 0) { toast.error('Select at least one platform'); return; }
    if (status === 'scheduled' && !scheduledAt) { toast.error('Please set a schedule time'); return; }
    setIsSaving(true);
    setPostStatus(status);
    try {
      const formData = new FormData();
      formData.append('content', caption);
      formData.append('platforms', JSON.stringify(selectedPlatforms));
      formData.append('status', 'draft');
      if (imageFile) formData.append('image', imageFile);
      const res = await fetch('/api/posts', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const postId = data.post?.id;
      if (status === 'scheduled' && scheduledAt && postId) {
        const schedRes = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, scheduledAt: new Date(scheduledAt).toISOString() }),
        });
        const schedData = await schedRes.json();
        if (!schedRes.ok) throw new Error(schedData.error || 'Failed to schedule');
        toast.success('Post scheduled! 🚀 We\'ll email you when it goes live.');
      } else {
        toast.success('Post saved as draft!');
      }
      setCaption(''); setTopic(''); setImageFile(null); setImagePreview(null);
      setImageBase64(null); setScheduledAt(''); setSelectedPlatforms(['instagram']);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const activePlatformConfig = PLATFORMS.find(p => p.id === previewPlatform) || PLATFORMS[0];
  const charLimit = activePlatformConfig.charLimit;
  const charCount = caption.length;
  const charPercent = Math.min((charCount / charLimit) * 100, 100);

  return (
    <div className="max-w-7xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">AI Post Composer</h1>
        <p className="text-zinc-400 text-sm">Generate captions with Gemini AI and schedule across platforms</p>
      </div>

      <UsageBanner user={user} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Platform Selector */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Send size={14} className="text-primary-400" /> Select Platforms
            </h2>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button key={p.id} onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 ${selectedPlatforms.includes(p.id) ? `${p.bg} ${p.color} border-current` : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'}`}>
                  <span className={selectedPlatforms.includes(p.id) ? p.color : 'text-zinc-500'}>{p.icon}</span>
                  {p.label}
                  {selectedPlatforms.includes(p.id) && <CheckCircle2 size={11} className="ml-0.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* AI Caption Generator */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-primary-400" /> AI Caption Generator
            </h2>
            <div className="mb-4">
              <label className="text-xs text-zinc-400 mb-1.5 block">What&apos;s your post about?</label>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. New product launch for eco-friendly water bottles..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500/60 transition-colors" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-zinc-400 mb-1.5 block">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button key={t.id} onClick={() => setTone(t.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${tone === t.id ? 'bg-primary-500/15 border-primary-500/40 text-primary-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}>
                    <span>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 mb-5">
              {[{ label: 'Include Hashtags', value: includeHashtags, set: setIncludeHashtags }, { label: 'Include Emoji', value: includeEmoji, set: setIncludeEmoji }].map(({ label, value, set }) => (
                <button key={label} onClick={() => set(!value)} className={`flex items-center gap-2 text-xs font-medium transition-colors ${value ? 'text-primary-400' : 'text-zinc-500'}`}>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${value ? 'bg-primary-500' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${value ? 'left-4' : 'left-0.5'}`} />
                  </div>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={generateCaption} disabled={isGenerating || (!topic && !imageBase64)} className="btn-primary w-full glow-primary">
              {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating with Gemini AI...</> : <><Sparkles size={16} /> Generate Caption</>}
            </button>
          </div>

          {/* Caption Editor */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-300">Caption</h2>
              <div className="flex items-center gap-2">
                {caption && (
                  <>
                    <button onClick={copyCaption} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                      {copied ? <CheckCircle2 size={13} className="text-green-400" /> : <Copy size={13} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={generateCaption} disabled={isGenerating} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                      <RefreshCw size={13} className={isGenerating ? 'animate-spin' : ''} /> Regenerate
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)}
              placeholder="Your AI-generated caption will appear here. You can also type manually..."
              rows={8}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500/60 transition-colors resize-none leading-relaxed" />
            <div className="flex items-center justify-between mt-2">
              <div className="flex-1 bg-zinc-800 rounded-full h-1 mr-3">
                <div className={`h-1 rounded-full transition-all duration-300 ${charPercent > 90 ? 'bg-red-500' : charPercent > 70 ? 'bg-yellow-500' : 'bg-primary-500'}`} style={{ width: `${charPercent}%` }} />
              </div>
              <span className={`text-xs ${charPercent > 90 ? 'text-red-400' : 'text-zinc-500'}`}>{charCount}/{charLimit}</span>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <ImageIcon size={14} className="text-primary-400" /> Media (optional)
            </h2>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Upload" className="w-full max-h-64 object-cover rounded-xl" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); setImageBase64(null); }}
                  className="absolute top-2 right-2 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full p-1.5 transition-colors">
                  <X size={14} />
                </button>
                <div className="mt-2 text-xs text-zinc-500">{imageFile?.name} · {((imageFile?.size || 0) / 1024).toFixed(0)} KB</div>
              </div>
            ) : (
              <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-primary-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors group">
                <Upload size={24} className="mx-auto mb-2 text-zinc-600 group-hover:text-primary-400 transition-colors" />
                <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">Drop image here or <span className="text-primary-400">browse</span></p>
                <p className="text-xs text-zinc-600 mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
          </div>

          {/* Schedule & Actions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Clock size={14} className="text-primary-400" /> Schedule (optional)
            </h2>
            <div className="mb-5">
              <label className="text-xs text-zinc-400 mb-1.5 block">Schedule date &amp; time</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500/60 transition-colors [color-scheme:dark]" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => savePost('draft')} disabled={isSaving} className="flex-1 btn-secondary border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white">
                {isSaving && postStatus === 'draft' ? <Loader2 size={15} className="animate-spin" /> : null}
                Save Draft
              </button>
              <button onClick={() => savePost(scheduledAt ? 'scheduled' : 'draft')} disabled={isSaving} className="flex-1 btn-primary glow-primary">
                {isSaving && postStatus === 'scheduled' ? <Loader2 size={15} className="animate-spin" /> : scheduledAt ? <Clock size={15} /> : <Send size={15} />}
                {scheduledAt ? 'Schedule Post' : 'Save Post'}
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Preview */}
        <div className="space-y-4">
          <div className="sticky top-6">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <ChevronDown size={14} className="text-primary-400" /> Live Preview
            </h2>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedPlatforms.map(pid => {
                const p = PLATFORMS.find(pl => pl.id === pid)!;
                return (
                  <button key={pid} onClick={() => setPreviewPlatform(pid)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${previewPlatform === pid ? `${p.bg} ${p.color} border-current` : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                    <span className={previewPlatform === pid ? p.color : 'text-zinc-500'}>{p.icon}</span>
                    {p.label}
                  </button>
                );
              })}
            </div>
            {selectedPlatforms.length > 0 ? (
              <PlatformPreview platform={activePlatformConfig} caption={caption} imagePreview={imagePreview} />
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                <p className="text-zinc-600 text-sm">Select at least one platform to see preview</p>
              </div>
            )}
            <div className="mt-4 bg-primary-500/5 border border-primary-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary-300 mb-2">💡 Pro Tips</p>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li>• Upload an image to generate a caption based on visuals</li>
                <li>• Try different tones to find the best fit for your audience</li>
                <li>• Best posting times: 9–11 AM &amp; 6–9 PM in your timezone</li>
                <li>• LinkedIn posts get 3x more reach without too many hashtags</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
