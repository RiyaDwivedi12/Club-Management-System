import { useEffect, useState, useRef, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useNotificationStore from './store/notificationStore';
import useMatchStore from './store/matchStore';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Clubs from './pages/Clubs';
import ClubDetails from './pages/ClubDetails';
import Events from './pages/Events';
import Matches from './pages/Matches';
import Leaderboard from './pages/Leaderboard';
import Elections from './pages/Elections';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Tournaments from './pages/Tournaments';
import TournamentBracket from './pages/TournamentBracket';
import Certificates from './pages/Certificates';
import MembershipFees from './pages/MembershipFees';
import AdminPanel from './pages/AdminPanel';
import PresidentDashboard from './pages/PresidentDashboard';
import VicePresidentDashboard from './pages/VicePresidentDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import RefereeDashboard from './pages/RefereeDashboard';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import UserAvatar from './components/ui/UserAvatar';
import { studentNavItems, getLeadershipItems, getRolePanel, formatRole } from './components/navConfig';
import {
  LogOut, Bell, Menu, X,
  GraduationCap, MessageSquare, Calendar, CheckCircle2, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffInSec = Math.floor((now - date) / 1000);
  if (diffInSec < 60) return 'Just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

const toastOptions = {
  style: {
    background: '#ffffff',
    color: '#0b132b',
    fontWeight: 600,
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 40px -10px rgba(15,23,42,0.15)'
  },
  error: {
    style: { color: '#dc2626' },
  },
};

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { 
    notifications, 
    unreadCount, 
    initSocket, 
    disconnectSocket, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    socket 
  } = useNotificationStore();
  const { updateMatchFromSocket } = useMatchStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');

  const prevUserRef = useRef(user);

  useEffect(() => {
    // When user logs out (transitions from logged in to null), redirect to the very first page of the website ("/")
    if (prevUserRef.current && !user) {
      navigate('/', { replace: true });
    }
    prevUserRef.current = user;
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      initSocket(user);
      fetchNotifications();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [user, initSocket, disconnectSocket, fetchNotifications]);

  useEffect(() => {
    if (socket) {
      socket.on('match_score_update', updateMatchFromSocket);
      socket.on('match_status_change', updateMatchFromSocket);
    }
    return () => {
      if (socket) {
        socket.off('match_score_update', updateMatchFromSocket);
        socket.off('match_status_change', updateMatchFromSocket);
      }
    };
  }, [socket, updateMatchFromSocket]);

  // Admin Panel renders with its own dedicated sidebar & full viewport
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
        <Toaster position="top-center" toastOptions={toastOptions} />
        {children}
      </div>
    );
  }

  // Public landing page renders its own navbar and full-width layout
  if (location.pathname === '/' && !user) {
    return (
      <>
        <Toaster position="top-center" />
        {children}
      </>
    );
  }

  const role = user?.role || 'student';
  const rolePanel = getRolePanel(role);
  const RolePanelIcon = rolePanel?.icon;
  const leadershipItems = getLeadershipItems(role);

  const renderNotificationPanel = () => (
    <>
      {/* Invisible backdrop to dismiss on outside click */}
      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      <div className="fixed left-3 right-3 top-[4.25rem] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96 bg-white rounded-2xl shadow-2xl shadow-dark-900/10 border border-slate-100 overflow-hidden z-50">
        <div className="px-4 py-3.5 border-b border-slate-100 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-dark-900 text-sm">Notifications</h3>
            {unreadCount > 0 && <span className="badge-blue">{unreadCount} new</span>}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Bell size={22} />
              </div>
              <p className="text-sm font-semibold text-dark-900">No notifications yet</p>
              <p className="text-xs text-slate-500 mt-1">Club announcements and messages will show up here</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => {
                  if (!notif.isRead) markAsRead(notif._id);
                  setShowNotifications(false);
                  if (notif.link) navigate(notif.link);
                }}
                className={`px-4 py-3.5 text-sm cursor-pointer transition-colors flex items-start gap-3 hover:bg-slate-50 ${
                  !notif.isRead ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  notif.type === 'club_message'
                    ? 'bg-sky-50 text-sky-600'
                    : notif.type === 'event_announcement'
                    ? 'bg-amber-50 text-amber-600'
                    : notif.type === 'club_approval'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {notif.type === 'club_message' && <MessageSquare size={16} />}
                  {notif.type === 'event_announcement' && <Calendar size={16} />}
                  {notif.type === 'club_approval' && <CheckCircle2 size={16} />}
                  {notif.type !== 'club_message' && notif.type !== 'event_announcement' && notif.type !== 'club_approval' && <Bell size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] leading-snug line-clamp-2 ${!notif.isRead ? 'font-semibold text-dark-900' : 'text-slate-700'}`}>
                    {notif.message}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    {formatTimeAgo(notif.createdAt)}
                  </p>
                </div>
                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2"></span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-dark-900 flex flex-col font-sans pt-16">
      <Toaster position="top-center" toastOptions={toastOptions} />

      {/* Header — mirrors the landing page navbar */}
      <header className="bg-white/90 backdrop-blur-md fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-100">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center gap-3">
          <Link to={user ? "/clubs" : "/"} className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25 shrink-0">
              <GraduationCap size={20} />
            </div>
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-lg font-extrabold tracking-tight text-dark-900">Campus<span className="text-blue-600">Hub</span></span>
              <span className="hidden sm:block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                {role !== 'student' ? `${formatRole(role)} Portal` : 'Student Portal'}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-dark-900 hover:text-blue-600 transition-colors">Login</Link>
                <Link to="/register" className="btn-primary px-5">Join Now</Link>
              </>
            ) : (
              <>
                {/* Role-specific quick switch */}
                {rolePanel && (
                  <Link
                    to={rolePanel.path}
                    className={role === 'admin'
                      ? 'btn btn-sm bg-dark-900 text-white hover:bg-dark-800'
                      : 'btn btn-sm bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100'}
                  >
                    <RolePanelIcon size={14} className={role === 'admin' ? 'text-blue-300' : ''} />
                    {role === 'admin' ? 'Admin Command' : role === 'vice_president' ? 'VP Panel' : rolePanel.name}
                  </Link>
                )}

                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="btn-icon w-10 h-10 relative"
                    aria-label="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && renderNotificationPanel()}
                </div>

                <Link to="/profile" className="flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-100">
                  <UserAvatar user={user} />
                  <div className="hidden lg:flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-dark-900 max-w-[160px] truncate">{user.name}</span>
                    <span className="text-[11px] text-slate-500 capitalize">{formatRole(role)}</span>
                  </div>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Right Controls: Notification bell + menu toggle */}
          <div className="flex items-center gap-1 md:hidden">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="btn-icon w-10 h-10 relative"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>
                {showNotifications && renderNotificationPanel()}
              </div>
            )}

            <button
              className="btn-icon w-10 h-10 text-dark-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden bg-white border-b border-slate-100 px-4 py-4 fixed top-16 left-0 w-full z-40 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            {!user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn-secondary">Login</Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary">Join Now</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <UserAvatar user={user} size="lg" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-dark-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{formatRole(role)}</p>
                  </div>
                </Link>

                {leadershipItems.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">Management</p>
                    {leadershipItems.map(({ name, path, icon: Icon }) => (
                      <Link key={path} to={path} onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${location.pathname === path ? 'bg-dark-900 text-white' : 'text-dark-900 hover:bg-slate-50'}`}>
                        <Icon size={18} className={location.pathname === path ? 'text-blue-300' : 'text-blue-600'} /> {name}
                      </Link>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">Campus Hub</p>
                  <div className="grid grid-cols-2 gap-1">
                    {studentNavItems.map(({ name, path, icon: Icon }) => {
                      const active = location.pathname === path || (path !== '/clubs' && location.pathname.startsWith(path));
                      return (
                        <Link key={path} to={path} onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm min-w-0 ${active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 font-medium hover:bg-slate-50'}`}>
                          <Icon size={17} className={`shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} /> <span className="truncate">{name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <button onClick={() => { logout(); setIsMobileMenuOpen(false); navigate('/', { replace: true }); }} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer">
                  <LogOut size={17} /> Logout
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 relative w-full">
        {user && <Sidebar />}
        <main className={`flex-1 w-full min-w-0 pb-24 lg:pb-10 ${user ? 'lg:ml-72' : ''} pt-6 transition-all duration-300 px-4 sm:px-6 lg:px-8`}>
          {children}
        </main>
      </div>

      {user && <BottomNav />}
    </div>
  );
};

const LandingPage = () => {
  const { user } = useAuthStore();

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'president') return <Navigate to="/president" replace />;
    if (user.role === 'vice_president') return <Navigate to="/vice-president" replace />;
    if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
    if (user.role === 'referee') return <Navigate to="/referee" replace />;
    return <Navigate to="/clubs" replace />;
  }

  return <Landing />;
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-dark-900 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <GraduationCap size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-500 mb-4 max-w-md">
            The page encountered an unexpected issue. Please click below to reload or return to the main dashboard.
          </p>
          {this.state.error && (
            <p className="text-xs font-mono text-red-600 bg-red-50 p-3 rounded-xl max-w-lg mb-6 break-words border border-red-100">
              {this.state.error?.message || String(this.state.error)}
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="btn-primary"
            >
              Reload Page
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              className="btn-secondary"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:id" element={<ClubDetails />} />
          <Route path="/events" element={<Events />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/:id/bracket" element={<TournamentBracket />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/membership-fees" element={<MembershipFees />} />
          <Route path="/fees" element={<Navigate to="/membership-fees" replace />} />
          <Route path="/elections" element={<Elections />} />
          
          {/* Management Panels */}
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/president" element={<PresidentDashboard />} />
          <Route path="/vice-president" element={<VicePresidentDashboard />} />
          <Route path="/faculty" element={<CoordinatorDashboard />} />
          <Route path="/coordinator" element={<CoordinatorDashboard />} />
          <Route path="/referee" element={<RefereeDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Catch all — redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
