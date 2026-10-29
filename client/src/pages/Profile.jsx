import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import {
  User, Mail, Shield, Book, Award, Activity, Loader2, Camera, CheckCircle,
  Gamepad2, GraduationCap, Calendar, Users, CheckSquare, Trophy, Key,
  ArrowRight, Lock, Server, Radio, ShieldCheck, Vote, CreditCard, ChevronRight,
  Eye, Download, Receipt, Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import CertificateTemplate from '../components/CertificateTemplate';
import PaymentReceiptModal from '../components/PaymentReceiptModal';
import LoadingState from '../components/ui/LoadingState';
import StatTile from '../components/ui/StatTile';
import EmptyState from '../components/EmptyState';

// Admin governance capabilities (static descriptive copy).
const GOVERNANCE_ITEMS = [
  { icon: Users, tint: 'bg-violet-50 text-violet-600', title: 'Club & Leadership Oversight', text: 'Create clubs, assign faculty advisors, and appoint student presidents.' },
  { icon: CheckSquare, tint: 'bg-amber-50 text-amber-600', title: 'Event Approvals & Overrides', text: 'Review club event proposals, sanction venues, or exercise administrative overrides.' },
  { icon: Trophy, tint: 'bg-blue-50 text-blue-600', title: 'Sports & Tournament Director', text: 'Design tournament knockout brackets, schedule fixtures, and assign referees.' },
  { icon: Vote, tint: 'bg-emerald-50 text-emerald-600', title: 'Campus Election Board', text: 'Supervise election timelines, certify candidates, and audit live vote integrity.' },
  { icon: CreditCard, tint: 'bg-sky-50 text-sky-600', title: 'Recruitment & Dues Policy', text: 'Toggle university recruitment seasons and regulate membership dues.' },
  { icon: Key, tint: 'bg-indigo-50 text-indigo-600', title: 'Administrator Accounts', text: 'Provision co-administrators and issue privileged security codes.' },
];

// Admin quick-launch shortcuts (routes unchanged).
const COMMAND_LINKS = [
  { to: '/admin?tab=club', icon: Users, tint: 'bg-blue-50 text-blue-600', title: 'Create Club', text: 'Register new student body' },
  { to: '/admin?tab=approvals', icon: CheckSquare, tint: 'bg-amber-50 text-amber-600', title: 'Event Approvals', text: 'Sanction or reject events', pending: true },
  { to: '/admin?tab=match', icon: Trophy, tint: 'bg-indigo-50 text-indigo-600', title: 'Schedule Match', text: 'Assign teams and referees' },
  { to: '/admin?tab=recruitment', icon: CreditCard, tint: 'bg-sky-50 text-sky-600', title: 'Recruitment Window', text: 'Open/close membership fee' },
  { to: '/admin?tab=settings&section=roles', icon: Key, tint: 'bg-violet-50 text-violet-600', title: 'Roles & Privileges', text: 'Delegate permissions & provision staff' },
  { to: '/admin?tab=settings', icon: Shield, tint: 'bg-emerald-50 text-emerald-600', title: 'Settings & Appearance', text: 'Profile credentials & dark mode' },
];

const InfoRow = ({ label, children }) => (
  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">{label}</span>
    <div className="text-sm font-semibold text-dark-900 mt-0.5 min-w-0">{children}</div>
  </div>
);

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
    return <LoadingState label="Loading your profile…" />;
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

  const pendingCount = adminStats.pendingEvents || user?.pendingEvents || 0;

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 space-y-6">
      {/* Profile Header Card */}
      <section className="card overflow-hidden">
        {/* Cover */}
        <div className="relative h-28 sm:h-36 bg-brand-gradient overflow-hidden">
          <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-1/4 w-56 h-56 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
          <User size={180} strokeWidth={1} className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-white/[0.07] pointer-events-none" />
        </div>

        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 -mt-14 sm:-mt-16">
            {/* Avatar with upload */}
            <div
              className="relative group cursor-pointer self-center md:self-auto shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Change profile picture"
            >
              <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-white bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg overflow-hidden flex items-center justify-center transition-all ${uploading ? 'opacity-50' : ''}`}>
                {(user?.profilePicture && user.profilePicture !== 'default.jpg') ? (
                  <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={52} className="text-white" />
                )}
              </div>

              {/* Hover overlay for upload */}
              <div className="absolute inset-0 bg-dark-900/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {uploading ? <Loader2 className="animate-spin text-white" size={26} /> : <Camera className="text-white" size={26} />}
              </div>
              <span className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-blue-600 text-white ring-2 ring-white flex items-center justify-center shadow-md">
                {uploading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
              </span>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />
            </div>

            <div className="flex-1 min-w-0 text-center md:text-left md:pb-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-dark-900 break-words">{user?.name}</h1>
                {isAdmin && (
                  <span className="badge-indigo self-center md:self-auto">Super Administrator</span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-sm text-slate-600 min-w-0">
                <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                  <Mail size={15} className="text-slate-400 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </span>
                {user?.username && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono">@{user.username}</span>
                )}
                {user?.roll_no && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-slate-600">
                    <Hash size={13} className="text-slate-400" /> {user.roll_no}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="badge-blue">
                  <Shield size={13} />
                  <span className="capitalize">{user?.role}</span>
                </span>

                {isStudent && user?.department && (
                  <span className="badge-slate">
                    <GraduationCap size={13} />
                    <span>{user.department} - Year {user.year}</span>
                  </span>
                )}

                {user?.isVerified && (
                  <span className="badge-green">
                    <CheckCircle size={13} />
                    <span>Verified</span>
                  </span>
                )}

                {isAdmin && (
                  <span className="badge-amber">
                    <Lock size={13} />
                    <span>Root Access</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Launch Button for Admin */}
            {isAdmin && (
              <div className="hidden lg:block md:pb-1">
                <Link to="/admin" className="btn-primary">
                  <ShieldCheck size={18} />
                  <span>Admin Panel</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Admin Stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatTile icon={Users} tint="blue" label="Clubs Managed" value={adminStats.totalClubs || user?.totalClubs || 0} />
          <StatTile icon={Shield} tint="indigo" label="Total Users" value={adminStats.totalUsers || user?.totalUsers || 0} />
          <StatTile icon={Calendar} tint="sky" label="Active Events" value={adminStats.totalEvents || user?.totalEvents || 0} />
          <StatTile icon={CheckSquare} tint={pendingCount > 0 ? 'amber' : 'slate'} label="Pending Approvals" value={pendingCount} />
        </div>
      )}

      {/* Student Stats */}
      {isStudent && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatTile icon={Book} tint="blue" label="Clubs Joined" value={user?.clubsJoined || memberships.length || 0} />
          <StatTile
            icon={Receipt}
            tint="emerald"
            label="Paid Receipts"
            value={studentPayments.filter(p => p.status === 'success' || p.status === 'Paid').length}
          />
          <StatTile icon={Gamepad2} tint="indigo" label="Games Played" value={user?.gamesPlayed || 0} />
          <StatTile icon={Award} tint="amber" label="Certificates" value={studentCertificates.length} />
        </div>
      )}

      {/* ADMIN SPECIFIC PROFILE VIEW */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Admin Authorities & Command Shortcuts */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Platform Governance Matrix Card */}
            <div className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2.5">
                  <ShieldCheck size={22} className="text-blue-600" /> Administrative Governance
                </h2>
                <span className="badge-blue">Full Root Privileges</span>
              </div>
              <p className="text-sm text-slate-600 mb-5">
                Your administrative profile manages campus clubs, user authorizations, event life-cycles, and competitive sport operations across the entire platform.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOVERNANCE_ITEMS.map(({ icon: Icon, tint, title, text }) => (
                  <div key={title} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-dark-900 text-sm">{title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Command Center (Direct Administrative Navigation) */}
            <div className="card p-5 sm:p-6">
              <h2 className="text-lg font-bold text-dark-900 mb-1 flex items-center gap-2.5">
                <Activity size={22} className="text-blue-600" /> Admin Command Center
              </h2>
              <p className="text-sm text-slate-500 mb-5">
                Fast-track shortcuts to frequently used administrative modules:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {COMMAND_LINKS.map(({ to, icon: Icon, tint, title, text, pending }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-card-hover transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tint}`}>
                        <Icon size={18} />
                      </div>
                      {pending && pendingCount > 0 ? (
                        <span className="badge-amber">{pendingCount} Pending</span>
                      ) : (
                        <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-dark-900 text-sm group-hover:text-blue-700">{title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{text}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Security Credentials & Platform Health */}
          <div className="space-y-6 min-w-0">
            {/* Account & Security Card */}
            <div className="card p-5 sm:p-6">
              <h2 className="text-lg font-bold text-dark-900 mb-4 flex items-center gap-2">
                <Lock size={20} className="text-blue-600" /> Admin Security Profile
              </h2>

              <div className="space-y-3">
                <InfoRow label="Privilege Tier">
                  <span className="flex items-center gap-1.5">
                    <Shield size={16} className="text-indigo-600" /> Tier 1 (Master Admin)
                  </span>
                </InfoRow>

                <InfoRow label="Account Identifier">
                  <span className="font-mono">{user?.username || 'admin'}</span>
                </InfoRow>

                <InfoRow label="Official Email">
                  <span className="block truncate">{user?.email}</span>
                </InfoRow>

                <InfoRow label="Security Protection">
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle size={15} /> MFA & Secret Key Guarded
                  </span>
                </InfoRow>

                {user?.createdAt && (
                  <InfoRow label="Registered Since">
                    <span className="text-slate-700">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                  </InfoRow>
                )}
              </div>
            </div>

            {/* Platform Live Diagnostics Card */}
            <div className="rounded-2xl p-5 sm:p-6 bg-dark-900 text-white border border-dark-900 shadow-card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Server size={20} className="text-blue-400" /> Platform Diagnostics
              </h2>

              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/10">
                  <span className="text-slate-400">Server API</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Port 5000 (Active)
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/10">
                  <span className="text-slate-400">Database</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle size={14} /> MongoDB Connected
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/10">
                  <span className="text-slate-400">Realtime Engine</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Radio size={14} /> Socket.io Live
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-slate-400">Active Policy</span>
                  <span className="text-xs font-semibold text-blue-300">
                    SuperAdmin Full
                  </span>
                </div>
              </div>

              <Link to="/admin" className="btn-primary w-full mt-5">
                <span>Launch Admin Panel</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FACULTY / COORDINATOR PROFILE VIEW */}
      {isFaculty && (
        <div className="card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2">
              <ShieldCheck size={22} className="text-blue-600" /> Faculty Coordinator Profile
            </h2>
            <Link to="/coordinator" className="btn-primary btn-sm w-full sm:w-auto">
              Go to Coordinator Dashboard
              <ArrowRight size={15} />
            </Link>
          </div>
          <p className="text-slate-600 text-sm">
            You are registered as a Faculty Advisor. You supervise student clubs, review activity proposals, and approve official campus events.
          </p>
        </div>
      )}

      {/* PRESIDENT PROFILE VIEW */}
      {isPresident && (
        <div className="card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2">
              <Trophy size={22} className="text-blue-600" /> Club President Profile
            </h2>
            <Link to="/president" className="btn-primary btn-sm w-full sm:w-auto">
              Go to President Dashboard
              <ArrowRight size={15} />
            </Link>
          </div>
          <p className="text-slate-600 text-sm">
            You are registered as a Club President. You manage club memberships, organize club events, submit proposals, and monitor student participation.
          </p>
        </div>
      )}

      {/* STUDENT PROFILE VIEW (DEFAULT) */}
      {isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <div className="card overflow-hidden">
              {/* Student Section Tabs */}
              <div className="card-header">
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1 max-w-full">
                  <button
                    onClick={() => setStudentActiveTab('clubs')}
                    className={`tab flex items-center gap-2 ${studentActiveTab === 'clubs' ? 'tab-active' : ''}`}
                  >
                    <Book size={15} />
                    <span>My Clubs & Memberships</span>
                    <span className={`px-1.5 rounded-full text-[11px] font-semibold ${studentActiveTab === 'clubs' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                      {memberships.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setStudentActiveTab('payments')}
                    className={`tab flex items-center gap-2 ${studentActiveTab === 'payments' ? 'tab-active' : ''}`}
                  >
                    <Receipt size={15} />
                    <span>Payment Receipts</span>
                    <span className={`px-1.5 rounded-full text-[11px] font-semibold ${studentActiveTab === 'payments' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                      {studentPayments.length}
                    </span>
                  </button>
                </div>

                <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {studentActiveTab === 'clubs' ? 'Active Registrations' : 'Official Ledgers'}
                </span>
              </div>

              <div className="p-4 sm:p-5">
                {error && <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl mb-4 font-semibold text-sm">{error}</div>}

                {/* TAB 1: CLUBS & MEMBERSHIP STATUS */}
                {studentActiveTab === 'clubs' && (
                  <>
                    {memberships.length > 0 ? (
                      <div className="space-y-3">
                        {memberships.map((mem) => {
                          const clubPayment = studentPayments.find(
                            p => (p.clubId?._id === mem.clubId?._id || p.clubId === mem.clubId?._id) && (p.status === 'success' || p.status === 'Paid')
                          ) || (user?.paymentStatus && studentPayments.length > 0 ? studentPayments[0] : null);

                          return (
                            <div key={mem._id} className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-200 transition-all">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-blue-600 font-bold text-lg">
                                  {mem.clubId?.logo ? (
                                    <img src={mem.clubId.logo} alt={mem.clubId.name} className="w-full h-full object-cover" />
                                  ) : (
                                    mem.clubId?.name?.charAt(0)
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Link to={`/clubs/${mem.clubId?._id}`} className="font-bold text-dark-900 hover:text-blue-600 transition truncate block">
                                    {mem.clubId?.name}
                                  </Link>
                                  <p className="text-xs text-slate-500 truncate">
                                    Joined on {new Date(mem.createdAt).toLocaleDateString()} • {mem.clubId?.category || 'Student Club'}
                                  </p>
                                </div>
                                <span className={`shrink-0 ${mem.status === 'Approved' ? 'badge-green' : 'badge-amber'}`}>
                                  {mem.status}
                                </span>
                              </div>

                              {/* Club Payment Record Card */}
                              {clubPayment ? (
                                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                      <ShieldCheck size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-bold text-dark-900">Fee Paid: ₹{clubPayment.amount}</span>
                                      <span className="text-slate-500 ml-2 font-mono text-[11px] break-all">
                                        #{clubPayment.receiptNumber || `RCP-${(clubPayment._id || '').slice(-6).toUpperCase()}`}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                                      {clubPayment.paymentMethod || 'Razorpay / UPI'}
                                    </span>
                                    <button
                                      onClick={() => setSelectedReceiptForPreview({
                                        ...clubPayment,
                                        clubId: mem.clubId,
                                        userId: user
                                      })}
                                      className="btn-secondary btn-sm"
                                    >
                                      <Receipt size={13} className="text-blue-600" />
                                      <span>View Receipt</span>
                                    </button>
                                  </div>
                                </div>
                              ) : mem.clubId?.joinFee === 0 ? (
                                <div className="mt-3 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-800 font-medium">
                                  <span>Free Club Membership</span>
                                  <span className="text-[11px] font-semibold text-blue-600">No dues required</span>
                                </div>
                              ) : (
                                <div className="mt-3 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 font-medium">
                                  <span>Membership Dues: ₹{mem.clubId?.joinFee || 500}</span>
                                  <Link
                                    to={`/clubs/${mem.clubId?._id}`}
                                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline"
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
                      <EmptyState
                        icon={Activity}
                        title="You haven't joined any clubs yet."
                        description="Browse campus clubs and request membership to see them here."
                        action={
                          <Link to="/clubs" className="btn-primary btn-sm">
                            Explore Campus Clubs
                          </Link>
                        }
                      />
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
                          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-200 transition-all space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Receipt size={18} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-dark-900 text-sm break-words">
                                  {pmt.clubId?.name || 'Institutional Club Membership Fee'}
                                </h4>
                                <p className="text-[11px] font-mono text-slate-500 mt-0.5 break-all">
                                  Receipt #{pmt.receiptNumber || `RCP-${pmt._id.slice(-6).toUpperCase()}`}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-extrabold text-base text-emerald-600 block">
                                ₹{Number(pmt.amount || 0).toLocaleString('en-IN')}
                              </span>
                              <span className="badge-green capitalize">
                                {pmt.status || 'Paid'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-[11px] min-w-0">
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
                              className="btn-secondary btn-sm w-full sm:w-auto"
                            >
                              <Receipt size={13} className="text-blue-600" />
                              <span>View / Print Receipt</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={Receipt}
                        title="No payment receipts on file yet"
                        description="When you pay club membership dues online or your fees are recorded by the campus admin, your verified institutional receipts will appear right here."
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 min-w-0">
            <div className="card overflow-hidden">
              <div className="card-header">
                <h2 className="font-bold text-dark-900 flex items-center gap-2">
                  <Award size={20} className="text-blue-600" /> Certificates ({studentCertificates.length})
                </h2>
                <Link to="/certificates" className="text-xs font-semibold text-blue-600 hover:underline">
                  All Credentials
                </Link>
              </div>

              <div className="p-4 sm:p-5">
                {studentCertificates.length > 0 ? (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {studentCertificates.map(cert => (
                      <div key={cert._id} className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-200 transition-all">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <Trophy size={16} />
                            </div>
                            <span className="badge-slate capitalize">
                              {cert.type}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium shrink-0">
                            {new Date(cert.issueDate).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-bold text-dark-900 text-sm leading-snug break-words">
                          {cert.title || cert.tournamentId?.name || 'Tournament Championship'}
                        </h4>

                        {cert.teamName && (
                          <div className="text-xs text-blue-600 font-semibold mt-1">
                            Team/Class: {cert.teamName}
                          </div>
                        )}

                        {cert.issuedByName && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            Sanctioned by: {cert.issuedByName}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => setSelectedCertForPreview({
                              ...cert,
                              userName: user?.name,
                              roll_no: cert.roll_no || user?.roll_no,
                              department: cert.department || user?.department,
                              year: cert.year || user?.year,
                              tournamentName: cert.title || cert.tournamentId?.name
                            })}
                            className="btn-primary btn-sm flex-1"
                          >
                            <Eye size={14} /> View
                          </button>
                          <a
                            href={`/api/certificates/${cert._id}/download`}
                            download={`Certificate-${(user?.name || 'Student').replace(/\s+/g, '_')}.pdf`}
                            className="btn-secondary btn-sm"
                            title="Download PDF"
                          >
                            <Download size={14} /> PDF
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Award}
                    title="No certificates yet"
                    description="Certificates issued by your Club President, Teacher, or Admin for your match victories will appear right here!"
                    className="py-8 px-2"
                  />
                )}
              </div>
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
