import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setCredentials = useAuthStore((state) => state.setCredentials);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In production, configure axios base URL globally
      const res = await axios.post('/api/auth/login', { email, password });
      setCredentials(res.data);
      toast.success('Logged in successfully');
      navigate('/'); // Redirect to dashboard based on role later
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-[70vh]">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={submitHandler}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-center">
          New Student? <Link to="/register" className="text-blue-600 hover:underline">Register Here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
