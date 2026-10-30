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
  Crown, Trash2, Swords, Check, Camera, Upload, Menu
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
import CertificateManagementView from '../components/admin/CertificateManagementView';
import RoleOnboardingView from '../components/admin/RoleOnboardingView';
import UserAvatar from '../components/ui/UserAvatar';

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

// Two-letter initials for avatar fallbacks (no external avatar services).
const getInitials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// Presentational helpers (landing-style KPI tile + quick action)
const AdminKpiCard = ({ icon: Icon, tint, label, value, hint }) => (
  <div className="card card-hover p-5 min-w-0">
    <div className="flex items-center gap-4">
      <div className={`icon-tile ${tint}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <h3 className="text-2xl font-extrabold text-dark-900 tracking-tight mt-0.5 truncate">{value}</h3>
      </div>
    </div>
    {hint && <div className="mt-3 text-xs text-slate-500">{hint}</div>}
  </div>
);

const AdminQuickAction = ({ onClick, icon: Icon, tint, title, text }) => (
  <button
    onClick={onClick}
    className="p-3.5 bg-white border border-slate-200/70 hover:border-blue-200 hover:shadow-card-hover hover:-translate-y-0.5 rounded-xl transition-all text-left group cursor-pointer min-w-0"
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-105 transition ${tint}`}>
      <Icon size={17} />
    </div>
    <p className="font-semibold text-sm text-dark-900 truncate">{title}</p>
    <p className="text-[11px] text-slate-500 mt-0.5">{text}</p>
  </button>
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
  // Mobile/tablet sidebar drawer state (sidebar is always visible on lg+)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Faculty Advisor in-between update state
  const [editingClubFaculty, setEditingClubFaculty] = useState(null); // clubId
  const [selectedNewFaculty, setSelectedNewFaculty] = useState('');
  const [updatingFaculty, setUpdatingFaculty] = useState(false);

  // Forms
  const [clubForm, setClubForm] = useState({ name: '', category: 'Sports', description: '', logo: '', facultyId: '' });
  const [eventForm, setEventForm] = useState({ title: '', description: '', clubId: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' });
  const [refereeInputMode, setRefereeInputMode] = useState('manual');
  const [matchForm, setMatchForm] = useState({ clubId: '', sport: 'Cricket', wing: 'General', teamA: '', teamB: '', refereeId: '', refereeUsername: '', date: '', timeSlot: '09:00 AM - 10:30 AM' });
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
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be smaller than 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 500;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

        setElectionForm(prev => ({
          ...prev,
          [candidateKey]: { ...prev[candidateKey], photo: compressedBase64 }
        }));
        toast.success(`${candidateKey === 'candidate1' ? 'Candidate 1' : 'Candidate 2'} photo loaded from system!`);
      };
      img.onerror = () => {
        setElectionForm(prev => ({
          ...prev,
          [candidateKey]: { ...prev[candidateKey], photo: event.target.result }
        }));
        toast.success(`${candidateKey === 'candidate1' ? 'Candidate 1' : 'Candidate 2'} photo loaded from system!`);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const { events: rawEvents, fetchEvents, approveEvent, rejectEvent, overrideEvent } = useEventStore();
  const events = Array.isArray(rawEvents) ? rawEvents : [];
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
    setIsSidebarOpen(false);
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
      await axios.put('/api/clubs/recruitment', recruitmentForm, { withCredentials: true });
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
    if (!electionForm.title?.trim()) {
      return toast.error('Please enter an election title');
    }
    if (!electionForm.clubId) {
      return toast.error('Please select a club');
    }
    if (!electionForm.startDate || !electionForm.endDate) {
      return toast.error('Please select both start and end dates/times');
    }
    if (new Date(electionForm.endDate) <= new Date(electionForm.startDate)) {
      return toast.error('Voting end date and time must be after the start date and time');
    }

    // Resolve Candidate 1
    const roll1 = (electionForm.candidate1.roll_no || '').trim().toUpperCase();
    const id1 = electionForm.candidate1.candidateId;
    const u1 = users.find(usr => 
      (id1 && usr._id === id1) ||
      (roll1 && usr.roll_no?.toUpperCase() === roll1) ||
      (roll1 && usr.username?.toUpperCase() === roll1)
    );

    // Resolve Candidate 2
    const roll2 = (electionForm.candidate2.roll_no || '').trim().toUpperCase();
    const id2 = electionForm.candidate2.candidateId;
    const u2 = users.find(usr => 
      (id2 && usr._id === id2) ||
      (roll2 && usr.roll_no?.toUpperCase() === roll2) ||
      (roll2 && usr.username?.toUpperCase() === roll2)
    );

    if (!u1) {
      return toast.error('Candidate 1 must be a valid registered student in the system. Check the roll number.');
    }
    if (!u2) {
      return toast.error('Candidate 2 must be a valid registered student in the system. Check the roll number.');
    }
    if (u1._id === u2._id) {
      return toast.error('Candidate 1 and Candidate 2 must be different students!');
    }

    setLoading(true);
    try {
      const candidates = [
        {
          candidateId: u1._id,
          roll_no: u1.roll_no || roll1,
          studentName: u1.name,
          name: electionForm.candidate1.name?.trim() || u1.name,
          manifesto: electionForm.candidate1.manifesto?.trim() || 'Committed to student empowerment and excellence.',
          photo: electionForm.candidate1.photo || u1.profilePicture || ''
        },
        {
          candidateId: u2._id,
          roll_no: u2.roll_no || roll2,
          studentName: u2.name,
          name: electionForm.candidate2.name?.trim() || u2.name,
          manifesto: electionForm.candidate2.manifesto?.trim() || 'Empowering club members with collaborative leadership.',
          photo: electionForm.candidate2.photo || u2.profilePicture || ''
        }
      ];

      const payload = {
        title: electionForm.title.trim(),
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
      toast.error(err.response?.data?.message || err.message || 'Failed to create election');
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
        backgroundColor: '#0B132B',
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
    const colors = ['#2563EB', '#4F46E5', '#0EA5E9', '#F59E0B', '#10B981', '#8B5CF6', '#94A3B8'];
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
        backgroundColor: ['#2563EB', '#4F46E5', '#0EA5E9', '#F59E0B', '#10B981', '#8B5CF6', '#94A3B8'].slice(0, Math.max(categoryStats.labels.length, 1)),
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
    { id: 'roles_onboarding', label: 'Role Credentials & Onboarding', icon: ShieldCheck },
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
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans antialiased">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-dark-950/50 backdrop-blur-sm z-[35] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 1. DARK NAVY SIDEBAR */}
      <aside className={`w-64 bg-dark-900 text-slate-300 min-h-screen flex flex-col justify-between shrink-0 fixed left-0 top-0 bottom-0 z-40 border-r border-white/5 overflow-y-auto transition-transform duration-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-2 mb-6 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
                <GraduationCap size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="text-white font-extrabold text-lg tracking-tight leading-none">Campus<span className="text-blue-400">Hub</span></h2>
                <p className="text-slate-400 text-[11px] font-medium mt-1 truncate">College Club Management</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition cursor-pointer shrink-0"
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-[11px] uppercase font-semibold tracking-wider text-slate-500 px-3.5 mb-2">
            Main
          </p>
          {/* Main Navigation List */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => switchTab(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={17} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* SYSTEM section */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-[11px] uppercase font-semibold tracking-wider text-slate-500 px-3.5 mb-2">
              System
            </p>
            <nav className="space-y-1">
              {systemNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => switchTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
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
        <div className="p-5 border-t border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-400">System Status</span>
          </div>
          <p className="text-[11px] font-bold text-emerald-400">All Systems Operational</p>
          <span className="text-[10px] text-slate-600 block mt-3 font-mono">v2.0.0</span>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT (LEFT PADDED TO FIT FIXED SIDEBAR) */}
      <div className={`flex-1 ml-0 lg:ml-64 flex flex-col min-w-0 ${darkMode ? 'bg-black text-slate-100' : 'bg-slate-50'}`}>
        {/* TOP BAR */}
        <header className={`${darkMode ? 'bg-black border-slate-800' : 'bg-white/90 backdrop-blur-md border-slate-100'} border-b h-16 px-4 md:px-8 flex items-center justify-between gap-2 sticky top-0 z-30`}>
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden btn-icon shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          {/* Global Search Bar */}
          <div className="flex items-center gap-2 sm:gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3.5 py-2 flex-1 min-w-0 md:flex-none md:w-72 lg:w-96 text-sm text-slate-400 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 focus-within:bg-white transition-all">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, clubs, events, etc..."
              className="bg-transparent text-dark-900 font-medium placeholder-slate-400 focus:outline-none flex-1 min-w-0 text-sm"
            />
          </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link 
              to="/clubs"
              className="btn-secondary btn-sm h-9 px-2.5 sm:px-3"
            >
              <GraduationCap size={15} className="text-blue-600" />
              <span className="hidden sm:inline">Student View</span>
            </Link>
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative btn-icon"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {events.filter(e => e.approvalStatus === 'pending').length > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white flex items-center justify-center shadow-xs">
                    {events.filter(e => e.approvalStatus === 'pending').length}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-80 mt-2 bg-white rounded-2xl shadow-card-hover border border-slate-200/70 p-4 z-50 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <span className="font-bold text-dark-900 text-sm">Notifications</span>
                    {events.filter(e => e.approvalStatus === 'pending').length > 0 ? (
                      <span className="badge-amber">
                        {events.filter(e => e.approvalStatus === 'pending').length} Action Required
                      </span>
                    ) : (
                      <span className="badge-green">
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
                        className="w-full mt-2 py-2 text-center text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
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
              className="btn-icon hidden sm:inline-flex"
              aria-label="Toggle Dark Mode"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-600" />}
            </button>

            {/* Admin User Profile with Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200 hover:opacity-80 transition cursor-pointer text-left"
                title="Administrator Account Menu"
              >
                <UserAvatar user={user} size="md" />
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-bold text-dark-900 leading-tight">{user?.name || 'Admin User'}</p>
                  <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5 flex items-center gap-1">
                    Administrator <ChevronDown size={11} className={`transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
                  </p>
                </div>
              </button>

              {showAdminMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAdminMenu(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-card-hover border border-slate-200/70 p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                      <UserAvatar user={user} size="md" className="w-10 h-10" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-dark-900 truncate">{user?.name || 'Administrator'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@campus.edu'}</p>
                        <span className="badge-blue mt-1">
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
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl font-semibold text-sm transition text-left cursor-pointer"
                      >
                        <User size={15} className="text-blue-600" />
                        <span>Change Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          switchTab('settings', 'roles');
                          setShowAdminMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl font-semibold text-sm transition text-left cursor-pointer"
                      >
                        <Shield size={15} className="text-indigo-600" />
                        <span>Roles & Permissions</span>
                      </button>

                      <button
                        onClick={() => {
                          toggleDarkMode();
                          setShowAdminMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-amber-600 rounded-xl font-semibold text-sm transition text-left cursor-pointer"
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
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold text-sm transition text-left cursor-pointer"
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
        <main className={`p-4 md:p-8 space-y-6 ${darkMode ? 'bg-black text-slate-100' : ''}`}>
          {/* TAB 1: EXACT MATCH TO USER'S DASHBOARD SCREENSHOT */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Greeting Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="min-w-0">
                  <span className="eyebrow mb-3"><ShieldCheck size={14} /> Admin Console</span>
                  <h1 className="page-title break-words">
                    {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Admin'}! <span>👋</span>
                  </h1>
                  <p className="page-subtitle mt-1">Real-time overview of college clubs, events, and student registrations.</p>
                </div>

                <div className="inline-flex items-center gap-2 self-start md:self-auto px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-card whitespace-nowrap">
                  <Calendar size={14} className="text-blue-600" />
                  <span>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Row 1: 4 Real KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <AdminKpiCard
                  icon={Users}
                  tint="bg-blue-50 text-blue-600"
                  label="Total Students"
                  value={users.filter(u => u.role === 'student').length.toLocaleString()}
                  hint="Verified student accounts"
                />
                <AdminKpiCard
                  icon={Share2}
                  tint="bg-indigo-50 text-indigo-600"
                  label="Active Clubs"
                  value={clubs.length.toLocaleString()}
                  hint="Societies & student teams"
                />
                <AdminKpiCard
                  icon={Calendar}
                  tint="bg-sky-50 text-sky-600"
                  label="Upcoming Events"
                  value={events.length.toLocaleString()}
                  hint={<span className="text-amber-600 font-semibold">{events.filter(e => e.approvalStatus === 'pending').length} pending approval</span>}
                />
                <AdminKpiCard
                  icon={Wallet}
                  tint="bg-amber-50 text-amber-600"
                  label="Total Revenue"
                  value={`₹ ${(financeSummary?.totalRevenue || 0).toLocaleString('en-IN')}`}
                  hint="Membership collections & dues"
                />
              </div>

              {/* Row 2: Dual Real-Time Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Student Registration Trend (8 of 12 cols) */}
                <div className="lg:col-span-8 card p-5 sm:p-6 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Activity size={17} />
                        </div>
                        <h4 className="card-title">Student Registration Trend</h4>
                      </div>
                      <span className="badge-slate">
                        Last 6 Months
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-5 text-xs font-semibold text-slate-500 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        <span className="text-slate-600">Registered Students</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-56 sm:h-64 w-full">
                    <Line data={lineChartData} options={lineChartOptions} />
                  </div>
                </div>

                {/* Right: Club Categories Donut (4 of 12 cols) */}
                <div className="lg:col-span-4 card p-5 sm:p-6 flex flex-col justify-between min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h4 className="card-title">Club Categories</h4>
                    <button onClick={() => switchTab('club')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                      Manage Clubs
                    </button>
                  </div>

                  {clubs.length === 0 ? (
                    <div className="py-8 text-center my-auto">
                      <div className="icon-tile bg-slate-100 text-slate-400 mx-auto mb-3"><Share2 size={20} /></div>
                      <p className="font-semibold text-sm text-dark-900">No clubs created yet</p>
                      <p className="text-xs text-slate-500 mt-0.5 mb-3">Categories will compute automatically once clubs are added</p>
                      <button
                        onClick={() => switchTab('club')}
                        className="btn-primary btn-sm"
                      >
                        + Create Club
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-4 my-auto">
                      <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                        <Doughnut data={donutChartData} options={donutChartOptions} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-extrabold text-dark-900">{categoryStats.total}</span>
                          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Clubs</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs font-semibold flex-1 w-full min-w-0">
                        {categoryStats.breakdown.map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                              <span className="text-slate-600 font-medium truncate">{item.label}</span>
                            </div>
                            <span className="text-dark-900 whitespace-nowrap ml-2">
                              {item.count} <span className="text-slate-400 text-[10px]">({item.percentage}%)</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Real Data Sections (Approvals, Clubs Overview, Quick Actions) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {/* 1. Real Event Approvals */}
                <div className="card p-5 sm:p-6 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h4 className="card-title">Event Approvals</h4>
                      <button onClick={() => switchTab('event')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap">
                        View All ({events.length})
                      </button>
                    </div>

                    {events.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">
                        <div className="icon-tile bg-slate-100 text-slate-400 mx-auto mb-3"><Calendar size={20} /></div>
                        <p className="font-semibold text-sm text-dark-900">No events scheduled</p>
                        <p className="text-xs text-slate-500 mt-0.5">Created events will appear here for review</p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {events.slice(0, 5).map((ev) => (
                          <div key={ev._id} className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                ev.approvalStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                ev.approvalStatus === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                <Calendar size={15} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-dark-900 truncate">{ev.title}</p>
                                <p className="text-[11px] text-slate-500 truncate">{ev.clubId?.name || 'Club Event'} • {ev.category || 'General'}</p>
                              </div>
                            </div>
                            <span className={`capitalize shrink-0 ${
                              ev.approvalStatus === 'approved' ? 'badge-green' :
                              ev.approvalStatus === 'rejected' ? 'badge-red' : 'badge-amber'
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
                <div className="card p-5 sm:p-6 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h4 className="card-title">Campus Clubs</h4>
                      <button onClick={() => switchTab('club')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap">
                        View All ({clubs.length})
                      </button>
                    </div>

                    {clubs.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">
                        <div className="icon-tile bg-slate-100 text-slate-400 mx-auto mb-3"><Share2 size={20} /></div>
                        <p className="font-semibold text-sm text-dark-900">No clubs created yet</p>
                        <p className="text-xs text-slate-500 mt-0.5">Clubs you create will appear here</p>
                        <button
                          onClick={() => switchTab('club')}
                          className="btn-primary btn-sm mt-3"
                        >
                          + Create Club
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {[...clubs]
                          .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0))
                          .slice(0, 5)
                          .map((club, idx) => (
                            <div key={club._id} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 transition">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 text-sm">
                                  {club.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-dark-900 truncate">{club.name}</p>
                                  <p className="text-[11px] text-slate-500 font-medium truncate">
                                    {club.category || 'General'}
                                  </p>
                                </div>
                              </div>
                              <span className="badge-slate whitespace-nowrap shrink-0">
                                {club.members?.length || 0} {club.members?.length === 1 ? 'member' : 'members'}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Quick Actions */}
                <div className="card p-5 sm:p-6 min-w-0 md:col-span-2 xl:col-span-1">
                  <h4 className="card-title mb-4">Quick Actions</h4>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    <AdminQuickAction onClick={() => switchTab('club')} icon={Plus} tint="bg-blue-50 text-blue-600" title="Add Club" text="Register a new club" />
                    <AdminQuickAction onClick={() => switchTab('event')} icon={Calendar} tint="bg-indigo-50 text-indigo-600" title="Schedule Event" text="Create campus event" />
                    <AdminQuickAction onClick={() => switchTab('certificates')} icon={Award} tint="bg-emerald-50 text-emerald-600" title="Certificates" text="Generate certificates" />
                    <AdminQuickAction onClick={() => switchTab('finance')} icon={Wallet} tint="bg-violet-50 text-violet-600" title="Fees Ledger" text="Manage fees & dues" />
                    <AdminQuickAction onClick={() => switchTab('directory')} icon={Users} tint="bg-sky-50 text-sky-600" title="User Directory" text="View student roster" />
                    <AdminQuickAction onClick={() => switchTab('import')} icon={FileSpreadsheet} tint="bg-amber-50 text-amber-600" title="Import Students" text="Upload CSV/Excel" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT (STUDENT DIRECTORY) */}
          {activeTab === 'directory' && <StudentDirectoryView />}

          {/* TAB 2b: ROLE CREDENTIALS & CSV/EXCEL ONBOARDING */}
          {activeTab === 'roles_onboarding' && <RoleOnboardingView />}

          {/* TAB 3: CLUBS & MEMBERSHIPS */}
          {activeTab === 'club' && (
            <div className="space-y-6">
              <div className="card p-5 sm:p-6">
                <h3 className="section-title mb-1">Create Institutional Club</h3>
                <p className="text-sm text-slate-500 mb-6">Specify club details and assign a Faculty Advisor / Teacher In-Charge.</p>

                <form onSubmit={handleCreateClub} className="space-y-4 max-w-2xl text-xs">
                  <div>
                    <label className="label">Club Name</label>
                    <input required type="text" placeholder="e.g. Robotics & AI Club" value={clubForm.name} onChange={(e) => setClubForm({...clubForm, name: e.target.value})} className="input" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Category</label>
                      <select required value={clubForm.category} onChange={(e) => setClubForm({...clubForm, category: e.target.value})} className="input">
                        <option value="Sports">Sports</option>
                        <option value="Literary">Literary</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Technical">Technical</option>
                        <option value="Arts">Arts</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Logo URL (Optional)</label>
                      <input type="text" placeholder="https://..." value={clubForm.logo} onChange={(e) => setClubForm({...clubForm, logo: e.target.value})} className="input" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea required rows={3} placeholder="Brief summary of club objectives and student activities..." value={clubForm.description} onChange={(e) => setClubForm({...clubForm, description: e.target.value})} className="input" />
                  </div>

                  {/* President Election Notice (No manual president selector) */}
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                    <Vote size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Club President Selection:</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Presidents are democratically elected by members during Campus Elections. Once an election concludes, the elected student is elevated automatically.
                      </p>
                    </div>
                  </div>

                  {/* Faculty Advisor Typeable Input with Autocomplete */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label className="label mb-0">Faculty Advisor / Teacher In-Charge</label>
                      <span className="badge-blue">Type Name or Email</span>
                    </div>
                    <input
                      type="text"
                      list="facultyListOptions"
                      required
                      placeholder="Type teacher's name or email (e.g. Dr. Sharma or faculty@campus.edu)"
                      value={clubForm.facultyId}
                      onChange={(e) => setClubForm({...clubForm, facultyId: e.target.value})}
                      className="input"
                    />
                    <datalist id="facultyListOptions">
                      {users.map(u => (
                        <option key={u._id} value={u.email}>
                          {u.name} ({u.role}) • {u.department || 'Faculty'}
                        </option>
                      ))}
                    </datalist>
                    <p className="text-[11px] text-slate-400 mt-1">
                      You can type any teacher's name or email directly, or pick from existing accounts.
                    </p>
                  </div>

                  <button disabled={loading} type="submit" className="btn-primary">
                    {loading ? 'Creating...' : '+ Create Club'}
                  </button>
                </form>
              </div>

              {/* Active Clubs & In-Between Faculty Advisor Management */}
              <div className="card p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="section-title flex items-center gap-2">
                      <Share2 size={18} className="text-blue-600 shrink-0" /> Active Clubs & Faculty Advisor Management
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Review campus clubs and update or change their designated Faculty Advisor / Teacher in-between anytime.
                    </p>
                  </div>
                  <span className="badge-blue self-start sm:self-auto shrink-0">
                    {clubs.length} Active Clubs
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {clubs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">No clubs created yet.</div>
                  ) : (
                    clubs.map((c) => (
                      <div key={c._id} className="p-4 bg-white hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="icon-tile bg-blue-50 text-blue-600 font-bold text-base overflow-hidden border border-blue-100">
                            {c.logo ? (
                              <img src={c.logo} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              c.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className="card-title truncate">{c.name}</h4>
                              <span className="badge-slate shrink-0">
                                {c.category || 'General'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              President:{' '}
                              {c.presidentId?.name ? (
                                <span className="font-bold text-slate-700">{c.presidentId.name}</span>
                              ) : (
                                <span className="text-amber-600 font-bold inline-flex items-center gap-1">
                                  <Vote size={12} /> Awaiting Campus Election
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Faculty Advisor Section with Inline Change in-between */}
                        <div className="flex items-center gap-3 min-w-0 md:shrink-0">
                          {editingClubFaculty === c._id ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-blue-50/60 p-2 rounded-xl border border-blue-200 w-full">
                              <input
                                type="text"
                                list="editFacultyListOptions"
                                placeholder="Type teacher's name or email..."
                                value={selectedNewFaculty}
                                onChange={(e) => setSelectedNewFaculty(e.target.value)}
                                className="input py-2 text-xs sm:w-56"
                              />
                              <datalist id="editFacultyListOptions">
                                {users.map(u => (
                                  <option key={u._id} value={u.email}>
                                    {u.name} ({u.role}) • {u.email}
                                  </option>
                                ))}
                              </datalist>
                              <button
                                onClick={() => handleUpdateClubFaculty(c._id)}
                                disabled={updatingFaculty}
                                className="btn-primary btn-sm"
                              >
                                {updatingFaculty ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingClubFaculty(null);
                                  setSelectedNewFaculty('');
                                }}
                                className="btn-secondary btn-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between md:justify-end gap-3 w-full">
                              <div className="text-left md:text-right min-w-0">
                                <p className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">Faculty Advisor / Teacher</p>
                                <p className="text-xs font-bold text-slate-800">
                                  {c.facultyId?.name || 'Not Assigned'}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingClubFaculty(c._id);
                                  setSelectedNewFaculty(c.facultyId?._id || '');
                                }}
                                className="btn-secondary btn-sm shrink-0"
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
              <div className="card p-5 sm:p-6">
                <h3 className="section-title mb-1">Recruitment Phase & Membership Fees</h3>
                <form onSubmit={handleUpdateRecruitment} className="space-y-4 max-w-2xl text-xs">
                  <div>
                    <label className="label">Select Clubs to Configure</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50">
                      {clubs.map(c => (
                        <label key={c._id} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 min-w-0">
                          <input
                            type="checkbox"
                            checked={recruitmentForm.clubIds.includes(c._id)}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...recruitmentForm.clubIds, c._id]
                                : recruitmentForm.clubIds.filter(id => id !== c._id);
                              setRecruitmentForm({...recruitmentForm, clubIds: newIds});
                            }}
                            className="rounded text-blue-600 shrink-0"
                          />
                          <span className="truncate">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Join Fee (₹)</label>
                      <input required type="number" min="0" value={recruitmentForm.joinFee} onChange={(e) => setRecruitmentForm({...recruitmentForm, joinFee: parseInt(e.target.value)})} className="input" />
                    </div>
                    <div>
                      <label className="label">Recruitment Status</label>
                      <select required value={recruitmentForm.isAcceptingMembers ? 'open' : 'closed'} onChange={(e) => setRecruitmentForm({...recruitmentForm, isAcceptingMembers: e.target.value === 'open'})} className="input">
                        <option value="open">Open for Recruitment</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <button disabled={loading} type="submit" className="btn-primary">
                    Update Recruitment Settings
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: EVENTS & APPROVALS */}
          {activeTab === 'event' && (
            <div className="space-y-6">
              <div className="card p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="card-title">Event Approval Queue</h3>
                  <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1">
                    {['all', 'pending', 'approved', 'rejected'].map(st => (
                      <button
                        key={st}
                        onClick={() => setApprovalFilter(st)}
                        className={`tab capitalize py-1.5 text-xs ${
                          approvalFilter === st ? 'tab-active' : 'bg-slate-100'
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
                      <div key={event._id} className="space-y-2">
                        <ApprovalCard event={event} onApprove={handleApprove} onReject={handleReject} isRemoving={false} />
                        {event.approvalStatus !== 'pending' && (
                          <div className="flex justify-end">
                            <button onClick={() => setShowOverrideModal(event)} className="btn-secondary btn-sm">
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
              <div className="card p-5 sm:p-6">
                <h3 className="section-title mb-4">Create Campus Event</h3>
                <form onSubmit={handleCreateEvent} className="space-y-4 max-w-2xl text-xs">
                  <div>
                    <label className="label">Event Title</label>
                    <input required type="text" value={eventForm.title} onChange={(e) => setEventForm({...eventForm, title: e.target.value})} className="input" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Associated Club</label>
                      <select required value={eventForm.clubId} onChange={(e) => setEventForm({...eventForm, clubId: e.target.value})} className="input">
                        <option value="">Select Club</option>
                        {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Category</label>
                      <select required value={eventForm.category} onChange={(e) => setEventForm({...eventForm, category: e.target.value})} className="input">
                        <option value="Sports">Sports</option>
                        <option value="Literary">Literary</option>
                        <option value="Cultural">Cultural</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea required rows={3} value={eventForm.description} onChange={(e) => setEventForm({...eventForm, description: e.target.value})} className="input" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Date & Time</label>
                      <input required type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({...eventForm, date: e.target.value})} className="input" />
                    </div>
                    <div>
                      <label className="label">Max Capacity (0 = unlimited)</label>
                      <input required type="number" min="0" value={eventForm.maxParticipants} onChange={(e) => setEventForm({...eventForm, maxParticipants: parseInt(e.target.value) || 0})} className="input" />
                    </div>
                  </div>
                  <button disabled={loading} type="submit" className="btn-primary">
                    {loading ? 'Creating...' : '+ Publish Event'}
                  </button>
                </form>
              </div>

              {showOverrideModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowOverrideModal(null); }}>
                  <div className="modal-panel sm:max-w-md p-6">
                    <h3 className="text-xl font-bold tracking-tight mb-2 text-dark-900">Administrative Override</h3>
                    <p className="text-sm text-slate-600 mb-4">You are exercising administrative override for "{showOverrideModal.title}".</p>
                    <select id="adminOverrideStatus" className="input mb-4" defaultValue={showOverrideModal.approvalStatus === 'approved' ? 'rejected' : 'approved'}>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <textarea id="adminOverrideReason" placeholder="Reason for administrative override (Required)" className="input mb-4" rows="3"></textarea>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                      <button onClick={() => setShowOverrideModal(null)} className="btn-ghost">Cancel</button>
                      <button onClick={() => handleOverride(showOverrideModal._id, document.getElementById('adminOverrideStatus').value, document.getElementById('adminOverrideReason').value)} className="btn-primary">Confirm Override</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SPORTS & TOURNAMENTS */}
          {activeTab === 'sports' && (
            <div className="space-y-6">
              <div className="card p-5 sm:p-6">
                <h3 className="section-title mb-1">Campus Sports Disciplines</h3>
                <form onSubmit={handleCreateGame} className="space-y-4 max-w-2xl text-xs mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Discipline Name</label>
                      <input type="text" required placeholder="e.g. Volleyball, Chess" value={gameForm.name} onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })} className="input" />
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <select value={gameForm.type} onChange={(e) => setGameForm({ ...gameForm, type: e.target.value })} className="input">
                        <option value="team-based">Team-Based</option>
                        <option value="individual">Individual</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary">
                    + Add Sport
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {games.map(g => (
                    <span key={g._id} className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Gamepad2 size={14} className="text-blue-600" />
                      {g.name} ({g.type})
                    </span>
                  ))}
                </div>
              </div>

              {/* Schedule Inter-Class Match */}
              <div className="card p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="section-title">Schedule Inter-Class Match</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Schedule intra-club fixtures between sections/classes with dedicated referees and rotating slots.</p>
                  </div>
                </div>
                <form onSubmit={handleCreateMatch} className="space-y-4 max-w-3xl text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Club</label>
                      <select required value={matchForm.clubId} onChange={(e) => setMatchForm({...matchForm, clubId: e.target.value})} className="input">
                        <option value="">Select Club</option>
                        {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Sport / Discipline</label>
                      <select required value={matchForm.sport} onChange={(e) => setMatchForm({...matchForm, sport: e.target.value})} className="input">
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
                      <label className="label">Wing</label>
                      <select required value={matchForm.wing} onChange={(e) => setMatchForm({...matchForm, wing: e.target.value})} className="input">
                        <option value="General">General Wing</option>
                        <option value="Junior">Junior Wing (1st & 2nd Year)</option>
                        <option value="Senior">Senior Wing (3rd & 4th Year)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Class / Section A</label>
                      <input required type="text" placeholder="e.g. CSE-A, IT-2nd Year" value={matchForm.teamA} onChange={(e) => setMatchForm({...matchForm, teamA: e.target.value})} className="input" />
                    </div>
                    <div>
                      <label className="label">Class / Section B</label>
                      <input required type="text" placeholder="e.g. CSE-B, MECH-2nd Year" value={matchForm.teamB} onChange={(e) => setMatchForm({...matchForm, teamB: e.target.value})} className="input" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="label mb-0">Assigned Referee</label>
                        <button
                          type="button"
                          onClick={() => setRefereeInputMode(refereeInputMode === 'dropdown' ? 'manual' : 'dropdown')}
                          className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          {refereeInputMode === 'dropdown' ? '✏️ Type Username' : '📋 Select from List'}
                        </button>
                      </div>

                      {refereeInputMode === 'dropdown' ? (
                        <select
                          value={matchForm.refereeId}
                          onChange={(e) => setMatchForm({...matchForm, refereeId: e.target.value, refereeUsername: ''})}
                          className="input"
                        >
                          <option value="">Select Referee</option>
                          {users.filter(u => u.role === 'referee' || u.isReferee || u.role === 'admin').map(u => (
                            <option key={u._id} value={u._id}>{u.name} (@{u.username || u.name})</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Enter referee username or name (e.g. anubhav123)"
                          value={matchForm.refereeUsername || ''}
                          onChange={(e) => setMatchForm({...matchForm, refereeUsername: e.target.value, refereeId: ''})}
                          className="input"
                          required={!matchForm.refereeId}
                        />
                      )}
                    </div>
                    <div>
                      <label className="label">Date</label>
                      <input required type="date" value={matchForm.date} onChange={(e) => setMatchForm({...matchForm, date: e.target.value})} className="input" />
                    </div>
                    <div>
                      <label className="label">Time Slot</label>
                      <select value={matchForm.timeSlot} onChange={(e) => setMatchForm({...matchForm, timeSlot: e.target.value})} className="input">
                        <option value="09:00 AM - 10:30 AM">09:00 AM - 10:30 AM</option>
                        <option value="10:45 AM - 12:15 PM">10:45 AM - 12:15 PM</option>
                        <option value="01:30 PM - 03:00 PM">01:30 PM - 03:00 PM</option>
                        <option value="03:15 PM - 04:45 PM">03:15 PM - 04:45 PM</option>
                        <option value="05:00 PM - 06:30 PM">05:00 PM - 06:30 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                    <button type="submit" disabled={loading} className="btn-primary">
                      Schedule Inter-Class Match
                    </button>
                    <a href="/api/matches/export/excel" className="btn-secondary">
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
              <div className="bg-brand-gradient text-white p-5 sm:p-6 rounded-3xl shadow-brand relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-white/10 text-blue-200 rounded-xl border border-white/15 shrink-0">
                        <Vote size={22} />
                      </span>
                      <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">Campus Elections & Leadership Elevation</h3>
                    </div>
                    <p className="text-sm text-blue-100/80 mt-2 max-w-2xl">
                      Schedule floating voting windows, pit Candidate 1 against Candidate 2 with manifestos and photos, and automatically elevate winning students to Club President or Vice President.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs md:flex md:items-center shrink-0">
                    <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-center">
                      <p className="text-blue-200 text-[11px] font-semibold uppercase tracking-wider">Total</p>
                      <p className="font-bold text-lg text-white">{elections.length}</p>
                    </div>
                    <div className="bg-emerald-500/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-emerald-400/30 text-center">
                      <p className="text-emerald-300 text-[11px] font-semibold uppercase tracking-wider">Active</p>
                      <p className="font-bold text-lg text-emerald-400">
                        {elections.filter(e => !e.isConcluded && new Date(e.startDate) <= new Date() && new Date() <= new Date(e.endDate)).length}
                      </p>
                    </div>
                    <div className="bg-amber-500/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-400/30 text-center">
                      <p className="text-amber-300 text-[11px] font-semibold uppercase tracking-wider">Elevated</p>
                      <p className="font-bold text-lg text-amber-400">
                        {elections.filter(e => e.isConcluded).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Launch Matchup Form */}
              <div className="card p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
                  <div>
                    <h4 className="card-title flex items-center gap-2">
                      <Swords size={18} className="text-blue-600" />
                      Create New Leadership Matchup
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5">Pair Candidate 1 vs Candidate 2 for election into club executive roles.</p>
                  </div>
                  <Link
                    to="/elections"
                    className="btn-soft btn-sm self-start sm:self-auto"
                  >
                    Open Live Ballot Station <ExternalLink size={13} />
                  </Link>
                </div>

                <form onSubmit={handleCreateElection} className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="label">Election Title</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Cricket Club Presidential Election 2026"
                        value={electionForm.title}
                        onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Club / Organization</label>
                      <select
                        required
                        value={electionForm.clubId}
                        onChange={(e) => setElectionForm({ ...electionForm, clubId: e.target.value })}
                        className="input"
                      >
                        <option value="">-- Choose Club --</option>
                        {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Leadership Position To Win</label>
                      <select
                        value={electionForm.position}
                        onChange={(e) => setElectionForm({ ...electionForm, position: e.target.value })}
                        className="input"
                      >
                        <option value="President">Club President (Elevates winner to President)</option>
                        <option value="Vice President">Vice President (Elevates winner to Vice President)</option>
                      </select>
                    </div>
                  </div>

                  {/* Floating Timing Window */}
                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                    <div className="flex flex-wrap items-center gap-2 mb-3 text-blue-900 font-bold">
                      <Timer size={15} />
                      Floating Voting Window
                      <span className="badge-blue font-medium">
                        Ballots can only be cast between Start and End times
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Start Date & Time</label>
                        <input
                          required
                          type="datetime-local"
                          value={electionForm.startDate}
                          onChange={(e) => setElectionForm({ ...electionForm, startDate: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">End Date & Time</label>
                        <input
                          required
                          type="datetime-local"
                          value={electionForm.endDate}
                          onChange={(e) => setElectionForm({ ...electionForm, endDate: e.target.value })}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Candidate 1 vs Candidate 2 Matchup Cards */}
                  <div>
                    <h5 className="font-bold text-dark-900 text-sm mb-3 flex items-center gap-1.5">
                      <Users size={15} className="text-blue-600" />
                      Candidate Matchup Pairing (Profile 1 vs Profile 2)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                      {/* Candidate 1 */}
                      <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-200 space-y-3 relative min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-blue-600 text-white font-semibold text-[11px] rounded-lg">
                            Candidate 1 (Profile 1)
                          </span>
                        </div>

                        {/* Student Roll Number & Name Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="label">Student Roll Number</label>
                            <input
                              type="text"
                              placeholder="e.g. 23CS012"
                              value={electionForm.candidate1.roll_no || ''}
                              onChange={(e) => handleRollNoChange('candidate1', e.target.value)}
                              className="input"
                            />
                            {electionForm.candidate1.roll_no && users.some(u => u.roll_no?.toUpperCase() === electionForm.candidate1.roll_no.trim().toUpperCase()) && (
                              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                ✓ Verified Student in system
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="label">Student Full Name</label>
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
                              className="input"
                            />
                          </div>
                        </div>

                        {/* Display Name & Direct Photo Upload from System */}
                        <div className="space-y-2">
                          <div>
                            <label className="label">Display Name (Ballot Card Title)</label>
                            <input
                              type="text"
                              placeholder="Candidate 1 Name"
                              value={electionForm.candidate1.name}
                              onChange={(e) => setElectionForm({
                                ...electionForm,
                                candidate1: { ...electionForm.candidate1, name: e.target.value }
                              })}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">Candidate Photo (Upload from System)</label>
                            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-blue-200">
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
                                  className="btn-primary btn-sm max-w-full whitespace-normal text-left"
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
                          <label className="label">Manifesto / Agenda</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Dedicated to organizing weekly collegiate workshops and inter-college tournaments."
                            value={electionForm.candidate1.manifesto}
                            onChange={(e) => setElectionForm({
                              ...electionForm,
                              candidate1: { ...electionForm.candidate1, manifesto: e.target.value }
                            })}
                            className="input"
                          />
                        </div>
                      </div>

                      {/* Candidate 2 */}
                      <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-200 space-y-3 relative min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-indigo-600 text-white font-semibold text-[11px] rounded-lg">
                            Candidate 2 (Profile 2)
                          </span>
                        </div>

                        {/* Student Roll Number & Name Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="label">Student Roll Number</label>
                            <input
                              type="text"
                              placeholder="e.g. 23CS045"
                              value={electionForm.candidate2.roll_no || ''}
                              onChange={(e) => handleRollNoChange('candidate2', e.target.value)}
                              className="input"
                            />
                            {electionForm.candidate2.roll_no && users.some(u => u.roll_no?.toUpperCase() === electionForm.candidate2.roll_no.trim().toUpperCase()) && (
                              <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">
                                ✓ Verified Student in system
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="label">Student Full Name</label>
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
                              className="input"
                            />
                          </div>
                        </div>

                        {/* Display Name & Direct Photo Upload from System */}
                        <div className="space-y-2">
                          <div>
                            <label className="label">Display Name (Ballot Card Title)</label>
                            <input
                              type="text"
                              placeholder="Candidate 2 Name"
                              value={electionForm.candidate2.name}
                              onChange={(e) => setElectionForm({
                                ...electionForm,
                                candidate2: { ...electionForm.candidate2, name: e.target.value }
                              })}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">Candidate Photo (Upload from System)</label>
                            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-indigo-200">
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
                                  className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white max-w-full whitespace-normal text-left"
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
                          <label className="label">Manifesto / Agenda</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Transparent leadership, expanding sponsorship funds, and inclusive club hackathons."
                            value={electionForm.candidate2.manifesto}
                            onChange={(e) => setElectionForm({
                              ...electionForm,
                              candidate2: { ...electionForm.candidate2, manifesto: e.target.value }
                            })}
                            className="input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full sm:w-auto whitespace-normal"
                    >
                      <Plus size={16} />
                      Launch Election & Publish Candidate Matchup
                    </button>
                  </div>
                </form>
              </div>

              {/* Elections List & Matchup Roster */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="section-title">Active & Concluded Matchups</h4>
                  <span className="text-xs text-slate-400 font-medium">{elections.length} elections scheduled</span>
                </div>

                {elections.length === 0 ? (
                  <div className="card p-8 text-center text-slate-500 text-sm">
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
                        className="card card-hover p-4 sm:p-5 space-y-4 min-w-0"
                      >
                        {/* Top Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="card-title break-words">{el.title}</h5>
                              <span className="badge-blue">
                                {el.clubId?.name || 'Club'}
                              </span>
                              <span className="badge-indigo">
                                {el.position || 'President'}
                              </span>
                              {isConcluded ? (
                                <span className="badge-green">
                                  <Crown size={12} /> CONCLUDED & ELEVATED
                                </span>
                              ) : isLive ? (
                                <span className="badge-blue animate-pulse">
                                  🟢 LIVE VOTING WINDOW
                                </span>
                              ) : isUpcoming ? (
                                <span className="badge-amber">
                                  SCHEDULED
                                </span>
                              ) : (
                                <span className="badge-red">
                                  WINDOW EXPIRED (READY TO CONCLUDE)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-x-2 gap-y-1 flex-wrap">
                              <span>Window: {new Date(el.startDate).toLocaleString()} — {new Date(el.endDate).toLocaleString()}</span>
                              <span>•</span>
                              <span className="font-bold text-slate-700">{totalVotes} Ballots Cast</span>
                              <span>•</span>
                              <span className="text-blue-600 font-bold">{el.clubId?.members?.length || 0} Registered Club Members</span>
                            </p>
                          </div>

                          {/* Quick Admin Actions */}
                          <div className="flex flex-wrap items-center gap-2">
                            {!isConcluded && (
                              <button
                                onClick={() => handleConcludeElection(el._id)}
                                disabled={loading}
                                className="btn-success btn-sm"
                                title="Conclude election and elevate winner to President/VP"
                              >
                                <Crown size={14} /> Conclude & Elevate Winner
                              </button>
                            )}
                            <Link
                              to="/elections"
                              className="btn-secondary btn-sm"
                            >
                              Ballot Station <ExternalLink size={12} />
                            </Link>
                            <button
                              onClick={() => handleDeleteElection(el._id)}
                              className="btn-icon text-red-500 hover:bg-red-50 hover:text-red-600"
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
                              : 'bg-slate-50/70 border-slate-200'
                          }`}>
                            <div className="flex items-center gap-3">
                              {cand1?.photo && !cand1.photo.startsWith('/default') ? (
                                <img
                                  src={cand1.photo}
                                  alt={cand1?.name || 'Candidate 1'}
                                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                                  {getInitials(cand1?.name || 'Candidate 1')}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h6 className="font-bold text-dark-900 text-xs truncate">{cand1?.name || 'Profile 1'}</h6>
                                  {isConcluded && el.winner?.name === cand1?.name && (
                                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-md flex items-center gap-0.5">
                                      <Crown size={10} /> WINNER
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                                  "{cand1?.manifesto || 'No manifesto provided'}"
                                </p>
                                <div className="mt-1 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400 font-medium">Votes Cast:</span>
                                  <span className="font-bold text-blue-600">{cand1?.votes || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Candidate 2 */}
                          <div className={`p-3.5 rounded-xl border transition-all ${
                            isConcluded && el.winner?.name === cand2?.name
                              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40'
                              : 'bg-slate-50/70 border-slate-200'
                          }`}>
                            <div className="flex items-center gap-3">
                              {cand2?.photo && !cand2.photo.startsWith('/default') ? (
                                <img
                                  src={cand2.photo}
                                  alt={cand2?.name || 'Candidate 2'}
                                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                                  {getInitials(cand2?.name || 'Candidate 2')}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h6 className="font-bold text-dark-900 text-xs truncate">{cand2?.name || 'Profile 2'}</h6>
                                  {isConcluded && el.winner?.name === cand2?.name && (
                                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-md flex items-center gap-0.5">
                                      <Crown size={10} /> WINNER
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                                  "{cand2?.manifesto || 'No manifesto provided'}"
                                </p>
                                <div className="mt-1 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400 font-medium">Votes Cast:</span>
                                  <span className="font-bold text-indigo-600">{cand2?.votes || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Winner Elevation Notification Bar */}
                        {isConcluded && el.winner?.name && (
                          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <Crown size={16} className="text-amber-500" />
                              <span className="font-bold text-dark-900">
                                {el.winner.name} officially elected as {el.position || 'President'} of {el.clubId?.name || 'the club'}!
                              </span>
                            </div>
                            <span className="badge-green self-start sm:self-auto shrink-0">
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
          {activeTab === 'certificates' && <CertificateManagementView />}

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
              <div className="card p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="min-w-0">
                    <h3 className="section-title">System Notifications & Approvals</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Real-time alerts, pending event proposals, and administrative requests.</p>
                  </div>
                  <span className="badge-blue self-start sm:self-auto shrink-0">
                    {events.filter(e => e.approvalStatus === 'pending').length} pending actions
                  </span>
                </div>

                {events.filter(e => e.approvalStatus === 'pending').length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <div className="icon-tile bg-emerald-50 text-emerald-600 mx-auto mb-3"><CheckCircle2 size={22} /></div>
                    <p className="font-bold text-sm text-slate-700">All alerts cleared</p>
                    <p className="text-xs text-slate-400 mt-1">There are no pending event approvals or urgent requests right now.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.filter(e => e.approvalStatus === 'pending').map((ev) => (
                      <div key={ev._id} className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Calendar size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-dark-900 truncate">Event Approval Required: {ev.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              Proposed by <span className="font-semibold text-slate-700">{ev.clubId?.name || 'Club'}</span> • Category: {ev.category || 'General'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => switchTab('event')}
                          className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white shrink-0 self-start sm:self-auto"
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
              <div className="card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-dark-900 tracking-tight">Settings & Privileges</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage profile credentials, role permissions, dark mode theme, and security session.
                    </p>
                  </div>
                </div>

                {/* Subtab Pill Selectors */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto hide-scrollbar max-w-full">
                  <button
                    onClick={() => setSettingsSubTab('profile')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      settingsSubTab === 'profile'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-dark-900'
                    }`}
                  >
                    <User size={15} />
                    <span>Profile Change</span>
                  </button>

                  <button
                    onClick={() => setSettingsSubTab('roles')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      settingsSubTab === 'roles'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-dark-900'
                    }`}
                  >
                    <Shield size={15} />
                    <span>Roles & Permissions</span>
                  </button>

                  <button
                    onClick={() => setSettingsSubTab('appearance')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      settingsSubTab === 'appearance'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-dark-900'
                    }`}
                  >
                    <Moon size={15} />
                    <span>Dark Mode</span>
                  </button>

                  <button
                    onClick={() => setSettingsSubTab('security')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      settingsSubTab === 'security'
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-slate-600 hover:text-red-600'
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
                  <div className="card p-5 sm:p-6 flex flex-col items-center text-center">
                    {/* Avatar with Camera Icon Badge */}
                    <div className="relative mb-3 group">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-28 h-28 rounded-full cursor-pointer overflow-hidden border-4 border-blue-100 shadow-md transition-all hover:scale-105 active:scale-95"
                        title="Click to change profile picture"
                      >
                        <img
                          src={user?.profilePicture && user.profilePicture !== 'default.jpg' ? user.profilePicture : '/admin_avatar.jpg'}
                          alt={user?.name || 'Administrator'}
                          className="w-full h-full object-cover transition duration-200 group-hover:brightness-75"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/admin_avatar.jpg';
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

                    <h3 className="font-bold text-dark-900 text-lg leading-tight mt-1">{user?.name || 'Administrator'}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">@{user?.username || 'admin'}</p>

                    <div className="mt-3 badge-blue px-3 py-1 text-xs">
                      <ShieldCheck size={14} /> Master Administrator
                    </div>

                    <div className="mt-6 w-full pt-4 border-t border-slate-100 text-left space-y-2.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-400">Email:</span>
                        <span className="font-semibold text-slate-800 truncate ml-3">{user?.email || 'N/A'}</span>
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
                  <div className="lg:col-span-2 card p-5 sm:p-6 min-w-0">
                    <h3 className="section-title mb-1">Edit Account Credentials</h3>
                    <p className="text-sm text-slate-500 mb-6">Update your display information and administrative login credentials.</p>

                    <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-medium">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Full Name</label>
                          <input
                            type="text"
                            required
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="label">Username</label>
                          <input
                            type="text"
                            required
                            value={profileForm.username}
                            onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                            className="input"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Institutional Email</label>
                          <input
                            type="email"
                            required
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="label">Department / Branch</label>
                          <input
                            type="text"
                            value={profileForm.department}
                            onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                            placeholder="e.g. Administration / Engineering"
                            className="input"
                          />
                        </div>
                      </div>

                      {/* Profile Photo Link or Direct Upload */}
                      <div>
                        <label className="label">Profile Photo (Direct Link or Upload)</label>
                        <div className="flex flex-col sm:flex-row gap-2">
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
                            className="input"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-soft shrink-0"
                          >
                            <Camera size={14} /> Browse Image
                          </button>
                        </div>
                      </div>

                      {/* Password Change Box */}
                      <div className="pt-4 mt-2 border-t border-slate-100">
                        <p className="font-bold text-dark-900 text-xs mb-3 flex items-center gap-1.5">
                          <Lock size={14} className="text-blue-600" /> Change Password (Leave blank to keep current)
                        </p>

                        <div className="space-y-3">
                          <div>
                            <label className="label">Current Password</label>
                            <div className="relative">
                              <input
                                type={showCurrentPw ? "text" : "password"}
                                value={profileForm.currentPassword}
                                autoComplete="new-password"
                                onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                                placeholder="Enter current password if changing"
                                className="input pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPw(!showCurrentPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="label">New Password</label>
                              <div className="relative">
                                <input
                                  type={showNewPw ? "text" : "password"}
                                  value={profileForm.newPassword}
                                  autoComplete="new-password"
                                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                                  placeholder="Min 4 characters"
                                  className="input pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPw(!showNewPw)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="label">Confirm New Password</label>
                              <input
                                type="password"
                                value={profileForm.confirmPassword}
                                autoComplete="new-password"
                                onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                                placeholder="Re-type new password"
                                className="input"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="btn-primary w-full sm:w-auto"
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
                  <div className="card p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h3 className="section-title flex items-center gap-2">
                          <UserCheck className="text-blue-600" size={18} /> Assign & Reassign User Roles
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          Promote students or coordinators to leadership roles (President, Vice President, Referee, Faculty).
                        </p>
                      </div>
                      <span className="badge-slate self-start sm:self-auto shrink-0">
                        {users.length} Registered Users
                      </span>
                    </div>

                    <form onSubmit={handleUpdateUserRole} className="p-4 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <label className="label mb-0">User / Student</label>
                            <span className="badge-blue">Type Name, Email or Roll No</span>
                          </div>
                          <input
                            type="text"
                            list="roleUserListOptions"
                            required
                            placeholder="Type student name, email, or roll no (e.g. 23CS012)..."
                            value={roleChangeData.userId}
                            onChange={(e) => setRoleChangeData({ ...roleChangeData, userId: e.target.value })}
                            className="input"
                          />
                          <datalist id="roleUserListOptions">
                            {users.map((u) => (
                              <option key={u._id} value={u.name}>
                                {u.email} • {u.roll_no || 'No Roll No'} (Current: {u.role})
                              </option>
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="label">Assign New Role</label>
                          <select
                            required
                            value={roleChangeData.role}
                            onChange={(e) => setRoleChangeData({ ...roleChangeData, role: e.target.value })}
                            className="input"
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

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <p className="text-[11px] text-slate-500">
                          Role changes take effect immediately on next request or token refresh.
                        </p>
                        <button
                          type="submit"
                          disabled={roleUpdating || !roleChangeData.userId}
                          className="btn-primary btn-sm shrink-0"
                        >
                          <UserCheck size={14} />
                          {roleUpdating ? 'Updating...' : 'Update Role'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Section B: Create Dedicated Administrator Account */}
                  <div className="card p-5 sm:p-6">
                    <h3 className="section-title mb-1 flex items-center gap-2">
                      <ShieldCheck className="text-blue-600" size={18} /> Authorize New Administrator
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">Create dedicated administrator accounts protected by multi-factor authentication codes.</p>

                    <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-2xl text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Full Name</label>
                          <input
                            required
                            type="text"
                            value={adminForm.name}
                            onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="label">Username</label>
                          <input
                            required
                            type="text"
                            value={adminForm.username}
                            onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                            className="input"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">Email Address</label>
                        <input
                          required
                          type="email"
                          value={adminForm.email}
                          onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Admin Verification Code (MFA Authorization Key)</label>
                        <input
                          required
                          type="password"
                          placeholder="Enter institutional key (e.g. admin123)"
                          value={adminForm.secretCode}
                          autoComplete="new-password"
                          onChange={(e) => setAdminForm({...adminForm, secretCode: e.target.value})}
                          className="input"
                        />
                      </div>
                      <button
                        disabled={loading}
                        type="submit"
                        className="btn-primary"
                      >
                        {loading ? 'Authorizing...' : '+ Authorize Administrator'}
                      </button>
                    </form>
                  </div>

                  {/* Section C: Role Hierarchy & Permissions Matrix Table */}
                  <div className="card p-5 sm:p-6 overflow-hidden">
                    <h3 className="section-title mb-1">Campus Role Hierarchy & Privilege Matrix</h3>
                    <p className="text-sm text-slate-500 mb-4">Detailed permissions breakdown across institutional tiers.</p>

                    <div className="table-wrap -mx-5 sm:-mx-6 border-t border-slate-100">
                      <table className="data-table min-w-[640px] text-xs">
                        <thead>
                          <tr>
                            <th>Role Tier</th>
                            <th>Scope & Access</th>
                            <th>Primary Capabilities</th>
                            <th>Security Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-bold text-dark-900 whitespace-nowrap"><span className="inline-flex items-center gap-1.5">
                              <Shield size={14} className="text-blue-600" /> Administrator
                            </span></td>
                            <td>System-wide master control</td>
                            <td>Manage all users, fees, classes, venues, clubs, approvals</td>
                            <td><span className="badge-red whitespace-nowrap">Tier 1 (Master)</span></td>
                          </tr>
                          <tr>
                            <td className="font-bold text-dark-900 whitespace-nowrap"><span className="inline-flex items-center gap-1.5">
                              <Building2 size={14} className="text-indigo-600" /> Faculty Coordinator
                            </span></td>
                            <td>Departmental & Club Advisory</td>
                            <td>Approve/reject event proposals, oversee elections, view class rosters</td>
                            <td><span className="badge-indigo whitespace-nowrap">Tier 2 (Faculty)</span></td>
                          </tr>
                          <tr>
                            <td className="font-bold text-dark-900 whitespace-nowrap"><span className="inline-flex items-center gap-1.5">
                              <Trophy size={14} className="text-amber-500" /> Club President
                            </span></td>
                            <td>Designated Club Governance</td>
                            <td>Propose events, coordinate members, announce meetings, manage chat</td>
                            <td><span className="badge-amber whitespace-nowrap">Tier 3 (Student Lead)</span></td>
                          </tr>
                          <tr>
                            <td className="font-bold text-dark-900 whitespace-nowrap"><span className="inline-flex items-center gap-1.5">
                              <Award size={14} className="text-blue-600" /> Vice President
                            </span></td>
                            <td>Club Leadership & Operations</td>
                            <td>Assist president, assign match referees, register teams</td>
                            <td><span className="badge-blue whitespace-nowrap">Tier 3 (Student Lead)</span></td>
                          </tr>
                          <tr>
                            <td className="font-bold text-dark-900 whitespace-nowrap"><span className="inline-flex items-center gap-1.5">
                              <Timer size={14} className="text-rose-500" /> Official Referee
                            </span></td>
                            <td>Match & Tournament Scoring</td>
                            <td>Live score updates, referee terminal access, match winner declaration</td>
                            <td><span className="badge-slate whitespace-nowrap">Tier 4 (Official)</span></td>
                          </tr>
                          <tr>
                            <td className="font-bold text-dark-900 whitespace-nowrap"><span className="inline-flex items-center gap-1.5">
                              <GraduationCap size={14} className="text-emerald-600" /> Student
                            </span></td>
                            <td>Campus-wide Student Member</td>
                            <td>Join clubs, tournament participation, vote in elections, download certificates</td>
                            <td><span className="badge-green whitespace-nowrap">Tier 5 (Member)</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SUBTAB: DARK MODE / APPEARANCE */}
              {settingsSubTab === 'appearance' && (
                <div className="card p-5 sm:p-6 max-w-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
                    <div>
                      <h3 className="section-title mb-1">Display Theme & Dark Mode</h3>
                      <p className="text-sm text-slate-500">Toggle between high-contrast light mode and sleek dark mode.</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      darkMode ? 'bg-dark-900 text-white' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {darkMode ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
                    </span>
                  </div>

                  <div className="py-6 space-y-6">
                    <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          darkMode ? 'bg-slate-800 text-amber-400' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-dark-900">Dark Mode Theme</p>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          darkMode ? 'border-blue-500 bg-slate-800 text-white' : 'border-slate-200 hover:border-slate-300 bg-dark-900 text-white'
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
                  <div className="card p-5 sm:p-6">
                    <h3 className="section-title mb-1">Active Authentication Session</h3>
                    <p className="text-sm text-slate-500 mb-4">Current device connection and authorization status.</p>

                    <div className="p-4 bg-slate-50 rounded-xl space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Authenticated User:</span>
                        <span className="font-bold text-slate-800 text-right break-all ml-3">{user?.name} ({user?.email})</span>
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
                  <div className="bg-red-50/50 p-5 sm:p-6 rounded-2xl border border-red-200/60">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <LogOut size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-red-950 text-base">Terminate Session & Log Out</h4>
                        <p className="text-sm text-red-700 mt-1 leading-relaxed">
                          Logging out will securely invalidate your active browser session cookie and return you to the public portal homepage.
                        </p>

                        {!showLogoutConfirm ? (
                          <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="btn-danger mt-4"
                          >
                            <LogOut size={15} /> Log Out of CampusHub
                          </button>
                        ) : (
                          <div className="mt-4 p-4 bg-white rounded-xl border border-red-200 space-y-3">
                            <p className="text-xs font-bold text-slate-800">
                              Are you sure you want to log out right now?
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={handleLogout}
                                className="btn-danger btn-sm"
                              >
                                Yes, Log Out Now
                              </button>
                              <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="btn-secondary btn-sm"
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
