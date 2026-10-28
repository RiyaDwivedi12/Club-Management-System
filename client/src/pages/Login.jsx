import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Shield, Crown, Award, GraduationCap, Timer, Building2, Check } from 'lucide-react';
import axios from 'axios';

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

  const fieldClass = 'w-full px-4 py-3 text-sm rounded-xl border-2 border-slate-200 bg-white text-gray-900 font-medium placeholder-gray-400 outline-none transition-all focus:border-teal-600 focus:ring-[3px] focus:ring-teal-600/10';

  return (
    <div className="min-h-[calc(100vh-70px)] w-full flex items-center justify-center bg-gray-50 px-4 py-8 md:py-12">
      <div className="w-full max-w-xl">

        {/* Role Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-xs border border-gray-100 mb-4 grid grid-cols-3 sm:grid-cols-6 gap-1">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleChange(r.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} className={isSelected ? 'text-white' : 'text-gray-400'} />
                <span className="mt-1 text-[11px] leading-tight text-center">{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 sm:p-8 md:p-10">

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 text-teal-600 mb-3">
              {selectedRole === 'admin' && <Shield size={24} />}
              {selectedRole === 'president' && <Crown size={24} />}
              {selectedRole === 'vice_president' && <Award size={24} />}
              {selectedRole === 'faculty' && <Building2 size={24} />}
              {selectedRole === 'referee' && <Timer size={24} />}
              {selectedRole === 'student' && <GraduationCap size={24} />}
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
              {selectedRole === 'admin' && 'Admin Command Center'}
              {selectedRole === 'president' && 'President Sign In'}
              {selectedRole === 'vice_president' && 'Vice President Sign In'}
              {selectedRole === 'faculty' && 'Faculty Coordinator Sign In'}
              {selectedRole === 'referee' && 'Referee Terminal Sign In'}
              {selectedRole === 'student' && 'Sign in to your account'}
            </h2>
            <p className="text-sm font-medium text-gray-500">
              {selectedRole === 'student' 
                ? 'Enter your student credentials to continue.' 
                : `Enter your ${ROLES.find(r => r.id === selectedRole)?.label} credentials or secret code.`}
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl mb-5 text-sm font-semibold bg-red-50 text-red-700 border border-red-200">
              <div className="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{errorMsg}</span>
              </div>
              {isOffline && (
                <div className="mt-3 pt-3 border-t border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-xs font-medium text-red-700">Backend server is offline</span>
                  <button
                    type="button"
                    onClick={handleOfflineBypass}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    ⚡ Enter {selectedRole === 'admin' ? 'Admin Panel' : 'Dashboard'} in Demo Mode
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submitHandler} className="space-y-4">

            {/* Identifier */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {selectedRole === 'student' ? 'Roll Number / Email / Username' : 'Official Email / Username'}
              </label>
              <input
                id="login-identifier"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'student' ? 'e.g. 23CS012 or student@college.edu' : `${selectedRole}@campus.edu`}
                required
                className={fieldClass}
              />
            </div>

            {/* Class + Section (Only for student) */}
            {selectedRole === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Class / Year</label>
                  <input
                    id="student-class"
                    type="text"
                    maxLength={20}
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="e.g. 3rd Year"
                    required
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Section</label>
                  <input
                    id="student-section"
                    type="text"
                    maxLength={10}
                    value={studentSection}
                    onChange={(e) => setStudentSection(e.target.value)}
                    placeholder="e.g. A, B, C"
                    required
                    className={`${fieldClass} uppercase`}
                  />
                </div>
              </div>
            )}

            {/* Password / Secret Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-gray-700">
                  {selectedRole === 'student' ? 'Password' : 'Password or Secret Code'}
                </label>
                {selectedRole === 'student' && (
                  <Link to="/forgot-password" state={{ email }}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
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
                  className={`${fieldClass} pr-12`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Quick Demo Helper Hint */}
            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-teal-800 font-semibold truncate">
                <Shield size={14} className="text-teal-600 shrink-0" />
                <span className="truncate">
                  Demo: <span className="font-bold underline">{selectedRole}@campus.edu</span> / code: <span className="font-mono font-bold">{ROLES.find(r => r.id === selectedRole)?.defaultCode}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => autofillDemo(selectedRole)}
                  className="text-[11px] font-extrabold text-teal-700 hover:text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs transition cursor-pointer"
                >
                  Autofill
                </button>
                <button
                  type="button"
                  onClick={handleOfflineBypass}
                  title="Direct 1-click access without waiting for backend"
                  className="text-[11px] font-extrabold text-white bg-teal-700 hover:bg-teal-800 active:scale-95 px-2.5 py-1 rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1"
                >
                  Direct Entry ⚡
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-white text-sm tracking-wide transition-all bg-teal-600 hover:bg-teal-700 shadow-[0_4px_14px_rgba(13,148,136,0.35)] disabled:bg-slate-400 disabled:shadow-none disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing In...
                </>
              ) : `Sign In as ${ROLES.find(r => r.id === selectedRole)?.label}`}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm font-medium text-gray-500 mt-7">
            New student?{' '}
            <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700 transition-colors">
              Create an Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
