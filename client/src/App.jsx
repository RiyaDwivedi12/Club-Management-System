import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    // Assuming Axios is configured to drop cookie if we hit /api/auth/logout, 
    // but for now local state is cleared.
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Toaster position="top-right" />
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold">CCMS</Link>
            <nav>
              {user ? (
                <div className="flex items-center space-x-4">
                  <span>Welcome, {user.name} ({user.role})</span>
                  <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-x-4">
                  <Link to="/login" className="hover:underline">Login</Link>
                  <Link to="/register" className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded font-semibold">
                    Register
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </header>
        <main className="container mx-auto p-4 mt-8">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* General Routes */}
            <Route path="/" element={
              <div className="text-center mt-20">
                <h2 className="text-4xl font-bold mb-4">Welcome to CCMS</h2>
                <p className="text-lg text-gray-600 mb-8">Phase 2: Authentication & Security (RBAC) Initialized.</p>
                {!user && (
                  <p>Please <Link to="/login" className="text-blue-600 underline">Login</Link> to access your dashboard.</p>
                )}
              </div>
            } />

            {/* Protected Routes Example */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'student', 'president', 'faculty', 'referee']} />}>
              {/* Add dashboards here in Phase 3 */}
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
