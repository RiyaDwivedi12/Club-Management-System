import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Mail, User as UserIcon, Lock, RefreshCw } from 'lucide-react';

const Register = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submitDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/registerUser', { name, email, role });
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
    try {
      await axios.post('/api/auth/verifyOTP', { email, otp });
      toast.success('Email verified successfully!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await axios.post('/api/auth/registerUser', { name, email, role });
      toast.success('A new OTP has been sent!');
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
      await axios.post('/api/auth/setupPassword', { email, password });
      toast.success('Registration complete! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] p-4">
      <div className="bg-white p-8 rounded-[32px] shadow-soft w-full max-w-md mt-10 transition-all duration-300">
        
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 flex justify-center items-center gap-2">
              Create Account
            </h2>
            <form onSubmit={submitDetails}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">College Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-8">
                <label className="block text-gray-700 font-medium mb-2">Role</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow bg-white"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                  <option value="president">Club President</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 rounded-full font-bold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-soft-purple hover:-translate-y-1 hover:shadow-lg"
              >
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>
            </form>
            <p className="mt-6 text-center text-gray-500 font-medium">
              Already have an account? <Link to="/login" className="text-primary-600 hover:underline font-bold">Sign In</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Enter OTP</h2>
            <p className="text-gray-500 mb-6">
              We've sent a 6-digit code to <span className="font-bold text-gray-800">{email}</span>.
            </p>
            <form onSubmit={submitOTP}>
              <input 
                type="text" 
                maxLength="6"
                placeholder="000000"
                className="w-full px-4 py-3 mb-6 text-center text-2xl tracking-[0.5em] font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
              <button 
                type="submit" 
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary-600 text-white py-3 rounded-full font-bold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-soft-purple mb-4"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
            <button 
              onClick={handleResend}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-full transition-colors mb-4"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} />}
              Resend OTP
            </button>
          </div>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 flex justify-center items-center gap-2">
              Set Password
            </h2>
            <form onSubmit={submitPassword}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="6"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 rounded-full font-bold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-soft-purple"
              >
                {loading ? 'Setting Password...' : 'Finish Setup'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
