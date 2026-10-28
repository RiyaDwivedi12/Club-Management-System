import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useClubStore from '../store/clubStore';
import useEventStore from '../store/eventStore';
import useMatchStore from '../store/matchStore';
import { Users, Calendar, Trophy, Check, X, ShieldCheck, Edit, Trash2, CheckSquare, Activity, CheckCircle2, Inbox, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ApprovalCard from '../components/ApprovalCard';
import PageHeader from '../components/ui/PageHeader';
import StatTile from '../components/ui/StatTile';

const CoordinatorDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { clubs, fetchCoordinatorClubs, approveMember } = useClubStore();
  const { events, fetchEventsByClub, createEvent, updateEvent, deleteEvent, approveEvent, rejectEvent, overrideEvent } = useEventStore();
  const { matches, fetchMatches } = useMatchStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClub, setSelectedClub] = useState(null);

  // Form states
  const [eventForm, setEventForm] = useState({ title: '', description: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' });
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  
  const [approvalNote, setApprovalNote] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(null);
  const [approvalFilter, setApprovalFilter] = useState('pending');

  useEffect(() => {
    if (user?.role !== 'faculty' && user?.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    fetchCoordinatorClubs();
    fetchMatches();
  }, [user, navigate, fetchCoordinatorClubs, fetchMatches]);

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
      fetchCoordinatorClubs();
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (isEditingEvent) {
      await updateEvent(editingEventId, eventForm);
    } else {
      await createEvent({ ...eventForm, clubId: selectedClub._id });
    }
    setEventForm({ title: '', description: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' });
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
      category: event.category,
      maxParticipants: event.maxParticipants,
      date: new Date(event.date).toISOString().slice(0, 16),
      poster: event.poster
    });
    setActiveTab('events');
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(id);
      fetchEventsByClub(selectedClub._id);
    }
  };

  const handleApprove = async (id, note = '') => {
    await approveEvent(id, note || approvalNote);
    setApprovalNote('');
    if (selectedClub) fetchEventsByClub(selectedClub._id);
  };

  const handleReject = async (id, reason) => {
    const noteToUse = reason || approvalNote;
    if (!noteToUse) {
      alert("Please provide a reason for rejection in the note field.");
      return;
    }
    await rejectEvent(id, noteToUse);
    setApprovalNote('');
    if (selectedClub) fetchEventsByClub(selectedClub._id);
  };

  const handleOverride = async (id, status, reason) => {
    await overrideEvent(id, status, reason);
    setShowOverrideModal(null);
    if (selectedClub) fetchEventsByClub(selectedClub._id);
  };


  const tabClass = (tabName) =>
    `tab inline-flex items-center gap-2 shrink-0 ${activeTab === tabName ? 'tab-active' : ''}`;

  if (!clubs || clubs.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <EmptyState
            icon={ShieldCheck}
            title="Faculty Coordinator Portal"
            description="You are logged in as Faculty Coordinator. No clubs are assigned to your faculty profile at the moment."
            action={<Link to="/clubs" className="btn-primary">View All Clubs</Link>}
          />
        </div>
      </div>
    );
  }

  const clubMatches = matches.filter(m => m.teamA === selectedClub?.name || m.teamB === selectedClub?.name);
  const pendingApprovals = events.filter(e => e.approvalStatus === 'pending');
  const filteredApprovalEvents = events.filter(e => approvalFilter === 'all' ? true : e.approvalStatus === approvalFilter);

  const approvalFilters = [
    { key: 'all', label: 'All', count: events.length },
    { key: 'pending', label: 'Pending', count: events.filter(e => e.approvalStatus === 'pending').length },
    { key: 'approved', label: 'Approved', count: events.filter(e => e.approvalStatus === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: events.filter(e => e.approvalStatus === 'rejected').length },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        variant="hero"
        eyebrow="Faculty Coordinator"
        eyebrowIcon={ShieldCheck}
        icon={ShieldCheck}
        title={selectedClub?.name || 'Faculty Coordinator Dashboard'}
        description="Faculty Coordinator Dashboard · Supervise clubs, evaluate high-budget event approvals, and maintain campus governance."
        actions={clubs.length > 1 ? (
          <select
            className="w-full sm:w-auto max-w-full bg-white/10 text-white border border-white/20 rounded-xl px-3.5 py-2.5 outline-none font-semibold text-sm backdrop-blur-sm cursor-pointer focus:ring-4 focus:ring-white/20"
            value={selectedClub?._id || ''}
            onChange={(e) => setSelectedClub(clubs.find(c => c._id === e.target.value))}
          >
            {clubs.map(c => <option key={c._id} value={c._id} className="text-slate-900">{c.name}</option>)}
          </select>
        ) : null}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile icon={Building2} tint="blue" label="Assigned Clubs" value={clubs.length} />
        <StatTile icon={CheckSquare} tint="amber" label="Pending Approvals" value={pendingApprovals.length} />
        <StatTile icon={Calendar} tint="emerald" label="Active Events" value={events.length} />
        <StatTile icon={Activity} tint="indigo" label="Total Matches" value={matches.length} />
      </div>

      {/* Tabs */}
      <div className="card p-1.5 flex gap-1 overflow-x-auto hide-scrollbar">
        <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
          <ShieldCheck size={16}/> Overview
        </button>
        <button onClick={() => setActiveTab('approvals')} className={tabClass('approvals')}>
          <CheckSquare size={16}/> Event Approvals
          {pendingApprovals.length > 0 && (
            <span className={`px-1.5 min-w-[20px] h-5 inline-flex items-center justify-center rounded-full text-[11px] font-bold ${activeTab === 'approvals' ? 'bg-white text-blue-700' : 'bg-red-500 text-white'}`}>
              {pendingApprovals.length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('members')} className={tabClass('members')}>
          <Users size={16}/> Members
        </button>
        <button onClick={() => setActiveTab('events')} className={tabClass('events')}>
          <Calendar size={16}/> Events
        </button>
        <button onClick={() => setActiveTab('matches')} className={tabClass('matches')}>
          <Trophy size={16}/> Matches ({clubMatches.length})
        </button>
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && selectedClub && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="card-header">
            <div className="min-w-0">
              <h2 className="card-title">Club Overview</h2>
              <p className="card-subtitle">The club currently under your supervision</p>
            </div>
          </div>
          <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="icon-tile bg-blue-50 text-blue-600">
                <ShieldCheck size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-dark-900 text-lg break-words">{selectedClub.name}</h3>
                <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed break-words">{selectedClub.description}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('approvals')}
              className="btn-primary w-full md:w-auto shrink-0"
            >
              <CheckSquare size={16} /> Review Pending Approvals ({pendingApprovals.length})
            </button>
          </div>
        </motion.div>
      )}

      {/* APPROVALS */}
      {activeTab === 'approvals' && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="card-header">
            <div className="min-w-0">
              <h2 className="card-title">Event Approvals</h2>
              <p className="card-subtitle">Approve, reject or override club event requests</p>
            </div>
            {pendingApprovals.length > 0 && <span className="badge-amber">{pendingApprovals.length} pending</span>}
          </div>

          <div className="p-5 space-y-5">
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1">
              {approvalFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setApprovalFilter(f.key)}
                  className={`tab shrink-0 ${approvalFilter === f.key ? 'tab-active' : 'bg-slate-50'}`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Optional Approval Note field */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <label className="label">
                Coordinator Review Note (Optional for approval, mandatory for rejection):
              </label>
              <input
                type="text"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="e.g. Budget approved. Venue security required."
                className="input"
              />
            </div>

            <div className="max-h-[640px] overflow-y-auto pr-1 -mr-1">
              {filteredApprovalEvents.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="No events in this category" description="All club event requests have been processed." />
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredApprovalEvents.map(event => (
                    <div key={event._id}>
                      <ApprovalCard event={event} onApprove={handleApprove} onReject={handleReject} isRemoving={false} />
                      {(event.approvalStatus !== 'pending' || event.approvalOverride?.reason) && (
                        <div className="-mt-1 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                          {event.approvalOverride?.reason && (
                            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 break-words">
                              Override: {event.approvalOverride.reason}
                            </span>
                          )}
                          {event.approvalStatus !== 'pending' && (
                            <button
                              onClick={() => setShowOverrideModal(event)}
                              className="btn-secondary btn-sm min-h-[36px]"
                            >
                              Override Status
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {showOverrideModal && (
        <div className="modal-overlay" onClick={() => setShowOverrideModal(null)}>
          <div className="modal-panel sm:max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <div className="min-w-0">
                <h3 className="card-title">Override Status</h3>
                <p className="card-subtitle break-words">You are changing the faculty approval for "{showOverrideModal.title}".</p>
              </div>
              <button onClick={() => setShowOverrideModal(null)} className="btn-icon" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="overrideStatus" className="label">New status</label>
                <select id="overrideStatus" className="input" defaultValue={showOverrideModal.approvalStatus === 'approved' ? 'rejected' : 'approved'}>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label htmlFor="overrideReason" className="label">Reason</label>
                <textarea id="overrideReason" placeholder="Reason for override (Required)" className="input" rows="3"></textarea>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
                <button onClick={() => setShowOverrideModal(null)} className="btn-ghost">Cancel</button>
                <button onClick={() => handleOverride(showOverrideModal._id, document.getElementById('overrideStatus').value, document.getElementById('overrideReason').value)} className="btn-primary">Confirm Override</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS */}
      {activeTab === 'members' && selectedClub && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <section className="card">
            <div className="card-header">
              <div className="min-w-0">
                <h2 className="card-title">Pending Requests ({selectedClub.pendingRequests?.length || 0})</h2>
                <p className="card-subtitle">Review student membership applications</p>
              </div>
            </div>
            {!selectedClub.pendingRequests?.length ? (
              <EmptyState icon={Inbox} title="All caught up" description="No pending requests." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {selectedClub.pendingRequests.map(req => (
                  <li key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Initial name={req.name} fallback="S" />
                      <div className="min-w-0">
                        <p className="font-semibold text-dark-900 text-sm truncate">{req.name}</p>
                        <p className="text-xs text-slate-500 break-words">{req.email} • Roll: {req.roll_no}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
                      <button onClick={() => handleMemberAction(req._id, 'approve')} className="btn-success btn-sm min-h-[36px]"><Check size={15}/> Approve</button>
                      <button onClick={() => handleMemberAction(req._id, 'reject')} className="btn btn-sm min-h-[36px] bg-red-50 text-red-700 hover:bg-red-100"><X size={15}/> Reject</button>
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
                    <p className="font-semibold text-dark-900 text-sm truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.department || 'Student'}</p>
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
                <input required type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="input" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea required rows="3" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="input"></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Date & Time</label>
                  <input required type="datetime-local" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="label">Max Participants</label>
                  <input required type="number" min="0" value={eventForm.maxParticipants} onChange={e => setEventForm({...eventForm, maxParticipants: parseInt(e.target.value)})} className="input" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button type="submit" className="btn-primary flex-1">
                  {isEditingEvent ? 'Update Event' : 'Create Event'}
                </button>
                {isEditingEvent && (
                  <button type="button" onClick={() => { setIsEditingEvent(false); setEventForm({ title: '', description: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' }); }} className="btn-secondary">Cancel</button>
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
              <EmptyState icon={Calendar} title="No events yet" description="No events yet." />
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                {events.map(event => (
                  <li key={event._id} className="flex justify-between items-center gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-dark-900 break-words">{event.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(event.date).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleEditEventClick(event)} className="btn-icon w-10 h-10 hover:text-blue-600 hover:bg-blue-50" title="Edit Event"><Edit size={16}/></button>
                      <button onClick={() => handleDeleteEvent(event._id)} className="btn-icon w-10 h-10 hover:text-red-600 hover:bg-red-50" title="Delete Event"><Trash2 size={16}/></button>
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

export default CoordinatorDashboard;
