import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useClubStore from '../store/clubStore';
import useEventStore from '../store/eventStore';
import useMatchStore from '../store/matchStore';
import { Users, Calendar, Trophy, Check, X, ShieldCheck, Edit, Trash2, CheckSquare, Activity, CheckCircle2, Inbox, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import ApprovalCard from '../components/ApprovalCard';

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
    `flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 cursor-pointer shrink-0 whitespace-nowrap ${
      activeTab === tabName 
        ? 'border-teal-600 text-teal-700 bg-teal-50/50' 
        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    }`;

  if (!clubs || clubs.length === 0) {
    return (
      <div className="p-6 md:p-12 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Faculty Coordinator Portal</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You are logged in as Faculty Coordinator. No clubs are assigned to your faculty profile at the moment.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/clubs" className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition">
              View All Clubs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const clubMatches = matches.filter(m => m.teamA === selectedClub?.name || m.teamB === selectedClub?.name);
  const pendingApprovals = events.filter(e => e.approvalStatus === 'pending');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="mb-8 p-8 rounded-[32px] text-white relative overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #042f2e 0%, #115e59 50%, #0d9488 100%)' }}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-teal-100 text-xs font-black uppercase tracking-wider mb-3 backdrop-blur-xs">
              <ShieldCheck size={14} className="text-teal-300" />
              <span>Faculty Oversight & Approvals</span>
            </div>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
              Faculty Coordinator Dashboard
            </h1>
            <p className="text-teal-100 font-medium text-base">
              Supervise clubs, evaluate high-budget event approvals, and maintain campus governance.
            </p>
          </div>
          
          {clubs.length > 1 && (
            <div className="mt-4 md:mt-0">
              <select 
                className="bg-black/30 text-white border border-white/20 rounded-xl px-4 py-2.5 outline-none font-bold text-sm backdrop-blur-sm cursor-pointer"
                value={selectedClub?._id || ''}
                onChange={(e) => setSelectedClub(clubs.find(c => c._id === e.target.value))}
              >
                {clubs.map(c => <option key={c._id} value={c._id} className="text-gray-900">{c.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden mb-8 border border-gray-100">
        <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
            <ShieldCheck size={18}/> Overview
          </button>
          <button onClick={() => setActiveTab('approvals')} className={tabClass('approvals')}>
            <CheckSquare size={18}/> Event Approvals 
            {pendingApprovals.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-black">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('members')} className={tabClass('members')}>
            <Users size={18}/> Members
          </button>
          <button onClick={() => setActiveTab('events')} className={tabClass('events')}>
            <Calendar size={18}/> Events
          </button>
          <button onClick={() => setActiveTab('matches')} className={tabClass('matches')}>
            <Trophy size={18}/> Matches ({clubMatches.length})
          </button>
        </div>

        <div className="p-6 md:p-8">
          {/* OVERVIEW */}
          {activeTab === 'overview' && selectedClub && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Assigned Clubs" value={clubs.length} icon={ShieldCheck} />
                <StatCard title="Pending Approvals" value={pendingApprovals.length} icon={CheckSquare} colorClass="text-amber-600" bgClass="bg-amber-50" chartColor="#d97706" />
                <StatCard title="Active Events" value={events.length} icon={Calendar} colorClass="text-emerald-600" bgClass="bg-emerald-50" chartColor="#059669" />
                <StatCard title="Total Matches" value={matches.length} icon={Activity} colorClass="text-teal-600" bgClass="bg-teal-50" chartColor="#0d9488" />
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-black text-gray-900 text-lg">{selectedClub.name}</h4>
                  <p className="text-sm text-gray-600 mt-1 max-w-2xl">{selectedClub.description}</p>
                </div>
                <button 
                  onClick={() => setActiveTab('approvals')}
                  className="px-5 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 transition cursor-pointer"
                >
                  Review Pending Approvals ({pendingApprovals.length})
                </button>
              </div>
            </motion.div>
          )}

          {/* APPROVALS */}
          {activeTab === 'approvals' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4 overflow-x-auto hide-scrollbar">
                <button 
                  onClick={() => setApprovalFilter('all')} 
                  className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    approvalFilter === 'all' ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({events.length})
                </button>
                <button 
                  onClick={() => setApprovalFilter('pending')} 
                  className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    approvalFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Pending ({events.filter(e => e.approvalStatus === 'pending').length})
                </button>
                <button 
                  onClick={() => setApprovalFilter('approved')} 
                  className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    approvalFilter === 'approved' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Approved ({events.filter(e => e.approvalStatus === 'approved').length})
                </button>
                <button 
                  onClick={() => setApprovalFilter('rejected')} 
                  className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    approvalFilter === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  Rejected ({events.filter(e => e.approvalStatus === 'rejected').length})
                </button>
              </div>

              {/* Optional Approval Note field */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Coordinator Review Note (Optional for approval, mandatory for rejection):
                </label>
                <input 
                  type="text" 
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="e.g. Budget approved. Venue security required."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {events.filter(e => approvalFilter === 'all' ? true : e.approvalStatus === approvalFilter).length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No events in this category" description="All club event requests have been processed." />
                ) : (
                  <AnimatePresence mode="popLayout">
                    {events.filter(e => approvalFilter === 'all' ? true : e.approvalStatus === approvalFilter).map(event => (
                      <div key={event._id} className="relative">
                        <ApprovalCard event={event} onApprove={handleApprove} onReject={handleReject} isRemoving={false} />
                        {event.approvalStatus !== 'pending' && (
                          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
                            <button 
                              onClick={() => setShowOverrideModal(event)} 
                              className="px-3 py-1.5 bg-white border border-gray-200 shadow-xs text-xs font-bold text-gray-700 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                            >
                              Override Status
                            </button>
                          </div>
                        )}
                        {event.approvalOverride?.reason && (
                          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10 text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
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
                  <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xl font-black mb-2 text-gray-900">Override Status</h3>
                    <p className="text-xs text-gray-500 mb-4 font-medium">You are changing the faculty approval for "{showOverrideModal.title}".</p>
                    <select id="overrideStatus" className="w-full mb-4 px-4 py-2.5 border border-gray-200 rounded-xl outline-none font-bold text-xs" defaultValue={showOverrideModal.approvalStatus === 'approved' ? 'rejected' : 'approved'}>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <textarea id="overrideReason" placeholder="Reason for override (Required)" className="w-full mb-4 px-4 py-2.5 border border-gray-200 rounded-xl outline-none text-xs font-medium" rows="3"></textarea>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowOverrideModal(null)} className="px-4 py-2 font-bold text-xs text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                      <button onClick={() => handleOverride(showOverrideModal._id, document.getElementById('overrideStatus').value, document.getElementById('overrideReason').value)} className="px-5 py-2 font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition">Confirm Override</button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* MEMBERS */}
          {activeTab === 'members' && selectedClub && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div>
                <h2 className="text-xl font-black mb-4">Pending Requests ({selectedClub.pendingRequests?.length || 0})</h2>
                {selectedClub.pendingRequests?.length === 0 ? (
                  <p className="text-gray-500 bg-gray-50 p-4 rounded-xl text-xs font-medium">No pending requests.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedClub.pendingRequests.map(req => (
                      <div key={req._id} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-xl shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 text-teal-800 rounded-full font-bold flex items-center justify-center text-sm">
                            {req.name ? req.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{req.name}</p>
                            <p className="text-xs text-gray-500">{req.email} • Roll: {req.roll_no}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleMemberAction(req._id, 'approve')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100 transition text-xs flex items-center gap-1"><Check size={16}/> Approve</button>
                          <button onClick={() => handleMemberAction(req._id, 'reject')} className="px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition text-xs flex items-center gap-1"><X size={16}/> Reject</button>
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
                        <p className="font-bold text-gray-900 text-sm truncate">{member.name}</p>
                        <p className="text-xs text-gray-500 truncate">{member.department || 'Student'}</p>
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
                    <input required type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-teal-500 outline-none text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea required rows="3" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-teal-500 outline-none text-xs font-medium"></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Date & Time</label>
                      <input required type="datetime-local" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-teal-500 outline-none text-xs font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Max Participants</label>
                      <input required type="number" min="0" value={eventForm.maxParticipants} onChange={e => setEventForm({...eventForm, maxParticipants: parseInt(e.target.value)})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-teal-500 outline-none text-xs font-medium" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition cursor-pointer text-xs">
                      {isEditingEvent ? 'Update Event' : 'Create Event'}
                    </button>
                    {isEditingEvent && (
                      <button type="button" onClick={() => { setIsEditingEvent(false); setEventForm({ title: '', description: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' }); }} className="px-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 text-xs">Cancel</button>
                    )}
                  </div>
                </form>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-black mb-4">Existing Events ({events.length})</h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {events.length === 0 ? <p className="text-gray-500 text-xs">No events yet.</p> : events.map(event => (
                    <div key={event._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs flex justify-between items-center gap-4">
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">{event.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(event.date).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditEventClick(event)} className="p-2 text-gray-500 hover:text-teal-600 bg-gray-50 hover:bg-teal-50 rounded-lg transition"><Edit size={16}/></button>
                        <button onClick={() => handleDeleteEvent(event._id)} className="p-2 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
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
                  <p className="text-gray-400 text-xs">No matches found for this club.</p>
                ) : clubMatches.map(match => (
                  <div key={match._id} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 relative">
                    <div className="flex justify-between items-center mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${match.status === 'live' ? 'bg-red-100 text-red-600' : match.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
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
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
