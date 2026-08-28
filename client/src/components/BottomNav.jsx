import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, User, Trophy, LayoutDashboard, Vote, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  
  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Explore', path: '/clubs', icon: Users },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Matches', path: '/matches', icon: Trophy },
    { name: 'Elections', path: '/elections', icon: Vote },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin', path: '/admin', icon: Shield });
  }
  if (user?.role === 'president' || user?.role === 'admin') {
    navItems.push({ name: 'President', path: '/president', icon: Shield });
  }
  if (user?.role === 'faculty' || user?.role === 'admin') {
    navItems.push({ name: 'Coordinator', path: '/coordinator', icon: Shield });
  }
  
  if (user?.role !== 'admin' && user?.role !== 'president' && user?.role !== 'faculty') {
    navItems.push({ name: 'Profile', path: '/profile', icon: User });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-20 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className="flex flex-col items-center justify-center w-16 h-full relative"
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {isActive && (
                  <motion.div 
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 top-2 flex justify-center"
                  >
                    <div className="w-10 h-10 bg-primary-50 rounded-full"></div>
                  </motion.div>
                )}
                <Icon size={22} className="relative z-10" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold mt-1 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
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
