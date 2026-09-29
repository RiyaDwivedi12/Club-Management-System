import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      toast.success(res.data.message || 'OTP sent successfully!');
      // Pass the email in state so the next page can use it
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to send OTP');
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex bg-white absolute top-[80px] left-0 z-50">
      
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/login" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-primary-600 mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Sign In
          </Link>
          
          <h2 className="text-4xl font-black mb-2 text-gray-900 tracking-tight">
            Forgot Password
          </h2>
          <p className="text-gray-500 font-medium mb-8">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>

          {errorMsg && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-sm font-medium">{errorMsg}</div>}

          <form onSubmit={submitHandler}>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Email Address</label>
              <input 
                type="email" 
                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-[0_8px_20px_-8px_rgba(79,70,229,0.5)] hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.6)]"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        </motion.div>
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
            <KeyRound size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">Secure your<br/>Account.</h1>
          <p className="text-primary-100 text-lg font-medium leading-relaxed">
            Lost your password? No worries. We'll help you get back on track in a few steps.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
