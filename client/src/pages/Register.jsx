import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowLeft, CheckCircle, RefreshCw, GraduationCap } from 'lucide-react';
import useAuthStore from '../store/authStore';

// ── Shared input style helper ────────────────────────────────────────
const inputClass =
  'w-full px-4 py-3 text-sm rounded-xl border-2 bg-white text-gray-900 font-medium placeholder-gray-400 outline-none transition-all';
const inputStyle = { borderColor: '#e2e8f0' };
const onFocus = (e) => {
  e.target.style.borderColor = '#0d9488';
  e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.1)';
};
const onBlur = (e) => {
  e.target.style.borderColor = '#e2e8f0';
  e.target.style.boxShadow = 'none';
};

// ── Step indicator ────────────────────────────────────────────────────
const steps = ['Account Info', 'Verify Email', 'Set Password'];

const StepBar = ({ current }) => (
  <div className="flex items-center gap-0 mb-6">
    {steps.map((label, i) => {
      const idx = i + 1;
      const done = idx < current;
      const active = idx === current;
      return (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all"
              style={{
                background: done ? '#0d9488' : active ? '#0d9488' : '#f1f5f9',
                color: done || active ? '#fff' : '#94a3b8',
                boxShadow: active ? '0 0 0 4px rgba(13,148,136,0.15)' : 'none',
              }}
            >
              {done ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l4 4 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : idx}
            </div>
            <span
              className="text-[10px] font-bold mt-1.5 whitespace-nowrap"
              style={{ color: active ? '#0d9488' : done ? '#0d9488' : '#94a3b8' }}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="flex-1 h-0.5 mx-2 mb-4"
              style={{ background: done ? '#0d9488' : '#e2e8f0' }}
            />
          )}
        </div>
      );
    })}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────
const Register = () => {
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentSection, setStudentSection] = useState('');

  // Step 2 fields
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Step 3 fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setCredentials = useAuthStore((state) => state.setCredentials);

  // Resend timer countdown
  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [step, resendTimer]);

  // ── Handlers ──────────────────────────────────────────────────────
  const submitDetails = async (e) => {
    e.preventDefault();
    if (!rollNo || !department || !year) {
      toast.error('Please fill in all student details.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        name,
        username,
        email,
        role: 'student',
        roll_no: rollNo,
        department,
        year,
        studentClass: studentClass.trim(),
        studentSection: studentSection.trim().toUpperCase(),
      });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits.');
      return;
    }
    setLoading(true);
    setOtpError(false);
    try {
      await axios.post('/api/auth/verify-otp', { email, otp });
      setOtpSuccess(true);
      toast.success('Email verified!');
      setTimeout(() => setStep(3), 900);
    } catch (err) {
      setOtpError(true);
      toast.error(err.response?.data?.message || 'Invalid OTP. Try again.');
      setTimeout(() => setOtpError(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await axios.post('/api/auth/resend-verification', { email });
      toast.success('New OTP sent!');
      setResendTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/setup-password', { email, otp, password });
      setCredentials(res.data);
      toast.success('Registration complete! Welcome to CampusHub 🎓');
      navigate('/clubs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-70px)] w-full flex items-center justify-center bg-gray-50 px-4 py-8 md:py-12">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 text-teal-600 mb-3">
              <GraduationCap size={26} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
              {step === 1 && 'Create Student Account'}
              {step === 2 && 'Verify Your Email'}
              {step === 3 && 'Set Your Password'}
            </h2>
            <p className="text-sm font-medium text-gray-500">
              {step === 1 && 'Join your campus clubs and events as a student'}
              {step === 2 && `Enter the 6-digit code sent to ${email}`}
              {step === 3 && 'Choose a secure password for your account'}
            </p>
          </div>

          {/* Step bar */}
          <StepBar current={step} />

          {/* ── STEP 1: Account Details ─────────────────────────── */}
          {step === 1 && (
            <form onSubmit={submitDetails} className="space-y-4">
              {/* Name + Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Riya Dwivedi"
                    required
                    className={inputClass}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. riya_d"
                    required
                    className={inputClass}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">College Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  required
                  className={inputClass}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              {/* Roll No + Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Roll Number</label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="e.g. 23CS012"
                    required
                    className={inputClass}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Year of Study</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="1 – 5"
                    required
                    min="1"
                    max="5"
                    className={inputClass}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>

              {/* Class + Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Class / Course</label>
                  <input
                    type="text"
                    maxLength={25}
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="e.g. B.Tech CSE 3rd Year"
                    required
                    className={inputClass}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Section</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={studentSection}
                    onChange={(e) => setStudentSection(e.target.value)}
                    placeholder="e.g. A, B, C"
                    required
                    className={`${inputClass} uppercase`}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  required
                  className={inputClass}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: '#0d9488', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = '#0f766e';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = '#0d9488';
                }}
              >
                {loading ? 'Sending Verification Code...' : 'Continue to Verification →'}
              </button>

              <div className="text-center pt-3">
                <span className="text-sm text-gray-500 font-medium">Already have an account? </span>
                <Link to="/login" className="text-sm font-bold text-teal-600 hover:text-teal-700">
                  Sign in here
                </Link>
              </div>
            </form>
          )}

          {/* ── STEP 2: OTP Verification ────────────────────────── */}
          {step === 2 && (
            <form onSubmit={submitOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="● ● ● ● ● ●"
                  required
                  disabled={otpSuccess}
                  className="w-full px-4 py-4 text-center text-3xl tracking-[0.55em] font-mono rounded-xl border-2 outline-none transition-all"
                  style={{
                    borderColor: otpError ? '#ef4444' : otpSuccess ? '#10b981' : '#e2e8f0',
                    background: otpError ? '#fef2f2' : otpSuccess ? '#f0fdf4' : '#fff',
                    color: otpError ? '#b91c1c' : otpSuccess ? '#166534' : '#0f172a',
                    boxShadow: otpError
                      ? '0 0 0 3px rgba(239,68,68,0.15)'
                      : otpSuccess
                      ? '0 0 0 3px rgba(16,185,129,0.15)'
                      : 'none',
                  }}
                  onFocus={(e) => {
                    if (!otpError && !otpSuccess) {
                      e.target.style.borderColor = '#0d9488';
                      e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!otpError && !otpSuccess) {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                {otpSuccess && (
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm font-semibold" style={{ color: '#166534' }}>
                    <CheckCircle size={16} /> Email verified successfully!
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || otpSuccess}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: otpSuccess ? '#10b981' : '#0d9488', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}
              >
                {loading ? 'Verifying...' : otpSuccess ? 'Verified!' : 'Verify Email'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendTimer > 0 || otpSuccess}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border border-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300 text-gray-600"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-gray-500 hover:text-teal-600 transition-colors"
                >
                  ← Edit account details
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: Set Password ────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={submitPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Create Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    className={`${inputClass} pr-12`}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{
                          background:
                            password.length >= i * 3
                              ? i <= 1 ? '#ef4444' : i === 2 ? '#f59e0b' : i === 3 ? '#10b981' : '#0d9488'
                              : '#e2e8f0',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    autoComplete="new-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    className={`${inputClass} pr-12`}
                    style={{
                      borderColor: confirmPassword && password !== confirmPassword ? '#ef4444' : '#e2e8f0',
                      boxShadow: confirmPassword && password !== confirmPassword ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
                    }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs font-semibold mt-1.5 text-red-500">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: '#0d9488', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = '#0f766e';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = '#0d9488';
                }}
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
