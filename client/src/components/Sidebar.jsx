import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { 
  Users, Calendar, Trophy, Vote, Medal, User, MessageSquare, Award, 
  Home, GraduationCap, LogOut, Shield, Crown, Timer, Building2, ChevronRight 
} from 'lucide-react';
import { motion } from 'framer-motion';

const studentNavItems = [
  { name: 'Clubs & Hub', path: '/clubs', icon: <Users size={19} /> },
  { name: 'My Profile', path: '/profile', icon: <User size={19} /> },
  { name: 'Messages', path: '/chat', icon: <MessageSquare size={19} /> },
  { name: 'Events', path: '/events', icon: <Calendar size={19} /> },
  { name: 'Matches', path: '/matches', icon: <Trophy size={19} /> },
  { name: 'Tournaments', path: '/tournaments', icon: <Trophy size={19} /> },
  { name: 'Leaderboard', path: '/leaderboard', icon: <Medal size={19} /> },
  { name: 'Certificates', path: '/certificates', icon: <Award size={19} /> },
  { name: 'Elections', path: '/elections', icon: <Vote size={19} /> },
];

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (!user) return null;

  const role = user.role || 'student';

  // Get leadership links based on role
  const getLeadershipItems = () => {
    if (role === 'admin') {
      return [
        { name: 'Admin Panel', path: '/admin', icon: <Shield size={19} className="text-amber-400" /> },
        { name: 'President Dashboard', path: '/president', icon: <Crown size={19} className="text-amber-400" /> },
        { name: 'Vice President', path: '/vice-president', icon: <Award size={19} className="text-teal-300" /> },
        { name: 'Faculty Coordinator', path: '/faculty', icon: <Building2 size={19} className="text-blue-300" /> },
        { name: 'Referee Terminal', path: '/referee', icon: <Timer size={19} className="text-rose-300" /> },
      ];
    }
    if (role === 'president') {
      return [
        { name: 'President Panel', path: '/president', icon: <Crown size={19} className="text-amber-400" /> },
      ];
    }
    if (role === 'vice_president') {
      return [
        { name: 'Vice President Panel', path: '/vice-president', icon: <Award size={19} className="text-teal-300" /> },
      ];
    }
    if (role === 'faculty') {
      return [
        { name: 'Faculty Coordinator', path: '/faculty', icon: <Building2 size={19} className="text-blue-300" /> },
      ];
    }
    if (role === 'referee') {
      return [
        { name: 'Referee Terminal', path: '/referee', icon: <Timer size={19} className="text-rose-300" /> },
      ];
    }
    return [];
  };

  const leadershipItems = getLeadershipItems();

  const getPortalTitle = () => {
    switch (role) {
      case 'admin': return 'Admin Control';
      case 'president': return 'President Portal';
      case 'vice_president': return 'Vice President';
      case 'faculty': return 'Faculty Portal';
      case 'referee': return 'Referee Terminal';
      default: return 'Student Portal';
    }
  };

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="w-72 bg-white h-[calc(100vh-70px)] fixed left-0 top-[70px] border-r border-gray-100 hidden lg:flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
    >
      {/* Branding strip */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xs" style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            {role === 'admin' ? <Shield size={20} className="text-white" /> :
             role === 'president' ? <Crown size={20} className="text-amber-200" /> :
             role === 'vice_president' ? <Award size={20} className="text-white" /> :
             role === 'faculty' ? <Building2 size={20} className="text-white" /> :
             role === 'referee' ? <Timer size={20} className="text-white" /> :
             <GraduationCap size={20} className="text-white" />}
          </div>
          <div className="leading-none">
            <p className="text-white font-black text-sm">{getPortalTitle()}</p>
            <p className="text-teal-200 text-[10px] font-semibold mt-0.5 capitalize">CampusHub {role}</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div className="px-4 overflow-y-auto flex-1 hide-scrollbar space-y-4">

        {/* Leadership Section (if privileged) */}
        {leadershipItems.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-teal-800 bg-teal-50 px-3 py-1 rounded-lg uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Management Panels</span>
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
            </p>
            <ul className="space-y-1">
              {leadershipItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path + item.name}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? 'bg-teal-700 text-white font-black shadow-md shadow-teal-700/20'
                          : 'text-gray-700 hover:bg-teal-50 hover:text-teal-800 font-bold'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="text-xs">{item.name}</span>
                      <ChevronRight size={14} className="ml-auto opacity-50" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Main Portal Navigation */}
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">
            Campus Hub
          </p>
          <ul className="space-y-1">
            {studentNavItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/clubs' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path + item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-teal-600 text-white font-black shadow-sm'
                        : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700 font-semibold'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                    <span className="text-xs sm:text-sm">{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebarIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* User card at bottom */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between bg-teal-50/70 p-3.5 rounded-2xl border border-teal-100">
          <div className="flex items-center gap-3 min-w-0">
            {user?.profilePicture && user.profilePicture !== 'default.jpg' && !user.profilePicture.startsWith('/default') ? (
              <img
                src={user.profilePicture}
                alt={user.name || 'User'}
                className="w-10 h-10 rounded-full object-cover border border-teal-200 flex-shrink-0 shadow-2xs"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default_avatar.png";
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-black flex items-center justify-center text-sm flex-shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900 truncate">{user.name || 'User'}</p>
              <p className="text-[11px] font-bold text-teal-700 capitalize truncate">
                {role.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all flex-shrink-0 cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
