import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Home, Users, Calendar, LayoutDashboard, Trophy, Vote, Shield, Medal, User, MessageSquare, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return null; // Only show for logged in users

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Chat', path: '/chat', icon: <MessageSquare size={20} /> },
    { name: 'Clubs', path: '/clubs', icon: <Users size={20} /> },
    { name: 'Events', path: '/events', icon: <Calendar size={20} /> },
    { name: 'Matches', path: '/matches', icon: <Trophy size={20} /> },
    { name: 'Tournaments', path: '/tournaments', icon: <Trophy size={20} /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Medal size={20} /> },
    { name: 'Certificates', path: '/certificates', icon: <Award size={20} /> },
    { name: 'Elections', path: '/elections', icon: <Vote size={20} /> },
  ];

  if (user?.role === 'referee' || user?.role === 'admin') {
    navItems.push({ name: 'Referee Terminal', path: '/referee', icon: <Shield size={20} /> });
  }
  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: <Shield size={20} /> });
  }
  if (user?.role === 'president') {
    navItems.push({ name: 'President Panel', path: '/president', icon: <Shield size={20} /> });
  }
  if (user?.role === 'faculty') {
    navItems.push({ name: 'Coordinator Panel', path: '/coordinator', icon: <Shield size={20} /> });
  }

  return (
    <motion.aside 
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-72 bg-white h-[calc(100vh-80px)] fixed left-0 top-[80px] border-r border-gray-100 hidden md:flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
    >
      <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
        <div className="mb-8">
          <ul className="space-y-3 mt-4">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-4 px-5 py-4 rounded-[20px] transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary-50 text-primary-600 font-bold' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-semibold'
                    }`}
                  >
                    <div className={`${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                      {item.icon}
                    </div>
                    <span className="text-[15px]">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-[20px]">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{user.name || 'User'}</p>
            <p className="text-xs font-semibold text-primary-500 capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
