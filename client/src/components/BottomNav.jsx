import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, User, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Clubs', path: '/clubs', icon: Home },
  { name: 'Events', path: '/events', icon: Calendar },
  { name: 'Explore', path: '/clubs', icon: Users },
  { name: 'Rank', path: '/leaderboard', icon: Medal },
  { name: 'Profile', path: '/profile', icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  // Two items share /clubs; only highlight the first match so the indicator doesn't duplicate.
  const activeIndex = navItems.findIndex((item) => location.pathname.startsWith(item.path));

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/70 pb-safe z-50 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.12)]"
      aria-label="Quick navigation"
    >
      <div className="flex justify-around items-stretch h-16 max-w-lg mx-auto px-1">
        {navItems.map((item, i) => {
          const isActive = i === activeIndex;
          const Icon = item.icon;

          return (
            <Link
              key={item.path + item.name}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative min-w-0"
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-blue-600"
                />
              )}
              <span className={`flex items-center justify-center w-10 h-8 rounded-xl transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
