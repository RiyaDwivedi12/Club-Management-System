import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield, Crown, Award, GraduationCap, Timer, Building2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { AuthBrandPanel, MobileLogo } from '../components/auth/AuthLayout';

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
  const [unverifiedData, setUnverifiedData] = useState(null);

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
      if (err?.response?.data?.isUnverified) {
        setUnverifiedData(err.response.data);
      } else {
        setUnverifiedData(null);
      }
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

  const RoleIcon = ROLES.find(r => r.id === selectedRole)?.icon || GraduationCap;

  return (
    <div className="w-full max-w-6xl mx-auto lg:min-h-[calc(100vh-8.5rem)] flex items-start lg:items-center py-2 sm:py-6 lg:py-0">
      <div className="w-full lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:rounded-3xl lg:overflow-hidden lg:bg-white lg:border lg:border-slate-200/70 lg:shadow-card">
        <AuthBrandPanel
          title="Welcome back to"
          highlight="your campus clubs."
          text="Sign in to manage clubs, events, tournaments and elections from a dashboard built for your role."
          points={[
            'Role-based dashboards for students, leaders, faculty, referees and admins',
            'Event passes, QR attendance and live match scores',
            'Secret-ballot club elections and verifiable certificates',
          ]}
        />

        <div className="min-w-0 w-full max-w-lg mx-auto lg:max-w-none flex flex-col justify-center">
          <MobileLogo />

          {/* Card */}
          <div className="card p-5 sm:p-8 lg:rounded-none lg:border-0 lg:shadow-none lg:px-10 lg:py-10 xl:px-14">
            <div className="lg:max-w-lg lg:mx-auto">

              {/* Role Tabs */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 mb-6 rounded-xl bg-slate-100">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleChange(r.id)}
                      aria-pressed={isSelected}
                      className={`flex flex-col items-center justify-center min-h-[52px] py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/70'
                          : 'text-slate-500 hover:text-dark-900 hover:bg-white/60'
                      }`}
                    >
                      <Icon size={16} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                      <span className="mt-1 text-[11px] leading-tight text-center">{r.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Header */}
              <div className="mb-6 flex items-start gap-3.5">
                <div className="icon-tile bg-blue-50 text-blue-600 shrink-0">
                  <RoleIcon size={22} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-dark-900">
                    {selectedRole === 'admin' && 'Admin Command Center'}
                    {selectedRole === 'president' && 'President Sign In'}
                    {selectedRole === 'vice_president' && 'Vice President Sign In'}
                    {selectedRole === 'faculty' && 'Faculty Coordinator Sign In'}
                    {selectedRole === 'referee' && 'Referee Terminal Sign In'}
                    {selectedRole === 'student' && 'Sign in to your account'}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedRole === 'student'
                      ? 'Enter your Roll Number or College Email to continue.'
                      : `Enter your ${ROLES.find(r => r.id === selectedRole)?.label} credentials.`}
                  </p>
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl mb-5 text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="break-words">{errorMsg}</span>
                      {unverifiedData && (
                        <div className="mt-2.5 pt-2 border-t border-red-200/80">
                          <Link
                            to="/forgot-password"
                            state={{ email: unverifiedData.email || email }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-xs"
                          >
                            Set Password & Verify Now →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={submitHandler} className="space-y-4">

                {/* Identifier */}
                <div>
                  <label htmlFor="login-identifier" className="label">
                    {selectedRole === 'student' ? 'Roll Number / College Email / Username' : 'Full Name / Official Email / Username'}
                  </label>
                  <input
                    id="login-identifier"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={selectedRole === 'student' ? 'e.g. 23CS012 or student@college.edu' : 'e.g. Anubhav Singh or faculty@campus.edu'}
                    required
                    className="input py-3"
                  />
                </div>

                {/* Password / Secret Code */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label htmlFor="login-password" className="label mb-0">
                      {selectedRole === 'student' ? 'Password' : 'Password or Secret Code'}
                    </label>
                    {selectedRole === 'student' && (
                      <Link to="/forgot-password" state={{ email }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      autoComplete="new-password"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={selectedRole === 'student' ? 'Enter your password' : 'Enter password or secret code'}
                      required
                      className="input py-3 pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : `Sign In as ${ROLES.find(r => r.id === selectedRole)?.label}`}
                </button>
              </form>

              {/* Footer */}
              <p className="text-center text-sm text-slate-500 mt-7">
                New student?{' '}
                <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Create an Account
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
