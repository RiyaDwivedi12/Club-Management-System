import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useNotificationStore from './store/notificationStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clubs from './pages/Clubs';
import ClubDetails from './pages/ClubDetails';
import Events from './pages/Events';
import Matches from './pages/Matches';
import Elections from './pages/Elections';
import RefereeDashboard from './pages/RefereeDashboard';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { LogOut, Bell } from 'lucide-react';

const AppLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, initSocket, disconnectSocket, fetchNotifications, markAsRead } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      initSocket(user);
      fetchNotifications();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [user, initSocket, disconnectSocket, fetchNotifications]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col font-sans">
      <Toaster position="top-center" toastOptions={{ 
        className: 'rounded-2xl shadow-soft font-medium text-sm border-none',
      }} />
      
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 h-[80px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-gray-100">
        <div className="container mx-auto px-6 h-full flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-soft-purple">C</div>
              <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">Club Management</span>
            </Link>
          </div>
          
          <nav>
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors relative"
                  >
                    <Bell size={24} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                  
                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-bold">{unreadCount} New</span>}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 text-sm">No notifications yet.</div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif._id} 
                              onClick={() => !notif.isRead && markAsRead(notif._id)}
                              className={`p-4 border-b border-gray-50 text-sm cursor-pointer transition-colors hover:bg-gray-50 ${!notif.isRead ? 'bg-primary-50/30' : ''}`}
                            >
                              <p className={`text-gray-800 ${!notif.isRead ? 'font-bold' : ''}`}>{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={logout} 
                  className="flex items-center space-x-2 text-gray-400 hover:text-red-500 font-bold transition-colors bg-gray-50 hover:bg-red-50 px-4 py-2.5 rounded-full"
                >
                  <span className="hidden sm:inline text-sm">Logout</span>
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="space-x-3 flex items-center">
                <Link to="/login" className="text-gray-500 hover:text-primary-600 font-bold text-sm transition-colors px-4 py-2.5">Login</Link>
                <Link to="/register" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-soft-purple transition-all hover:scale-105 active:scale-95">
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 relative max-w-7xl mx-auto w-full">
        {user && <Sidebar />}
        
        <main className={`flex-1 w-full pb-24 md:pb-8 ${user ? 'md:ml-72 md:pl-8' : ''} pt-6 transition-all duration-300 px-4 md:px-0`}>
          {children}
        </main>
        
        {user && <BottomNav />}
      </div>
    </div>
  );
};

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          
          {/* Landing Route */}
          <Route path="/" element={
            user ? <Navigate to="/dashboard" /> : (
              <div className="relative overflow-hidden min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">
                {/* Background blobs */}
                <div className="absolute top-20 -left-20 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 -right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

                <div className="text-center max-w-3xl mx-auto relative z-10 px-4 mt-[-80px]">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 font-bold text-sm mb-8">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                    The ultimate campus experience
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-gray-900 leading-[1.1]">
                    Manage your clubs <br/>
                    <span className="text-gradient">with ease.</span>
                  </h1>
                  <p className="text-xl text-gray-500 mb-10 leading-relaxed font-medium max-w-2xl mx-auto">
                    Discover your passion. Join clubs, attend events, and connect with peers across campus in one beautiful, unified platform.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/register" className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-soft-purple transition-all hover:-translate-y-1 hover:shadow-lg">
                      Get Started Today
                    </Link>
                    <Link to="/login" className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-100 px-8 py-4 rounded-full font-bold text-lg transition-all hover:-translate-y-1">
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            )
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/clubs" element={user ? <Clubs /> : <Navigate to="/login" />} />
          <Route path="/clubs/:id" element={user ? <ClubDetails /> : <Navigate to="/login" />} />
          <Route path="/events" element={user ? <Events /> : <Navigate to="/login" />} />
          <Route path="/matches" element={user ? <Matches /> : <Navigate to="/login" />} />
          <Route path="/elections" element={user ? <Elections /> : <Navigate to="/login" />} />
          <Route path="/referee-dashboard" element={user && user.role === 'referee' ? <RefereeDashboard /> : <Navigate to="/dashboard" />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
