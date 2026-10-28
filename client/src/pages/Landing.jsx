import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  GraduationCap, Menu, X, ArrowRight, Users, Calendar, Trophy, Vote, Award,
  Wallet, ShieldCheck, UserPlus, Compass, Sparkles, CheckCircle2, Building2
} from 'lucide-react';

// In-page sections use anchors; Clubs/Login/Get Started use existing routes.
const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Clubs', to: '/clubs' },
  { label: 'Pricing', href: '#pricing' },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Club Management',
    text: 'Discover clubs, request membership and let presidents and faculty coordinators manage members in one place.',
    tint: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Trophy,
    title: 'Tournaments & Brackets',
    text: 'Generate knockout brackets from team rosters, track live scores and crown champions automatically.',
    tint: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Vote,
    title: 'Club Elections',
    text: 'Run nominations and secret-ballot voting for club leadership with results managed by admins.',
    tint: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Award,
    title: 'Verifiable Certificates',
    text: 'Issue participation and merit certificates that anyone can verify with a unique hash.',
    tint: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Wallet,
    title: 'Fees & Finance',
    text: 'Collect club membership fees, record offline payments, generate receipts and review budgets.',
    tint: 'bg-violet-50 text-violet-600',
  },
];

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create your account',
    text: 'Register with your roll number and verify your email with a one-time code.',
  },
  {
    icon: Compass,
    title: 'Join your clubs',
    text: 'Browse campus clubs, pay any membership fee in-app and get approved by club leadership.',
  },
  {
    icon: Sparkles,
    title: 'Take part',
    text: 'Attend events, compete in tournaments, vote in elections and collect your certificates.',
  },
];

// Decorative campus building illustration (inline SVG, no external asset).
const CampusIllustration = () => (
  <svg viewBox="0 0 480 360" className="w-full h-auto" role="img" aria-label="Illustration of a campus building">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#dbeafe" />
        <stop offset="100%" stopColor="#eff6ff" />
      </linearGradient>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e0e7ff" />
      </linearGradient>
      <linearGradient id="roof" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
    </defs>
    <rect width="480" height="360" rx="28" fill="url(#sky)" />
    {/* Clouds */}
    <g fill="#ffffff" opacity="0.9">
      <ellipse cx="96" cy="70" rx="38" ry="14" />
      <ellipse cx="124" cy="62" rx="26" ry="14" />
      <ellipse cx="370" cy="54" rx="34" ry="12" />
      <ellipse cx="394" cy="48" rx="22" ry="11" />
    </g>
    {/* Ground */}
    <rect x="0" y="300" width="480" height="60" rx="0" fill="#c7d2fe" opacity="0.55" />
    {/* Side wings */}
    <rect x="56" y="178" width="96" height="122" rx="6" fill="url(#wall)" stroke="#c7d2fe" />
    <rect x="328" y="178" width="96" height="122" rx="6" fill="url(#wall)" stroke="#c7d2fe" />
    {[0, 1].map((r) =>
      [0, 1, 2].map((c) => (
        <g key={`w-${r}-${c}`}>
          <rect x={70 + c * 26} y={196 + r * 40} width="16" height="24" rx="3" fill="#93c5fd" />
          <rect x={342 + c * 26} y={196 + r * 40} width="16" height="24" rx="3" fill="#93c5fd" />
        </g>
      ))
    )}
    {/* Main hall */}
    <rect x="140" y="150" width="200" height="150" rx="6" fill="url(#wall)" stroke="#c7d2fe" />
    <polygon points="128,152 240,92 352,152" fill="url(#roof)" />
    <circle cx="240" cy="128" r="12" fill="#ffffff" opacity="0.9" />
    <circle cx="240" cy="128" r="6" fill="#2563eb" />
    {/* Columns */}
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={`col-${i}`} x={158 + i * 38} y="166" width="12" height="112" rx="3" fill="#e0e7ff" stroke="#a5b4fc" />
    ))}
    {/* Door + steps */}
    <rect x="222" y="232" width="36" height="46" rx="18" fill="#1e3a8a" />
    <rect x="150" y="278" width="180" height="8" rx="2" fill="#a5b4fc" />
    <rect x="138" y="286" width="204" height="8" rx="2" fill="#818cf8" opacity="0.7" />
    {/* Flag */}
    <rect x="239" y="58" width="2" height="36" fill="#1e3a8a" />
    <path d="M241 60 h24 l-6 7 l6 7 h-24 z" fill="#2563eb" />
    {/* Trees */}
    {[30, 450].map((x) => (
      <g key={`tree-${x}`}>
        <rect x={x - 3} y="262" width="6" height="38" fill="#1e3a8a" opacity="0.7" />
        <circle cx={x} cy="252" r="22" fill="#60a5fa" />
        <circle cx={x - 10} cy="262" r="14" fill="#3b82f6" />
      </g>
    ))}
  </svg>
);

const FloatingCard = ({ icon: Icon, title, text, className, delay }) => (
  <div
    className={`absolute bg-white/95 backdrop-blur rounded-2xl shadow-[0_12px_32px_-12px_rgba(30,58,138,0.35)] border border-blue-100 px-3.5 py-2.5 flex items-center gap-2.5 animate-float ${className}`}
    style={{ animationDelay: delay }}
  >
    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
      <Icon size={16} />
    </div>
    <div className="leading-tight">
      <p className="text-xs font-bold text-dark-900">{title}</p>
      <p className="text-[11px] text-slate-500">{text}</p>
    </div>
  </div>
);

const Landing = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  // Live counts from public endpoints; null means unavailable (shown as "—").
  const [stats, setStats] = useState({ clubs: null, members: null, events: null, tournaments: null });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      axios.get('/api/clubs'),
      axios.get('/api/events'),
      axios.get('/api/tournaments'),
    ]).then(([clubsRes, eventsRes, tournamentsRes]) => {
      if (cancelled) return;
      const list = (r) => (r.status === 'fulfilled' && Array.isArray(r.value.data) ? r.value.data : null);
      const clubs = list(clubsRes);
      const events = list(eventsRes);
      const tournaments = list(tournamentsRes);
      setStats({
        clubs: clubs ? clubs.length : null,
        members: clubs ? clubs.reduce((sum, c) => sum + (c.members?.length || 0), 0) : null,
        events: events ? events.length : null,
        tournaments: tournaments ? tournaments.length : null,
      });
      setStatsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const statItems = [
    { label: 'Active Clubs', value: stats.clubs, icon: Building2 },
    { label: 'Club Memberships', value: stats.members, icon: Users },
    { label: 'Campus Events', value: stats.events, icon: Calendar },
    { label: 'Tournaments', value: stats.tournaments, icon: Trophy },
  ];
  const statsUnavailable = !statsLoading && statItems.every((s) => s.value === null);

  const navItemClass = 'text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors';

  return (
    <div className="min-h-screen bg-white text-dark-900 font-sans">
      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-[72px] flex items-center justify-between" aria-label="Main">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25">
              <GraduationCap size={20} />
            </div>
            <span className="text-lg font-extrabold tracking-tight">Campus<span className="text-blue-600">Hub</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => l.to
              ? <Link key={l.label} to={l.to} className={navItemClass}>{l.label}</Link>
              : <a key={l.label} href={l.href} className={navItemClass}>{l.label}</a>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-dark-900 hover:text-blue-600 transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/25 transition-all hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 -mr-2 text-dark-900 rounded-lg hover:bg-slate-100"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1 shadow-lg">
            {NAV_LINKS.map((l) => l.to
              ? <Link key={l.label} to={l.to} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">{l.label}</Link>
              : <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">{l.label}</a>
            )}
            <div className="grid grid-cols-2 gap-2 pt-3">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-center px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-dark-900">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="text-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/70 via-white to-white pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-blue-200/40 blur-3xl pointer-events-none" />
          <div className="absolute top-40 -left-40 w-[360px] h-[360px] rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Club, event & sports management for colleges
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6">
                Your Campus Clubs.<br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">One Smart Platform.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                CampusHub brings clubs, events, tournaments, elections, certificates and fees together —
                with dedicated dashboards for students, club leaders, faculty, referees and admins.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5">
                  Get Started <ArrowRight size={18} />
                </Link>
                <Link to="/clubs" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-dark-900 font-semibold shadow-sm transition-all">
                  Explore Clubs
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-slate-500">
                {['Role-based dashboards', 'Email OTP verification', 'Live match scores'].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-blue-600" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual with floating feature cards */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none px-2 sm:px-6 py-6">
              <div className="rounded-[28px] bg-white p-3 shadow-[0_30px_60px_-20px_rgba(30,58,138,0.35)] border border-blue-100">
                <CampusIllustration />
              </div>
              <FloatingCard icon={Vote} title="Elections" text="Secret ballot voting" className="top-0 left-0 sm:-left-2" delay="-1s" />
              <FloatingCard icon={Trophy} title="Tournaments" text="Live brackets" className="top-1/3 right-0 sm:-right-2" delay="-3s" />
              <FloatingCard icon={ShieldCheck} title="Certificates" text="Hash verified" className="hidden sm:flex -bottom-2 right-8" delay="-2s" />
            </div>
          </div>
        </section>

        {/* ── STATS (live data from public endpoints) ─────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 md:-mt-8 relative">
          <div className="rounded-3xl bg-dark-900 text-white px-6 py-8 sm:px-10 sm:py-10 shadow-xl shadow-dark-900/20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {statItems.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 sm:gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {statsLoading ? '…' : value === null ? '—' : value.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs sm:text-sm text-blue-100/80">{label}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-blue-100/60">
              {statsUnavailable
                ? 'Live campus figures will appear here once the CampusHub server is connected.'
                : 'Live figures from this CampusHub installation.'}
            </p>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section id="features" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <p className="text-sm font-semibold text-blue-600 mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Everything your campus clubs need</h2>
            <p className="text-slate-600">One platform for the full club lifecycle — from joining a club to winning a tournament.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {FEATURES.map(({ icon: Icon, title, text, tint }) => (
              <div key={title} className="group rounded-2xl border border-slate-100 bg-white p-6 md:p-7 shadow-sm hover:shadow-[0_20px_40px_-20px_rgba(30,58,138,0.25)] hover:-translate-y-1 hover:border-blue-100 transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${tint}`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-20 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold text-blue-600 mb-3">How It Works</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Get started in three steps</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <div key={title} className="relative rounded-2xl bg-white border border-slate-100 p-7 shadow-sm">
                  <span className="absolute top-6 right-6 text-5xl font-extrabold text-slate-100 select-none">{i + 1}</span>
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-md shadow-blue-600/25">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────── */}
        <section id="pricing" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-blue-600 mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Simple and transparent</h2>
            <p className="text-slate-600">CampusHub is provided by your college. Club fees are set by each club.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border-2 border-blue-600 bg-white p-8 shadow-[0_20px_40px_-20px_rgba(37,99,235,0.35)]">
              <p className="text-sm font-semibold text-blue-600 mb-2">Students</p>
              <p className="text-4xl font-extrabold tracking-tight mb-1">Free</p>
              <p className="text-sm text-slate-500 mb-6">to create an account and use the portal</p>
              <ul className="space-y-3 text-sm text-slate-700 mb-8">
                {['Browse and join campus clubs', 'Event passes & attendance', 'Vote in club elections', 'Download your certificates'].map((t) => (
                  <li key={t} className="flex items-center gap-2.5"><CheckCircle2 size={18} className="text-blue-600 shrink-0" /> {t}</li>
                ))}
              </ul>
              <Link to="/register" className="block text-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors">
                Create free account
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <p className="text-sm font-semibold text-slate-500 mb-2">Club membership</p>
              <p className="text-4xl font-extrabold tracking-tight mb-1">Set by club</p>
              <p className="text-sm text-slate-500 mb-6">shown on each club’s page before you join</p>
              <ul className="space-y-3 text-sm text-slate-700 mb-8">
                {['Pay securely in-app', 'Instant digital receipts', 'Offline payments recorded by admins', 'Some clubs are free to join'].map((t) => (
                  <li key={t} className="flex items-center gap-2.5"><CheckCircle2 size={18} className="text-slate-400 shrink-0" /> {t}</li>
                ))}
              </ul>
              <Link to="/clubs" className="block text-center px-6 py-3 rounded-xl border border-slate-200 hover:border-blue-300 text-dark-900 font-semibold transition-colors">
                View clubs
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-12 sm:px-12 sm:py-14 text-center text-white">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <h2 className="relative text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Ready to bring your clubs together?</h2>
            <p className="relative text-blue-100 mb-8 max-w-xl mx-auto">Create your account and start exploring campus clubs today.</p>
            <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="px-7 py-3.5 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors">Get Started</Link>
              <Link to="/login" className="px-7 py-3.5 rounded-xl border border-white/40 text-white font-semibold hover:bg-white/10 transition-colors">Login</Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
              <GraduationCap size={15} />
            </div>
            <span className="font-semibold text-dark-900">CampusHub</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/clubs" className="hover:text-blue-600">Clubs</Link>
            <Link to="/login" className="hover:text-blue-600">Login</Link>
            <Link to="/register" className="hover:text-blue-600">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
