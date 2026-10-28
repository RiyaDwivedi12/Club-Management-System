import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield, Crown, Award, GraduationCap, Timer, Building2 } from 'lucide-react';
import axios from 'axios';

const ROLES = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'president', label: 'President', icon: Crown },
  { id: 'vice_president', label: 'Vice President', icon: Award },
  { id: 'faculty', label: 'Faculty', icon: Building2 },
  { id: 'referee', label: 'Referee', icon: Timer },
  { id: 'admin', label: 'Admin', icon: Shield },
];

const Login = () => {
  const { user, setCredentials } = useAuthStore();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'president') navigate('/president');
      else if (user.role === 'vice_president') navigate('/vice-president');
      else if (user.role === 'faculty') navigate('/faculty');
      else if (user.role === 'referee') navigate('/referee');
      else navigate('/clubs');
    }
  }, [user, navigate]);

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setErrorMsg(null);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        email: email.trim(),
        identifier: email.trim(),
        roll_no: email.trim(),
        password,
        secretCode: password,
        role: selectedRole,
      };

      const res = await axios.post('/api/auth/login', payload);
      const userData = res.data;
      setCredentials(userData);
      toast.success(`Welcome, ${userData.name || 'User'}!`);

      // Smart redirection based on role
      const actualRole = userData.role || selectedRole;
      if (actualRole === 'admin') {
        navigate('/admin');
      } else if (actualRole === 'president') {
        navigate('/president');
      } else if (actualRole === 'vice_president') {
        navigate('/vice-president');
      } else if (actualRole === 'faculty') {
        navigate('/faculty');
      } else if (actualRole === 'referee') {
        navigate('/referee');
      } else {
        navigate('/clubs');
      }
    } catch (err) {
      let msg = err?.response?.data?.message;
      const rawData = typeof err?.response?.data === 'string' ? err.response.data : '';
      const isConnError = rawData.includes('ECONNREFUSED') || rawData.includes('connect') || err?.message?.includes('Network Error');
      if (isConnError || err?.code === 'ERR_NETWORK' || !err?.response || err?.response?.status >= 500) {
        msg = 'Unable to connect to the server. Please check your internet connection or try again in a moment.';
      } else if (!msg) {
        msg = 'Invalid credentials. Please verify your details.';
      }
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = 'w-full px-4 py-3 text-sm rounded-xl border-2 border-slate-200 bg-white text-gray-900 font-medium placeholder-gray-400 outline-none transition-all focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10';

  return (
    <div className="min-h-[calc(100vh-70px)] w-full flex items-center justify-center bg-gray-50 px-4 py-8 md:py-12">
      <div className="w-full max-w-xl">

        {/* Role Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-xs border border-gray-100 mb-4 grid grid-cols-3 sm:grid-cols-6 gap-1">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleChange(r.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} className={isSelected ? 'text-white' : 'text-gray-400'} />
                <span className="mt-1 text-[11px] leading-tight text-center">{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 text-teal-600 mb-3">
              {selectedRole === 'admin' && <Shield size={24} />}
              {selectedRole === 'president' && <Crown size={24} />}
              {selectedRole === 'vice_president' && <Award size={24} />}
              {selectedRole === 'faculty' && <Building2 size={24} />}
              {selectedRole === 'referee' && <Timer size={24} />}
              {selectedRole === 'student' && <GraduationCap size={24} />}
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
              {selectedRole === 'admin' && 'Admin Command Center'}
              {selectedRole === 'president' && 'President Sign In'}
              {selectedRole === 'vice_president' && 'Vice President Sign In'}
              {selectedRole === 'faculty' && 'Faculty Coordinator Sign In'}
              {selectedRole === 'referee' && 'Referee Terminal Sign In'}
              {selectedRole === 'student' && 'Sign in to your account'}
            </h2>
            <p className="text-sm font-medium text-gray-500">
              {selectedRole === 'student' 
                ? 'Enter your Roll Number or College Email to continue.' 
                : `Enter your ${ROLES.find(r => r.id === selectedRole)?.label} credentials.`}
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl mb-5 text-sm font-semibold bg-red-50 text-red-700 border border-red-200">
              <div className="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submitHandler} className="space-y-4">

            {/* Identifier */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {selectedRole === 'student' ? 'Roll Number / College Email / Username' : 'Official Email / Username'}
              </label>
              <input
                id="login-identifier"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'student' ? 'e.g. 23CS012 or student@college.edu' : `${selectedRole}@campus.edu`}
                required
                className={fieldClass}
              />
            </div>

            {/* Password / Secret Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-gray-700">
                  {selectedRole === 'student' ? 'Password' : 'Password or Secret Code'}
                </label>
                {selectedRole === 'student' && (
                  <Link to="/forgot-password" state={{ email }}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) =
                  autoComplete="new-password"> setPassword(e.target.value)}
                  placeholder={selectedRole === 'student' ? 'Enter your password' : 'Enter password or secret code'}
                  required
                  className={`${fieldClass} pr-12`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-white text-sm tracking-wide transition-all bg-teal-600 hover:bg-teal-700 shadow-[0_4px_14px_rgba(13,148,136,0.35)] disabled:bg-slate-400 disabled:shadow-none disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing In...
                </>
              ) : `Sign In as ${ROLES.find(r => r.id === selectedRole)?.label}`}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm font-medium text-gray-500 mt-7">
            New student?{' '}
            <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700 transition-colors">
              Create an Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
