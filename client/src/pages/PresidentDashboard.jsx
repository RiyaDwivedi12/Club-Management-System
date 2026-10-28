import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useClubStore from '../store/clubStore';
import useEventStore from '../store/eventStore';
import useMatchStore from '../store/matchStore';
import { Shield, Users, Calendar, Trophy, Check, X, Edit, Trash2, Crown, MessageSquare, Plus, Timer, UserCheck, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import StatTile from '../components/ui/StatTile';

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
    `tab inline-flex items-center gap-2 shrink-0 ${activeTab === tabName ? 'tab-active' : ''}`;

  if (!clubs || clubs.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <EmptyState
            icon={Crown}
            title="President Terminal"
            description="You are logged in as President. No active club assignments were found for your profile."
            action={<Link to="/clubs" className="btn-primary">Explore Clubs</Link>}
          />
        </div>
      </div>
    );
  }

  const clubMatches = matches.filter(m => m.teamA === selectedClub?.name || m.teamB === selectedClub?.name);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        variant="hero"
        eyebrow={user?.role === 'vice_president' ? 'Vice President' : 'President'}
        eyebrowIcon={Crown}
        icon={Crown}
        title={selectedClub?.name || (user?.role === 'vice_president' ? 'Vice President Panel' : 'President Dashboard')}
        description={`${user?.role === 'vice_president' ? 'Vice President Panel' : 'President Dashboard'} · Manage your club roster, evaluate student applications, and organize events.`}
        actions={
          <>
            {clubs.length > 1 && (
              <select
                className="w-full sm:w-auto max-w-full bg-white/10 text-white border border-white/20 rounded-xl px-3.5 py-2.5 outline-none font-semibold text-sm backdrop-blur-sm cursor-pointer focus:ring-4 focus:ring-white/20"
                value={selectedClub?._id || ''}
                onChange={(e) => setSelectedClub(clubs.find(c => c._id === e.target.value))}
              >
                {clubs.map(c => <option key={c._id} value={c._id} className="text-slate-900">{c.name}</option>)}
              </select>
            )}
            <Link
              to={`/chat?clubId=${selectedClub?._id}`}
              className="btn bg-white text-blue-700 shadow-sm hover:bg-blue-50 w-full sm:w-auto"
            >
              <MessageSquare size={16} /> Club Chat
            </Link>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile icon={Users} tint="blue" label="Total Members" value={selectedClub?.members?.length || 0} hint="Registered club students" />
        <StatTile icon={Inbox} tint="amber" label="Pending Requests" value={selectedClub?.pendingRequests?.length || 0} hint="Awaiting your approval" />
        <StatTile icon={Calendar} tint="emerald" label="Upcoming Events" value={events.filter(e => new Date(e.date) > new Date()).length} hint={`${events.length} total events`} />
        <StatTile icon={Trophy} tint="indigo" label="Club Matches" value={clubMatches.length} hint={`${referees.length} student referees`} />
      </div>

      {/* Tabs */}
      <div className="card p-1.5 flex gap-1 overflow-x-auto hide-scrollbar">
        <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
          <Shield size={16}/> Overview
        </button>
        <button onClick={() => setActiveTab('members')} className={tabClass('members')}>
          <Users size={16}/> Members
          {selectedClub?.pendingRequests?.length > 0 && (
            <span className={`px-1.5 min-w-[20px] h-5 inline-flex items-center justify-center rounded-full text-[11px] font-bold ${activeTab === 'members' ? 'bg-white text-blue-700' : 'bg-red-500 text-white'}`}>
              {selectedClub.pendingRequests.length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('events')} className={tabClass('events')}>
          <Calendar size={16}/> Events
        </button>
        <button onClick={() => setActiveTab('matches')} className={tabClass('matches')}>
          <Trophy size={16}/> Matches ({clubMatches.length})
        </button>
        <button onClick={() => setActiveTab('referees')} className={tabClass('referees')}>
          <Timer size={16}/> Student Referees ({referees.length})
        </button>
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && selectedClub && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="card-header">
            <div className="min-w-0">
              <h2 className="card-title">Club Overview</h2>
              <p className="card-subtitle">Your club at a glance</p>
            </div>
          </div>
          <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="icon-tile bg-blue-50 text-blue-600">
                <Shield size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-dark-900 text-lg break-words">{selectedClub.name}</h3>
                <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed break-words">{selectedClub.description}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
              <button onClick={() => setActiveTab('members')} className="btn-primary">
                <Users size={16} /> Manage Members
              </button>
              <button onClick={() => setActiveTab('events')} className="btn-secondary">
                <Plus size={16} /> Add Event
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* MEMBERS */}
      {activeTab === 'members' && selectedClub && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <section className="card">
            <div className="card-header">
              <div className="min-w-0">
                <h2 className="card-title">Pending Requests</h2>
                <p className="card-subtitle">Review student membership applications</p>
              </div>
              <span className="badge-amber">{selectedClub.pendingRequests?.length || 0} pending</span>
            </div>
            {(!selectedClub.pendingRequests || selectedClub.pendingRequests.length === 0) ? (
              <EmptyState icon={Inbox} title="All caught up" description="No pending membership applications." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {selectedClub.pendingRequests.map(req => (
                  <li key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Initial name={req.name} fallback="S" />
                      <div className="min-w-0">
                        <p className="font-semibold text-dark-900 truncate">{req.name}</p>
                        <p className="text-xs text-slate-500 break-words">
                          {req.email} • Roll: {req.roll_no || 'N/A'} • {req.department || 'Student'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
                      <button onClick={() => handleMemberAction(req._id, 'approve')} className="btn-success btn-sm min-h-[36px]">
                        <Check size={15}/> Approve
                      </button>
                      <button onClick={() => handleMemberAction(req._id, 'reject')} className="btn btn-sm min-h-[36px] bg-red-50 text-red-700 hover:bg-red-100">
                        <X size={15}/> Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <div className="min-w-0">
                <h2 className="card-title">Current Members ({selectedClub.members?.length || 0})</h2>
                <p className="card-subtitle">Approved students in {selectedClub.name}</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedClub.members?.map(member => (
                <div key={member._id} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 min-w-0">
                  <Initial name={member.name} fallback="M" />
                  <div className="min-w-0">
                    <p className="font-semibold text-dark-900 truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.department || 'Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      )}

      {/* EVENTS */}
      {activeTab === 'events' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section className="card">
            <div className="card-header">
              <div className="min-w-0">
                <h2 className="card-title">{isEditingEvent ? 'Edit Event' : 'Create New Event'}</h2>
                <p className="card-subtitle">Events are published under {selectedClub?.name}</p>
              </div>
            </div>
            <form onSubmit={handleEventSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  required
                  type="text"
                  value={eventForm.title}
                  onChange={e => setEventForm({...eventForm, title: e.target.value})}
                  className="input"
                  placeholder="e.g. Inter-College Cricket Tournament"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  required
                  rows="3"
                  value={eventForm.description}
                  onChange={e => setEventForm({...eventForm, description: e.target.value})}
                  className="input"
                  placeholder="Event details, guidelines, rules..."
                ></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={eventForm.date}
                    onChange={e => setEventForm({...eventForm, date: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Max Participants (0=Unlimited)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={eventForm.maxParticipants}
                    onChange={e => setEventForm({...eventForm, maxParticipants: parseInt(e.target.value) || 0})}
                    className="input"
                  />
                </div>
              </div>
              <label htmlFor="requiresApproval" className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={eventForm.requiresApproval}
                  onChange={e => setEventForm({...eventForm, requiresApproval: e.target.checked})}
                  className="mt-0.5 w-4 h-4 accent-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Requires Faculty Approval (high budget or off-campus)
                </span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button type="submit" className="btn-primary flex-1">
                  {isEditingEvent ? 'Update Event' : 'Create Event'}
                </button>
                {isEditingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingEvent(false);
                      setEventForm({ title: '', description: '', category: 'Sports', maxParticipants: 0, date: '', poster: '', requiresApproval: false });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="card">
            <div className="card-header">
              <div className="min-w-0">
                <h2 className="card-title">Existing Events ({events.length})</h2>
                <p className="card-subtitle">Edit or remove scheduled events</p>
              </div>
            </div>
            {events.length === 0 ? (
              <EmptyState icon={Calendar} title="No events yet" description="No events created yet." />
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                {events.map(event => (
                  <li key={event._id} className="flex justify-between items-center gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-dark-900 flex flex-wrap items-center gap-y-1 break-words">
                        <span className="min-w-0 break-words">{event.title}</span>
                        {event.requiresApproval && (
                          <StatusBadge status={event.approvalStatus} note={event.approvalNote} />
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{new Date(event.date).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEditEventClick(event)}
                        className="btn-icon w-10 h-10 hover:text-blue-600 hover:bg-blue-50"
                        title="Edit Event"
                      >
                        <Edit size={16}/>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="btn-icon w-10 h-10 hover:text-red-600 hover:bg-red-50"
                        title="Delete Event"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </motion.div>
      )}

      {/* MATCHES */}
      {activeTab === 'matches' && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="card-header">
            <div className="min-w-0">
              <h2 className="card-title">Club Matches</h2>
              <p className="card-subtitle">Fixtures involving {selectedClub?.name}</p>
            </div>
            <span className="badge-blue">{clubMatches.length} matches</span>
          </div>
          {clubMatches.length === 0 ? (
            <EmptyState icon={Trophy} title="No matches yet" description="No matches found for this club." />
          ) : (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {clubMatches.map(match => <MatchCard key={match._id} match={match} />)}
            </div>
          )}
        </motion.section>
      )}

      {/* STUDENT REFEREES */}
      {activeTab === 'referees' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Designation Form */}
          <section className="card">
            <div className="card-header">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserCheck size={18} />
                </div>
                <h2 className="card-title">Designate Student Referee</h2>
              </div>
            </div>
            <form onSubmit={handleAssignReferee} className="p-5 space-y-4">
              <div>
                <label className="label">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={refereeForm.name}
                  onChange={(e) => setRefereeForm({ ...refereeForm, name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Campus Email</label>
                <input
                  type="email"
                  required
                  placeholder="student@campus.edu"
                  value={refereeForm.email}
                  onChange={(e) => setRefereeForm({ ...refereeForm, email: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                <div>
                  <label className="label">Roll Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026CS101"
                    value={refereeForm.roll_no}
                    onChange={(e) => setRefereeForm({ ...refereeForm, roll_no: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Year</label>
                  <select
                    value={refereeForm.year}
                    onChange={(e) => setRefereeForm({ ...refereeForm, year: Number(e.target.value) })}
                    className="input"
                  >
                    <option value={1}>1st Year (Junior)</option>
                    <option value={2}>2nd Year (Junior)</option>
                    <option value={3}>3rd Year (Senior)</option>
                    <option value={4}>4th Year (Senior)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                <div>
                  <label className="label">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE / IT"
                    value={refereeForm.department}
                    onChange={(e) => setRefereeForm({ ...refereeForm, department: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Section</label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    value={refereeForm.section}
                    onChange={(e) => setRefereeForm({ ...refereeForm, section: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isAssigningRef}
                className="btn-primary w-full"
              >
                {isAssigningRef ? 'Designating...' : '+ Authorize Student Referee'}
              </button>
              <p className="text-xs text-slate-400">Designated students can log in as Referee to manage match scores and official results.</p>
            </form>
          </section>

          {/* Referee Roster */}
          <section className="card lg:col-span-2">
            <div className="card-header">
              <div className="min-w-0">
                <h2 className="card-title">Campus Referee Roster</h2>
                <p className="card-subtitle">{referees.length} Official Match Officials</p>
              </div>
            </div>
            {referees.length === 0 ? (
              <EmptyState icon={Timer} title="No referees yet" description="No student referees registered yet. Use the form on the left to designate referees." />
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {referees.map((ref) => (
                  <div key={ref._id} className="rounded-2xl border border-slate-100 bg-white p-4 card-hover min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {ref.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="badge-green capitalize">{ref.role}</span>
                    </div>
                    <h4 className="font-bold text-dark-900 text-sm leading-tight truncate">{ref.name}</h4>
                    <p className="text-xs text-slate-500 mb-3 truncate">{ref.email}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-400">
                      <span>Roll: {ref.roll_no || 'N/A'}</span>
                      <span>•</span>
                      <span>{ref.department || 'Sports'} (Yr {ref.year || 3})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </motion.div>
      )}
    </div>
  );
};

// Initial-letter avatar used for member / request rows.
const Initial = ({ name, fallback }) => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
    {name ? name.charAt(0).toUpperCase() : fallback}
  </div>
);

// Scoreboard card for a single club match.
const MatchCard = ({ match }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
    <div className="flex justify-between items-center gap-2 mb-4">
      <span className={match.status === 'live' ? 'badge-red' : match.status === 'completed' ? 'badge-green' : 'badge-blue'}>
        {match.status.toUpperCase()}
      </span>
      <span className="text-xs text-slate-500 font-medium">{new Date(match.date).toLocaleDateString()}</span>
    </div>
    <div className="flex justify-between items-center gap-2">
      <div className="text-center flex-1 min-w-0">
        <p className="font-bold text-dark-900 truncate">{match.teamA}</p>
        <p className="text-3xl font-extrabold tracking-tight text-blue-600 mt-1.5">{match.scoreA}</p>
      </div>
      <div className="text-xs font-bold text-slate-300 px-2">VS</div>
      <div className="text-center flex-1 min-w-0">
        <p className="font-bold text-dark-900 truncate">{match.teamB}</p>
        <p className="text-3xl font-extrabold tracking-tight text-blue-600 mt-1.5">{match.scoreB}</p>
      </div>
    </div>
  </div>
);

export default PresidentDashboard;
