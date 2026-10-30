import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthBrandPanel, MobileLogo } from '../components/auth/AuthLayout';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // We expect the email and optional instant OTP to be passed from the ForgotPassword page
  const initialEmail = location.state?.email || '';
  const initialOtp = location.state?.otp || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(initialOtp);
  const [directOtp, setDirectOtp] = useState(initialOtp);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password
      });
      toast.success(res.data.message || 'Password reset successfully!');
      navigate('/login');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to reset password');
      toast.error(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto lg:min-h-[calc(100vh-8.5rem)] flex items-start lg:items-center py-2 sm:py-6 lg:py-0">
      <div className="w-full lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:min-h-[560px] lg:rounded-3xl lg:overflow-hidden lg:bg-white lg:border lg:border-slate-200/70 lg:shadow-card">
        <AuthBrandPanel
          title="Almost there."
          highlight="Set a new password."
          text="Use the code we emailed you to choose a new password and regain access to your clubs and events."
          points={[
            'Enter the 6-digit code sent to your email',
            'Choose and confirm your new password',
            'Sign in again with your new password',
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
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Sign In
              </Link>

              <div className="mb-6 flex items-start gap-3.5">
                <div className="icon-tile bg-blue-50 text-blue-600 shrink-0">
                  <Lock size={22} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-dark-900">
                    Reset Password
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter the OTP sent to your email and your new password.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl mb-5 text-sm font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="break-words min-w-0">{errorMsg}</span>
                </div>
              )}

              {directOtp && (
                <div className="mb-4 p-3.5 bg-blue-50/90 border border-blue-200/90 rounded-2xl flex items-center justify-between gap-3 text-left">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                      Instant Reset Code
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Valid for 15 mins. Code auto-filled below.
                    </div>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-200 font-mono text-lg font-black text-blue-900 tracking-wider shadow-xs">
                    {directOtp}
                  </div>
                </div>
              )}

              <form onSubmit={submitHandler} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="label">Email Address</label>
                  <input
                    id="reset-email"
                    type="text"
                    className={`input py-3 ${initialEmail ? 'bg-slate-50 text-slate-600' : ''}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!!initialEmail}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="reset-otp" className="label">OTP (6 Digits)</label>
                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    className="input py-3 tracking-[0.4em] text-center text-2xl font-mono"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    placeholder="000000"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="reset-password" className="label">New Password</label>
                  <input
                    id="reset-password"
                    type="password"
                    className="input py-3"
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="reset-confirm" className="label">Confirm New Password</label>
                  <input
                    id="reset-confirm"
                    type="password"
                    className="input py-3"
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 !mt-6"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : 'Reset Password'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-7">
                Didn't get a code?{' '}
                <Link to="/forgot-password" state={{ email }} className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Request a new one
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
