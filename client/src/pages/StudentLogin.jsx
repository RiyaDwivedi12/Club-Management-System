import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { GraduationCap, ArrowLeft, Eye, EyeOff, BookOpen, Trophy, Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const floatingCards = [
  { icon: Trophy, label: 'Tournaments', color: '#f59e0b', delay: 0 },
  { icon: Users, label: 'Clubs', color: '#10b981', delay: 0.5 },
  { icon: BookOpen, label: 'Events', color: '#6366f1', delay: 1 },
  { icon: Star, label: 'Leaderboard', color: '#ec4899', delay: 1.5 },
];

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/auth/login', {
        email,
        password,
        role: 'student',
      });
      const user = res.data;
      setCredentials(user);
      toast.success('Welcome back, ' + (user.name || 'Student') + '!');
      navigate('/clubs');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Invalid credentials. Please try again.');
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans">
      {/* Left Panel - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 40%, #1d4ed8 100%)' }}
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'rgba(16,185,129,0.25)', filter: 'blur(80px)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: 'rgba(99,102,241,0.3)', filter: 'blur(80px)' }}
        />

        {floatingCards.map(({ icon: Icon, label, color, delay }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -10, 0] }}
            transition={{ delay, duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute flex items-center gap-2 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-xl"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              top: i === 0 ? '18%' : i === 1 ? '30%' : i === 2 ? '62%' : '74%',
              left: i % 2 === 0 ? '6%' : undefined,
              right: i % 2 !== 0 ? '6%' : undefined,
            }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '30' }}>
              <Icon size={16} style={{ color }} />
            </div>
            <span className="text-white text-sm font-semibold">{label}</span>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 text-white text-center max-w-md"
        >
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <GraduationCap size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-black mb-5 leading-tight tracking-tight">
            Student<br />
            <span style={{ color: '#a7f3d0' }}>Portal</span>
          </h1>
          <p className="text-teal-100 text-lg font-medium leading-relaxed mb-8">
            Access clubs, events, tournaments, elections, and your campus life all in one place.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[{ value: '50+', label: 'Clubs' }, { value: '200+', label: 'Events' }, { value: '1k+', label: 'Students' }].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl p-3"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs text-teal-200 font-semibold mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-[#f0fdf4] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center text-sm font-bold text-teal-600 hover:text-teal-700 mb-8 transition-colors gap-1.5">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4" style={{ background: '#d1fae5', color: '#065f46' }}>
              <GraduationCap size={13} /> Student Access
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Welcome Back!</h2>
            <p className="text-gray-500 font-medium">Sign in with your student credentials to continue.</p>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl mb-6 border bg-white" style={{ borderColor: '#d1fae5' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center">
                <GraduationCap size={15} className="text-teal-600" />
              </div>
              <span className="text-sm font-bold text-gray-800">Student Login</span>
            </div>
            <Link to="/admin-login" className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors px-3 py-1.5 bg-teal-50 rounded-lg">
              Switch to Admin →
            </Link>
          </div>

          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl mb-5 text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={submitHandler} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-bold mb-2 text-sm">Roll Number / Email / Username</label>
              <input
                type="text"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all bg-white text-gray-900 font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. 23CS012 or student@college.edu"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 text-sm">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all bg-white text-gray-900 font-medium pr-12"
                  value={password}
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-teal-500" />
                <span className="text-sm text-gray-600 font-medium">Remember me</span>
              </label>
              <Link to="/forgot-password" state={{ email }} className="text-sm text-teal-600 hover:text-teal-700 font-bold transition-colors">
                Forgot Password?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl font-black text-white text-base transition-all disabled:opacity-60"
              style={{
                background: loading ? '#6b7280' : 'linear-gradient(135deg, #0d9488, #0891b2)',
                boxShadow: loading ? 'none' : '0 10px 30px -8px rgba(13,148,136,0.5)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In to Student Portal'
              )}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-gray-500 font-medium text-sm">
            New student?{' '}
            <Link to="/register" className="text-teal-600 hover:text-teal-700 font-black">
              Create Account →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentLogin;
