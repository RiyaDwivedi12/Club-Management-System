import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useNotificationStore from './store/notificationStore';
import useMatchStore from './store/matchStore';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Clubs from './pages/Clubs';
import ClubDetails from './pages/ClubDetails';
import Events from './pages/Events';
import Matches from './pages/Matches';
import Leaderboard from './pages/Leaderboard';
import Elections from './pages/Elections';
import RefereeDashboard from './pages/RefereeDashboard';
import AdminPanel from './pages/AdminPanel';
import PresidentDashboard from './pages/PresidentDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Tournaments from './pages/Tournaments';
import TournamentBracket from './pages/TournamentBracket';
import Certificates from './pages/Certificates';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import { LogOut, Bell, Menu, X, ArrowRight, Globe, Star, Trophy, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AppLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, initSocket, disconnectSocket, fetchNotifications, markAsRead, socket } = useNotificationStore();
  const { updateMatchFromSocket } = useMatchStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute && user && user.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans">
        <Toaster position="top-center" toastOptions={{ 
          style: {
            background: '#ffffff',
            color: '#1f2937',
            fontWeight: 'bold',
            borderRadius: '12px',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
          }
        }} />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans">
      <Toaster position="top-center" toastOptions={{ 
        style: {
          background: '#ffffff',
          color: '#1f2937',
          fontWeight: 'bold',
          borderRadius: '12px',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
        },
        error: {
          style: {
            color: '#ef4444',
          },
        },
      }} />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 h-[80px] border-b border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
        <div className="w-full px-6 md:px-12 h-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center text-white font-black text-xl shadow-soft-purple group-hover:scale-105 transition-transform">
                <span>C</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-gray-900 hidden sm:block">Club<span className="text-primary-600">Sphere</span></span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            {!user ? (
              <>
                <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-primary-600 transition-colors">Login</Link>
                <Link to="/register" className="text-sm font-bold bg-primary-600 text-white px-6 py-2.5 rounded-full hover:bg-primary-700 hover:shadow-soft-purple transition-all hover:-translate-y-0.5">
                  Join the club
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-all relative"
                  >
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                  
                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 text-sm tracking-wide">Notifications</h3>
                        {unreadCount > 0 && <span className="text-xs bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full font-bold">{unreadCount} NEW</span>}
                      </div>
                      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 text-sm font-semibold">No notifications</div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif._id} 
                              onClick={() => !notif.isRead && markAsRead(notif._id)}
                              className={`p-4 text-sm cursor-pointer transition-colors hover:bg-gray-50 ${!notif.isRead ? 'bg-primary-50/40 border-l-4 border-l-primary-500' : ''}`}
                            >
                              <p className={`text-gray-700 ${!notif.isRead ? 'font-bold text-gray-900' : ''}`}>{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1 font-medium">{new Date(notif.createdAt).toLocaleDateString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold flex items-center justify-center text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span>{user.name}</span>
                </div>

                <button 
                  onClick={logout}
                  className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-50"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </nav>

          <button 
            className="md:hidden text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 fixed top-[80px] left-0 w-full z-40 shadow-lg"
          >
            <div className="flex flex-col gap-4">
              {!user ? (
                <>
                  <Link to="/login" className="text-gray-700 font-bold py-2 hover:text-primary-600">Login</Link>
                  <Link to="/register" className="bg-primary-600 text-white text-center py-3 rounded-xl font-bold shadow-soft-purple">Join Now</Link>
                </>
              ) : (
                <button onClick={logout} className="text-red-500 font-bold py-2 text-left flex items-center gap-2">
                  <LogOut size={18} /> Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-1 relative w-full">
        {user && <Sidebar />}
        
        <main className={`flex-1 w-full pb-24 md:pb-8 ${user ? 'md:ml-72 md:pl-8' : ''} pt-6 transition-all duration-300 px-4 md:px-12`}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {user && <BottomNav />}
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="w-full flex items-center min-h-[calc(100vh-140px)] py-10 overflow-hidden">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Side: Text and Buttons */}
        <div className="flex flex-col items-start z-10 md:pr-10 text-left order-2 md:order-1">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 font-bold text-xs uppercase tracking-wider mb-6 border border-primary-100">
            <Star size={14} className="fill-primary-500 text-primary-500" />
            <span>Campus Sports & Club Management</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-gray-900 leading-[1.1]">
            Dominate Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-800">Campus Sports</span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed font-medium">
            Join elite clubs, dominate events, participate in live tournaments, and track your athletic progress on the ultimate student platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
            <Link to="/register" className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-primary-700 shadow-soft-purple transition-all w-full sm:w-auto text-center hover:-translate-y-1">
              Join the club
            </Link>
            <Link to="/login" className="text-gray-800 font-black hover:text-primary-600 transition-colors flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-gray-200/80 hover:border-primary-300 w-full sm:w-auto">
              <span>Explore activities</span>
              <ArrowRight size={20} className="text-primary-600" />
            </Link>
          </div>
        </div>

        {/* Right Side: Circular Layout */}
        <div className="relative flex justify-center items-center w-full h-[500px] order-1 md:order-2">
          {/* Concentric Circles */}
          <div className="absolute w-[480px] h-[480px] rounded-full bg-primary-100/40 animate-pulse" style={{ animationDuration: '6s' }}></div>
          <div className="absolute w-[380px] h-[380px] rounded-full bg-primary-200/50"></div>
          <div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 opacity-90 shadow-soft-purple"></div>
          
          {/* Hero Image */}
          <img 
            src="/student_hero.jpg" 
            alt="Student Athlete" 
            className="absolute bottom-0 h-[450px] object-cover object-top z-10 rounded-b-full shadow-2xl"
            style={{ clipPath: 'circle(50% at 50% 50%)' }}
          />

          {/* Floating Badges */}
          <div className="absolute top-10 left-8 bg-white p-3.5 rounded-2xl shadow-soft z-20 border border-purple-50 animate-bounce" style={{ animationDuration: '3s' }}>
            <Globe className="text-primary-600" size={24} />
          </div>
          <div className="absolute top-16 right-12 bg-white p-3.5 rounded-2xl shadow-soft z-20 border border-purple-50 animate-bounce" style={{ animationDuration: '4s' }}>
            <Star className="text-primary-600 fill-primary-400" size={24} />
          </div>
          <div className="absolute bottom-28 left-4 bg-white p-3.5 rounded-2xl shadow-soft z-20 border border-purple-50 animate-bounce" style={{ animationDuration: '2.5s' }}>
            <Trophy className="text-primary-600" size={24} />
          </div>
          <div className="absolute bottom-36 right-6 bg-white p-3.5 rounded-2xl shadow-soft z-20 border border-purple-50 animate-bounce" style={{ animationDuration: '3.5s' }}>
            <BookOpen className="text-primary-600" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
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
          <Route path="/dashboard" element={<Dashboard />} />
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
          <Route element={<ProtectedRoute allowedRoles={['referee', 'admin']} />}>
            <Route path="/referee" element={<RefereeDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['president', 'admin']} />}>
            <Route path="/president" element={<PresidentDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin']} />}>
            <Route path="/coordinator" element={<CoordinatorDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
