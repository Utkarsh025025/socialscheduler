import Link from 'next/link';

export const metadata = {
  title: 'CreatorPost — AI Social Media Scheduler',
  description: 'Schedule smarter. Grow faster. The AI-powered social media scheduler built for content creators and influencers.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-primary-500/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-700/10 rounded-full blur-[80px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-white">CreatorPost</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link href="/signup" className="text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-primary-500/25">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/25 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium text-primary-200">AI-powered scheduling — now live</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight max-w-4xl">
          Schedule smarter.{' '}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #a5a0f0, #7F77DD, #5a52bb)' }}
          >
            Grow faster.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-300 mb-10 max-w-2xl leading-relaxed">
          The AI-powered social media scheduler built for content creators and influencers.
          Generate captions, schedule posts, and grow your audience — all in one place.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold text-base px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-xl shadow-primary-500/35 hover:shadow-primary-500/50 hover:-translate-y-0.5 active:scale-95"
          >
            Start for Free →
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium text-base px-8 py-3.5 rounded-2xl transition-all duration-200"
          >
            Sign In
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {[
            { emoji: '✨', text: 'Gemini AI captions' },
            { emoji: '📅', text: 'Smart scheduling' },
            { emoji: '📊', text: 'Post analytics' },
            { emoji: '🔗', text: '6 platforms' },
            { emoji: '📧', text: 'Email alerts' },
          ].map(({ emoji, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium"
            >
              <span>{emoji}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Platform logos row */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Supported platforms</p>
          <div className="flex items-center gap-5">
            {[
              { name: 'Instagram', color: '#E1306C', gradient: 'from-pink-500 to-rose-500' },
              { name: 'TikTok',    color: '#69C9D0', gradient: 'from-cyan-400 to-teal-400' },
              { name: 'LinkedIn',  color: '#0A66C2', gradient: 'from-blue-500 to-blue-600' },
              { name: 'YouTube',   color: '#FF0000', gradient: 'from-red-500 to-red-600'   },
              { name: 'Facebook',  color: '#1877F2', gradient: 'from-blue-400 to-blue-500' },
              { name: 'Pinterest', color: '#E60023', gradient: 'from-rose-500 to-rose-600' },
            ].map(({ name, gradient }) => (
              <div
                key={name}
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shadow-lg opacity-80 hover:opacity-100 transition-opacity`}
                title={name}
              >
                {name[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom feature cards */}
      <div className="relative z-10 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
        {[
          {
            icon: '✨',
            title: 'AI Caption Generator',
            desc: 'Powered by Google Gemini. Generate on-brand captions for any platform in seconds.',
          },
          {
            icon: '🚀',
            title: 'Auto-Publish',
            desc: 'Schedule posts and we\'ll automatically publish them at exactly the right time.',
          },
          {
            icon: '📈',
            title: 'Performance Analytics',
            desc: 'Track your posts, understand trends, and optimize your content strategy.',
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex flex-col items-start gap-3 px-8 py-8">
            <div className="text-2xl">{icon}</div>
            <h3 className="font-semibold text-white text-base">{title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
