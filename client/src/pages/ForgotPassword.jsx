import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthBrandPanel, MobileLogo } from '../components/auth/AuthLayout';

const ForgotPassword = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    if (loading) return;
    const cleanInput = email.trim();
    if (!cleanInput) {
      toast.error('Please enter your email address or roll number.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/auth/forgot-password', { email: cleanInput });
      toast.success(res.data.message || 'OTP sent successfully!');
      // Pass the email in state so the next page can use it
      navigate('/reset-password', { state: { email: cleanInput } });
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to send OTP');
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto lg:min-h-[calc(100vh-8.5rem)] flex items-start lg:items-center py-2 sm:py-6 lg:py-0">
      <div className="w-full lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:min-h-[560px] lg:rounded-3xl lg:overflow-hidden lg:bg-white lg:border lg:border-slate-200/70 lg:shadow-card">
        <AuthBrandPanel
          title="Lost your password?"
          highlight="We've got you."
          text="Get back into your clubs and events in a couple of quick steps."
          points={[
            'Enter the email linked to your account',
            'Receive a one-time code in your inbox',
            'Choose a new password and sign in again',
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
                  <KeyRound size={22} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-dark-900">
                    Forgot Password
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter your email address and we'll send you an OTP to reset your password.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl mb-5 text-sm font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="break-words min-w-0">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={submitHandler} className="space-y-5">
                <div>
                  <label htmlFor="forgot-email" className="label">Email Address or Roll Number</label>
                  <input
                    id="forgot-email"
                    type="text"
                    className="input py-3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. 23CS012 or student@college.edu"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending OTP...
                    </>
                  ) : 'Send OTP'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-7">
                Remembered it?{' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
