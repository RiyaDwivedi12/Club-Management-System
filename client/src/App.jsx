import { useEffect, useState, useRef } from 'react';
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
import AdminPanel from './pages/AdminPanel';
import PresidentDashboard from './pages/PresidentDashboard';
import VicePresidentDashboard from './pages/VicePresidentDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import RefereeDashboard from './pages/RefereeDashboard';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { 
  LogOut, Bell, Menu, X,
  GraduationCap, MessageSquare, Calendar, CheckCircle2, Check, 
  Users, Shield, Crown, Award, Building2, Timer, ChevronRight 
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
      <div className="min-h-screen bg-[#F4F6F9] font-sans antialiased text-slate-800">
        <Toaster position="top-center" toastOptions={{ 
          style: {
            background: '#ffffff',
            color: '#1f2937',
            fontWeight: 'bold',
            borderRadius: '12px',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
          },
          error: {
            style: { color: '#ef4444' },
          },
        }} />
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans pt-[70px]">
      <Toaster position="top-center" toastOptions={{ 
        style: {
          background: '#ffffff',
          color: '#1f2937',
          fontWeight: 'bold',
          borderRadius: '12px',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
        },
        error: {
          style: { color: '#ef4444' },
        },
      }} />
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md fixed top-0 left-0 right-0 z-50 h-[70px] border-b border-gray-100 shadow-sm">
        <div className="w-full px-4 sm:px-6 md:px-12 h-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to={user ? "/clubs" : "/"} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap size={22} />
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-xl font-black tracking-tight text-gray-900">Campus<span className="text-teal-600">Hub</span></span>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                  {role !== 'student' ? `${role.replace('_', ' ')} Portal` : 'Student Portal'}
                </span>
              </div>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-5">
            {!user ? (
              <>
                <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-teal-600 transition-colors">Login</Link>
                <Link to="/register" className="text-sm font-bold bg-teal-600 text-white px-6 py-2.5 rounded-full hover:bg-teal-700 transition-all hover:-translate-y-0.5 shadow-md shadow-teal-500/20">
                  Join Now
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                
                {/* Role-Specific Quick Switch Buttons */}
                {role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow-xs"
                  >
                    <Shield size={14} className="text-amber-400" /> Admin Command
                  </Link>
                )}
                {role === 'president' && (
                  <Link 
                    to="/president" 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs hover:bg-teal-100 transition"
                  >
                    <Crown size={14} className="text-amber-500" /> President Panel
                  </Link>
                )}
                {role === 'vice_president' && (
                  <Link 
                    to="/vice-president" 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs hover:bg-teal-100 transition"
                  >
                    <Award size={14} className="text-teal-600" /> VP Panel
                  </Link>
                )}
                {role === 'faculty' && (
                  <Link 
                    to="/faculty" 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs hover:bg-teal-100 transition"
                  >
                    <Building2 size={14} className="text-blue-500" /> Faculty Coordinator
                  </Link>
                )}
                {role === 'referee' && (
                  <Link 
                    to="/referee" 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs hover:bg-teal-100 transition"
                  >
                    <Timer size={14} className="text-rose-500" /> Referee Terminal
                  </Link>
                )}

                {/* Notification Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all relative cursor-pointer"
                    aria-label="Notifications"
                  >
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <>
                      {/* Invisible backdrop to dismiss on outside click */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowNotifications(false)}
                      />
                      <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-gray-900 text-sm tracking-wide">Notifications</h3>
                            {unreadCount > 0 && (
                              <span className="text-[11px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-extrabold">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead()}
                              className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check size={14} /> Mark all read
                            </button>
                          )}
                        </div>

                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                              <Bell size={32} className="mx-auto text-gray-300 mb-2 opacity-60" />
                              <p className="text-sm font-bold text-gray-700">No notifications yet</p>
                              <p className="text-xs text-gray-400 mt-1">Club announcements and messages will show up here</p>
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
                                className={`p-4 text-sm cursor-pointer transition-colors flex items-start gap-3 hover:bg-gray-50 ${
                                  !notif.isRead ? 'bg-teal-50/40 border-l-4 border-l-teal-600' : ''
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                  notif.type === 'club_message'
                                    ? 'bg-cyan-50 text-cyan-700'
                                    : notif.type === 'event_announcement'
                                    ? 'bg-amber-50 text-amber-700'
                                    : notif.type === 'club_approval'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-teal-50 text-teal-700'
                                }`}>
                                  {notif.type === 'club_message' && <MessageSquare size={16} />}
                                  {notif.type === 'event_announcement' && <Calendar size={16} />}
                                  {notif.type === 'club_approval' && <CheckCircle2 size={16} />}
                                  {notif.type !== 'club_message' && notif.type !== 'event_announcement' && notif.type !== 'club_approval' && <Bell size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs sm:text-sm text-gray-800 leading-snug line-clamp-2 ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium'}`}>
                                    {notif.message}
                                  </p>
                                  <p className="text-[11px] text-gray-400 mt-1 font-semibold">
                                    {formatTimeAgo(notif.createdAt)}
                                  </p>
                                </div>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0 mt-2"></span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  {user?.profilePicture && user.profilePicture !== 'default.jpg' && !user.profilePicture.startsWith('/default') ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name || 'User'}
                      className="w-9 h-9 rounded-full object-cover border border-teal-200 shadow-2xs"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default_avatar.png";
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-black flex items-center justify-center text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="flex flex-col leading-none">
                    <span className="text-sm font-bold">{user.name}</span>
                    <span className="text-[10px] text-teal-600 font-semibold capitalize">{role.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            )}
          </nav>

          {/* Mobile Right Controls: Notification bell + menu toggle */}
          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-700 hover:text-teal-600 rounded-xl relative"
                  aria-label="Notifications"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute 1 top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-xs font-bold">
                        <span>Notifications ({unreadCount})</span>
                        {unreadCount > 0 && (
                          <button onClick={() => markAllAsRead()} className="text-teal-600">Mark read</button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 text-xs">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-400">No notifications</div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif._id} 
                              onClick={() => {
                                if (!notif.isRead) markAsRead(notif._id);
                                setShowNotifications(false);
                                if (notif.link) navigate(notif.link);
                              }}
                              className="p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <p className="font-semibold text-gray-900">{notif.message}</p>
                              <span className="text-[10px] text-gray-400 mt-1 block">{formatTimeAgo(notif.createdAt)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <button 
              className="text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 fixed top-[70px] left-0 w-full z-40 shadow-lg"
          >
            <div className="flex flex-col gap-3">
              {!user ? (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 font-bold py-2 hover:text-teal-600">Login</Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="bg-teal-600 text-white text-center py-3 rounded-xl font-bold shadow-md">Join Now</Link>
                </>
              ) : (
                <>
                  {role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-900 font-black py-2 flex items-center gap-2 border-b border-gray-100">
                      <Shield size={18} className="text-amber-500" /> Admin Command Center
                    </Link>
                  )}
                  {role === 'president' && (
                    <Link to="/president" onClick={() => setIsMobileMenuOpen(false)} className="text-teal-700 font-black py-2 flex items-center gap-2 border-b border-gray-100">
                      <Crown size={18} className="text-amber-500" /> President Panel
                    </Link>
                  )}
                  {role === 'vice_president' && (
                    <Link to="/vice-president" onClick={() => setIsMobileMenuOpen(false)} className="text-teal-700 font-black py-2 flex items-center gap-2 border-b border-gray-100">
                      <Award size={18} className="text-teal-600" /> Vice President Panel
                    </Link>
                  )}
                  {role === 'faculty' && (
                    <Link to="/faculty" onClick={() => setIsMobileMenuOpen(false)} className="text-teal-700 font-black py-2 flex items-center gap-2 border-b border-gray-100">
                      <Building2 size={18} className="text-blue-500" /> Faculty Coordinator
                    </Link>
                  )}
                  {role === 'referee' && (
                    <Link to="/referee" onClick={() => setIsMobileMenuOpen(false)} className="text-teal-700 font-black py-2 flex items-center gap-2 border-b border-gray-100">
                      <Timer size={18} className="text-rose-500" /> Referee Terminal
                    </Link>
                  )}
                  <Link to="/clubs" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 font-bold py-2">Explore Clubs</Link>
                  <Link to="/events" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 font-bold py-2">Events</Link>
                  <Link to="/matches" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 font-bold py-2">Matches</Link>
                  <Link to="/chat" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 font-bold py-2">Messages</Link>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 font-bold py-2">My Profile</Link>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); navigate('/', { replace: true }); }} className="text-red-500 font-bold py-2 text-left flex items-center gap-2 pt-2 border-t border-gray-100 cursor-pointer">
                    <LogOut size={18} /> Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 relative w-full">
        {user && <Sidebar />}
        <main className={`flex-1 w-full pb-24 lg:pb-8 ${user ? 'lg:ml-72 lg:pl-8' : ''} pt-6 transition-all duration-300 px-4 md:px-12`}>
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

function App() {
  return (
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
  );
}

export default App;
