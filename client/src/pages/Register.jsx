import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Mail, User as UserIcon, Lock, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [roll_no, setRollNo] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const navigate = useNavigate();
  const setCredentials = useAuthStore((state) => state.setCredentials);

  useEffect(() => {
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const submitDetails = async (e) => {
    e.preventDefault();
    if (role === 'student' && (!roll_no || !department || !year)) {
      toast.error('Please fill all student details');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { name, username, email, role, secretCode, roll_no, department, year });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const submitOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }
    setLoading(true);
    setOtpError(false);
    try {
      await axios.post('/api/auth/verify-otp', { email, otp });
      setOtpSuccess(true);
      toast.success('Email verified successfully!');
      setTimeout(() => {
        setStep(3);
      }, 1000); // give time for success animation
    } catch (err) {
      setOtpError(true);
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setTimeout(() => setOtpError(false), 500); // reset shake
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { name, username, email, role, secretCode });
      toast.success('A new OTP has been sent!');
      setResendTimer(30);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/setup-password', { email, otp, password });
      const user = res.data;
      setCredentials(user);
      toast.success('Registration complete!');
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'president') {
        navigate('/president');
      } else if (user.role === 'faculty') {
        navigate('/coordinator');
      } else if (user.role === 'referee') {
        navigate('/referee');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex bg-white absolute top-[80px] left-0 z-50">
      
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-start p-8 lg:p-16 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-primary-600 mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Home
          </Link>
          
          <h2 className="text-4xl font-black mb-2 text-gray-900 tracking-tight">
            Create Account
          </h2>
          <p className="text-gray-500 font-medium mb-8">Join the ultimate student platform today.</p>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2 rounded-full"></div>
            <div className={`absolute top-1/2 left-0 h-1 bg-primary-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
            
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= s ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-200 text-gray-500'}`}>
                {s}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            <form onSubmit={submitDetails}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Username</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">College Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-8">
                <label className="block text-gray-700 font-medium mb-2">Role</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow bg-white text-gray-900"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                  <option value="president">Club President</option>
                </select>
              </div>
              
              {role === 'student' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Roll No</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900"
                      value={roll_no}
                      onChange={(e) => setRollNo(e.target.value)}
                      required={role === 'student'}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Year</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required={role === 'student'}
                      min="1"
                      max="5"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-700 font-medium mb-2">Department</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required={role === 'student'}
                    />
                  </div>
                </div>
              )}

              {['admin', 'faculty', 'president'].includes(role) && (
                <div className="mb-8">
                  <label className="block text-gray-700 font-medium mb-2">Registration Secret Code</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    required
                    placeholder="Enter the secret code for this role"
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-[0_8px_20px_-8px_rgba(79,70,229,0.5)] hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.6)]"
              >
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>
            </form>
            <p className="mt-8 text-center text-gray-500 font-medium">
              Already have an account? <Link to="/login" className="text-primary-600 hover:underline font-bold">Sign In</Link>
            </p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Enter OTP</h2>
            <p className="text-gray-500 mb-6">
              We've sent a 6-digit code to <span className="font-bold text-gray-800">{email}</span>.
            </p>
            <form onSubmit={submitOTP}>
              <div className="relative">
                <motion.input 
                  animate={otpError ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  type="text" 
                  maxLength="6"
                  placeholder="000000"
                  className={`w-full px-4 py-4 mb-6 text-center text-3xl tracking-[0.5em] font-mono border-2 rounded-xl focus:outline-none transition-all text-gray-900 ${otpError ? 'border-red-500 bg-red-50 text-red-600' : otpSuccess ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20'}`}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={otpSuccess}
                />
                <AnimatePresence>
                  {otpSuccess && (
                    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute right-4 top-1/2 -translate-y-[calc(50%+12px)] text-green-500">
                      <CheckCircle2 size={28} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                type="submit" 
                disabled={loading || otp.length !== 6 || otpSuccess}
                className={`w-full text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 mb-4 ${otpSuccess ? 'bg-green-500' : 'bg-primary-600 hover:bg-primary-700 shadow-[0_8px_20px_-8px_rgba(79,70,229,0.5)] hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.6)]'}`}
              >
                {loading ? 'Verifying...' : otpSuccess ? 'Verified!' : 'Verify OTP'}
              </button>
            </form>
            <button 
              onClick={handleResend}
              disabled={loading || resendTimer > 0 || otpSuccess}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} />}
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 flex justify-center items-center gap-2">
              Set Password
            </h2>
            <form onSubmit={submitPassword}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                />
              </div>
              <div className="mb-8">
                <label className="block text-gray-700 font-medium mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="6"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-[0_8px_20px_-8px_rgba(79,70,229,0.5)] hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.6)]"
              >
                {loading ? 'Setting Password...' : 'Finish Setup'}
              </button>
            </form>
          </motion.div>
        )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right side: Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 overflow-hidden items-center justify-center p-12">
        {/* Animated gradients background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-600 to-primary-900"></div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 text-white max-w-lg text-center"
        >
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20">
            <UserIcon size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">Join the<br/>Community.</h1>
          <p className="text-primary-100 text-lg font-medium leading-relaxed">
            Create your account to start managing your clubs, events, and matches in seconds.
          </p>
        </motion.div>
      </div>

    </div>
  );
};

export default Register;
