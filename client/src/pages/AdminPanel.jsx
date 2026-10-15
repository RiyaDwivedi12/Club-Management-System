import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  GraduationCap, LayoutDashboard, Users, Calendar, Trophy, Vote, Award,
  CreditCard, QrCode, Building2, Bell, FileSpreadsheet, BarChart3, Shield,
  Clock, Settings, Search, ChevronDown, Moon, Plus, Wallet, ArrowUpRight,
  Lightbulb, X, Share2, Sparkles, ExternalLink, Activity, CheckSquare, Gamepad2,
  CheckCircle2, Music, Palette, BookOpen, Laptop, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import useEventStore from '../store/eventStore';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

// ChartJS for identical visual charts
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Specialized Admin Views
import StudentDirectoryView from '../components/admin/StudentDirectoryView';
import DocumentImportView from '../components/admin/DocumentImportView';
import FinanceView from '../components/admin/FinanceView';
import AttendanceQrView from '../components/admin/AttendanceQrView';
import VenueBookingView from '../components/admin/VenueBookingView';
import AuditLogsView from '../components/admin/AuditLogsView';
import AnalyticsReportsView from '../components/admin/AnalyticsReportsView';
import ApprovalCard from '../components/ApprovalCard';
import EmptyState from '../components/EmptyState';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const AdminPanel = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [showSystemTip, setShowSystemTip] = useState(true);

  // Data
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [games, setGames] = useState([]);
  const [elections, setElections] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);

  // Forms
  const [clubForm, setClubForm] = useState({ name: '', category: 'Sports', description: '', logo: '', presidentId: '', facultyId: '' });
  const [eventForm, setEventForm] = useState({ title: '', description: '', clubId: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' });
  const [matchForm, setMatchForm] = useState({ teamA: '', teamB: '', refereeId: '', date: '' });
  const [recruitmentForm, setRecruitmentForm] = useState({ clubIds: [], joinFee: 500, isAcceptingMembers: true });
  const [adminForm, setAdminForm] = useState({ name: '', username: '', email: '', secretCode: '' });
  const [gameForm, setGameForm] = useState({ name: '', type: 'team-based', description: '' });
  const [electionForm, setElectionForm] = useState({ title: '', clubId: '', startDate: '', endDate: '' });

  const { events, fetchEvents, approveEvent, rejectEvent, overrideEvent } = useEventStore();
  const [approvalNote, setApprovalNote] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(null);
  const [approvalFilter, setApprovalFilter] = useState('pending');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const switchTab = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [usersRes, clubsRes, gamesRes, electionsRes, finRes] = await Promise.all([
          axios.get('/api/auth/users', { withCredentials: true }),
          axios.get('/api/clubs'),
          axios.get('/api/games').catch(() => ({ data: [] })),
          axios.get('/api/elections').catch(() => ({ data: [] })),
          axios.get('/api/finance/analytics', { withCredentials: true }).catch(() => ({ data: null }))
        ]);
        setUsers(usersRes.data || []);
        setClubs(clubsRes.data || []);
        setGames(gamesRes.data || []);
        setElections(electionsRes.data || []);
        setFinanceSummary(finRes.data || null);
        fetchEvents();
      } catch (err) {
        toast.error('Failed to load dashboard data');
      }
    };
    fetchData();
  }, [user, navigate, fetchEvents]);

  // Handlers
  const handleCreateClub = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/clubs', clubForm, { withCredentials: true });
      toast.success('Club created successfully');
      setClubForm({ name: '', category: 'Sports', description: '', logo: '', presidentId: '', facultyId: '' });
      const clubsRes = await axios.get('/api/clubs');
      setClubs(clubsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/events', eventForm, { withCredentials: true });
      toast.success('Event created successfully');
      setEventForm({ title: '', description: '', clubId: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' });
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/matches', matchForm, { withCredentials: true });
      toast.success('Match scheduled successfully');
      setMatchForm({ teamA: '', teamB: '', refereeId: '', date: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule match');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecruitment = async (e) => {
    e.preventDefault();
    if (recruitmentForm.clubIds.length === 0) {
      return toast.error('Please select at least one club to update');
    }
    setLoading(true);
    try {
      await axios.put('/api/clubs/recruitment-phase', recruitmentForm, { withCredentials: true });
      toast.success('Recruitment phase updated!');
      const clubsRes = await axios.get('/api/clubs');
      setClubs(clubsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update recruitment');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/create-admin', adminForm, { withCredentials: true });
      toast.success('Admin created successfully! They will receive an OTP.');
      setAdminForm({ name: '', username: '', email: '', secretCode: '' });
      const usersRes = await axios.get('/api/auth/users', { withCredentials: true });
      setUsers(usersRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!gameForm.name.trim()) return toast.error('Game name is required');
    setLoading(true);
    try {
      await axios.post('/api/games', gameForm);
      toast.success('Game created successfully!');
      setGameForm({ name: '', type: 'team-based', description: '' });
      const res = await axios.get('/api/games');
      setGames(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/elections', electionForm, { withCredentials: true });
      toast.success('Election created with secret ballot protection!');
      setElectionForm({ title: '', clubId: '', startDate: '', endDate: '' });
      const res = await axios.get('/api/elections');
      setElections(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    await approveEvent(id, approvalNote);
    setApprovalNote('');
    fetchEvents();
  };

  const handleReject = async (id) => {
    if (!approvalNote) return toast.error("Please provide a reason in the note field.");
    await rejectEvent(id, approvalNote);
    setApprovalNote('');
    fetchEvents();
  };

  const handleOverride = async (id, status, reason) => {
    await overrideEvent(id, status, reason);
    setShowOverrideModal(null);
    fetchEvents();
  };

  // Line Chart Data (matching screenshot: Student Registration Trend)
  const lineChartData = {
    labels: ['Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025'],
    datasets: [
      {
        label: 'New Registrations',
        data: [350, 480, 420, 780, 820, 1120],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'Active Users',
        data: [680, 920, 890, 1180, 1480, 1530],
        borderColor: '#9333EA',
        backgroundColor: 'rgba(147, 51, 234, 0.05)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#9333EA',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        min: 0,
        max: 2000,
        ticks: {
          stepSize: 500,
          callback: (value) => value === 0 ? '0' : value.toLocaleString()
        },
        grid: { color: '#F1F5F9' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: '500' }, color: '#64748B' }
      }
    }
  };

  // Donut Chart Data (matching screenshot: Club Categories)
  const donutChartData = {
    labels: ['Sports', 'Cultural', 'Technical', 'Literary', 'Others'],
    datasets: [
      {
        data: [10, 7, 6, 3, 2],
        backgroundColor: ['#2563EB', '#9333EA', '#10B981', '#F59E0B', '#94A3B8'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { cornerRadius: 8 }
    }
  };

  // Nav items from screenshot
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'directory', label: 'User Management', icon: Users },
    { id: 'club', label: 'Clubs & Memberships', icon: Share2 },
    { id: 'event', label: 'Events & Approvals', icon: Calendar, badge: events.filter(e => e.approvalStatus === 'pending').length },
    { id: 'sports', label: 'Sports & Tournaments', icon: Trophy },
    { id: 'elections', label: 'Elections & Voting', icon: Vote },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'finance', label: 'Fees & Payments', icon: CreditCard },
    { id: 'attendance', label: 'Attendance & QR', icon: QrCode },
    { id: 'venues', label: 'Venue & Resources', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'import', label: 'Documents & Reports', icon: FileSpreadsheet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const systemNavItems = [
    { id: 'admin', label: 'Roles & Permissions', icon: Shield },
    { id: 'audit', label: 'Audit Logs', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex text-slate-800 font-sans antialiased">
      {/* 1. DARK NAVY SIDEBAR */}
      <aside className="w-64 bg-[#0B132B] text-slate-300 min-h-screen flex flex-col justify-between shrink-0 fixed left-0 top-0 bottom-0 z-40 border-r border-slate-800/60 overflow-y-auto">
        <div className="p-5">
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-white font-black text-base tracking-tight leading-none">CampusHub</h2>
              <p className="text-slate-400 text-[11px] font-semibold mt-1">College Club Management</p>
            </div>
          </div>

          {/* Main Navigation List */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => switchTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* SYSTEM section */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 px-3.5 mb-2">
              SYSTEM
            </p>
            <nav className="space-y-1">
              {systemNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => switchTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-md'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-slate-800/80">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-400">System Status</span>
          </div>
          <p className="text-[11px] font-bold text-emerald-400">All Systems Operational</p>
          <span className="text-[10px] text-slate-600 block mt-3 font-mono">v2.0.0</span>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT (LEFT PADDED TO FIT FIXED SIDEBAR) */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="bg-white border-b border-gray-100 h-16 px-8 flex items-center justify-between sticky top-0 z-30">
          {/* Global Search Bar */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/80 rounded-xl px-3.5 py-2 w-96 text-xs text-gray-400">
            <Search size={15} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search users, clubs, events, etc..."
              className="bg-transparent text-gray-700 font-medium placeholder-gray-400 focus:outline-none flex-1"
            />
            <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-500">
              Ctrl + K
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Dark Mode Moon Toggle */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
              <Moon size={18} />
            </button>

            {/* Admin User Profile */}
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                AU
              </div>
              <div>
                <p className="text-xs font-black text-gray-900 leading-tight">Admin User</p>
                <p className="text-[10px] text-gray-400 font-semibold">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* 3. DYNAMIC CONTENT WORKSPACE */}
        <main className="p-8 space-y-6">
          {/* TAB 1: EXACT MATCH TO USER'S DASHBOARD SCREENSHOT */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Greeting Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    Good Morning, Admin! <span className="text-2xl">👋</span>
                  </h1>
                  <p className="text-xs font-semibold text-gray-500 mt-1">Here's what's happening in your college today.</p>
                </div>

                <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200/90 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition">
                  <Calendar size={14} className="text-gray-500" />
                  <span>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
              </div>

              {/* Row 1: 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Students */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex items-start justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#EBF5FF] text-[#2563EB] flex items-center justify-center mb-3">
                      <Users size={22} />
                    </div>
                    <p className="text-xs font-bold text-gray-400">Total Students</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-0.5">
                      {users.filter(u => u.role === 'student').length > 0 ? (2483 + users.filter(u => u.role === 'student').length).toLocaleString() : '2,483'}
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                      <span>↗ 12%</span> <span className="text-gray-400 font-medium">vs last semester</span>
                    </p>
                  </div>
                </div>

                {/* Active Clubs */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex items-start justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center mb-3">
                      <Share2 size={22} />
                    </div>
                    <p className="text-xs font-bold text-gray-400">Active Clubs</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-0.5">
                      {clubs.length > 0 ? clubs.length : '28'}
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                      <span>↗ 8%</span> <span className="text-gray-400 font-medium">vs last semester</span>
                    </p>
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex items-start justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-3">
                      <Calendar size={22} />
                    </div>
                    <p className="text-xs font-bold text-gray-400">Upcoming Events</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-0.5">
                      {events.length > 0 ? events.length : '12'}
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                      <span>↗ 25%</span> <span className="text-gray-400 font-medium">vs last month</span>
                    </p>
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex items-start justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-3 font-bold text-lg">
                      ₹
                    </div>
                    <p className="text-xs font-bold text-gray-400">Total Revenue</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-0.5">
                      {financeSummary?.totalRevenue ? `₹ ${financeSummary.totalRevenue.toLocaleString('en-IN')}` : '₹ 2,58,750'}
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                      <span>↗ 18%</span> <span className="text-gray-400 font-medium">vs last month</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Dual Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Student Registration Trend (7 of 12 cols) */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                        <Activity size={16} className="text-blue-600" /> Student Registration Trend
                      </h4>
                      <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                        <span>Last 6 Months</span> <ChevronDown size={12} />
                      </button>
                    </div>

                    {/* Chart Sub-legend */}
                    <div className="flex items-center justify-end gap-5 text-xs font-bold text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                        <span>New Registrations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#9333EA]"></span>
                        <span>Active Users</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <Line data={lineChartData} options={lineChartOptions} />
                  </div>
                </div>

                {/* Right: Club Categories Donut (4 of 12 cols) */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-gray-900">Club Categories</h4>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                      <span>All Clubs</span> <ChevronDown size={12} />
                    </button>
                  </div>

                  {/* Donut and Legend row */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative w-36 h-36 shrink-0">
                      <Doughnut data={donutChartData} options={donutChartOptions} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-black text-gray-900">28</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Clubs</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs font-bold flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                          <span className="text-gray-600 font-medium">Sports</span>
                        </div>
                        <span className="text-gray-900">10 <span className="text-gray-400 text-[10px]">(35.7%)</span></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#9333EA]"></span>
                          <span className="text-gray-600 font-medium">Cultural</span>
                        </div>
                        <span className="text-gray-900">7 <span className="text-gray-400 text-[10px]">(25.0%)</span></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                          <span className="text-gray-600 font-medium">Technical</span>
                        </div>
                        <span className="text-gray-900">6 <span className="text-gray-400 text-[10px]">(21.4%)</span></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                          <span className="text-gray-600 font-medium">Literary</span>
                        </div>
                        <span className="text-gray-900">3 <span className="text-gray-400 text-[10px]">(10.7%)</span></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#94A3B8]"></span>
                          <span className="text-gray-600 font-medium">Others</span>
                        </div>
                        <span className="text-gray-900">2 <span className="text-gray-400 text-[10px]">(7.1%)</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Triple Columns Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Recent Activities */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-gray-900">Recent Activities</h4>
                    <button onClick={() => switchTab('audit')} className="text-xs font-bold text-blue-600 hover:underline">
                      View All
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Item 1 */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Plus size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 leading-tight">New club membership request</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">Tech Club - by Rohit Sharma (23CS012)</p>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">10m ago</span>
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Award size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 leading-tight">Certificate issued</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">Sports Club - 2 students</p>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">25m ago</span>
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 leading-tight">Event approval required</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">Cultural Fest 2025</p>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">1h ago</span>
                    </div>

                    {/* Item 4 */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Wallet size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 leading-tight">Payment received</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">Club Membership - ₹500</p>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">2h ago</span>
                    </div>

                    {/* Item 5 */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Vote size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 leading-tight">New election nomination</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">Student Council Elections</p>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">3h ago</span>
                    </div>
                  </div>
                </div>

                {/* 2. Top Clubs */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-gray-900">Top Clubs</h4>
                    <button onClick={() => switchTab('club')} className="text-xs font-bold text-blue-600 hover:underline">
                      View All
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* Club 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 font-black text-[10px] flex items-center justify-center">1</span>
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                          <Trophy size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Sports Club</p>
                          <p className="text-[11px] text-gray-400">245 members</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600 text-[11px]">↗ 12%</span>
                    </div>

                    {/* Club 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-black text-[10px] flex items-center justify-center">2</span>
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Laptop size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Tech Club</p>
                          <p className="text-[11px] text-gray-400">218 members</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600 text-[11px]">↗ 9%</span>
                    </div>

                    {/* Club 3 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 font-black text-[10px] flex items-center justify-center">3</span>
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                          <Palette size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Cultural Club</p>
                          <p className="text-[11px] text-gray-400">190 members</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600 text-[11px]">↗ 7%</span>
                    </div>

                    {/* Club 4 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 font-black text-[10px] flex items-center justify-center">4</span>
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Literary Club</p>
                          <p className="text-[11px] text-gray-400">142 members</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600 text-[11px]">↗ 5%</span>
                    </div>

                    {/* Club 5 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center">5</span>
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                          <Music size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Music Club</p>
                          <p className="text-[11px] text-gray-400">98 members</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600 text-[11px]">↗ 3%</span>
                    </div>
                  </div>
                </div>

                {/* 3. Quick Actions */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
                  <h4 className="text-sm font-black text-gray-900 mb-4">Quick Actions</h4>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    <button
                      onClick={() => switchTab('club')}
                      className="p-3 bg-gray-50/80 hover:bg-blue-50/70 border border-gray-100 hover:border-blue-200 rounded-xl transition text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                        <Plus size={16} />
                      </div>
                      <p className="font-bold text-xs text-gray-900">Add Club</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Register a new club</p>
                    </button>

                    <button
                      onClick={() => switchTab('event')}
                      className="p-3 bg-gray-50/80 hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-xl transition text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                        <Calendar size={16} />
                      </div>
                      <p className="font-bold text-xs text-gray-900">Schedule Event</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Create campus event</p>
                    </button>

                    <button
                      onClick={() => switchTab('certificates')}
                      className="p-3 bg-gray-50/80 hover:bg-indigo-50/70 border border-gray-100 hover:border-indigo-200 rounded-xl transition text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                        <Award size={16} />
                      </div>
                      <p className="font-bold text-xs text-gray-900">Issue Certificate</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Generate certificates</p>
                    </button>

                    <button
                      onClick={() => switchTab('finance')}
                      className="p-3 bg-gray-50/80 hover:bg-emerald-50/70 border border-gray-100 hover:border-emerald-200 rounded-xl transition text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                        <CreditCard size={16} />
                      </div>
                      <p className="font-bold text-xs text-gray-900">Process Payment</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Manage fees & dues</p>
                    </button>

                    <button
                      onClick={() => switchTab('import')}
                      className="p-3 bg-gray-50/80 hover:bg-violet-50/70 border border-gray-100 hover:border-violet-200 rounded-xl transition text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                        <FileSpreadsheet size={16} />
                      </div>
                      <p className="font-bold text-xs text-gray-900">Import Students</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Upload CSV/Excel/PDF</p>
                    </button>

                    <button
                      onClick={() => switchTab('analytics')}
                      className="p-3 bg-gray-50/80 hover:bg-sky-50/70 border border-gray-100 hover:border-sky-200 rounded-xl transition text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                        <BarChart3 size={16} />
                      </div>
                      <p className="font-bold text-xs text-gray-900">View Reports</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Download analytics</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 4: Bottom Banner (System Tip) */}
              {showSystemTip && (
                <div className="bg-[#EEF2FF] border border-[#E0E7FF] rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Lightbulb size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-950">
                        <span className="font-black text-indigo-900">System Tip</span>: You can now import student data from Excel/CSV/PDF and get automatic class & department-wise counts from the Document Import section.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => switchTab('import')}
                      className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Go to Document Import
                    </button>
                    <button
                      onClick={() => setShowSystemTip(false)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT (STUDENT DIRECTORY) */}
          {activeTab === 'directory' && <StudentDirectoryView />}

          {/* TAB 3: CLUBS & MEMBERSHIPS */}
          {activeTab === 'club' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 text-base mb-1">Create Institutional Club</h3>
                <p className="text-xs text-gray-400 mb-6">Assign presidents and faculty coordinators.</p>

                <form onSubmit={handleCreateClub} className="space-y-4 max-w-2xl text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Club Name</label>
                    <input required type="text" value={clubForm.name} onChange={(e) => setClubForm({...clubForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Category</label>
                      <select required value={clubForm.category} onChange={(e) => setClubForm({...clubForm, category: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="Sports">Sports</option>
                        <option value="Literary">Literary</option>
                        <option value="Cultural">Cultural</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Logo URL (Optional)</label>
                      <input type="text" value={clubForm.logo} onChange={(e) => setClubForm({...clubForm, logo: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Description</label>
                    <textarea required rows={3} value={clubForm.description} onChange={(e) => setClubForm({...clubForm, description: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">President</label>
                      <select required value={clubForm.presidentId} onChange={(e) => setClubForm({...clubForm, presidentId: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="">Select User</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Faculty Advisor</label>
                      <select required value={clubForm.facultyId} onChange={(e) => setClubForm({...clubForm, facultyId: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="">Select User</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                      </select>
                    </div>
                  </div>
                  <button disabled={loading} type="submit" className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition">
                    {loading ? 'Creating...' : '+ Create Club'}
                  </button>
                </form>
              </div>

              {/* Recruitment Management */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 text-base mb-1">Recruitment Phase & Membership Fees</h3>
                <form onSubmit={handleUpdateRecruitment} className="space-y-4 max-w-2xl text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Select Clubs to Configure</label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-xl bg-gray-50">
                      {clubs.map(c => (
                        <label key={c._id} className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={recruitmentForm.clubIds.includes(c._id)}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...recruitmentForm.clubIds, c._id]
                                : recruitmentForm.clubIds.filter(id => id !== c._id);
                              setRecruitmentForm({...recruitmentForm, clubIds: newIds});
                            }}
                            className="rounded text-blue-600"
                          />
                          <span>{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Join Fee (₹)</label>
                      <input required type="number" min="0" value={recruitmentForm.joinFee} onChange={(e) => setRecruitmentForm({...recruitmentForm, joinFee: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Recruitment Status</label>
                      <select required value={recruitmentForm.isAcceptingMembers ? 'open' : 'closed'} onChange={(e) => setRecruitmentForm({...recruitmentForm, isAcceptingMembers: e.target.value === 'open'})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="open">Open for Recruitment</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <button disabled={loading} type="submit" className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition">
                    Update Recruitment Settings
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: EVENTS & APPROVALS */}
          {activeTab === 'event' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-gray-900 text-sm">Event Approval Queue</h3>
                  <div className="flex items-center gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map(st => (
                      <button
                        key={st}
                        onClick={() => setApprovalFilter(st)}
                        className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition ${
                          approvalFilter === st ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {events.filter(e => approvalFilter === 'all' ? true : e.approvalStatus === approvalFilter).length === 0 ? (
                    <EmptyState icon={CheckCircle2} title="No events in this category" description="Filter is clear." />
                  ) : (
                    events.filter(e => approvalFilter === 'all' ? true : e.approvalStatus === approvalFilter).map(event => (
                      <div key={event._id} className="relative">
                        <ApprovalCard event={event} onApprove={handleApprove} onReject={handleReject} isRemoving={false} />
                        {event.approvalStatus !== 'pending' && (
                          <div className="absolute top-4 right-4 z-10">
                            <button onClick={() => setShowOverrideModal(event)} className="px-3 py-1 bg-white border border-gray-200 shadow-sm text-[11px] font-bold text-gray-700 rounded-lg">
                              Override
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Create Event */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 text-base mb-4">Create Campus Event</h3>
                <form onSubmit={handleCreateEvent} className="space-y-4 max-w-2xl text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Event Title</label>
                    <input required type="text" value={eventForm.title} onChange={(e) => setEventForm({...eventForm, title: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Associated Club</label>
                      <select required value={eventForm.clubId} onChange={(e) => setEventForm({...eventForm, clubId: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="">Select Club</option>
                        {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Category</label>
                      <select required value={eventForm.category} onChange={(e) => setEventForm({...eventForm, category: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="Sports">Sports</option>
                        <option value="Literary">Literary</option>
                        <option value="Cultural">Cultural</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Description</label>
                    <textarea required rows={3} value={eventForm.description} onChange={(e) => setEventForm({...eventForm, description: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Date & Time</label>
                      <input required type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({...eventForm, date: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Max Capacity (0 = unlimited)</label>
                      <input required type="number" min="0" value={eventForm.maxParticipants} onChange={(e) => setEventForm({...eventForm, maxParticipants: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                    </div>
                  </div>
                  <button disabled={loading} type="submit" className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-md">
                    {loading ? 'Creating...' : '+ Publish Event'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: SPORTS & TOURNAMENTS */}
          {activeTab === 'sports' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 text-base mb-1">Campus Sports Disciplines</h3>
                <form onSubmit={handleCreateGame} className="space-y-4 max-w-2xl text-xs mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Discipline Name</label>
                      <input type="text" required placeholder="e.g. Volleyball, Chess" value={gameForm.name} onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Type</label>
                      <select value={gameForm.type} onChange={(e) => setGameForm({ ...gameForm, type: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="team-based">Team-Based</option>
                        <option value="individual">Individual</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold">
                    + Add Sport
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {games.map(g => (
                    <span key={g._id} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-2">
                      <Gamepad2 size={14} className="text-blue-600" />
                      {g.name} ({g.type})
                    </span>
                  ))}
                </div>
              </div>

              {/* Schedule Match */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 text-base mb-4">Schedule Inter-Club Match</h3>
                <form onSubmit={handleCreateMatch} className="space-y-4 max-w-2xl text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Team A</label>
                      <input required type="text" value={matchForm.teamA} onChange={(e) => setMatchForm({...matchForm, teamA: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Team B</label>
                      <input required type="text" value={matchForm.teamB} onChange={(e) => setMatchForm({...matchForm, teamB: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Assigned Referee</label>
                      <select required value={matchForm.refereeId} onChange={(e) => setMatchForm({...matchForm, refereeId: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="">Select Referee</option>
                        {users.filter(u => u.role === 'referee' || u.role === 'admin').map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Date & Time</label>
                      <input required type="datetime-local" value={matchForm.date} onChange={(e) => setMatchForm({...matchForm, date: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-md">
                    Schedule Match
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: ELECTIONS & VOTING */}
          {activeTab === 'elections' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-black text-gray-900 text-base">Campus Elections (Secret Ballot Enforced)</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Individual candidate vote distributions remain strictly hidden while voting is active.</p>
                </div>

                <form onSubmit={handleCreateElection} className="space-y-4 max-w-2xl text-xs mb-8">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Election Title</label>
                    <input required type="text" placeholder="e.g. 2026 Student Council Election" value={electionForm.title} onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Club / Organization</label>
                      <select required value={electionForm.clubId} onChange={(e) => setElectionForm({ ...electionForm, clubId: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="">-- Choose Club --</option>
                        {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Start Date</label>
                      <input required type="datetime-local" value={electionForm.startDate} onChange={(e) => setElectionForm({ ...electionForm, startDate: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">End Date</label>
                      <input required type="datetime-local" value={electionForm.endDate} onChange={(e) => setElectionForm({ ...electionForm, endDate: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-md">
                    + Launch Election
                  </button>
                </form>

                <div className="space-y-3">
                  {elections.map(el => (
                    <div key={el._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-black text-gray-900 text-sm">{el.title}</h5>
                          {el.isSecretPhase ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                              BALLOTS ACTIVE (SECRET PHASE)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              RESULTS CONCLUDED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(el.startDate).toLocaleDateString()} to {new Date(el.endDate).toLocaleDateString()} | {el.candidates?.length || 0} candidates
                        </p>
                      </div>
                      <Link to="/elections" className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100">
                        View Ballot Station
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
              <Award size={48} className="mx-auto text-blue-600 mb-3" />
              <h3 className="text-xl font-black text-gray-900">Certificate Generation & Public Verification</h3>
              <p className="text-sm text-gray-500 max-w-lg mx-auto mt-2">
                Manage tamper-proof digital certificates, customized templates, batch issuance, and public cryptographic verification.
              </p>
              <Link
                to="/certificates"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                Open Full Certificate Console <ExternalLink size={16} />
              </Link>
            </div>
          )}

          {/* TAB 8: FEES & FINANCE */}
          {activeTab === 'finance' && <FinanceView clubs={clubs} />}

          {/* TAB 9: ATTENDANCE & QR CHECK-IN */}
          {activeTab === 'attendance' && <AttendanceQrView events={events} />}

          {/* TAB 10: VENUES & RESOURCES */}
          {activeTab === 'venues' && <VenueBookingView clubs={clubs} />}

          {/* TAB 11: DOCUMENTS & REPORTS (IMPORT) */}
          {activeTab === 'import' && <DocumentImportView onImportSuccess={() => switchTab('directory')} />}

          {/* TAB 12: ANALYTICS */}
          {activeTab === 'analytics' && <AnalyticsReportsView />}

          {/* TAB 13: ROLES & PERMISSIONS */}
          {activeTab === 'admin' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-900 text-lg mb-1">Administrative Privileges & Role Delegation</h3>
              <p className="text-xs text-gray-400 mb-6">Create dedicated administrator accounts protected by multi-factor authentication codes.</p>

              <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-2xl text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Full Name</label>
                    <input required type="text" value={adminForm.name} onChange={(e) => setAdminForm({...adminForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Username</label>
                    <input required type="text" value={adminForm.username} onChange={(e) => setAdminForm({...adminForm, username: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Email Address</label>
                  <input required type="email" value={adminForm.email} onChange={(e) => setAdminForm({...adminForm, email: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Admin Verification Code (MFA Authorization)</label>
                  <input required type="password" placeholder="Enter secure institutional authorization key" value={adminForm.secretCode} onChange={(e) => setAdminForm({...adminForm, secretCode: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" />
                </div>
                <button disabled={loading} type="submit" className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-md">
                  {loading ? 'Authorizing...' : '+ Create Administrator'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 14: AUDIT LOGS */}
          {activeTab === 'audit' && <AuditLogsView />}

          {/* TAB 15: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-xl">
              <h3 className="font-black text-gray-900 text-lg mb-1">Campus System Settings</h3>
              <p className="text-xs text-gray-400 mb-6">Manage institutional parameters and global preferences.</p>

              <div className="space-y-4 text-xs font-bold text-gray-700">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-gray-900">Maintenance Mode</p>
                    <p className="text-[10px] text-gray-400 font-medium">Prevent public logins during data maintenance</p>
                  </div>
                  <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-gray-900">Automatic Attendance Certificates</p>
                    <p className="text-[10px] text-gray-400 font-medium">Auto-issue certificates on QR scan verification</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 w-4 h-4" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-gray-900">Email Notifications for Event Approvals</p>
                    <p className="text-[10px] text-gray-400 font-medium">Alert faculty coordinators when clubs propose events</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 w-4 h-4" />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
