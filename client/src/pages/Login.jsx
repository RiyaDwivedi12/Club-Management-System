import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';

import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      setCredentials(res.data);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Invalid credentials');
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] p-4">
      <div className="soft-card p-8 w-full max-w-md mt-10">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 flex justify-center items-center gap-2">
          Sign In
        </h2>
        
        {errorMsg && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-sm font-medium">{errorMsg}</div>}
        
        <form onSubmit={submitHandler}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Email Address</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-full font-bold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-soft-purple hover:-translate-y-1 hover:shadow-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-500 font-medium">
          Don't have an account? <Link to="/register" className="text-primary-600 hover:underline font-bold">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
