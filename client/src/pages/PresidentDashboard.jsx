import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useClubStore from '../store/clubStore';
import useEventStore from '../store/eventStore';
import useMatchStore from '../store/matchStore';
import { Shield, Users, Calendar, Trophy, Check, X, Edit, Trash2, Crown, MessageSquare, Plus, Timer, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';

const PresidentDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { clubs, fetchPresidentClubs, approveMember } = useClubStore();
  const { events, fetchEventsByClub, createEvent, updateEvent, deleteEvent } = useEventStore();
  const { matches, fetchMatches } = useMatchStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClub, setSelectedClub] = useState(null);

  // Form states
  const [eventForm, setEventForm] = useState({ 
    title: '', 
    description: '', 
    category: 'Sports', 
    maxParticipants: 0, 
    date: '', 
    poster: '', 
    requiresApproval: false 
  });
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  // Referee Management State
  const [referees, setReferees] = useState([]);
  const [refereeForm, setRefereeForm] = useState({
    name: '',
    email: '',
    roll_no: '',
    department: 'Computer Science',
    course: 'B.Tech',
    section: 'A',
    year: 3
  });
  const [isAssigningRef, setIsAssigningRef] = useState(false);

  useEffect(() => {
    if (user?.role !== 'president' && user?.role !== 'vice_president' && user?.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    fetchPresidentClubs();
    fetchMatches();
    fetchReferees();
  }, [user, navigate, fetchPresidentClubs, fetchMatches]);

  const fetchReferees = async () => {
    try {
      const res = await axios.get('/api/auth/referees');
      setReferees(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignReferee = async (e) => {
    e.preventDefault();
    setIsAssigningRef(true);
    try {
      await axios.post('/api/auth/assign-referee', refereeForm, { withCredentials: true });
      toast.success('Student designated as official referee!');
      setRefereeForm({
        name: '',
        email: '',
        roll_no: '',
        department: 'Computer Science',
        course: 'B.Tech',
        section: 'A',
        year: 3
      });
      fetchReferees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to designate referee');
    } finally {
      setIsAssigningRef(false);
    }
  };

  useEffect(() => {
    if (clubs && clubs.length > 0 && !selectedClub) {
      setSelectedClub(clubs[0]);
    }
  }, [clubs, selectedClub]);

  useEffect(() => {
    if (selectedClub?._id) {
      fetchEventsByClub(selectedClub._id);
    }
  }, [selectedClub, fetchEventsByClub]);

  const handleMemberAction = async (userId, action) => {
    if (selectedClub) {
      await approveMember(selectedClub._id, userId, action);
      fetchPresidentClubs();
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (isEditingEvent) {
      await updateEvent(editingEventId, eventForm);
    } else {
      await createEvent({ ...eventForm, clubId: selectedClub._id });
    }
    setEventForm({ title: '', description: '', category: 'Sports', maxParticipants: 0, date: '', poster: '', requiresApproval: false });
    setIsEditingEvent(false);
    setEditingEventId(null);
    fetchEventsByClub(selectedClub._id);
  };

  const handleEditEventClick = (event) => {
    setIsEditingEvent(true);
    setEditingEventId(event._id);
    setEventForm({
      title: event.title,
      description: event.description,
      category: event.category || 'Sports',
      maxParticipants: event.maxParticipants || 0,
      date: new Date(event.date).toISOString().slice(0, 16),
      poster: event.poster || '',
      requiresApproval: event.requiresApproval || false
    });
    setActiveTab('events');
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(id);
      fetchEventsByClub(selectedClub._id);
    }
  };

  const tabClass = (tabName) => 
    `flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 cursor-pointer ${
      activeTab === tabName 
        ? 'border-teal-600 text-teal-700 bg-teal-50/50' 
        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    }`;

  if (!clubs || clubs.length === 0) {
    return (
      <div className="p-6 md:p-12 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
            <Crown size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">President Terminal</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You are logged in as President. No active club assignments were found for your profile.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/clubs" className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition">
              Explore Clubs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const clubMatches = matches.filter(m => m.teamA === selectedClub?.name || m.teamB === selectedClub?.name);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="mb-8 p-8 rounded-[32px] text-white relative overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #115e59 100%)' }}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-teal-100 text-xs font-black uppercase tracking-wider mb-3 backdrop-blur-xs">
              <Crown size={14} className="text-amber-300" />
              <span>{user?.role === 'vice_president' ? 'Vice President Terminal' : 'Club Leadership'}</span>
            </div>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
              {user?.role === 'vice_president' ? 'Vice President Panel' : 'President Dashboard'}
            </h1>
            <p className="text-teal-100 font-medium text-base">
              Manage your club roster, evaluate student applications, and organize events.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {clubs.length > 1 && (
              <select 
                className="bg-black/25 text-white border border-white/20 rounded-xl px-4 py-2.5 outline-none font-bold text-sm backdrop-blur-sm cursor-pointer"
                value={selectedClub?._id || ''}
                onChange={(e) => setSelectedClub(clubs.find(c => c._id === e.target.value))}
              >
                {clubs.map(c => <option key={c._id} value={c._id} className="text-gray-900">{c.name}</option>)}
              </select>
            )}

            <Link
              to={`/chat?clubId=${selectedClub?._id}`}
              className="px-4 py-2.5 bg-white text-teal-800 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-teal-50 transition shadow-sm"
            >
              <MessageSquare size={16} /> Club Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Card */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden mb-8 border border-gray-100">
        <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
            <Shield size={18}/> Overview
          </button>
          <button onClick={() => setActiveTab('members')} className={tabClass('members')}>
            <Users size={18}/> Members 
            {selectedClub?.pendingRequests?.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-black">
                {selectedClub.pendingRequests.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('events')} className={tabClass('events')}>
            <Calendar size={18}/> Events
          </button>
          <button onClick={() => setActiveTab('matches')} className={tabClass('matches')}>
            <Trophy size={18}/> Matches ({clubMatches.length})
          </button>
          <button onClick={() => setActiveTab('referees')} className={tabClass('referees')}>
            <Timer size={18}/> Student Referees ({referees.length})
          </button>
        </div>

        <div className="p-6 md:p-8">
          {/* OVERVIEW */}
          {activeTab === 'overview' && selectedClub && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-teal-50/70 p-6 rounded-2xl border border-teal-100">
                  <h3 className="text-teal-700 font-bold mb-1 text-sm">Total Members</h3>
                  <p className="text-4xl font-black text-gray-900">{selectedClub.members?.length || 0}</p>
                  <p className="text-xs text-teal-600 mt-2 font-medium">Registered club students</p>
                </div>
                <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-100">
                  <h3 className="text-amber-700 font-bold mb-1 text-sm">Pending Requests</h3>
                  <p className="text-4xl font-black text-amber-800">{selectedClub.pendingRequests?.length || 0}</p>
                  <p className="text-xs text-amber-600 mt-2 font-medium">Awaiting your approval</p>
                </div>
                <div className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-100">
                  <h3 className="text-emerald-700 font-bold mb-1 text-sm">Upcoming Events</h3>
                  <p className="text-4xl font-black text-emerald-800">{events.filter(e => new Date(e.date) > new Date()).length}</p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">{events.length} total events</p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-black text-gray-900 text-lg">{selectedClub.name}</h4>
                  <p className="text-sm text-gray-600 mt-1 max-w-2xl">{selectedClub.description}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTab('members')}
                    className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 transition cursor-pointer"
                  >
                    Manage Members
                  </button>
                  <button 
                    onClick={() => setActiveTab('events')}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-200 font-bold text-xs rounded-xl hover:bg-gray-50 transition cursor-pointer"
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* MEMBERS */}
          {activeTab === 'members' && selectedClub && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div>
                <h2 className="text-xl font-black mb-4 flex items-center justify-between">
                  <span>Pending Requests</span>
                  <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-extrabold">
                    {selectedClub.pendingRequests?.length || 0} pending
                  </span>
                </h2>
                {(!selectedClub.pendingRequests || selectedClub.pendingRequests.length === 0) ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 font-medium">
                    No pending membership applications.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedClub.pendingRequests.map(req => (
                      <div key={req._id} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-xl shadow-xs hover:border-teal-200 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-teal-100 text-teal-800 rounded-full font-black flex items-center justify-center text-sm">
                            {req.name ? req.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{req.name}</p>
                            <p className="text-xs text-gray-500 font-medium">
                              {req.email} • Roll: {req.roll_no || 'N/A'} • {req.department || 'Student'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleMemberAction(req._id, 'approve')} 
                            className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition flex items-center gap-1.5 text-xs cursor-pointer"
                          >
                            <Check size={16}/> Approve
                          </button>
                          <button 
                            onClick={() => handleMemberAction(req._id, 'reject')} 
                            className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition flex items-center gap-1.5 text-xs cursor-pointer"
                          >
                            <X size={16}/> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-black mb-4">Current Members ({selectedClub.members?.length || 0})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedClub.members?.map(member => (
                    <div key={member._id} className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="w-10 h-10 bg-teal-100 text-teal-800 rounded-full font-bold flex items-center justify-center text-sm">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{member.name}</p>
                        <p className="text-xs text-gray-500 truncate">{member.department || 'Member'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* EVENTS */}
          {activeTab === 'events' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <h2 className="text-xl font-black mb-4">{isEditingEvent ? 'Edit Event' : 'Create New Event'}</h2>
                <form onSubmit={handleEventSubmit} className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                    <input 
                      required 
                      type="text" 
                      value={eventForm.title} 
                      onChange={e => setEventForm({...eventForm, title: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-teal-500 outline-none text-sm font-medium" 
                      placeholder="e.g. Inter-College Cricket Tournament"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea 
                      required 
                      rows="3" 
                      value={eventForm.description} 
                      onChange={e => setEventForm({...eventForm, description: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-teal-500 outline-none text-sm font-medium" 
                      placeholder="Event details, guidelines, rules..."
                    ></textarea>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Date & Time</label>
                      <input 
                        required 
                        type="datetime-local" 
                        value={eventForm.date} 
                        onChange={e => setEventForm({...eventForm, date: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-teal-500 outline-none text-sm font-medium" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Max Participants (0=Unlimited)</label>
                      <input 
                        required 
                        type="number" 
                        min="0" 
                        value={eventForm.maxParticipants} 
                        onChange={e => setEventForm({...eventForm, maxParticipants: parseInt(e.target.value) || 0})} 
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-teal-500 outline-none text-sm font-medium" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox" 
                      id="requiresApproval" 
                      checked={eventForm.requiresApproval} 
                      onChange={e => setEventForm({...eventForm, requiresApproval: e.target.checked})} 
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="requiresApproval" className="text-sm font-bold text-gray-700 cursor-pointer">
                      Requires Faculty Approval (high budget or off-campus)
                    </label>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition shadow-sm cursor-pointer">
                      {isEditingEvent ? 'Update Event' : 'Create Event'}
                    </button>
                    {isEditingEvent && (
                      <button 
                        type="button" 
                        onClick={() => { 
                          setIsEditingEvent(false); 
                          setEventForm({ title: '', description: '', category: 'Sports', maxParticipants: 0, date: '', poster: '', requiresApproval: false }); 
                        }} 
                        className="px-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-black mb-4">Existing Events ({events.length})</h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {events.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl text-gray-400 font-medium">
                      No events created yet.
                    </div>
                  ) : events.map(event => (
                    <div key={event._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs flex justify-between items-center gap-4 hover:border-teal-200 transition">
                      <div>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          {event.title}
                          {event.requiresApproval && (
                            <StatusBadge status={event.approvalStatus} note={event.approvalNote} />
                          )}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 font-semibold">{new Date(event.date).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditEventClick(event)} 
                          className="p-2 text-gray-500 hover:text-teal-600 bg-gray-50 hover:bg-teal-50 rounded-lg transition"
                          title="Edit Event"
                        >
                          <Edit size={16}/>
                        </button>
                        <button 
                          onClick={() => handleDeleteEvent(event._id)} 
                          className="p-2 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition"
                          title="Delete Event"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* MATCHES */}
          {activeTab === 'matches' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-black mb-4">Club Matches</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clubMatches.length === 0 ? (
                  <div className="p-8 col-span-2 text-center bg-gray-50 rounded-2xl text-gray-400 font-medium">
                    No matches found for this club.
                  </div>
                ) : clubMatches.map(match => (
                  <div key={match._id} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 relative">
                    <div className="flex justify-between items-center mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        match.status === 'live' ? 'bg-red-100 text-red-600' : 
                        match.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {match.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{new Date(match.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                        <p className="font-black text-gray-900">{match.teamA}</p>
                        <p className="text-3xl font-black text-teal-700 mt-2">{match.scoreA}</p>
                      </div>
                      <div className="text-gray-300 font-black px-4">VS</div>
                      <div className="text-center flex-1">
                        <p className="font-black text-gray-900">{match.teamB}</p>
                        <p className="text-3xl font-black text-teal-700 mt-2">{match.scoreB}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STUDENT REFEREES */}
          {activeTab === 'referees' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Designation Form */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-4 text-slate-800 font-black">
                    <UserCheck size={20} className="text-teal-600" />
                    <span>Designate Student Referee</span>
                  </div>
                  <form onSubmit={handleAssignReferee} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Student Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={refereeForm.name}
                        onChange={(e) => setRefereeForm({ ...refereeForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 uppercase mb-1">Campus Email</label>
                      <input
                        type="email"
                        required
                        placeholder="student@campus.edu"
                        value={refereeForm.email}
                        onChange={(e) => setRefereeForm({ ...refereeForm, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">Roll Number</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2026CS101"
                          value={refereeForm.roll_no}
                          onChange={(e) => setRefereeForm({ ...refereeForm, roll_no: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">Year</label>
                        <select
                          value={refereeForm.year}
                          onChange={(e) => setRefereeForm({ ...refereeForm, year: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none"
                        >
                          <option value={1}>1st Year (Junior)</option>
                          <option value={2}>2nd Year (Junior)</option>
                          <option value={3}>3rd Year (Senior)</option>
                          <option value={4}>4th Year (Senior)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">Department</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CSE / IT"
                          value={refereeForm.department}
                          onChange={(e) => setRefereeForm({ ...refereeForm, department: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 uppercase mb-1">Section</label>
                        <input
                          type="text"
                          placeholder="e.g. A"
                          value={refereeForm.section}
                          onChange={(e) => setRefereeForm({ ...refereeForm, section: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isAssigningRef}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50"
                    >
                      {isAssigningRef ? 'Designating...' : '+ Authorize Student Referee'}
                    </button>
                    <p className="text-[10px] text-gray-400">Designated students can log in as Referee to manage match scores and official results.</p>
                  </form>
                </div>

                {/* Referee Roster */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-gray-900 text-base">Campus Referee Roster</h3>
                    <span className="text-xs text-gray-400 font-bold">{referees.length} Official Match Officials</span>
                  </div>

                  {referees.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center text-gray-400 font-medium">
                      No student referees registered yet. Use the form on the left to designate referees.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {referees.map((ref) => (
                        <div key={ref._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                          <div className="flex items-start justify-between mb-2">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">
                              {ref.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {ref.role}
                            </span>
                          </div>
                          <h4 className="font-black text-gray-900 text-sm leading-tight">{ref.name}</h4>
                          <p className="text-xs text-gray-500 font-semibold mb-3">{ref.email}</p>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                            <span>Roll: {ref.roll_no || 'N/A'}</span>
                            <span>•</span>
                            <span>{ref.department || 'Sports'} (Yr {ref.year || 3})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PresidentDashboard;
