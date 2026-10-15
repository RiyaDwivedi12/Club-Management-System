import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { LogIn, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [loginRole, setLoginRole] = useState('student');
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
        password: loginRole === 'student' ? password : undefined, 
        secretCode: loginRole !== 'student' ? secretCode : undefined,
        role: loginRole 
      });
      const user = res.data;
      setCredentials(user);
      toast.success('Login successful!');
      
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'president') navigate('/president');
      else if (user.role === 'faculty') navigate('/coordinator');
      else if (user.role === 'referee') navigate('/referee');
      else navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Invalid credentials');
      toast.error(err?.response?.data?.message || 'Invalid credentials');
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
          <Link to="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-primary-600 mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Home
          </Link>
          
          <h2 className="text-4xl font-black mb-2 text-gray-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-gray-500 font-medium mb-8">Please enter your details to sign in.</p>

        <div className="flex bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
          {['student', 'faculty', 'president', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg capitalize transition-colors ${
                loginRole === r 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setLoginRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
        
        {errorMsg && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-sm font-medium">{errorMsg}</div>}
        
        <form onSubmit={submitHandler}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              {loginRole === 'student' ? 'Student Roll Number (from ID card), Email, or Username' : 'Email Address or Username'}
            </label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={loginRole === 'student' ? 'e.g. 23CS012 or dwivedi@college.edu' : 'Enter email or username'}
              required
            />
          </div>
          
          {loginRole === 'student' ? (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Secret Code</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                required
                placeholder={`Enter ${loginRole} secret code`}
              />
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
              <Link to="/forgot-password" state={{ email }} className="text-sm text-primary-600 hover:underline font-medium">Forgot Password?</Link>
            </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-[0_8px_20px_-8px_rgba(79,70,229,0.5)] hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.6)] flex justify-center items-center"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-8 text-center text-gray-500 font-medium">
          Don't have an account? <Link to="/register" className="text-primary-600 hover:underline font-bold">Join the club</Link>
        </p>
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
            <LogIn size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">Your Campus.<br/>Your Clubs.</h1>
          <p className="text-primary-100 text-lg font-medium leading-relaxed">
            Manage everything from events and memberships to elections and live matches in one unified ecosystem.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
