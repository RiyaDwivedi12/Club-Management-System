import { Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2 } from 'lucide-react';

// ── Auth layout pieces (shared look across auth screens) ─────────────
export const AuthBrandPanel = ({ title, highlight, text, points }) => (
  <aside className="relative hidden lg:flex flex-col justify-between gap-10 overflow-hidden bg-brand-gradient p-10 xl:p-12 text-white">
    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
    <div className="absolute -bottom-28 -left-20 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
    <Link to="/" className="relative inline-flex items-center gap-2.5 self-start">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-950/40 ring-1 ring-white/20">
        <GraduationCap size={20} />
      </div>
      <span className="text-xl font-extrabold tracking-tight">Campus<span className="text-blue-300">Hub</span></span>
    </Link>
    <div className="relative">
      <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
        {title}<br />
        <span className="text-blue-200">{highlight}</span>
      </h2>
      <p className="mt-4 text-blue-100/80 leading-relaxed max-w-sm">{text}</p>
      <ul className="mt-8 space-y-3.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm text-blue-50">
            <CheckCircle2 size={18} className="text-blue-300 shrink-0 mt-0.5" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
    <p className="relative text-xs text-blue-100/60">Club, event & sports management for colleges</p>
  </aside>
);

export const MobileLogo = () => (
  <Link to="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-5">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25">
      <GraduationCap size={20} />
    </div>
    <span className="text-lg font-extrabold tracking-tight text-dark-900">Campus<span className="text-blue-600">Hub</span></span>
  </Link>
);
