import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { studentNavItems, getLeadershipItems, getPortalTitle, formatRole } from './navConfig';
import UserAvatar from './ui/UserAvatar';

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
  const leadershipItems = getLeadershipItems(role);

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="w-72 bg-white h-[calc(100vh-4rem)] fixed left-0 top-16 border-r border-slate-100 hidden lg:flex flex-col z-10"
    >
      {/* Portal strip */}
      <div className="px-4 pt-5 pb-4">
        <div className="relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-brand-gradient shadow-md shadow-blue-900/15">
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-blue-400/25 blur-2xl pointer-events-none" />
          <div className="relative min-w-0">
            <p className="text-white font-bold text-sm">{getPortalTitle(role)}</p>
            <p className="text-blue-200 text-[11px] font-medium mt-0.5 capitalize">CampusHub · {formatRole(role)}</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="px-4 overflow-y-auto flex-1 hide-scrollbar space-y-6 pb-4" aria-label="Portal">
        {leadershipItems.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Management
            </p>
            <ul className="space-y-1">
              {leadershipItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <li key={item.path + item.name}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        isActive
                          ? 'bg-dark-900 text-white font-semibold shadow-md shadow-dark-900/15'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-dark-900 font-medium'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-blue-300' : 'text-slate-400'} />
                      <span className="truncate">{item.name}</span>
                      <ChevronRight size={14} className="ml-auto opacity-40" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Campus Hub
          </p>
          <ul className="space-y-1">
            {studentNavItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/clubs' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <li key={item.path + item.name}>
                  <Link
                    to={item.path}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-dark-900 font-medium'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="sidebarIndicator"
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600"
                      />
                    )}
                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User card */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
          <Link to="/profile" className="flex items-center gap-3 min-w-0">
            <UserAvatar user={user} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dark-900 truncate">{user.name || 'User'}</p>
              <p className="text-xs text-slate-500 capitalize truncate">{formatRole(role)}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="btn-icon hover:text-red-600 hover:bg-red-50 shrink-0"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
