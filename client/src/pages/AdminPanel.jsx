import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Shield, PlusCircle, LayoutDashboard, Users, Calendar, Trophy, Image as ImageIcon, CheckSquare, Activity, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import useEventStore from '../store/eventStore';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import ApprovalCard from '../components/ApprovalCard';

const AdminPanel = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('club');
  const [loading, setLoading] = useState(false);
  
  // Data for dropdowns
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);

  // Form states
  const [clubForm, setClubForm] = useState({ name: '', category: 'Sports', description: '', logo: '', presidentId: '', facultyId: '' });
  const [eventForm, setEventForm] = useState({ title: '', description: '', clubId: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' });
  const [matchForm, setMatchForm] = useState({ teamA: '', teamB: '', refereeId: '', date: '' });
  const [recruitmentForm, setRecruitmentForm] = useState({ clubIds: [], joinFee: 500, isAcceptingMembers: true });
  const [adminForm, setAdminForm] = useState({ name: '', username: '', email: '', secretCode: '' });

  const { events, fetchEvents, approveEvent, rejectEvent, overrideEvent } = useEventStore();
  const [approvalNote, setApprovalNote] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(null);
  const [approvalFilter, setApprovalFilter] = useState('pending');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [usersRes, clubsRes] = await Promise.all([
          axios.get('/api/auth/users', { withCredentials: true }),
          axios.get('/api/clubs') // public
        ]);
        setUsers(usersRes.data);
        setClubs(clubsRes.data);
        fetchEvents();
      } catch (err) {
        toast.error('Failed to load necessary data');
      }
    };
    fetchData();
  }, [user, navigate, fetchEvents]);

  const handleCreateClub = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/clubs', clubForm, { withCredentials: true });
      toast.success('Club created successfully');
      setClubForm({ name: '', category: 'Sports', description: '', logo: '', presidentId: '', facultyId: '' });
      // Refresh clubs
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
      toast.success('Match created successfully');
      setMatchForm({ teamA: '', teamB: '', refereeId: '', date: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecruitment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('/api/clubs/recruitment', recruitmentForm, { withCredentials: true });
      toast.success('Recruitment phase updated successfully');
      setRecruitmentForm({ clubIds: [], joinFee: 500, isAcceptingMembers: true });
      const clubsRes = await axios.get('/api/clubs');
      setClubs(clubsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update recruitment phase');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { ...adminForm, role: 'admin' });
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

  const handleApprove = async (id) => {
    await approveEvent(id, approvalNote);
    setApprovalNote('');
    fetchEvents();
  };

  const handleReject = async (id) => {
    if (!approvalNote) {
      toast.error("Please provide a reason for rejection in the note field.");
      return;
    }
    await rejectEvent(id, approvalNote);
    setApprovalNote('');
    fetchEvents();
  };

  const handleOverride = async (id, status, reason) => {
    await overrideEvent(id, status, reason);
    setShowOverrideModal(null);
    fetchEvents();
  };

  const tabClass = (tabName) => 
    `flex items-center gap-2 px-6 py-4 font-bold transition-all border-b-2 ${activeTab === tabName ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8 p-8 rounded-[32px] bg-dark-800 text-white relative overflow-hidden shadow-xl border border-slate-700/50">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2 uppercase tracking-tight">
            <Shield className="text-primary-500" size={32} /> Admin Dashboard
          </h1>
          <p className="text-slate-400 font-medium text-lg">Manage platform entities efficiently.</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary-900/50 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Clubs" value={clubs.length} icon={Users} />
        <StatCard title="Pending Approvals" value={events.filter(e => e.approvalStatus === 'pending').length} icon={CheckSquare} colorClass="text-amber-600" bgClass="bg-amber-50" chartColor="#d97706" />
        <StatCard title="Active Events" value={events.length} icon={Calendar} colorClass="text-green-600" bgClass="bg-green-50" chartColor="#16a34a" />
        <StatCard title="Matches (Month)" value={5} icon={Activity} colorClass="text-blue-600" bgClass="bg-blue-50" chartColor="#2563eb" />
      </div>

      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden mb-8 border border-gray-100">
        <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab('club')} className={tabClass('club')}><Users size={18}/> Create Club</button>
          <button onClick={() => setActiveTab('admin')} className={tabClass('admin')}><Shield size={18}/> Manage Admins</button>
          <button onClick={() => setActiveTab('recruitment')} className={tabClass('recruitment')}><CheckSquare size={18}/> Manage Recruitment</button>
          <button onClick={() => setActiveTab('event')} className={tabClass('event')}><Calendar size={18}/> Create Event</button>
          <button onClick={() => setActiveTab('approvals')} className={tabClass('approvals')}><CheckSquare size={18}/> Event Approvals {events.filter(e => e.approvalStatus === 'pending').length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full inline-block ml-1"></span>}</button>
          <button onClick={() => setActiveTab('match')} className={tabClass('match')}><Trophy size={18}/> Create Match</button>
        </div>

        <div className="p-8">
          {activeTab === 'admin' && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleCreateAdmin} className="space-y-6 max-w-2xl">
              <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 mb-6">
                <p className="text-primary-800 text-sm font-medium">
                  Create a new administrator account. They will receive an OTP on their email to verify. Once verified, they can log in using the Admin Secret Code.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input required type="text" value={adminForm.name} onChange={(e) => setAdminForm({...adminForm, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                  <input required type="text" value={adminForm.username} onChange={(e) => setAdminForm({...adminForm, username: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <input required type="email" value={adminForm.email} onChange={(e) => setAdminForm({...adminForm, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Admin Secret Code (MFA)</label>
                <input required type="password" value={adminForm.secretCode} onChange={(e) => setAdminForm({...adminForm, secretCode: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Enter the global admin secret code" />
              </div>
              <button disabled={loading} type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all hover:shadow-soft-purple hover:-translate-y-1">
                {loading ? 'Creating...' : <><Shield size={20} /> Create Admin</>}
              </button>
            </motion.form>
          )}

          {activeTab === 'club' && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleCreateClub} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Club Name</label>
                <input required type="text" value={clubForm.name} onChange={(e) => setClubForm({...clubForm, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select required value={clubForm.category} onChange={(e) => setClubForm({...clubForm, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                  <option value="Sports">Sports</option>
                  <option value="Literary">Literary</option>
                  <option value="Cultural">Cultural</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea required value={clubForm.description} onChange={(e) => setClubForm({...clubForm, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" rows="4"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Logo URL (Optional)</label>
                <input type="text" value={clubForm.logo} onChange={(e) => setClubForm({...clubForm, logo: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">President</label>
                  <select required value={clubForm.presidentId} onChange={(e) => setClubForm({...clubForm, presidentId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                    <option value="">Select User</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Faculty Advisor</label>
                  <select required value={clubForm.facultyId} onChange={(e) => setClubForm({...clubForm, facultyId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                    <option value="">Select User</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
              </div>
              <button disabled={loading} type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all hover:shadow-soft-purple hover:-translate-y-1">
                {loading ? 'Creating...' : <><PlusCircle size={20} /> Create Club</>}
              </button>
            </motion.form>
          )}

          {activeTab === 'event' && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleCreateEvent} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Event Title</label>
                <input required type="text" value={eventForm.title} onChange={(e) => setEventForm({...eventForm, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Associated Club</label>
                <select required value={eventForm.clubId} onChange={(e) => setEventForm({...eventForm, clubId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                  <option value="">Select Club</option>
                  {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select required value={eventForm.category} onChange={(e) => setEventForm({...eventForm, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                  <option value="Sports">Sports</option>
                  <option value="Literary">Literary</option>
                  <option value="Cultural">Cultural</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea required value={eventForm.description} onChange={(e) => setEventForm({...eventForm, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" rows="4"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date & Time</label>
                  <input required type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({...eventForm, date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Max Participants (0 for unlimited)</label>
                  <input required type="number" min="0" value={eventForm.maxParticipants} onChange={(e) => setEventForm({...eventForm, maxParticipants: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Poster URL (Optional)</label>
                <input type="text" value={eventForm.poster} onChange={(e) => setEventForm({...eventForm, poster: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <button disabled={loading} type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all hover:shadow-soft-purple hover:-translate-y-1">
                {loading ? 'Creating...' : <><PlusCircle size={20} /> Create Event</>}
              </button>
            </motion.form>
          )}

          {activeTab === 'match' && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleCreateMatch} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Team A</label>
                  <input required type="text" value={matchForm.teamA} onChange={(e) => setMatchForm({...matchForm, teamA: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Team B</label>
                  <input required type="text" value={matchForm.teamB} onChange={(e) => setMatchForm({...matchForm, teamB: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Referee</label>
                <select required value={matchForm.refereeId} onChange={(e) => setMatchForm({...matchForm, refereeId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                  <option value="">Select Referee</option>
                  {users.filter(u => u.role === 'referee' || u.role === 'admin').map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date & Time</label>
                <input required type="datetime-local" value={matchForm.date} onChange={(e) => setMatchForm({...matchForm, date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <button disabled={loading} type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all hover:shadow-soft-purple hover:-translate-y-1">
                {loading ? 'Creating...' : <><PlusCircle size={20} /> Create Match</>}
              </button>
            </motion.form>
          )}

          {activeTab === 'recruitment' && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleUpdateRecruitment} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Clubs</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-4 border border-gray-200 rounded-xl bg-gray-50">
                  {clubs.map(c => (
                    <label key={c._id} className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={recruitmentForm.clubIds.includes(c._id)}
                        onChange={(e) => {
                          const newIds = e.target.checked 
                            ? [...recruitmentForm.clubIds, c._id]
                            : recruitmentForm.clubIds.filter(id => id !== c._id);
                          setRecruitmentForm({...recruitmentForm, clubIds: newIds});
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-bold text-gray-700">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Join Fee (₹)</label>
                  <input required type="number" min="0" value={recruitmentForm.joinFee} onChange={(e) => setRecruitmentForm({...recruitmentForm, joinFee: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  <select required value={recruitmentForm.isAcceptingMembers ? 'open' : 'closed'} onChange={(e) => setRecruitmentForm({...recruitmentForm, isAcceptingMembers: e.target.value === 'open'})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                    <option value="open">Open for Recruitment</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <button disabled={loading} type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all hover:shadow-soft-purple hover:-translate-y-1">
                {loading ? 'Updating...' : <><CheckSquare size={20} /> Update Recruitment Phase</>}
              </button>
            </motion.form>
          )}

          {activeTab === 'approvals' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4 overflow-x-auto hide-scrollbar">
                <button onClick={() => setApprovalFilter('all')} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${approvalFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All ({events.length})</button>
                <button onClick={() => setApprovalFilter('pending')} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${approvalFilter === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Pending ({events.filter(e => e.approvalStatus === 'pending').length})</button>
                <button onClick={() => setApprovalFilter('approved')} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${approvalFilter === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Approved ({events.filter(e => e.approvalStatus === 'approved').length})</button>
                <button onClick={() => setApprovalFilter('rejected')} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${approvalFilter === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Rejected ({events.filter(e => e.approvalStatus === 'rejected').length})</button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {events.filter(e => approvalFilter === 'all' ? true : e.approvalStatus === approvalFilter).length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="Nothing here!" description="No events match this filter." />
                ) : (
                  <AnimatePresence mode="popLayout">
                    {events.filter(e => approvalFilter === 'all' ? true : e.approvalStatus === approvalFilter).map(event => (
                      <div key={event._id} className="relative">
                        <ApprovalCard event={event} onApprove={handleApprove} onReject={handleReject} isRemoving={false} />
                        {event.approvalStatus !== 'pending' && (
                          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
                            <button onClick={() => setShowOverrideModal(event)} className="px-3 py-1.5 bg-white border border-gray-200 shadow-sm text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                              Override Status
                            </button>
                          </div>
                        )}
                        {event.approvalOverride?.reason && (
                          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10 text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">
                            Override: {event.approvalOverride.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
              
              {showOverrideModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                    <h3 className="text-xl font-black mb-2">Override Status</h3>
                    <p className="text-sm text-gray-500 mb-4">You are about to change the status of "{showOverrideModal.title}".</p>
                    <select id="overrideStatus" className="w-full mb-4 px-4 py-2 border border-gray-200 rounded-lg outline-none" defaultValue={showOverrideModal.approvalStatus === 'approved' ? 'rejected' : 'approved'}>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <textarea id="overrideReason" placeholder="Reason for override (Required)" className="w-full mb-4 px-4 py-2 border border-gray-200 rounded-lg outline-none" rows="3"></textarea>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowOverrideModal(null)} className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                      <button onClick={() => handleOverride(showOverrideModal._id, document.getElementById('overrideStatus').value, document.getElementById('overrideReason').value)} className="px-4 py-2 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg">Confirm Override</button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
