import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield, Crown, Award, GraduationCap, Timer, Building2, AlertCircle, Zap } from 'lucide-react';
import axios from 'axios';
import { AuthBrandPanel, MobileLogo } from '../components/auth/AuthLayout';

const ROLES = [
  { id: 'student', label: 'Student', icon: GraduationCap, defaultCode: 'student' },
  { id: 'president', label: 'President', icon: Crown, defaultCode: 'president123' },
  { id: 'vice_president', label: 'Vice President', icon: Award, defaultCode: 'vp123' },
  { id: 'faculty', label: 'Faculty', icon: Building2, defaultCode: 'faculty123' },
  { id: 'referee', label: 'Referee', icon: Timer, defaultCode: 'referee123' },
  { id: 'admin', label: 'Admin', icon: Shield, defaultCode: 'admin123' },
];

const Login = () => {
  const { user, setCredentials } = useAuthStore();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentSection, setStudentSection] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const handleOfflineBypass = () => {
    const roleProfiles = {
      admin: {
        _id: 'admin_demo_id',
        name: 'Admin Controller',
        email: email.trim() || 'admin@campus.edu',
        role: 'admin',
        isReferee: false,
        profilePicture: 'default.jpg',
        roll_no: 'ADM001',
        department: 'Administration',
        year: 1,
        course: 'Admin',
        section: 'A',
        clubMemberships: []
      },
      president: {
        _id: 'president_demo_id',
        name: 'Club President',
        email: email.trim() || 'president@campus.edu',
        role: 'president',
        isReferee: false,
        profilePicture: 'default.jpg',
        roll_no: 'PRES001',
        department: 'Computer Science',
        year: 4,
        course: 'B.Tech',
        section: 'A',
        clubMemberships: []
      },
      vice_president: {
        _id: 'vp_demo_id',
        name: 'Vice President',
        email: email.trim() || 'vicepresident@campus.edu',
        role: 'vice_president',
        isReferee: false,
        profilePicture: 'default.jpg',
        roll_no: 'VP001',
        department: 'Information Technology',
        year: 3,
        course: 'B.Tech',
        section: 'A',
        clubMemberships: []
      },
      faculty: {
        _id: 'faculty_demo_id',
        name: 'Dr. Faculty Coordinator',
        email: email.trim() || 'faculty@campus.edu',
        role: 'faculty',
        isReferee: false,
        profilePicture: 'default.jpg',
        roll_no: 'FAC001',
        department: 'Sports & Cultural Affairs',
        year: 1,
        course: 'Faculty',
        section: 'A',
        clubMemberships: []
      },
      referee: {
        _id: 'referee_demo_id',
        name: 'Official Referee',
        email: email.trim() || 'referee@campus.edu',
        role: 'referee',
        isReferee: true,
        profilePicture: 'default.jpg',
        roll_no: 'REF001',
        department: 'Athletics Board',
        year: 1,
        course: 'Referee',
        section: 'A',
        clubMemberships: []
      },
      student: {
        _id: 'student_demo_id',
        name: 'Alex Student',
        email: email.trim() || 'student@college.edu',
        role: 'student',
        isReferee: false,
        profilePicture: 'default.jpg',
        roll_no: email.trim() || '23CS012',
        department: 'Computer Science',
        year: 3,
        course: studentClass || '3rd Year',
        section: studentSection || 'A',
        clubMemberships: []
      }
    };

    const targetUser = roleProfiles[selectedRole] || roleProfiles.admin;
    setCredentials(targetUser);
    toast.success(`Entered Demo Mode as ${targetUser.name}!`);
    if (selectedRole === 'admin') navigate('/admin');
    else if (selectedRole === 'president') navigate('/president');
    else if (selectedRole === 'vice_president') navigate('/vice-president');
    else if (selectedRole === 'faculty') navigate('/faculty');
    else if (selectedRole === 'referee') navigate('/referee');
    else navigate('/clubs');
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'president') navigate('/president');
      else if (user.role === 'vice_president') navigate('/vice-president');
      else if (user.role === 'faculty') navigate('/faculty');
      else if (user.role === 'referee') navigate('/referee');
      else navigate('/clubs');
    }
  }, [user, navigate]);

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setErrorMsg(null);
  };

  const autofillDemo = (roleId) => {
    setSelectedRole(roleId);
    setErrorMsg(null);
    if (roleId === 'student') {
      setEmail('23CS012');
      setPassword('admin123');
      setStudentClass('3rd Year');
      setStudentSection('A');
    } else if (roleId === 'president') {
      setEmail('president@campus.edu');
      setPassword('president123');
    } else if (roleId === 'vice_president') {
      setEmail('vicepresident@campus.edu');
      setPassword('vp123');
    } else if (roleId === 'faculty') {
      setEmail('faculty@campus.edu');
      setPassword('faculty123');
    } else if (roleId === 'referee') {
      setEmail('referee@campus.edu');
      setPassword('referee123');
    } else if (roleId === 'admin') {
      setEmail('admin@campus.edu');
      setPassword('admin123');
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (selectedRole === 'student') {
        if (!studentClass.trim()) {
          setErrorMsg('Please enter your class / year.');
          setLoading(false);
          return;
        }
        if (!studentSection.trim()) {
          setErrorMsg('Please enter your section.');
          setLoading(false);
          return;
        }
      }

      const payload = {
        email: email.trim(),
        identifier: email.trim(),
        password,
        secretCode: password, // For privileged roles, password acts as secret code if matching
        role: selectedRole,
      };

      if (selectedRole === 'student') {
        payload.studentClass = studentClass.trim();
        payload.studentSection = studentSection.trim().toUpperCase();
      }

      const res = await axios.post('/api/auth/login', payload);
      const user = res.data;
      setCredentials(user);
      toast.success(`Welcome, ${user.name || 'User'}!`);

      // Smart redirection based on role
      const actualRole = user.role || selectedRole;
      if (actualRole === 'admin') {
        navigate('/admin');
      } else if (actualRole === 'president') {
        navigate('/president');
      } else if (actualRole === 'vice_president') {
        navigate('/vice-president');
      } else if (actualRole === 'faculty') {
        navigate('/faculty');
      } else if (actualRole === 'referee') {
        navigate('/referee');
      } else {
        navigate('/clubs');
      }
    } catch (err) {
      let msg = err?.response?.data?.message;
      const rawData = typeof err?.response?.data === 'string' ? err.response.data : '';
      const isConnError = rawData.includes('ECONNREFUSED') || rawData.includes('connect') || err?.message?.includes('Network Error');
      if (isConnError || err?.code === 'ERR_NETWORK' || !err?.response || err?.response?.status >= 500) {
        setIsOffline(true);
        msg = 'Backend server on port 5000 is not running (ECONNREFUSED). Please run "npm run server" or click Direct Entry.';
      } else if (!msg) {
        msg = 'Invalid credentials. Please verify your details.';
      }
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const RoleIcon = ROLES.find(r => r.id === selectedRole)?.icon || GraduationCap;

  return (
    <div className="w-full max-w-6xl mx-auto lg:min-h-[calc(100vh-8.5rem)] flex items-start lg:items-center py-2 sm:py-6 lg:py-0">
      <div className="w-full lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:rounded-3xl lg:overflow-hidden lg:bg-white lg:border lg:border-slate-200/70 lg:shadow-card">
        <AuthBrandPanel
          title="Welcome back to"
          highlight="your campus clubs."
          text="Sign in to manage clubs, events, tournaments and elections from a dashboard built for your role."
          points={[
            'Role-based dashboards for students, leaders, faculty, referees and admins',
            'Event passes, QR attendance and live match scores',
            'Secret-ballot club elections and verifiable certificates',
          ]}
        />

        <div className="min-w-0 w-full max-w-lg mx-auto lg:max-w-none flex flex-col justify-center">
          <MobileLogo />

          {/* Card */}
          <div className="card p-5 sm:p-8 lg:rounded-none lg:border-0 lg:shadow-none lg:px-10 lg:py-10 xl:px-14">
            <div className="lg:max-w-lg lg:mx-auto">

              {/* Role Tabs */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 mb-6 rounded-xl bg-slate-100">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleChange(r.id)}
                      aria-pressed={isSelected}
                      className={`flex flex-col items-center justify-center min-h-[52px] py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/70'
                          : 'text-slate-500 hover:text-dark-900 hover:bg-white/60'
                      }`}
                    >
                      <Icon size={16} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                      <span className="mt-1 text-[11px] leading-tight text-center">{r.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Header */}
              <div className="mb-6 flex items-start gap-3.5">
                <div className="icon-tile bg-blue-50 text-blue-600 shrink-0">
                  <RoleIcon size={22} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-dark-900">
                    {selectedRole === 'admin' && 'Admin Command Center'}
                    {selectedRole === 'president' && 'President Sign In'}
                    {selectedRole === 'vice_president' && 'Vice President Sign In'}
                    {selectedRole === 'faculty' && 'Faculty Coordinator Sign In'}
                    {selectedRole === 'referee' && 'Referee Terminal Sign In'}
                    {selectedRole === 'student' && 'Sign in to your account'}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedRole === 'student'
                      ? 'Enter your student credentials to continue.'
                      : `Enter your ${ROLES.find(r => r.id === selectedRole)?.label} credentials or secret code.`}
                  </p>
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl mb-5 text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span className="break-words min-w-0">{errorMsg}</span>
                  </div>
                  {isOffline && (
                    <div className="mt-3 pt-3 border-t border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-xs font-medium text-red-700">Backend server is offline</span>
                      <button
                        type="button"
                        onClick={handleOfflineBypass}
                        className="btn-danger btn-sm"
                      >
                        <Zap size={13} /> Enter {selectedRole === 'admin' ? 'Admin Panel' : 'Dashboard'} in Demo Mode
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Form */}
              <form onSubmit={submitHandler} className="space-y-4">

                {/* Identifier */}
                <div>
                  <label htmlFor="login-identifier" className="label">
                    {selectedRole === 'student' ? 'Roll Number / Email / Username' : 'Official Email / Username'}
                  </label>
                  <input
                    id="login-identifier"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={selectedRole === 'student' ? 'e.g. 23CS012 or student@college.edu' : `${selectedRole}@campus.edu`}
                    required
                    className="input py-3"
                  />
                </div>

                {/* Class + Section (Only for student) */}
                {selectedRole === 'student' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <label htmlFor="student-class" className="label">Class / Year</label>
                      <input
                        id="student-class"
                        type="text"
                        maxLength={20}
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        placeholder="e.g. 3rd Year"
                        required
                        className="input py-3"
                      />
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="student-section" className="label">Section</label>
                      <input
                        id="student-section"
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
                )}

                {/* Password / Secret Code */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label htmlFor="login-password" className="label mb-0">
                      {selectedRole === 'student' ? 'Password' : 'Password or Secret Code'}
                    </label>
                    {selectedRole === 'student' && (
                      <Link to="/forgot-password" state={{ email }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        selectedRole === 'student'
                          ? 'Enter your password'
                          : `Enter password or ${ROLES.find(r => r.id === selectedRole)?.defaultCode}`
                      }
                      required
                      className="input py-3 pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Quick Demo Helper Hint */}
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs text-blue-800 font-medium min-w-0">
                    <Shield size={14} className="text-blue-600 shrink-0" />
                    <span className="truncate">
                      Demo: <span className="font-semibold underline">{selectedRole}@campus.edu</span> / code: <span className="font-mono font-semibold">{ROLES.find(r => r.id === selectedRole)?.defaultCode}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => autofillDemo(selectedRole)}
                      className="btn-secondary btn-sm"
                    >
                      Autofill
                    </button>
                    <button
                      type="button"
                      onClick={handleOfflineBypass}
                      title="Direct 1-click access without waiting for backend"
                      className="btn-primary btn-sm"
                    >
                      Direct Entry <Zap size={12} />
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : `Sign In as ${ROLES.find(r => r.id === selectedRole)?.label}`}
                </button>
              </form>

              {/* Footer */}
              <p className="text-center text-sm text-slate-500 mt-7">
                New student?{' '}
                <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Create an Account
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
