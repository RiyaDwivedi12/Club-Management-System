import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { GraduationCap, ArrowLeft, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthBrandPanel, MobileLogo } from '../components/auth/AuthLayout';

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
    <div className="w-full max-w-6xl mx-auto lg:min-h-[calc(100vh-8.5rem)] flex items-start lg:items-center py-2 sm:py-6 lg:py-0">
      <div className="w-full lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:min-h-[560px] lg:rounded-3xl lg:overflow-hidden lg:bg-white lg:border lg:border-slate-200/70 lg:shadow-card">
        <AuthBrandPanel
          title="Student Portal."
          highlight="Your campus life, in one place."
          text="Access clubs, events, tournaments, elections, and your campus life all in one place."
          points={[
            'Join clubs and pay membership fees in-app',
            'Event passes, QR attendance and live match scores',
            'Vote in club elections and download your certificates',
          ]}
        />

        <div className="min-w-0 w-full max-w-lg mx-auto lg:max-w-none flex flex-col justify-center">
          <MobileLogo />

          <div className="card p-5 sm:p-8 lg:rounded-none lg:border-0 lg:shadow-none lg:px-10 lg:py-12 xl:px-14">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full lg:max-w-md lg:mx-auto"
            >
              <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Home
              </Link>

              <div className="mb-6">
                <span className="eyebrow mb-3">
                  <GraduationCap size={13} /> Student Access
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-dark-900">Welcome Back!</h1>
                <p className="mt-1 text-sm text-slate-500">Sign in with your student credentials to continue.</p>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 rounded-xl mb-6 border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <GraduationCap size={15} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-dark-900 truncate">Student Login</span>
                </div>
                <Link to="/admin-login" className="btn-soft btn-sm shrink-0">
                  Switch to Admin <ArrowRight size={13} />
                </Link>
              </div>

              {errorMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl mb-5 text-sm font-medium flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                  <span className="break-words min-w-0">{errorMsg}</span>
                </motion.div>
              )}

              <form onSubmit={submitHandler} className="space-y-4">
                <div>
                  <label className="label">Roll Number / Email / Username</label>
                  <input
                    type="text"
                    className="input py-3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. 23CS012 or student@college.edu"
                    required
                  />
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input py-3 pr-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-blue-600" />
                    <span className="text-sm text-slate-600">Remember me</span>
                  </label>
                  <Link to="/forgot-password" state={{ email }} className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In to Student Portal'
                  )}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-slate-500">
                New student?{' '}
                <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                  Create Account
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
