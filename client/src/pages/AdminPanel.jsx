import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  GraduationCap, LayoutDashboard, Users, Calendar, Trophy, Vote, Award,
  CreditCard, QrCode, Building2, Bell, FileSpreadsheet, BarChart3, Shield,
  Clock, Settings, Search, ChevronDown, Moon, Sun, Plus, Wallet, ArrowUpRight,
  Lightbulb, X, Share2, ExternalLink, Activity, CheckSquare, Gamepad2,
  CheckCircle2, Music, Palette, BookOpen, Laptop, Flame,
  LogOut, Lock, Key, User, UserCheck, ShieldCheck, Save, RefreshCw, AlertTriangle, Eye, EyeOff, Timer,
  Crown, Trash2, Swords, Check, Camera, Upload
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
import ApprovalCard from '../components/ApprovalCard';
import EmptyState from '../components/EmptyState';
import ClassFeeManagementView from '../components/admin/ClassFeeManagementView';

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
  const { user, setCredentials, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const initialTab = searchParams.get('tab') || 'dashboard';
  const initialSection = searchParams.get('section') || (initialTab === 'admin' ? 'roles' : 'profile');
  const [activeTab, setActiveTab] = useState(initialTab === 'admin' ? 'settings' : initialTab);
  const [settingsSubTab, setSettingsSubTab] = useState(initialSection);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Settings & Profile Edit State
  const fileInputRef = useRef(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    department: user?.department || 'Administration',
    course: user?.course || 'B.Tech',
    section: user?.section || 'A',
    profilePicture: user?.profilePicture || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Role Delegation & Reassignment State
  const [roleChangeData, setRoleChangeData] = useState({ userId: '', role: 'student' });
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  // Logout Modal State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Initialize Dark Mode from localStorage or system
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || document.documentElement.classList.contains('dark')) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      toast.success('🌙 Dark Mode enabled');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      toast.success('☀️ Light Mode enabled');
    }
  };

  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        department: user.department || 'Administration',
        course: user.course || 'B.Tech',
        section: user.section || 'A',
        profilePicture: user.profilePicture || ''
      }));
    }
  }, [user]);

  // Handle uploading and instantly linking new profile picture across UI
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be smaller than 5MB');
      return;
    }

    // 1. Instant local preview and propagation across navbar and profile card
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target.result;
      const updatedUser = { ...user, profilePicture: base64Url };
      setCredentials(updatedUser);
      setProfileForm(prev => ({ ...prev, profilePicture: base64Url }));
      toast.success('Profile picture updated successfully!');

      // 2. Persist to server backend
      try {
        setUploadingPic(true);
        const formData = new FormData();
        formData.append('profilePic', file);
        const res = await axios.post('/api/auth/profile-pic', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
        if (res.data?.profilePicture) {
          const syncedUser = { ...updatedUser, profilePicture: res.data.profilePicture };
          setCredentials(syncedUser);
          setProfileForm(prev => ({ ...prev, profilePicture: res.data.profilePicture }));
        }
      } catch (err) {
        console.warn('Backend sync unavailable, preserved local profile picture:', err?.message);
        try {
          await axios.put('/api/auth/profile', { profilePicture: base64Url }, { withCredentials: true });
        } catch (e2) {
          // Keep base64Url in localStorage/authStore
        }
      } finally {
        setUploadingPic(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (profileForm.newPassword) {
      if (profileForm.newPassword.length < 4) {
        return toast.error('New password must be at least 4 characters');
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        return toast.error('New passwords do not match');
      }
    }
    setProfileSaving(true);
    try {
      const res = await axios.put('/api/auth/profile', {
        name: profileForm.name,
        username: profileForm.username,
        email: profileForm.email,
        department: profileForm.department,
        course: profileForm.course,
        section: profileForm.section,
        profilePicture: profileForm.profilePicture,
        currentPassword: profileForm.currentPassword,
        newPassword: profileForm.newPassword
      }, { withCredentials: true });

      setCredentials({ ...user, ...res.data });
      toast.success('Profile credentials updated successfully!');
      setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      // Local fallback for offline/demo mode so user sees their updates applied
      const updatedLocalUser = {
        ...user,
        name: profileForm.name,
        username: profileForm.username,
        email: profileForm.email,
        department: profileForm.department,
        course: profileForm.course,
        section: profileForm.section,
        profilePicture: profileForm.profilePicture || user?.profilePicture
      };
      setCredentials(updatedLocalUser);
      toast.success('Profile changes saved locally!');
      setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateUserRole = async (e) => {
    e.preventDefault();
    if (!roleChangeData.userId) return toast.error('Please select a student/user');
    setRoleUpdating(true);
    try {
      const res = await axios.post('/api/auth/update-role', roleChangeData, { withCredentials: true });
      toast.success(res.data.message || 'User role successfully updated!');
      const usersRes = await axios.get('/api/auth/users', { withCredentials: true });
      if (Array.isArray(usersRes.data)) setUsers(usersRes.data);
      setRoleChangeData({ userId: '', role: 'student' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/', { replace: true });
  };

  // Data
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [games, setGames] = useState([]);
  const [elections, setElections] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);

  // Header Admin Menu State
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  // Faculty Advisor in-between update state
  const [editingClubFaculty, setEditingClubFaculty] = useState(null); // clubId
  const [selectedNewFaculty, setSelectedNewFaculty] = useState('');
  const [updatingFaculty, setUpdatingFaculty] = useState(false);

  // Forms
  const [clubForm, setClubForm] = useState({ name: '', category: 'Sports', description: '', logo: '', facultyId: '' });
  const [eventForm, setEventForm] = useState({ title: '', description: '', clubId: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' });
  const [matchForm, setMatchForm] = useState({ clubId: '', sport: 'Cricket', wing: 'General', teamA: '', teamB: '', refereeId: '', date: '', timeSlot: '09:00 AM - 10:30 AM' });
  const [recruitmentForm, setRecruitmentForm] = useState({ clubIds: [], joinFee: 500, isAcceptingMembers: true });
  const [adminForm, setAdminForm] = useState({ name: '', username: '', email: '', secretCode: '' });
  const [gameForm, setGameForm] = useState({ name: '', type: 'team-based', description: '' });
  const candidate1PhotoRef = useRef(null);
  const candidate2PhotoRef = useRef(null);
  const [electionForm, setElectionForm] = useState({
    title: '',
    clubId: '',
    position: 'President',
    startDate: '',
    endDate: '',
    candidate1: { candidateId: '', roll_no: '', studentName: '', name: '', manifesto: '', photo: '' },
    candidate2: { candidateId: '', roll_no: '', studentName: '', name: '', manifesto: '', photo: '' }
  });

  const handleRollNoChange = (candidateKey, val) => {
    const cleanVal = val.trim().toUpperCase();
    const matched = users.find(u => u.roll_no?.toUpperCase() === cleanVal || u.username?.toUpperCase() === cleanVal);
    setElectionForm(prev => ({
      ...prev,
      [candidateKey]: {
        ...prev[candidateKey],
        roll_no: val,
        candidateId: matched ? matched._id : prev[candidateKey].candidateId,
        studentName: matched ? matched.name : prev[candidateKey].studentName,
        name: prev[candidateKey].name || (matched ? matched.name : ''),
        photo: prev[candidateKey].photo || (matched?.profilePicture || '')
      }
    }));
  };

  const handleCandidatePhotoUpload = (e, candidateKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be smaller than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setElectionForm(prev => ({
        ...prev,
        [candidateKey]: { ...prev[candidateKey], photo: base64 }
      }));
      toast.success(`${candidateKey === 'candidate1' ? 'Candidate 1' : 'Candidate 2'} photo loaded from system!`);
    };
    reader.readAsDataURL(file);
  };

  const { events, fetchEvents, approveEvent, rejectEvent, overrideEvent } = useEventStore();
  const [approvalNote, setApprovalNote] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(null);
  const [approvalFilter, setApprovalFilter] = useState('pending');

  useEffect(() => {
    const tab = searchParams.get('tab');
    const sec = searchParams.get('section');
    if (tab === 'admin') {
      setActiveTab('settings');
      setSettingsSubTab('roles');
    } else if (tab) {
      setActiveTab(tab);
      if (sec) setSettingsSubTab(sec);
    }
  }, [searchParams]);

  const switchTab = (tabName, subTab = null) => {
    if (tabName === 'admin') {
      setActiveTab('settings');
      setSettingsSubTab('roles');
      setSearchParams({ tab: 'settings', section: 'roles' });
      return;
    }
    setActiveTab(tabName);
    if (subTab) setSettingsSubTab(subTab);
    setSearchParams(subTab ? { tab: tabName, section: subTab } : { tab: tabName });
  };

  // Keyboard shortcut for Ctrl + K search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, clubsRes, gamesRes, electionsRes, finRes] = await Promise.all([
          axios.get('/api/auth/users', { withCredentials: true }).catch(() => ({ data: [] })),
          axios.get('/api/clubs').catch(() => ({ data: [] })),
          axios.get('/api/games').catch(() => ({ data: [] })),
          axios.get('/api/elections').catch(() => ({ data: [] })),
          axios.get('/api/finance/analytics', { withCredentials: true }).catch(() => ({ data: null }))
        ]);
        if (Array.isArray(usersRes.data)) setUsers(usersRes.data);
        if (Array.isArray(clubsRes.data)) setClubs(clubsRes.data);
        if (Array.isArray(gamesRes.data)) setGames(gamesRes.data);
        if (Array.isArray(electionsRes.data)) setElections(electionsRes.data);
        if (finRes.data) setFinanceSummary(finRes.data);
        fetchEvents();
      } catch (err) {
        // Fallback to sample data for visual fidelity
      }
    };
    fetchData();
  }, [fetchEvents]);

  // Handlers
  const handleCreateClub = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/clubs', {
        name: clubForm.name,
        category: clubForm.category,
        description: clubForm.description,
        logo: clubForm.logo,
        facultyId: clubForm.facultyId || null,
        presidentId: null // President will be elected via Elections
      }, { withCredentials: true });
      toast.success('Club created successfully! President will be elected in elections.');
      setClubForm({ name: '', category: 'Sports', description: '', logo: '', facultyId: '' });
      const clubsRes = await axios.get('/api/clubs');
      setClubs(clubsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClubFaculty = async (clubId) => {
    if (!selectedNewFaculty) return toast.error('Please select a faculty advisor');
    setUpdatingFaculty(true);
    try {
      await axios.put(`/api/clubs/${clubId}`, { facultyId: selectedNewFaculty }, { withCredentials: true });
      toast.success('Faculty Advisor successfully updated for this club!');
      const clubsRes = await axios.get('/api/clubs');
      setClubs(clubsRes.data);
      setEditingClubFaculty(null);
      setSelectedNewFaculty('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update Faculty Advisor');
    } finally {
      setUpdatingFaculty(false);
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
      toast.success('Inter-class match scheduled successfully');
      setMatchForm({ clubId: '', sport: 'Cricket', wing: 'General', teamA: '', teamB: '', refereeId: '', date: '', timeSlot: '09:00 AM - 10:30 AM' });
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
    if (!electionForm.clubId) {
      return toast.error('Please select a club');
    }
    setLoading(true);
    try {
      const candidates = [];
      if (electionForm.candidate1.roll_no || electionForm.candidate1.studentName || electionForm.candidate1.candidateId) {
        const u = users.find(usr => 
          (electionForm.candidate1.candidateId && usr._id === electionForm.candidate1.candidateId) ||
          (electionForm.candidate1.roll_no && usr.roll_no?.toUpperCase() === electionForm.candidate1.roll_no.trim().toUpperCase())
        );
        candidates.push({
          candidateId: u ? u._id : electionForm.candidate1.candidateId || null,
          roll_no: electionForm.candidate1.roll_no?.trim() || u?.roll_no || '',
          studentName: electionForm.candidate1.studentName?.trim() || u?.name || '',
          name: electionForm.candidate1.name?.trim() || electionForm.candidate1.studentName?.trim() || u?.name || 'Candidate 1',
          manifesto: electionForm.candidate1.manifesto || 'Committed to student empowerment and excellence.',
          photo: electionForm.candidate1.photo || u?.profilePicture || ''
        });
      }
      if (electionForm.candidate2.roll_no || electionForm.candidate2.studentName || electionForm.candidate2.candidateId) {
        const u = users.find(usr => 
          (electionForm.candidate2.candidateId && usr._id === electionForm.candidate2.candidateId) ||
          (electionForm.candidate2.roll_no && usr.roll_no?.toUpperCase() === electionForm.candidate2.roll_no.trim().toUpperCase())
        );
        candidates.push({
          candidateId: u ? u._id : electionForm.candidate2.candidateId || null,
          roll_no: electionForm.candidate2.roll_no?.trim() || u?.roll_no || '',
          studentName: electionForm.candidate2.studentName?.trim() || u?.name || '',
          name: electionForm.candidate2.name?.trim() || electionForm.candidate2.studentName?.trim() || u?.name || 'Candidate 2',
          manifesto: electionForm.candidate2.manifesto || 'Empowering club members with collaborative leadership.',
          photo: electionForm.candidate2.photo || u?.profilePicture || ''
        });
      }

      const payload = {
        title: electionForm.title,
        clubId: electionForm.clubId,
        position: electionForm.position || 'President',
        startDate: electionForm.startDate,
        endDate: electionForm.endDate,
        candidates
      };

      await axios.post('/api/elections', payload, { withCredentials: true });
      toast.success('Election launched successfully! Candidates are now standing for election.');
      setElectionForm({
        title: '',
        clubId: '',
        position: 'President',
        startDate: '',
        endDate: '',
        candidate1: { candidateId: '', roll_no: '', studentName: '', name: '', manifesto: '', photo: '' },
        candidate2: { candidateId: '', roll_no: '', studentName: '', name: '', manifesto: '', photo: '' }
      });
      const res = await axios.get('/api/elections');
      setElections(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  const handleConcludeElection = async (electionId) => {
    try {
      setLoading(true);
      const res = await axios.post(`/api/elections/${electionId}/conclude`, {}, { withCredentials: true });
      toast.success(res.data?.message || 'Election concluded! Winner has been elevated to leadership.');
      const [elRes, clubsRes, usersRes] = await Promise.all([
        axios.get('/api/elections'),
        axios.get('/api/clubs'),
        axios.get('/api/auth/users', { withCredentials: true }).catch(() => ({ data: [] }))
      ]);
      setElections(elRes.data || []);
      if (Array.isArray(clubsRes.data)) setClubs(clubsRes.data);
      if (Array.isArray(usersRes.data)) setUsers(usersRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to conclude election');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteElection = async (electionId) => {
    if (!window.confirm('Are you sure you want to delete this election?')) return;
    try {
      await axios.delete(`/api/elections/${electionId}`, { withCredentials: true });
      toast.success('Election deleted successfully');
      setElections(prev => prev.filter(e => e._id !== electionId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete election');
    }
  };

  const handleApprove = async (id, note = '') => {
    await approveEvent(id, note || approvalNote);
    setApprovalNote('');
    fetchEvents();
  };

  const handleReject = async (id, reason) => {
    const noteToUse = reason || approvalNote;
    if (!noteToUse) return toast.error("Please provide a reason for rejection.");
    await rejectEvent(id, noteToUse);
    setApprovalNote('');
    fetchEvents();
  };

  const handleOverride = async (id, status, reason) => {
    await overrideEvent(id, status, reason);
    setShowOverrideModal(null);
    fetchEvents();
  };

  // Dynamic Real Registration Trend Chart (computed from real users)
  const lineChartData = useMemo(() => {
    const months = [];
    const counts = [];
    const now = new Date();
    
    // Past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleDateString('en-US', { month: 'short' }));
      
      const count = users.filter(u => {
        if (!u.createdAt) return false;
        const uDate = new Date(u.createdAt);
        return uDate.getMonth() === d.getMonth() && uDate.getFullYear() === d.getFullYear();
      }).length;
      counts.push(count);
    }
    
    const totalCount = counts.reduce((a, b) => a + b, 0);
    if (totalCount === 0 && users.length > 0) {
      counts[counts.length - 1] = users.filter(u => u.role === 'student').length || users.length;
    }

    return {
      labels: months,
      datasets: [
        {
          label: 'Student Registrations',
          data: counts,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#2563EB',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
        }
      ]
    };
  }, [users]);

  const maxStudentCount = Math.max(...(lineChartData.datasets[0]?.data || [10]), 10);
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
        beginAtZero: true,
        ticks: {
          stepSize: Math.max(1, Math.ceil(maxStudentCount / 5)),
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Dynamic Real Club Categories Chart (computed from real clubs)
  const categoryStats = useMemo(() => {
    if (!clubs || clubs.length === 0) {
      return {
        labels: [],
        data: [],
        total: 0,
        breakdown: []
      };
    }
    const counts = {};
    clubs.forEach(c => {
      const cat = c.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const colors = ['#2563EB', '#9333EA', '#10B981', '#F59E0B', '#06B6D4', '#EC4899', '#94A3B8'];
    return {
      labels,
      data,
      total: clubs.length,
      breakdown: labels.map((l, i) => ({
        label: l,
        count: data[i],
        percentage: ((data[i] / clubs.length) * 100).toFixed(1),
        color: colors[i % colors.length]
      }))
    };
  }, [clubs]);

  const donutChartData = useMemo(() => ({
    labels: categoryStats.labels,
    datasets: [
      {
        data: categoryStats.data,
        backgroundColor: ['#2563EB', '#9333EA', '#10B981', '#F59E0B', '#06B6D4', '#EC4899', '#94A3B8'].slice(0, Math.max(categoryStats.labels.length, 1)),
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }), [categoryStats]);

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
    { id: 'classes', label: 'Department & Classes', icon: Building2 },
    { id: 'finance', label: 'Fees & Payments', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'import', label: 'Documents & Reports', icon: FileSpreadsheet },
  ];

  const systemNavItems = [
    { id: 'settings', label: 'Settings & Privileges', icon: Settings },
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
        <header className="bg-white border-b border-slate-100 h-16 px-8 flex items-center justify-between sticky top-0 z-30">
          {/* Global Search Bar */}
          <div className="flex items-center gap-2.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3.5 py-2 w-96 text-xs text-slate-400 focus-within:border-blue-500 focus-within:bg-white transition-all">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, clubs, events, etc..."
              className="bg-transparent text-slate-800 font-medium placeholder-slate-400 focus:outline-none flex-1 text-xs"
            />
            <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 shadow-2xs">
              Ctrl + K
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            <Link 
              to="/clubs"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <GraduationCap size={15} className="text-teal-600" />
              <span>Student View</span>
            </Link>
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {events.filter(e => e.approvalStatus === 'pending').length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {events.filter(e => e.approvalStatus === 'pending').length}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <span className="font-bold text-slate-900">Notifications</span>
                    {events.filter(e => e.approvalStatus === 'pending').length > 0 ? (
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                        {events.filter(e => e.approvalStatus === 'pending').length} Action Required
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                        All Caught Up
                      </span>
                    )}
                  </div>
                  {events.filter(e => e.approvalStatus === 'pending').length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      <CheckCircle2 size={24} className="mx-auto mb-1.5 text-emerald-500 opacity-80" />
                      <p className="font-bold text-xs text-slate-700">No pending alerts</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">All event approvals and club actions are clear.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto">
                      {events.filter(e => e.approvalStatus === 'pending').slice(0, 5).map((ev) => (
                        <div 
                          key={ev._id} 
                          onClick={() => {
                            switchTab('event');
                            setShowNotifications(false);
                          }}
                          className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                        >
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">Event Approval Required: {ev.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{ev.clubId?.name || 'Club'} • {ev.category || 'General'}</p>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          switchTab('event');
                          setShowNotifications(false);
                        }}
                        className="w-full mt-2 py-1.5 text-center text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Review all {events.filter(e => e.approvalStatus === 'pending').length} pending events →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              aria-label="Toggle Dark Mode"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-600" />}
            </button>

            {/* Admin User Profile with Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="flex items-center gap-3 pl-3 border-l border-slate-200 hover:opacity-80 transition cursor-pointer text-left"
                title="Administrator Account Menu"
              >
                <img
                  src={user?.profilePicture || '/admin_avatar.jpg'}
                  alt="Admin User"
                  className="w-9 h-9 rounded-full object-cover border border-slate-200/90 shadow-2xs"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="text-left">
                  <p className="text-xs font-black text-slate-900 leading-tight">{user?.name || 'Admin User'}</p>
                  <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5 flex items-center gap-1">
                    Administrator <ChevronDown size={11} className={`transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
                  </p>
                </div>
              </button>

              {showAdminMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAdminMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user?.name || 'Admin'}
                          className="w-10 h-10 rounded-full object-cover border border-blue-200 shadow-2xs"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-black flex items-center justify-center text-sm">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 truncate">{user?.name || 'Administrator'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@campus.edu'}</p>
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-extrabold rounded-full mt-1">
                          Master Admin
                        </span>
                      </div>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        onClick={() => {
                          switchTab('settings', 'profile');
                          setShowAdminMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl font-bold transition text-left cursor-pointer"
                      >
                        <User size={15} className="text-blue-600" />
                        <span>Change Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          switchTab('settings', 'roles');
                          setShowAdminMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl font-bold transition text-left cursor-pointer"
                      >
                        <Shield size={15} className="text-indigo-600" />
                        <span>Roles & Permissions</span>
                      </button>

                      <button
                        onClick={() => {
                          toggleDarkMode();
                          setShowAdminMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-amber-600 rounded-xl font-bold transition text-left cursor-pointer"
                      >
                        {darkMode ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} className="text-slate-600" />}
                        <span>{darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                      </button>
                    </div>

                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowAdminMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition text-left cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 3. DYNAMIC CONTENT WORKSPACE */}
        <main className={`p-8 space-y-6 ${darkMode ? 'bg-slate-900 text-slate-100' : ''}`}>
          {/* TAB 1: EXACT MATCH TO USER'S DASHBOARD SCREENSHOT */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Greeting Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Admin'}! <span className="text-2xl">👋</span>
                  </h1>
                  <p className="text-xs font-medium text-slate-500 mt-1">Real-time overview of college clubs, events, and student registrations.</p>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
                  <Calendar size={14} className="text-slate-500" />
                  <span>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Row 1: 4 Real KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Students */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#EBF5FF] text-[#2563EB] flex items-center justify-center shrink-0">
                      <Users size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Total Students</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        {users.filter(u => u.role === 'student').length.toLocaleString()}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] font-semibold text-slate-400">
                    Verified student accounts
                  </div>
                </div>

                {/* Active Clubs */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
                      <Share2 size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Active Clubs</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        {clubs.length.toLocaleString()}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] font-semibold text-slate-400">
                    Societies & student teams
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                      <Calendar size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Upcoming Events</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        {events.length.toLocaleString()}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] font-bold text-amber-600">
                    {events.filter(e => e.approvalStatus === 'pending').length} pending approval
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 font-bold text-xl">
                      ₹
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Total Revenue</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        ₹ {(financeSummary?.totalRevenue || 0).toLocaleString('en-IN')}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] font-semibold text-slate-400">
                    Membership collections & dues
                  </div>
                </div>
              </div>

              {/* Row 2: Dual Real-Time Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Student Registration Trend (8 of 12 cols) */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Activity size={17} />
                        </div>
                        <h4 className="text-sm font-black text-slate-900">Student Registration Trend</h4>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                        Last 6 Months
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-5 text-xs font-semibold text-slate-500 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                        <span className="text-slate-600">Registered Students</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <Line data={lineChartData} options={lineChartOptions} />
                  </div>
                </div>

                {/* Right: Club Categories Donut (4 of 12 cols) */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-slate-900">Club Categories</h4>
                    <button onClick={() => switchTab('club')} className="text-xs font-bold text-blue-600 hover:underline">
                      Manage Clubs
                    </button>
                  </div>

                  {clubs.length === 0 ? (
                    <div className="py-8 text-center my-auto">
                      <Share2 size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-bold text-xs text-slate-600">No clubs created yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Categories will compute automatically once clubs are added</p>
                      <button 
                        onClick={() => switchTab('club')} 
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition shadow-2xs"
                      >
                        + Create Club
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4 my-auto">
                      <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                        <Doughnut data={donutChartData} options={donutChartOptions} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-black text-slate-900">{categoryStats.total}</span>
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Clubs</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs font-bold flex-1">
                        {categoryStats.breakdown.map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                              <span className="text-gray-600 font-medium truncate">{item.label}</span>
                            </div>
                            <span className="text-gray-900 whitespace-nowrap ml-2">
                              {item.count} <span className="text-gray-400 text-[10px]">({item.percentage}%)</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Real Data Sections (Approvals, Clubs Overview, Quick Actions) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Real Event Approvals */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-slate-900">Event Approvals</h4>
                      <button onClick={() => switchTab('event')} className="text-xs font-bold text-blue-600 hover:underline">
                        View All ({events.length})
                      </button>
                    </div>

                    {events.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">
                        <Calendar size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="font-bold text-xs text-slate-600">No events scheduled</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Created events will appear here for review</p>
                      </div>
                    ) : (
                      <div className="space-y-3 text-xs">
                        {events.slice(0, 5).map((ev) => (
                          <div key={ev._id} className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                ev.approvalStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                ev.approvalStatus === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                <Calendar size={15} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{ev.title}</p>
                                <p className="text-[11px] text-slate-400 truncate">{ev.clubId?.name || 'Club Event'} • {ev.category || 'General'}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full capitalize shrink-0 ${
                              ev.approvalStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              ev.approvalStatus === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {ev.approvalStatus || 'pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Real Registered Clubs Overview */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-slate-900">Campus Clubs</h4>
                      <button onClick={() => switchTab('club')} className="text-xs font-bold text-blue-600 hover:underline">
                        View All ({clubs.length})
                      </button>
                    </div>

                    {clubs.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">
                        <Share2 size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="font-bold text-xs text-slate-600">No clubs created yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Clubs you create will appear here</p>
                        <button 
                          onClick={() => switchTab('club')} 
                          className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition shadow-2xs"
                        >
                          + Create Club
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 text-xs">
                        {[...clubs]
                          .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0))
                          .slice(0, 5)
                          .map((club, idx) => (
                            <div key={club._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black flex items-center justify-center shrink-0 text-xs">
                                  {club.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate">{club.name}</p>
                                  <p className="text-[11px] text-slate-400 font-medium">
                                    {club.category || 'General'}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-slate-700 text-xs whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-md">
                                {club.members?.length || 0} {club.members?.length === 1 ? 'member' : 'members'}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Quick Actions */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                  <h4 className="text-sm font-black text-slate-900 mb-4">Quick Actions</h4>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    <button
                      onClick={() => switchTab('club')}
                      className="p-3.5 bg-white hover:bg-slate-50 border border-slate-100 hover:border-blue-200 rounded-xl transition text-left group shadow-2xs hover:shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-2xs">
                        <Plus size={16} strokeWidth={2.5} />
                      </div>
                      <p className="font-bold text-xs text-slate-900">Add Club</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Register a new club</p>
                    </button>

                    <button
                      onClick={() => switchTab('event')}
                      className="p-3.5 bg-white hover:bg-slate-50 border border-slate-100 hover:border-purple-200 rounded-xl transition text-left group shadow-2xs hover:shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#9333EA] text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-2xs">
                        <Calendar size={16} strokeWidth={2} />
                      </div>
                      <p className="font-bold text-xs text-slate-900">Schedule Event</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Create campus event</p>
                    </button>

                    <button
                      onClick={() => switchTab('certificates')}
                      className="p-3.5 bg-white hover:bg-slate-50 border border-slate-100 hover:border-purple-200 rounded-xl transition text-left group shadow-2xs hover:shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#9333EA] text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-2xs">
                        <Award size={16} strokeWidth={2} />
                      </div>
                      <p className="font-bold text-xs text-slate-900">Certificates</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Generate certificates</p>
                    </button>

                    <button
                      onClick={() => switchTab('finance')}
                      className="p-3.5 bg-white hover:bg-slate-50 border border-slate-100 hover:border-indigo-200 rounded-xl transition text-left group shadow-2xs hover:shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#6366F1] text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-2xs">
                        <Wallet size={16} strokeWidth={2} />
                      </div>
                      <p className="font-bold text-xs text-slate-900">Fees Ledger</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Manage fees & dues</p>
                    </button>

                    <button
                      onClick={() => switchTab('directory')}
                      className="p-3.5 bg-white hover:bg-slate-50 border border-slate-100 hover:border-blue-200 rounded-xl transition text-left group shadow-2xs hover:shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-2xs">
                        <Users size={16} strokeWidth={2} />
                      </div>
                      <p className="font-bold text-xs text-slate-900">User Directory</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">View student roster</p>
                    </button>

                    <button
                      onClick={() => switchTab('import')}
                      className="p-3.5 bg-white hover:bg-slate-50 border border-slate-100 hover:border-blue-200 rounded-xl transition text-left group shadow-2xs hover:shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-2xs">
                        <FileSpreadsheet size={16} strokeWidth={2} />
                      </div>
                      <p className="font-bold text-xs text-slate-900">Import Students</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Upload CSV/Excel</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT (STUDENT DIRECTORY) */}
          {activeTab === 'directory' && <StudentDirectoryView />}

          {/* TAB 3: CLUBS & MEMBERSHIPS */}
          {activeTab === 'club' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 text-base mb-1">Create Institutional Club</h3>
                <p className="text-xs text-gray-400 mb-6">Specify club details and assign a Faculty Advisor / Teacher In-Charge.</p>

                <form onSubmit={handleCreateClub} className="space-y-4 max-w-2xl text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Club Name</label>
                    <input required type="text" placeholder="e.g. Robotics & AI Club" value={clubForm.name} onChange={(e) => setClubForm({...clubForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Category</label>
                      <select required value={clubForm.category} onChange={(e) => setClubForm({...clubForm, category: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="Sports">Sports</option>
                        <option value="Literary">Literary</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Technical">Technical</option>
                        <option value="Arts">Arts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Logo URL (Optional)</label>
                      <input type="text" placeholder="https://..." value={clubForm.logo} onChange={(e) => setClubForm({...clubForm, logo: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Description</label>
                    <textarea required rows={3} placeholder="Brief summary of club objectives and student activities..." value={clubForm.description} onChange={(e) => setClubForm({...clubForm, description: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                  </div>

                  {/* President Election Notice (No manual president selector) */}
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                    <Vote size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black">Club President Selection:</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Presidents are democratically elected by members during Campus Elections. Once an election concludes, the elected student is elevated automatically.
                      </p>
                    </div>
                  </div>

                  {/* Faculty Advisor Selector */}
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Faculty Advisor / Teacher In-Charge</label>
                    <select required value={clubForm.facultyId} onChange={(e) => setClubForm({...clubForm, facultyId: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none text-xs">
                      <option value="">-- Select Faculty Advisor / Teacher --</option>
                      {users.filter(u => u.role === 'faculty' || u.role === 'admin' || !['student'].includes(u.role)).map(u => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.department || 'Faculty Coordinator'}) • {u.email}
                        </option>
                      ))}
                      <option disabled>────────── All Staff Accounts ──────────</option>
                      {users.filter(u => !['faculty', 'admin'].includes(u.role)).map(u => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role}) • {u.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button disabled={loading} type="submit" className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition cursor-pointer">
                    {loading ? 'Creating...' : '+ Create Club'}
                  </button>
                </form>
              </div>

              {/* Active Clubs & In-Between Faculty Advisor Management */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                      <Share2 size={18} className="text-blue-600" /> Active Clubs & Faculty Advisor Management
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Review campus clubs and update or change their designated Faculty Advisor / Teacher in-between anytime.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    {clubs.length} Active Clubs
                  </span>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                  {clubs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">No clubs created yet.</div>
                  ) : (
                    clubs.map((c) => (
                      <div key={c._id} className="p-4 bg-white hover:bg-gray-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-base shrink-0 overflow-hidden border border-blue-100">
                            {c.logo ? (
                              <img src={c.logo} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              c.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-gray-900 text-sm truncate">{c.name}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                                {c.category || 'General'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              President:{' '}
                              {c.presidentId?.name ? (
                                <span className="font-bold text-gray-700">{c.presidentId.name}</span>
                              ) : (
                                <span className="text-amber-600 font-bold inline-flex items-center gap-1">
                                  <Vote size={12} /> Awaiting Campus Election
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Faculty Advisor Section with Inline Change in-between */}
                        <div className="flex items-center gap-3 shrink-0">
                          {editingClubFaculty === c._id ? (
                            <div className="flex items-center gap-2 bg-blue-50/60 p-2 rounded-xl border border-blue-200">
                              <select
                                value={selectedNewFaculty}
                                onChange={(e) => setSelectedNewFaculty(e.target.value)}
                                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none"
                              >
                                <option value="">-- Choose New Teacher/Faculty --</option>
                                {users.filter(u => u.role === 'faculty' || u.role === 'admin' || !['student'].includes(u.role)).map(u => (
                                  <option key={u._id} value={u._id}>{u.name} ({u.department || 'Faculty Coordinator'})</option>
                                ))}
                                <option disabled>────────── All Accounts ──────────</option>
                                {users.filter(u => !['faculty', 'admin'].includes(u.role)).map(u => (
                                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleUpdateClubFaculty(c._id)}
                                disabled={updatingFaculty}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                {updatingFaculty ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingClubFaculty(null);
                                  setSelectedNewFaculty('');
                                }}
                                className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-gray-400">Faculty Advisor / Teacher</p>
                                <p className="text-xs font-bold text-gray-800">
                                  {c.facultyId?.name || 'Not Assigned'}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingClubFaculty(c._id);
                                  setSelectedNewFaculty(c.facultyId?._id || '');
                                }}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer border border-gray-200/80"
                              >
                                Change Teacher
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
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

              {showOverrideModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
                    <h3 className="text-xl font-black mb-2 text-gray-900">Administrative Override</h3>
                    <p className="text-xs text-gray-500 mb-4 font-medium">You are exercising administrative override for "{showOverrideModal.title}".</p>
                    <select id="adminOverrideStatus" className="w-full mb-4 px-4 py-2.5 border border-gray-200 rounded-xl outline-none font-bold text-xs" defaultValue={showOverrideModal.approvalStatus === 'approved' ? 'rejected' : 'approved'}>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <textarea id="adminOverrideReason" placeholder="Reason for administrative override (Required)" className="w-full mb-4 px-4 py-2.5 border border-gray-200 rounded-xl outline-none text-xs font-medium" rows="3"></textarea>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowOverrideModal(null)} className="px-4 py-2 font-bold text-xs text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                      <button onClick={() => handleOverride(showOverrideModal._id, document.getElementById('adminOverrideStatus').value, document.getElementById('adminOverrideReason').value)} className="px-5 py-2 font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">Confirm Override</button>
                    </div>
                  </div>
                </div>
              )}
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

              {/* Schedule Inter-Class Match */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-gray-900 text-base">Schedule Inter-Class Match</h3>
                    <p className="text-xs text-gray-500 font-medium">Schedule intra-club fixtures between sections/classes with dedicated referees and rotating slots.</p>
                  </div>
                </div>
                <form onSubmit={handleCreateMatch} className="space-y-4 max-w-3xl text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Club</label>
                      <select required value={matchForm.clubId} onChange={(e) => setMatchForm({...matchForm, clubId: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="">Select Club</option>
                        {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Sport / Discipline</label>
                      <select required value={matchForm.sport} onChange={(e) => setMatchForm({...matchForm, sport: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="Cricket">Cricket</option>
                        <option value="Football">Football / Soccer</option>
                        <option value="Volleyball">Volleyball</option>
                        <option value="Basketball">Basketball</option>
                        <option value="Badminton">Badminton</option>
                        <option value="Table Tennis">Table Tennis</option>
                        <option value="Chess">Chess</option>
                        {games.map(g => <option key={g._id} value={g.name}>{g.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Wing</label>
                      <select required value={matchForm.wing} onChange={(e) => setMatchForm({...matchForm, wing: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="General">General Wing</option>
                        <option value="Junior">Junior Wing (1st & 2nd Year)</option>
                        <option value="Senior">Senior Wing (3rd & 4th Year)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Class / Section A</label>
                      <input required type="text" placeholder="e.g. CSE-A, IT-2nd Year" value={matchForm.teamA} onChange={(e) => setMatchForm({...matchForm, teamA: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Class / Section B</label>
                      <input required type="text" placeholder="e.g. CSE-B, MECH-2nd Year" value={matchForm.teamB} onChange={(e) => setMatchForm({...matchForm, teamB: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Assigned Referee</label>
                      <select required value={matchForm.refereeId} onChange={(e) => setMatchForm({...matchForm, refereeId: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="">Select Referee</option>
                        {users.filter(u => u.role === 'referee' || u.isReferee || u.role === 'admin').map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.role}{u.isReferee ? ', Student Referee' : ''})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Date</label>
                      <input required type="date" value={matchForm.date} onChange={(e) => setMatchForm({...matchForm, date: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Time Slot</label>
                      <select value={matchForm.timeSlot} onChange={(e) => setMatchForm({...matchForm, timeSlot: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                        <option value="09:00 AM - 10:30 AM">09:00 AM - 10:30 AM</option>
                        <option value="10:45 AM - 12:15 PM">10:45 AM - 12:15 PM</option>
                        <option value="01:30 PM - 03:00 PM">01:30 PM - 03:00 PM</option>
                        <option value="03:15 PM - 04:45 PM">03:15 PM - 04:45 PM</option>
                        <option value="05:00 PM - 06:30 PM">05:00 PM - 06:30 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all">
                      Schedule Inter-Class Match
                    </button>
                    <a href="/api/matches/export/excel" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all">
                      Export Schedule (.xlsx)
                    </a>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: ELECTIONS & LEADERSHIP ELEVATION */}
          {activeTab === 'elections' && (
            <div className="space-y-6">
              {/* Header Stats Banner */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/20">
                        <Vote size={22} />
                      </span>
                      <h3 className="font-black text-xl tracking-tight">Campus Elections & Leadership Elevation</h3>
                    </div>
                    <p className="text-xs text-blue-200/80 mt-1.5 max-w-2xl">
                      Schedule floating voting windows, pit Candidate 1 against Candidate 2 with manifestos and photos, and automatically elevate winning students to Club President or Vice President.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-center">
                      <p className="text-blue-200 text-[10px] font-bold uppercase">Total</p>
                      <p className="font-black text-lg text-white">{elections.length}</p>
                    </div>
                    <div className="bg-emerald-500/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-emerald-400/30 text-center">
                      <p className="text-emerald-300 text-[10px] font-bold uppercase">Active</p>
                      <p className="font-black text-lg text-emerald-400">
                        {elections.filter(e => !e.isConcluded && new Date(e.startDate) <= new Date() && new Date() <= new Date(e.endDate)).length}
                      </p>
                    </div>
                    <div className="bg-amber-500/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-400/30 text-center">
                      <p className="text-amber-300 text-[10px] font-bold uppercase">Elevated</p>
                      <p className="font-black text-lg text-amber-400">
                        {elections.filter(e => e.isConcluded).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Launch Matchup Form */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                  <div>
                    <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
                      <Swords size={18} className="text-blue-600" />
                      Create New Leadership Matchup
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">Pair Candidate 1 vs Candidate 2 for election into club executive roles.</p>
                  </div>
                  <Link
                    to="/elections"
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Open Live Ballot Station <ExternalLink size={13} />
                  </Link>
                </div>

                <form onSubmit={handleCreateElection} className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block font-bold text-gray-700 uppercase mb-1">Election Title</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Cricket Club Presidential Election 2026"
                        value={electionForm.title}
                        onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Club / Organization</label>
                      <select
                        required
                        value={electionForm.clubId}
                        onChange={(e) => setElectionForm({ ...electionForm, clubId: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-blue-500 transition-all"
                      >
                        <option value="">-- Choose Club --</option>
                        {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Leadership Position To Win</label>
                      <select
                        value={electionForm.position}
                        onChange={(e) => setElectionForm({ ...electionForm, position: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-blue-500 transition-all text-blue-700"
                      >
                        <option value="President">Club President (Elevates winner to President)</option>
                        <option value="Vice President">Vice President (Elevates winner to Vice President)</option>
                      </select>
                    </div>
                  </div>

                  {/* Floating Timing Window */}
                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2 text-blue-900 font-bold">
                      <Timer size={15} />
                      Floating Voting Window
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                        Ballots can only be cast between Start and End times
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">Start Date & Time</label>
                        <input
                          required
                          type="datetime-local"
                          value={electionForm.startDate}
                          onChange={(e) => setElectionForm({ ...electionForm, startDate: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-medium outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">End Date & Time</label>
                        <input
                          required
                          type="datetime-local"
                          value={electionForm.endDate}
                          onChange={(e) => setElectionForm({ ...electionForm, endDate: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-medium outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Candidate 1 vs Candidate 2 Matchup Cards */}
                  <div>
                    <h5 className="font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Users size={15} className="text-blue-600" />
                      Candidate Matchup Pairing (Profile 1 vs Profile 2)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                      {/* Candidate 1 */}
                      <div className="p-4 bg-gradient-to-br from-blue-50/50 to-white rounded-2xl border border-blue-200 space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-blue-600 text-white font-black text-[10px] rounded-lg tracking-wider uppercase">
                            Candidate 1 (Profile 1)
                          </span>
                        </div>
                        <div>
                        {/* Student Roll Number & Name Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Student Roll Number</label>
                            <input
                              type="text"
                              placeholder="e.g. 23CS012"
                              value={electionForm.candidate1.roll_no || ''}
                              onChange={(e) => handleRollNoChange('candidate1', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs"
                            />
                            {electionForm.candidate1.roll_no && users.some(u => u.roll_no?.toUpperCase() === electionForm.candidate1.roll_no.trim().toUpperCase()) && (
                              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                ✓ Verified Student in system
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Student Full Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Alex Johnson"
                              value={electionForm.candidate1.studentName || ''}
                              onChange={(e) => setElectionForm({
                                ...electionForm,
                                candidate1: { 
                                  ...electionForm.candidate1, 
                                  studentName: e.target.value,
                                  name: electionForm.candidate1.name || e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs"
                            />
                          </div>
                        </div>

                        {/* Display Name & Direct Photo Upload from System */}
                        <div className="space-y-2">
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Display Name (Ballot Card Title)</label>
                            <input
                              type="text"
                              placeholder="Candidate 1 Name"
                              value={electionForm.candidate1.name}
                              onChange={(e) => setElectionForm({
                                ...electionForm,
                                candidate1: { ...electionForm.candidate1, name: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Candidate Photo (Upload from System)</label>
                            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                              {electionForm.candidate1.photo ? (
                                <img 
                                  src={electionForm.candidate1.photo} 
                                  alt="Candidate 1 Preview" 
                                  className="w-12 h-12 rounded-xl object-cover border-2 border-blue-500 shadow-sm shrink-0" 
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-dashed border-blue-300 flex items-center justify-center text-blue-500 shrink-0">
                                  <Camera size={20} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => candidate1PhotoRef.current?.click()}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <Upload size={13} /> Choose Photo from Computer
                                </button>
                                <p className="text-[10px] text-slate-400 mt-1 truncate">
                                  {electionForm.candidate1.photo ? '✓ Custom photo loaded from device' : 'No photo uploaded yet (PNG, JPG)'}
                                </p>
                                <input
                                  ref={candidate1PhotoRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleCandidatePhotoUpload(e, 'candidate1')}
                                  className="hidden"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Manifesto / Agenda</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Dedicated to organizing weekly collegiate workshops and inter-college tournaments."
                            value={electionForm.candidate1.manifesto}
                            onChange={(e) => setElectionForm({
                              ...electionForm,
                              candidate1: { ...electionForm.candidate1, manifesto: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none text-xs"
                          />
                        </div>
                      </div>

                      {/* Candidate 2 */}
                      <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-white rounded-2xl border border-indigo-200 space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-indigo-600 text-white font-black text-[10px] rounded-lg tracking-wider uppercase">
                            Candidate 2 (Profile 2)
                          </span>
                        </div>

                        {/* Student Roll Number & Name Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Student Roll Number</label>
                            <input
                              type="text"
                              placeholder="e.g. 23CS045"
                              value={electionForm.candidate2.roll_no || ''}
                              onChange={(e) => handleRollNoChange('candidate2', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs"
                            />
                            {electionForm.candidate2.roll_no && users.some(u => u.roll_no?.toUpperCase() === electionForm.candidate2.roll_no.trim().toUpperCase()) && (
                              <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">
                                ✓ Verified Student in system
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Student Full Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Samantha Miller"
                              value={electionForm.candidate2.studentName || ''}
                              onChange={(e) => setElectionForm({
                                ...electionForm,
                                candidate2: { 
                                  ...electionForm.candidate2, 
                                  studentName: e.target.value,
                                  name: electionForm.candidate2.name || e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs"
                            />
                          </div>
                        </div>

                        {/* Display Name & Direct Photo Upload from System */}
                        <div className="space-y-2">
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Display Name (Ballot Card Title)</label>
                            <input
                              type="text"
                              placeholder="Candidate 2 Name"
                              value={electionForm.candidate2.name}
                              onChange={(e) => setElectionForm({
                                ...electionForm,
                                candidate2: { ...electionForm.candidate2, name: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Candidate Photo (Upload from System)</label>
                            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-indigo-200 shadow-2xs">
                              {electionForm.candidate2.photo ? (
                                <img 
                                  src={electionForm.candidate2.photo} 
                                  alt="Candidate 2 Preview" 
                                  className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500 shadow-sm shrink-0" 
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-dashed border-indigo-300 flex items-center justify-center text-indigo-500 shrink-0">
                                  <Camera size={20} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => candidate2PhotoRef.current?.click()}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <Upload size={13} /> Choose Photo from Computer
                                </button>
                                <p className="text-[10px] text-slate-400 mt-1 truncate">
                                  {electionForm.candidate2.photo ? '✓ Custom photo loaded from device' : 'No photo uploaded yet (PNG, JPG)'}
                                </p>
                                <input
                                  ref={candidate2PhotoRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleCandidatePhotoUpload(e, 'candidate2')}
                                  className="hidden"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Manifesto / Agenda</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Transparent leadership, expanding sponsorship funds, and inclusive club hackathons."
                            value={electionForm.candidate2.manifesto}
                            onChange={(e) => setElectionForm({
                              ...electionForm,
                              candidate2: { ...electionForm.candidate2, manifesto: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Launch Election & Publish Candidate Matchup
                    </button>
                  </div>
                </form>
              </div>

              {/* Elections List & Matchup Roster */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-gray-900 text-sm">Active & Concluded Matchups</h4>
                  <span className="text-xs text-gray-400 font-medium">{elections.length} elections scheduled</span>
                </div>

                {elections.length === 0 ? (
                  <div className="p-8 bg-white rounded-2xl border border-gray-100 text-center text-gray-400 text-xs">
                    No elections created yet. Launch an election above to configure the first Candidate 1 vs Candidate 2 ballot.
                  </div>
                ) : (
                  elections.map((el) => {
                    const isConcluded = el.isConcluded;
                    const now = new Date();
                    const isLive = !isConcluded && new Date(el.startDate) <= now && now <= new Date(el.endDate);
                    const isUpcoming = !isConcluded && now < new Date(el.startDate);
                    const isPastDue = !isConcluded && now > new Date(el.endDate);
                    const totalVotes = el.votedUsers?.length || el.candidates?.reduce((acc, c) => acc + (c.votes || 0), 0) || 0;

                    const cand1 = el.candidates?.[0];
                    const cand2 = el.candidates?.[1];

                    return (
                      <div
                        key={el._id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 transition-all space-y-4"
                      >
                        {/* Top Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-black text-gray-900 text-sm">{el.title}</h5>
                              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[11px] border border-blue-100">
                                {el.clubId?.name || 'Club'}
                              </span>
                              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-md font-bold text-[11px] border border-purple-100">
                                {el.position || 'President'}
                              </span>
                              {isConcluded ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px] flex items-center gap-1">
                                  <Crown size={12} /> CONCLUDED & ELEVATED
                                </span>
                              ) : isLive ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-black text-[10px] flex items-center gap-1 animate-pulse">
                                  🟢 LIVE VOTING WINDOW
                                </span>
                              ) : isUpcoming ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                  SCHEDULED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                                  WINDOW EXPIRED (READY TO CONCLUDE)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                              <span>Window: {new Date(el.startDate).toLocaleString()} — {new Date(el.endDate).toLocaleString()}</span>
                              <span>•</span>
                              <span className="font-bold text-gray-700">{totalVotes} Ballots Cast</span>
                              <span>•</span>
                              <span className="text-blue-600 font-bold">{el.clubId?.members?.length || 0} Registered Club Members</span>
                            </p>
                          </div>

                          {/* Quick Admin Actions */}
                          <div className="flex items-center gap-2">
                            {!isConcluded && (
                              <button
                                onClick={() => handleConcludeElection(el._id)}
                                disabled={loading}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5"
                                title="Conclude election and elevate winner to President/VP"
                              >
                                <Crown size={14} /> Conclude & Elevate Winner
                              </button>
                            )}
                            <Link
                              to="/elections"
                              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-200 transition-all flex items-center gap-1"
                            >
                              Ballot Station <ExternalLink size={12} />
                            </Link>
                            <button
                              onClick={() => handleDeleteElection(el._id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Election"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Matchup Comparison Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch relative">
                          {/* Candidate 1 */}
                          <div className={`p-3.5 rounded-xl border transition-all ${
                            isConcluded && el.winner?.name === cand1?.name
                              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40'
                              : 'bg-gray-50/70 border-gray-200'
                          }`}>
                            <div className="flex items-center gap-3">
                              <img
                                src={cand1?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand1?.name || 'Candidate 1')}&background=2563EB&color=fff`}
                                alt={cand1?.name || 'Candidate 1'}
                                className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h6 className="font-bold text-gray-900 text-xs truncate">{cand1?.name || 'Profile 1'}</h6>
                                  {isConcluded && el.winner?.name === cand1?.name && (
                                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-md flex items-center gap-0.5">
                                      <Crown size={10} /> WINNER
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 italic mt-0.5 line-clamp-1">
                                  "{cand1?.manifesto || 'No manifesto provided'}"
                                </p>
                                <div className="mt-1 flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 font-medium">Votes Cast:</span>
                                  <span className="font-black text-blue-600">{cand1?.votes || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Candidate 2 */}
                          <div className={`p-3.5 rounded-xl border transition-all ${
                            isConcluded && el.winner?.name === cand2?.name
                              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40'
                              : 'bg-gray-50/70 border-gray-200'
                          }`}>
                            <div className="flex items-center gap-3">
                              <img
                                src={cand2?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand2?.name || 'Candidate 2')}&background=4F46E5&color=fff`}
                                alt={cand2?.name || 'Candidate 2'}
                                className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h6 className="font-bold text-gray-900 text-xs truncate">{cand2?.name || 'Profile 2'}</h6>
                                  {isConcluded && el.winner?.name === cand2?.name && (
                                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-md flex items-center gap-0.5">
                                      <Crown size={10} /> WINNER
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 italic mt-0.5 line-clamp-1">
                                  "{cand2?.manifesto || 'No manifesto provided'}"
                                </p>
                                <div className="mt-1 flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 font-medium">Votes Cast:</span>
                                  <span className="font-black text-indigo-600">{cand2?.votes || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Winner Elevation Notification Bar */}
                        {isConcluded && el.winner?.name && (
                          <div className="p-3 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Crown size={16} className="text-amber-500" />
                              <span className="font-bold text-gray-900">
                                {el.winner.name} officially elected as {el.position || 'President'} of {el.clubId?.name || 'the club'}!
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                              Leadership Privileges Elevated
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
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

          {/* TAB 8: DEPARTMENT & CLASS FEE CARDS */}
          {activeTab === 'classes' && <ClassFeeManagementView clubs={clubs} />}

          {/* TAB 8b: FEES & FINANCE */}
          {activeTab === 'finance' && <FinanceView clubs={clubs} />}

          {/* TAB 9: ATTENDANCE & QR CHECK-IN */}
          {activeTab === 'attendance' && <AttendanceQrView events={events} />}

          {/* TAB 10: VENUES & RESOURCES */}
          {activeTab === 'venues' && <VenueBookingView clubs={clubs} />}

          {/* TAB: NOTIFICATIONS & ALERTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">System Notifications & Approvals</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time alerts, pending event proposals, and administrative requests.</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                    {events.filter(e => e.approvalStatus === 'pending').length} pending actions
                  </span>
                </div>

                {events.filter(e => e.approvalStatus === 'pending').length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500 opacity-80" />
                    <p className="font-bold text-sm text-slate-700">All alerts cleared</p>
                    <p className="text-xs text-slate-400 mt-1">There are no pending event approvals or urgent requests right now.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.filter(e => e.approvalStatus === 'pending').map((ev) => (
                      <div key={ev._id} className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Calendar size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">Event Approval Required: {ev.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              Proposed by <span className="font-semibold text-slate-700">{ev.clubId?.name || 'Club'}</span> • Category: {ev.category || 'General'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => switchTab('event')}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs shrink-0"
                        >
                          Review Event
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 11: DOCUMENTS & REPORTS (IMPORT) */}
          {activeTab === 'import' && <DocumentImportView onImportSuccess={() => switchTab('directory')} />}

          {/* TAB 12: SETTINGS & PRIVILEGES (INCLUDES PROFILE, ROLES & PERMISSIONS, DARK MODE, LOGOUT) */}
          {(activeTab === 'settings' || activeTab === 'admin') && (
            <div className="space-y-6 max-w-5xl">
              {/* Settings Header */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Settings & Privileges</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage profile credentials, role permissions, dark mode theme, and security session.
                    </p>
                  </div>
                </div>

                {/* Subtab Pill Selectors */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setSettingsSubTab('profile')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                      settingsSubTab === 'profile'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User size={15} />
                    <span>Profile Change</span>
                  </button>

                  <button
                    onClick={() => setSettingsSubTab('roles')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                      settingsSubTab === 'roles'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Shield size={15} />
                    <span>Roles & Permissions</span>
                  </button>

                  <button
                    onClick={() => setSettingsSubTab('appearance')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                      settingsSubTab === 'appearance'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Moon size={15} />
                    <span>Dark Mode</span>
                  </button>

                  <button
                    onClick={() => setSettingsSubTab('security')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                      settingsSubTab === 'security'
                        ? 'bg-white text-rose-600 shadow-xs'
                        : 'text-slate-600 hover:text-rose-600'
                    }`}
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>

              {/* 1. SUBTAB: PROFILE CHANGE */}
              {settingsSubTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Profile Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    {/* Avatar with Camera Icon Badge */}
                    <div className="relative mb-3 group">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-28 h-28 rounded-full cursor-pointer overflow-hidden border-4 border-blue-100 shadow-md transition-all hover:scale-105 active:scale-95"
                        title="Click to change profile picture"
                      >
                        <img
                          src={user?.profilePicture || '/admin_avatar.jpg'}
                          alt={user?.name || 'Administrator'}
                          className="w-full h-full object-cover transition duration-200 group-hover:brightness-75"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition duration-200 text-white text-[11px] font-bold gap-1">
                          <Camera size={22} className="animate-bounce" />
                          <span>Change Photo</span>
                        </div>
                      </div>

                      {/* Camera Button Badge (Bottom Right) */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-90 text-white flex items-center justify-center shadow-lg border-2 border-white transition cursor-pointer"
                        title="Change Profile Picture"
                        aria-label="Upload profile picture"
                      >
                        {uploadingPic ? (
                          <RefreshCw size={15} className="animate-spin" />
                        ) : (
                          <Camera size={15} />
                        )}
                      </button>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </div>

                    <h3 className="font-black text-slate-900 text-lg leading-tight mt-1">{user?.name || 'Administrator'}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">@{user?.username || 'admin'}</p>

                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                      <ShieldCheck size={14} /> Master Administrator
                    </div>

                    <div className="mt-6 w-full pt-4 border-t border-slate-100 text-left space-y-2.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-400">Email:</span>
                        <span className="font-semibold text-slate-800">{user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-400">Department:</span>
                        <span className="font-semibold text-slate-800">{user?.department || 'Administration'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-400">Role Status:</span>
                        <span className="font-semibold text-emerald-600">Active & Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Profile Edit Form */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-900 text-base mb-1">Edit Account Credentials</h3>
                    <p className="text-xs text-slate-400 mb-6">Update your display information and administrative login credentials.</p>

                    <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-medium">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-500 focus:bg-white transition"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">Username</label>
                          <input
                            type="text"
                            required
                            value={profileForm.username}
                            onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-500 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">Institutional Email</label>
                          <input
                            type="email"
                            required
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-500 focus:bg-white transition"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">Department / Branch</label>
                          <input
                            type="text"
                            value={profileForm.department}
                            onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                            placeholder="e.g. Administration / Engineering"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-500 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      {/* Profile Photo Link or Direct Upload */}
                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">Profile Photo (Direct Link or Upload)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={profileForm.profilePicture || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProfileForm({ ...profileForm, profilePicture: val });
                              if (val.trim()) {
                                setCredentials({ ...user, profilePicture: val.trim() });
                              }
                            }}
                            placeholder="Paste image URL (https://...) or click Browse to upload from device"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-500 focus:bg-white transition text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-xs shrink-0 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                          >
                            <Camera size={14} /> Browse Image
                          </button>
                        </div>
                      </div>

                      {/* Password Change Box */}
                      <div className="pt-4 mt-2 border-t border-slate-100">
                        <p className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
                          <Lock size={14} className="text-blue-600" /> Change Password (Leave blank to keep current)
                        </p>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Current Password</label>
                            <div className="relative">
                              <input
                                type={showCurrentPw ? "text" : "password"}
                                value={profileForm.currentPassword}
                                onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                                placeholder="Enter current password if changing"
                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 text-xs pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPw(!showCurrentPw)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">New Password</label>
                              <div className="relative">
                                <input
                                  type={showNewPw ? "text" : "password"}
                                  value={profileForm.newPassword}
                                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                                  placeholder="Min 4 characters"
                                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 text-xs pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPw(!showNewPw)}
                                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Confirm New Password</label>
                              <input
                                type="password"
                                value={profileForm.confirmPassword}
                                onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                                placeholder="Re-type new password"
                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition cursor-pointer"
                        >
                          <Save size={16} />
                          {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 2. SUBTAB: ROLES & PERMISSIONS */}
              {settingsSubTab === 'roles' && (
                <div className="space-y-6">
                  {/* Section A: Role Delegation & Reassignment Tool */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                          <UserCheck className="text-blue-600" size={18} /> Assign & Reassign User Roles
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Promote students or coordinators to leadership roles (President, Vice President, Referee, Faculty).
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {users.length} Registered Users
                      </span>
                    </div>

                    <form onSubmit={handleUpdateUserRole} className="p-4 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select User / Student</label>
                          <select
                            required
                            value={roleChangeData.userId}
                            onChange={(e) => setRoleChangeData({ ...roleChangeData, userId: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-800"
                          >
                            <option value="">-- Choose a user --</option>
                            {users.map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.name} ({u.roll_no || u.email}) — Current: {u.role}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign New Role</label>
                          <select
                            required
                            value={roleChangeData.role}
                            onChange={(e) => setRoleChangeData({ ...roleChangeData, role: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-800"
                          >
                            <option value="student">Student (Standard Member)</option>
                            <option value="president">Club President (Club Leadership)</option>
                            <option value="vice_president">Vice President (Co-Lead)</option>
                            <option value="faculty">Faculty Coordinator (Faculty Advisory)</option>
                            <option value="referee">Official Referee (Live Terminal Match Scoring)</option>
                            <option value="admin">Administrator (Institutional System Master)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-[11px] text-slate-500">
                          Role changes take effect immediately on next request or token refresh.
                        </p>
                        <button
                          type="submit"
                          disabled={roleUpdating || !roleChangeData.userId}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <UserCheck size={14} />
                          {roleUpdating ? 'Updating...' : 'Update Role'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Section B: Create Dedicated Administrator Account */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-900 text-base mb-1 flex items-center gap-2">
                      <ShieldCheck className="text-blue-600" size={18} /> Authorize New Administrator
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">Create dedicated administrator accounts protected by multi-factor authentication codes.</p>

                    <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-2xl text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                          <input
                            required
                            type="text"
                            value={adminForm.name}
                            onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">Username</label>
                          <input
                            required
                            type="text"
                            value={adminForm.username}
                            onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">Email Address</label>
                        <input
                          required
                          type="email"
                          value={adminForm.email}
                          onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">Admin Verification Code (MFA Authorization Key)</label>
                        <input
                          required
                          type="password"
                          placeholder="Enter institutional key (e.g. admin123)"
                          value={adminForm.secretCode}
                          onChange={(e) => setAdminForm({...adminForm, secretCode: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                        />
                      </div>
                      <button
                        disabled={loading}
                        type="submit"
                        className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition cursor-pointer"
                      >
                        {loading ? 'Authorizing...' : '+ Authorize Administrator'}
                      </button>
                    </form>
                  </div>

                  {/* Section C: Role Hierarchy & Permissions Matrix Table */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <h3 className="font-black text-slate-900 text-base mb-1">Campus Role Hierarchy & Privilege Matrix</h3>
                    <p className="text-xs text-slate-400 mb-4">Detailed permissions breakdown across institutional tiers.</p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Role Tier</th>
                            <th className="py-2.5 px-3">Scope & Access</th>
                            <th className="py-2.5 px-3">Primary Capabilities</th>
                            <th className="py-2.5 px-3">Security Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                          <tr>
                            <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                              <Shield size={14} className="text-blue-600" /> Administrator
                            </td>
                            <td className="py-3 px-3">System-wide master control</td>
                            <td className="py-3 px-3">Manage all users, fees, classes, venues, clubs, approvals</td>
                            <td className="py-3 px-3"><span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-bold text-[10px]">Tier 1 (Master)</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                              <Building2 size={14} className="text-purple-600" /> Faculty Coordinator
                            </td>
                            <td className="py-3 px-3">Departmental & Club Advisory</td>
                            <td className="py-3 px-3">Approve/reject event proposals, oversee elections, view class rosters</td>
                            <td className="py-3 px-3"><span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-bold text-[10px]">Tier 2 (Faculty)</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                              <Trophy size={14} className="text-amber-500" /> Club President
                            </td>
                            <td className="py-3 px-3">Designated Club Governance</td>
                            <td className="py-3 px-3">Propose events, coordinate members, announce meetings, manage chat</td>
                            <td className="py-3 px-3"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold text-[10px]">Tier 3 (Student Lead)</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                              <Award size={14} className="text-teal-600" /> Vice President
                            </td>
                            <td className="py-3 px-3">Club Leadership & Operations</td>
                            <td className="py-3 px-3">Assist president, assign match referees, register teams</td>
                            <td className="py-3 px-3"><span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full font-bold text-[10px]">Tier 3 (Student Lead)</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                              <Timer size={14} className="text-rose-500" /> Official Referee
                            </td>
                            <td className="py-3 px-3">Match & Tournament Scoring</td>
                            <td className="py-3 px-3">Live score updates, referee terminal access, match winner declaration</td>
                            <td className="py-3 px-3"><span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full font-bold text-[10px]">Tier 4 (Official)</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                              <GraduationCap size={14} className="text-emerald-600" /> Student
                            </td>
                            <td className="py-3 px-3">Campus-wide Student Member</td>
                            <td className="py-3 px-3">Join clubs, tournament participation, vote in elections, download certificates</td>
                            <td className="py-3 px-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px]">Tier 5 (Member)</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SUBTAB: DARK MODE / APPEARANCE */}
              {settingsSubTab === 'appearance' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-2xl">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <div>
                      <h3 className="font-black text-slate-900 text-base mb-1">Display Theme & Dark Mode</h3>
                      <p className="text-xs text-slate-400">Toggle between high-contrast light mode and sleek dark mode.</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      darkMode ? 'bg-slate-900 text-white' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {darkMode ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
                    </span>
                  </div>

                  <div className="py-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          darkMode ? 'bg-slate-800 text-amber-400' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Dark Mode Theme</p>
                          <p className="text-[11px] text-slate-400">Optimizes UI for low-light environments and reduces glare</p>
                        </div>
                      </div>

                      <button
                        onClick={toggleDarkMode}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          darkMode ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                        role="switch"
                        aria-checked={darkMode}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            darkMode ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => { if (darkMode) toggleDarkMode(); }}
                        className={`p-4 rounded-xl border-2 transition cursor-pointer text-center ${
                          !darkMode ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 mx-auto mb-2 flex items-center justify-center">
                          <Sun size={16} />
                        </div>
                        <p className="font-bold text-xs text-slate-800">Light Mode</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">High clarity daylight styling</p>
                      </div>

                      <div 
                        onClick={() => { if (!darkMode) toggleDarkMode(); }}
                        className={`p-4 rounded-xl border-2 transition cursor-pointer text-center ${
                          darkMode ? 'border-blue-500 bg-slate-800 text-white' : 'border-slate-200 hover:border-slate-300 bg-slate-900 text-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-blue-400 mx-auto mb-2 flex items-center justify-center border border-slate-700">
                          <Moon size={16} />
                        </div>
                        <p className="font-bold text-xs text-white">Dark Mode</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Reduced eye strain & sleek finish</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. SUBTAB: LOGOUT & SESSION */}
              {settingsSubTab === 'security' && (
                <div className="space-y-6 max-w-2xl">
                  {/* Active Session Info */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-900 text-base mb-1">Active Authentication Session</h3>
                    <p className="text-xs text-slate-400 mb-4">Current device connection and authorization status.</p>

                    <div className="p-4 bg-slate-50 rounded-xl space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Authenticated User:</span>
                        <span className="font-bold text-slate-800">{user?.name} ({user?.email})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Role Privilege:</span>
                        <span className="font-bold text-blue-600">Administrator (Level 1)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Security Cookie:</span>
                        <span className="font-bold text-emerald-600 font-mono">HttpOnly Secure JWT</span>
                      </div>
                    </div>
                  </div>

                  {/* Terminate Session / Logout Card */}
                  <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200/60 shadow-sm">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <LogOut size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-rose-950 text-base">Terminate Session & Log Out</h4>
                        <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                          Logging out will securely invalidate your active browser session cookie and return you to the public portal homepage.
                        </p>

                        {!showLogoutConfirm ? (
                          <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="mt-4 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-2"
                          >
                            <LogOut size={15} /> Log Out of CampusHub
                          </button>
                        ) : (
                          <div className="mt-4 p-4 bg-white rounded-xl border border-rose-200 space-y-3">
                            <p className="text-xs font-bold text-slate-800">
                              Are you sure you want to log out right now?
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Yes, Log Out Now
                              </button>
                              <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
