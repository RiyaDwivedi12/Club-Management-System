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

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
      <div className="flex justify-around items-center h-20 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path + item.name}
              to={item.path}
              className="flex flex-col items-center justify-center w-16 h-full relative"
            >
              <div className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 ${isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 bg-teal-50 rounded-full"
                  />
                )}
                <Icon size={22} className="relative z-10" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold mt-0.5 transition-colors ${isActive ? 'text-teal-600' : 'text-gray-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
