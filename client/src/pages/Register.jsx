import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle, RefreshCw, GraduationCap, Check } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { AuthBrandPanel, MobileLogo } from '../components/auth/AuthLayout';

// ── Step indicator ────────────────────────────────────────────────────
const steps = ['Account Info', 'Verify Email', 'Set Password'];

const StepBar = ({ current }) => (
  <div className="flex items-center mb-6">
    {steps.map((label, i) => {
      const idx = i + 1;
      const done = idx < current;
      const active = idx === current;
      return (
        <div key={label} className="flex items-center flex-1 last:flex-none min-w-0">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done || active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              } ${active ? 'ring-4 ring-blue-100' : ''}`}
            >
              {done ? <Check size={14} strokeWidth={3} /> : idx}
            </div>
            <span
              className={`text-[10px] sm:text-[11px] font-semibold mt-1.5 whitespace-nowrap ${
                done || active ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1.5 sm:mx-2 mb-5 rounded-full ${done ? 'bg-blue-600' : 'bg-slate-200'}`} />
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
    if (loading) return;
    if (!rollNo || !department || !year) {
      toast.error('Please fill in all student details.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        name: name.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        role: 'student',
        roll_no: rollNo.trim().toUpperCase(),
        department: department.trim(),
        year: Number(year),
        studentClass: studentClass.trim(),
        studentSection: studentSection.trim().toUpperCase(),
      });
      toast.success('Verification code sent to your email!');
      setResendTimer(60);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitOTP = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits.');
      return;
    }
    setLoading(true);
    setOtpError(false);
    try {
      await axios.post('/api/auth/verify-otp', { email: email.trim().toLowerCase(), otp: otp.trim() });
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
    if (loading || resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/resend-verification', { email: email.trim().toLowerCase() });
      toast.success(res.data?.message || 'New OTP sent to your email!');
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

  const strengthColor = (i) =>
    password.length >= i * 3
      ? i <= 1 ? 'bg-red-500' : i === 2 ? 'bg-amber-500' : i === 3 ? 'bg-emerald-500' : 'bg-blue-600'
      : 'bg-slate-200';

  const passwordMismatch = confirmPassword && password !== confirmPassword;

  const otpStateClass = otpError
    ? 'border-red-400 bg-red-50 text-red-700 ring-4 ring-red-100 focus:border-red-400 focus:ring-red-100'
    : otpSuccess
    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100'
    : '';

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-6xl mx-auto lg:min-h-[calc(100vh-8.5rem)] flex items-start lg:items-center py-2 sm:py-6 lg:py-0">
      <div className="w-full lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:rounded-3xl lg:overflow-hidden lg:bg-white lg:border lg:border-slate-200/70 lg:shadow-card">
        <AuthBrandPanel
          title="Join CampusHub."
          highlight="Get into your clubs."
          text="Create your student account with your roll number and verify your college email with a one-time code."
          points={[
            'Browse campus clubs and request membership',
            'Get event passes and check in with a QR scan',
            'Vote in club elections and download your certificates',
          ]}
        />

        <div className="min-w-0 w-full max-w-lg mx-auto lg:max-w-none flex flex-col justify-center">
          <MobileLogo />

          {/* Card */}
          <div className="card p-5 sm:p-8 lg:rounded-none lg:border-0 lg:shadow-none lg:px-10 lg:py-10 xl:px-14">
            <div className="lg:max-w-lg lg:mx-auto">
              {/* Header */}
              <div className="mb-6 flex items-start gap-3.5">
                <div className="icon-tile bg-blue-50 text-blue-600 shrink-0">
                  <GraduationCap size={22} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-dark-900">
                    {step === 1 && 'Create Student Account'}
                    {step === 2 && 'Verify Your Email'}
                    {step === 3 && 'Set Your Password'}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500 break-words">
                    {step === 1 && 'Join your campus clubs and events as a student'}
                    {step === 2 && `Enter the 6-digit code sent to ${email}`}
                    {step === 3 && 'Choose a secure password for your account'}
                  </p>
                </div>
              </div>

              {/* Step bar */}
              <StepBar current={step} />

              {/* ── STEP 1: Account Details ─────────────────────────── */}
              {step === 1 && (
                <form onSubmit={submitDetails} className="space-y-4">
                  {/* Name + Username */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div className="min-w-0">
                      <label className="label">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Riya Dwivedi"
                        required
                        className="input py-3"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="label">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. riya_d"
                        required
                        className="input py-3"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="label">College Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@college.edu"
                      required
                      className="input py-3"
                    />
                  </div>

                  {/* Roll No + Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div className="min-w-0">
                      <label className="label">Roll Number</label>
                      <input
                        type="text"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        placeholder="e.g. 23CS012"
                        required
                        className="input py-3"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="label">Year of Study</label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="1 – 5"
                        required
                        min="1"
                        max="5"
                        className="input py-3"
                      />
                    </div>
                  </div>

                  {/* Class + Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div className="min-w-0">
                      <label className="label">Class / Course</label>
                      <input
                        type="text"
                        maxLength={25}
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        placeholder="e.g. B.Tech CSE 3rd Year"
                        required
                        className="input py-3"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="label">Section</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={studentSection}
                        onChange={(e) => setStudentSection(e.target.value)}
                        placeholder="e.g. A, B, C"
                        required
                        className="input py-3 uppercase"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="label">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      required
                      className="input py-3"
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
                        Sending Verification Code...
                      </>
                    ) : (
                      <>Continue to Verification <ArrowRight size={16} /></>
                    )}
                  </button>

                  <p className="text-center text-sm text-slate-500 pt-2">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                      Sign in here
                    </Link>
                  </p>
                </form>
              )}

              {/* ── STEP 2: OTP Verification ────────────────────────── */}
              {step === 2 && (
                <form onSubmit={submitOTP} className="space-y-4">
                  <div>
                    <label htmlFor="otp-input" className="label text-center mb-2">
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
                      className={`input py-4 text-center text-2xl sm:text-3xl tracking-[0.45em] sm:tracking-[0.55em] font-mono ${otpStateClass}`}
                    />
                    {otpSuccess && (
                      <div className="flex items-center justify-center gap-2 mt-2 text-sm font-semibold text-emerald-700">
                        <CheckCircle size={16} /> Email verified successfully!
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6 || otpSuccess}
                    className={`${otpSuccess ? 'btn-success' : 'btn-primary'} w-full py-3`}
                  >
                    {loading ? 'Verifying...' : otpSuccess ? 'Verified!' : 'Verify Email'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading || resendTimer > 0 || otpSuccess}
                    className="btn-secondary w-full py-3"
                  >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1.5 py-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <ArrowLeft size={14} /> Edit account details
                    </button>
                  </div>
                </form>
              )}

              {/* ── STEP 3: Set Password ────────────────────────────── */}
              {step === 3 && (
                <form onSubmit={submitPassword} className="space-y-4">
                  <div>
                    <label className="label">Create Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        autoComplete="new-password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        required
                        minLength={6}
                        className="input py-3 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${strengthColor(i)}`} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        autoComplete="new-password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        minLength={6}
                        className={`input py-3 pr-12 ${passwordMismatch ? 'border-red-400 ring-4 ring-red-100 focus:border-red-400 focus:ring-red-100' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordMismatch && (
                      <p className="text-xs font-semibold mt-1.5 text-red-600">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 !mt-6"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Account...
                      </>
                    ) : 'Complete Registration'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
