import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { 
  User, Mail, Shield, Book, Award, Activity, Loader2, Camera, CheckCircle, 
  Gamepad2, GraduationCap, Calendar, Users, CheckSquare, Trophy, Key, 
  ArrowRight, Lock, Server, Radio, ShieldCheck, Vote, CreditCard, ChevronRight,
  Eye, Download, Receipt, Building2, CheckCircle2, Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import CertificateTemplate from '../components/CertificateTemplate';
import PaymentReceiptModal from '../components/PaymentReceiptModal';

const Profile = () => {
  const { user, setCredentials } = useAuthStore();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [studentCertificates, setStudentCertificates] = useState([]);
  const [selectedCertForPreview, setSelectedCertForPreview] = useState(null);
  const [studentPayments, setStudentPayments] = useState([]);
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState(null);
  const [studentActiveTab, setStudentActiveTab] = useState('clubs');
  const [adminStats, setAdminStats] = useState({
    totalClubs: 0,
    totalUsers: 0,
    totalEvents: 0,
    pendingEvents: 0
  });
  const fileInputRef = useRef(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchProfileData = async () => {
      try {
        const profileRes = await axios.get('/api/auth/profile', { withCredentials: true });
        setCredentials({ ...user, ...profileRes.data });

        const currentRole = profileRes.data?.role || user?.role;

        if (currentRole === 'admin') {
          try {
            const [analyticsRes, eventsRes] = await Promise.all([
              axios.get('/api/analytics', { withCredentials: true }),
              axios.get('/api/events')
            ]);
            const pending = (eventsRes.data || []).filter(e => e.approvalStatus === 'pending').length;
            setAdminStats({
              totalClubs: analyticsRes.data?.metrics?.totalClubs ?? profileRes.data?.totalClubs ?? 0,
              totalUsers: analyticsRes.data?.metrics?.totalUsers ?? profileRes.data?.totalUsers ?? 0,
              totalEvents: analyticsRes.data?.metrics?.totalEvents ?? profileRes.data?.totalEvents ?? 0,
              pendingEvents: pending ?? profileRes.data?.pendingEvents ?? 0
            });
          } catch (e) {
            setAdminStats({
              totalClubs: profileRes.data?.totalClubs || 0,
              totalUsers: profileRes.data?.totalUsers || 0,
              totalEvents: profileRes.data?.totalEvents || 0,
              pendingEvents: profileRes.data?.pendingEvents || 0
            });
          }
        } else if (currentRole === 'student') {
          const [memRes, certRes, payRes] = await Promise.all([
            axios.get('/api/student/memberships', { withCredentials: true }).catch(() => ({ data: [] })),
            axios.get('/api/certificates/my-certificates', { withCredentials: true }).catch(() => ({ data: [] })),
            axios.get('/api/payments/my-payments', { withCredentials: true }).catch(() => ({ data: [] }))
          ]);
          setMemberships(memRes.data || []);
          setStudentCertificates(certRes.data || []);
          setStudentPayments(payRes.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile details');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?._id, navigate, setCredentials]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" size={48} /></div>;
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    const formData = new FormData();
    formData.append('profilePic', file);

    setUploading(true);
    try {
      const res = await axios.post('/api/auth/profile-pic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      
      setCredentials({ ...user, profilePicture: res.data.profilePicture });
      toast.success('Profile picture updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';
  const isPresident = user?.role === 'president';
  const isReferee = user?.role === 'referee';
  const isStudent = user?.role === 'student' || (!isAdmin && !isFaculty && !isPresident && !isReferee);

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      {/* Profile Header Banner */}
      <div className={`mb-8 p-8 md:p-10 rounded-[32px] text-white relative overflow-hidden shadow-2xl transition-all ${
        isAdmin 
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 border border-purple-500/20' 
          : 'bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 border-white/50 backdrop-blur-md overflow-hidden transition-all duration-300 group-hover:border-white shadow-xl ${uploading ? 'opacity-50' : ''}`}>
              {(user?.profilePicture && user.profilePicture !== 'default.jpg') ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={56} className="text-white drop-shadow-md" />
              )}
            </div>
            
            {/* Hover overlay for upload */}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {uploading ? <Loader2 className="animate-spin text-white" size={28} /> : <Camera className="text-white" size={28} />}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-md">{user?.name}</h1>
              {isAdmin && (
                <span className="self-center md:self-auto px-3 py-1 bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-black uppercase tracking-wider rounded-full backdrop-blur-sm">
                  Super Administrator
                </span>
              )}
            </div>

            <p className="text-purple-100 font-medium flex items-center justify-center md:justify-start gap-2 mb-4 text-base md:text-lg">
              <Mail size={18} /> {user?.email}
              {user?.username && <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-mono">@{user.username}</span>}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/20 rounded-full text-sm font-bold backdrop-blur-md shadow-sm border border-white/30">
                <Shield size={16} />
                <span className="capitalize tracking-wide">{user?.role}</span>
              </div>

              {isStudent && user?.department && (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/20 rounded-full text-sm font-bold backdrop-blur-md shadow-sm border border-white/30">
                  <GraduationCap size={16} />
                  <span className="tracking-wide">{user.department} - Year {user.year}</span>
                </div>
              )}

              {user?.isVerified && (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-500/20 rounded-full text-sm font-bold backdrop-blur-md shadow-sm border border-green-400/30 text-green-50">
                  <CheckCircle size={16} />
                  <span className="tracking-wide">Verified</span>
                </div>
              )}

              {isAdmin && (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/20 rounded-full text-sm font-bold backdrop-blur-md shadow-sm border border-amber-400/30 text-amber-100">
                  <Lock size={16} />
                  <span className="tracking-wide">Root Access</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Launch Button for Admin */}
          {isAdmin && (
            <div className="hidden lg:block">
              <Link 
                to="/admin" 
                className="flex items-center gap-2 px-6 py-3.5 bg-white text-slate-900 font-black rounded-2xl hover:bg-purple-50 transition-all hover:scale-105 shadow-xl"
              >
                <ShieldCheck size={18} className="text-purple-600" />
                <span>Admin Panel</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
        
        {/* Admin Stats Bar */}
        {isAdmin && (
          <div className="relative z-10 mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-center gap-2 text-purple-200 mb-1 font-bold text-xs uppercase tracking-wider">
                <Users size={16} /> Clubs Managed
              </div>
              <div className="text-3xl font-black">{adminStats.totalClubs || user?.totalClubs || 0}</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-center gap-2 text-purple-200 mb-1 font-bold text-xs uppercase tracking-wider">
                <Shield size={16} /> Total Users
              </div>
              <div className="text-3xl font-black">{adminStats.totalUsers || user?.totalUsers || 0}</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-center gap-2 text-purple-200 mb-1 font-bold text-xs uppercase tracking-wider">
                <Calendar size={16} /> Active Events
              </div>
              <div className="text-3xl font-black">{adminStats.totalEvents || user?.totalEvents || 0}</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-center gap-2 text-purple-200 mb-1 font-bold text-xs uppercase tracking-wider">
                <CheckSquare size={16} /> Pending Approvals
              </div>
              <div className={`text-3xl font-black ${(adminStats.pendingEvents || user?.pendingEvents) > 0 ? 'text-amber-300' : 'text-white'}`}>
                {adminStats.pendingEvents || user?.pendingEvents || 0}
              </div>
            </div>
          </div>
        )}

        {/* Student Stats Bar */}
        {isStudent && (
          <div className="relative z-10 mt-8 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all">
              <div className="flex items-center justify-center gap-2 text-primary-100 mb-1 font-bold text-xs uppercase tracking-wider">
                <Book size={16} /> Clubs Joined
              </div>
              <div className="text-3xl font-black">{user?.clubsJoined || memberships.length || 0}</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all">
              <div className="flex items-center justify-center gap-2 text-primary-100 mb-1 font-bold text-xs uppercase tracking-wider">
                <Receipt size={16} /> Paid Receipts
              </div>
              <div className="text-3xl font-black text-emerald-300">
                {studentPayments.filter(p => p.status === 'success' || p.status === 'Paid').length}
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all">
              <div className="flex items-center justify-center gap-2 text-primary-100 mb-1 font-bold text-xs uppercase tracking-wider">
                <Gamepad2 size={16} /> Games Played
              </div>
              <div className="text-3xl font-black">{user?.gamesPlayed || 0}</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all">
              <div className="flex items-center justify-center gap-2 text-primary-100 mb-1 font-bold text-xs uppercase tracking-wider">
                <Award size={16} /> Certificates
              </div>
              <div className="text-3xl font-black">{studentCertificates.length}</div>
            </div>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform pointer-events-none"></div>
        <div className="absolute right-40 -bottom-20 w-48 h-48 bg-purple-400 opacity-20 rounded-full blur-2xl transform pointer-events-none"></div>
      </div>

      {/* ADMIN SPECIFIC PROFILE VIEW */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Admin Authorities & Command Shortcuts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Platform Governance Matrix Card */}
            <div className="soft-card p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
                  <ShieldCheck size={24} className="text-primary-600" /> Administrative Governance
                </h2>
                <span className="text-xs font-black px-3 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-200">
                  Full Root Privileges
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-6">
                Your administrative profile manages campus clubs, user authorizations, event life-cycles, and competitive sport operations across the entire platform.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5 hover:bg-slate-100/70 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Club & Leadership Oversight</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Create clubs, assign faculty advisors, and appoint student presidents.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5 hover:bg-slate-100/70 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <CheckSquare size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Event Approvals & Overrides</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Review club event proposals, sanction venues, or exercise administrative overrides.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5 hover:bg-slate-100/70 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Sports & Tournament Director</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Design tournament knockout brackets, schedule fixtures, and assign referees.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5 hover:bg-slate-100/70 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Vote size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Campus Election Board</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Supervise election timelines, certify candidates, and audit live vote integrity.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5 hover:bg-slate-100/70 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Recruitment & Dues Policy</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Toggle university recruitment seasons and regulate membership dues.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5 hover:bg-slate-100/70 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Key size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Administrator Accounts</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Provision co-administrators and issue privileged security codes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Command Center (Direct Administrative Navigation) */}
            <div className="soft-card p-6 md:p-8">
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2.5">
                <Activity size={24} className="text-primary-600" /> Admin Command Center
              </h2>
              <p className="text-sm text-gray-500 font-medium mb-6">
                Fast-track shortcuts to frequently used administrative modules:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Link 
                  to="/admin?tab=club" 
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-primary-50/60 hover:border-primary-200 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                      <Users size={18} />
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm group-hover:text-primary-700">Create Club</div>
                    <div className="text-xs text-gray-500 mt-0.5">Register new student body</div>
                  </div>
                </Link>

                <Link 
                  to="/admin?tab=approvals" 
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-amber-50/60 hover:border-amber-200 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <CheckSquare size={18} />
                    </div>
                    {(adminStats.pendingEvents || user?.pendingEvents) > 0 ? (
                      <span className="text-xs bg-amber-500 text-white font-black px-2 py-0.5 rounded-full">
                        {adminStats.pendingEvents || user?.pendingEvents} Pending
                      </span>
                    ) : (
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm group-hover:text-amber-700">Event Approvals</div>
                    <div className="text-xs text-gray-500 mt-0.5">Sanction or reject events</div>
                  </div>
                </Link>

                <Link 
                  to="/admin?tab=match" 
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-blue-50/60 hover:border-blue-200 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <Trophy size={18} />
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm group-hover:text-blue-700">Schedule Match</div>
                    <div className="text-xs text-gray-500 mt-0.5">Assign teams and referees</div>
                  </div>
                </Link>

                <Link 
                  to="/admin?tab=recruitment" 
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-rose-50/60 hover:border-rose-200 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                      <CreditCard size={18} />
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm group-hover:text-rose-700">Recruitment Window</div>
                    <div className="text-xs text-gray-500 mt-0.5">Open/close membership fee</div>
                  </div>
                </Link>

                <Link 
                  to="/admin?tab=settings&section=roles" 
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-purple-50/60 hover:border-purple-200 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                      <Key size={18} />
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm group-hover:text-purple-700">Roles & Privileges</div>
                    <div className="text-xs text-gray-500 mt-0.5">Delegate permissions & provision staff</div>
                  </div>
                </Link>

                <Link 
                  to="/admin?tab=settings" 
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-blue-50/60 hover:border-blue-200 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <Shield size={18} />
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm group-hover:text-blue-700">Settings & Appearance</div>
                    <div className="text-xs text-gray-500 mt-0.5">Profile credentials & dark mode</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Security Credentials & Platform Health */}
          <div className="space-y-6">
            {/* Account & Security Card */}
            <div className="soft-card p-6">
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <Lock size={20} className="text-primary-600" /> Admin Security Profile
              </h2>

              <div className="space-y-4">
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Privilege Tier</span>
                  <div className="text-sm font-black text-gray-900 mt-0.5 flex items-center gap-1.5">
                    <Shield size={16} className="text-purple-600" /> Tier 1 (Master Admin)
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Account Identifier</span>
                  <div className="text-sm font-bold text-gray-900 font-mono mt-0.5">
                    {user?.username || 'admin'}
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Official Email</span>
                  <div className="text-sm font-bold text-gray-900 mt-0.5 truncate">
                    {user?.email}
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Security Protection</span>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
                    <CheckCircle size={15} /> MFA & Secret Key Guarded
                  </div>
                </div>

                {user?.createdAt && (
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Registered Since</span>
                    <div className="text-sm font-bold text-gray-700 mt-0.5">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Platform Live Diagnostics Card */}
            <div className="soft-card p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700">
              <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                <Server size={20} className="text-primary-400" /> Platform Diagnostics
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-700/60">
                  <span className="text-slate-400 font-medium">Server API</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Port 5000 (Active)
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-700/60">
                  <span className="text-slate-400 font-medium">Database</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle size={14} /> MongoDB Connected
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-700/60">
                  <span className="text-slate-400 font-medium">Realtime Engine</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Radio size={14} /> Socket.io Live
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 font-medium">Active Policy</span>
                  <span className="text-xs font-bold text-purple-300">
                    SuperAdmin Full
                  </span>
                </div>
              </div>

              <Link 
                to="/admin" 
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                <span>Launch Admin Panel</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FACULTY / COORDINATOR PROFILE VIEW */}
      {isFaculty && (
        <div className="soft-card p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck size={24} className="text-primary-600" /> Faculty Coordinator Profile
            </h2>
            <Link to="/coordinator" className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700">
              Go to Coordinator Dashboard
            </Link>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            You are registered as a Faculty Advisor. You supervise student clubs, review activity proposals, and approve official campus events.
          </p>
        </div>
      )}

      {/* PRESIDENT PROFILE VIEW */}
      {isPresident && (
        <div className="soft-card p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Trophy size={24} className="text-primary-600" /> Club President Profile
            </h2>
            <Link to="/president" className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700">
              Go to President Dashboard
            </Link>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            You are registered as a Club President. You manage club memberships, organize club events, submit proposals, and monitor student participation.
          </p>
        </div>
      )}

      {/* STUDENT PROFILE VIEW (DEFAULT) */}
      {isStudent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="soft-card p-6">
              {/* Student Section Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-5">
                <div className="flex gap-2">
                  <button
                    onClick={() => setStudentActiveTab('clubs')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      studentActiveTab === 'clubs'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Book size={15} />
                    <span>My Clubs & Memberships</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                      {memberships.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setStudentActiveTab('payments')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      studentActiveTab === 'payments'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Receipt size={15} />
                    <span>Payment Receipts</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                      {studentPayments.length}
                    </span>
                  </button>
                </div>

                <span className="text-[11px] font-bold text-slate-400">
                  {studentActiveTab === 'clubs' ? 'Active Registrations' : 'Official Ledgers'}
                </span>
              </div>

              {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 font-bold text-sm">{error}</div>}

              {/* TAB 1: CLUBS & MEMBERSHIP STATUS */}
              {studentActiveTab === 'clubs' && (
                <>
                  {memberships.length > 0 ? (
                    <div className="space-y-4">
                      {memberships.map((mem) => {
                        const clubPayment = studentPayments.find(
                          p => (p.clubId?._id === mem.clubId?._id || p.clubId === mem.clubId?._id) && (p.status === 'success' || p.status === 'Paid')
                        ) || (user?.paymentStatus && studentPayments.length > 0 ? studentPayments[0] : null);

                        return (
                          <div key={mem._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-teal-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-teal-700 font-black">
                                {mem.clubId?.logo ? (
                                  <img src={mem.clubId.logo} alt={mem.clubId.name} className="w-full h-full object-cover" />
                                ) : (
                                  mem.clubId?.name?.charAt(0)
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link to={`/clubs/${mem.clubId?._id}`} className="font-bold text-gray-900 text-base hover:text-teal-600 transition truncate block">
                                  {mem.clubId?.name}
                                </Link>
                                <p className="text-xs text-gray-500">
                                  Joined on {new Date(mem.createdAt).toLocaleDateString()} • {mem.clubId?.category || 'Student Club'}
                                </p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${
                                mem.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'
                              }`}>
                                {mem.status}
                              </div>
                            </div>

                            {/* Club Payment Record Card */}
                            {clubPayment ? (
                              <div className="mt-3.5 p-3 bg-emerald-50/90 rounded-xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                    <ShieldCheck size={14} />
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-slate-800">Fee Paid: ₹{clubPayment.amount}</span>
                                    <span className="text-slate-500 ml-2 font-mono text-[11px]">
                                      #{clubPayment.receiptNumber || `RCP-${(clubPayment._id || '').slice(-6).toUpperCase()}`}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                                    {clubPayment.paymentMethod || 'Razorpay / UPI'}
                                  </span>
                                  <button
                                    onClick={() => setSelectedReceiptForPreview({
                                      ...clubPayment,
                                      clubId: mem.clubId,
                                      userId: user
                                    })}
                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                                  >
                                    <Receipt size={12} className="text-teal-400" />
                                    <span>View Receipt</span>
                                  </button>
                                </div>
                              </div>
                            ) : mem.clubId?.joinFee === 0 ? (
                              <div className="mt-2.5 px-3 py-1.5 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between text-xs text-teal-800 font-medium">
                                <span>Free Club Membership</span>
                                <span className="text-[11px] font-bold text-teal-600">No dues required</span>
                              </div>
                            ) : (
                              <div className="mt-2.5 px-3 py-2 bg-amber-50/70 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-900 font-medium">
                                <span>Membership Dues: ₹{mem.clubId?.joinFee || 500}</span>
                                <Link 
                                  to={`/clubs/${mem.clubId?._id}`}
                                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline"
                                >
                                  Complete Payment →
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 opacity-70">
                      <Activity size={44} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 font-bold">You haven't joined any clubs yet.</p>
                      <Link to="/clubs" className="inline-block mt-3 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition">
                        Explore Campus Clubs
                      </Link>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: DETAILED PAYMENT RECEIPTS & INVOICES */}
              {studentActiveTab === 'payments' && (
                <div className="space-y-3">
                  {studentPayments.length > 0 ? (
                    studentPayments.map((pmt) => (
                      <div 
                        key={pmt._id} 
                        className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:shadow-xs transition-all space-y-2.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <Receipt size={18} />
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 text-sm">
                                {pmt.clubId?.name || 'Institutional Club Membership Fee'}
                              </h4>
                              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                                Receipt #{pmt.receiptNumber || `RCP-${pmt._id.slice(-6).toUpperCase()}`}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-base text-emerald-600 block">
                              ₹{Number(pmt.amount || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md uppercase">
                              {pmt.status || 'Paid'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                            <span>
                              Mode: <strong className="text-slate-700">{pmt.paymentMethod || 'Razorpay'}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(pmt.createdAt || pmt.date || Date.now()).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            {pmt.offlineNotes && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 italic truncate max-w-[200px]" title={pmt.offlineNotes}>
                                  {pmt.offlineNotes}
                                </span>
                              </>
                            )}
                          </div>

                          <button
                            onClick={() => setSelectedReceiptForPreview({
                              ...pmt,
                              userId: pmt.userId || user
                            })}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          >
                            <Receipt size={13} className="text-teal-400" />
                            <span>View / Print Receipt</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200">
                      <Receipt size={40} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-700 font-bold text-sm">No payment receipts on file yet</p>
                      <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                        When you pay club membership dues online or your fees are recorded by the campus admin, your verified institutional receipts will appear right here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="col-span-1 space-y-6">
            <div className="soft-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Award size={24} className="text-teal-600" /> Certificates ({studentCertificates.length})
                </h2>
                <Link to="/certificates" className="text-xs font-bold text-teal-600 hover:underline">
                  All Credentials
                </Link>
              </div>

              {studentCertificates.length > 0 ? (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {studentCertificates.map(cert => (
                    <div key={cert._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-teal-200 transition-all">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            <Trophy size={16} />
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-800">
                            {cert.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold">
                          {new Date(cert.issueDate).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="font-bold text-gray-900 text-sm leading-snug">
                        {cert.title || cert.tournamentId?.name || 'Tournament Championship'}
                      </h4>

                      {cert.teamName && (
                        <div className="text-xs text-teal-600 font-semibold mt-1">
                          Team/Class: {cert.teamName}
                        </div>
                      )}

                      {cert.issuedByName && (
                        <div className="text-[11px] text-gray-500 mt-1">
                          Sanctioned by: {cert.issuedByName}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-200/60">
                        <button
                          onClick={() => setSelectedCertForPreview({
                            ...cert,
                            userName: user?.name,
                            roll_no: cert.roll_no || user?.roll_no,
                            department: cert.department || user?.department,
                            year: cert.year || user?.year,
                            tournamentName: cert.title || cert.tournamentId?.name
                          })}
                          className="flex-1 py-1.5 px-3 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 flex items-center justify-center gap-1 transition-colors"
                        >
                          <Eye size={13} /> View
                        </button>
                        <a
                          href={`/api/certificates/${cert._id}/download`}
                          download={`Certificate-${(user?.name || 'Student').replace(/\s+/g, '_')}.pdf`}
                          className="py-1.5 px-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 flex items-center justify-center gap-1 transition-colors"
                          title="Download PDF"
                        >
                          <Download size={13} /> PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 opacity-70 bg-gray-50 rounded-2xl p-4">
                  <Award size={36} className="mx-auto text-teal-500 mb-2" />
                  <p className="text-gray-800 font-bold text-sm">No certificates yet</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Certificates issued by your Club President, Teacher, or Admin for your match victories will appear right here!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Preview Modal */}
      {selectedCertForPreview && (
        <CertificateTemplate
          cert={selectedCertForPreview}
          onClose={() => setSelectedCertForPreview(null)}
        />
      )}

      {/* Payment Receipt Voucher Modal */}
      {selectedReceiptForPreview && (
        <PaymentReceiptModal
          receipt={selectedReceiptForPreview}
          student={user}
          onClose={() => setSelectedReceiptForPreview(null)}
        />
      )}
    </div>
  );
};

export default Profile;
