import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useClubStore from '../store/clubStore';
import useEventStore from '../store/eventStore';
import useMatchStore from '../store/matchStore';
import { Users, Calendar, Trophy, Check, X, ShieldCheck, Edit, Trash2, CheckSquare, Activity, CheckCircle2, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
      navigate('/dashboard');
      return;
    }
    fetchCoordinatorClubs();
    fetchMatches();
  }, [user, navigate, fetchCoordinatorClubs, fetchMatches]);

  useEffect(() => {
    if (clubs.length > 0 && !selectedClub) {
      setSelectedClub(clubs[0]);
    }
  }, [clubs, selectedClub]);

  useEffect(() => {
    if (selectedClub) {
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

  const handleApprove = async (id) => {
    await approveEvent(id, approvalNote);
    setApprovalNote('');
    fetchEventsByClub(selectedClub._id);
  };

  const handleReject = async (id) => {
    if (!approvalNote) {
      alert("Please provide a reason for rejection in the note field.");
      return;
    }
    await rejectEvent(id, approvalNote);
    setApprovalNote('');
    fetchEventsByClub(selectedClub._id);
  };

  const handleOverride = async (id, status, reason) => {
    await overrideEvent(id, status, reason);
    setShowOverrideModal(null);
    fetchEventsByClub(selectedClub._id);
  };

  const tabClass = (tabName) => 
    `flex items-center gap-2 px-6 py-4 font-bold transition-all border-b-2 ${activeTab === tabName ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`;

  if (!clubs || clubs.length === 0) {
    return <div className="p-8 text-center text-gray-500">You are not assigned as a faculty coordinator to any clubs yet.</div>;
  }

  const clubMatches = matches.filter(m => m.teamA === selectedClub?.name || m.teamB === selectedClub?.name);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8 p-8 rounded-[32px] bg-slate-900 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
              <ShieldCheck className="text-primary-400" size={32} /> Faculty Coordinator Dashboard
            </h1>
            <p className="text-slate-400 font-medium text-lg">Oversee clubs, events, and member requests.</p>
          </div>
          
          {clubs.length > 1 && (
            <div className="mt-4 md:mt-0">
              <select 
                className="bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 outline-none"
                value={selectedClub?._id || ''}
                onChange={(e) => setSelectedClub(clubs.find(c => c._id === e.target.value))}
              >
                {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden mb-8 border border-gray-100">
        <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}><ShieldCheck size={18}/> Overview</button>
          <button onClick={() => setActiveTab('members')} className={tabClass('members')}><Users size={18}/> Members</button>
          <button onClick={() => setActiveTab('events')} className={tabClass('events')}><Calendar size={18}/> Events</button>
          <button onClick={() => setActiveTab('approvals')} className={tabClass('approvals')}><CheckSquare size={18}/> Approvals {events.filter(e => e.approvalStatus === 'pending').length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full inline-block ml-1"></span>}</button>
          <button onClick={() => setActiveTab('matches')} className={tabClass('matches')}><Trophy size={18}/> Matches</button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'overview' && selectedClub && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard title="Total Clubs" value={clubs.length} icon={ShieldCheck} />
                 <StatCard title="Pending Approvals" value={events.filter(e => e.approvalStatus === 'pending').length} icon={CheckSquare} colorClass="text-amber-600" bgClass="bg-amber-50" chartColor="#d97706" />
                 <StatCard title="Active Events" value={events.length} icon={Calendar} colorClass="text-green-600" bgClass="bg-green-50" chartColor="#16a34a" />
                 <StatCard title="Matches (Month)" value={matches.length} icon={Activity} colorClass="text-blue-600" bgClass="bg-blue-50" chartColor="#2563eb" />
               </div>
            </motion.div>
          )}

          {activeTab === 'members' && selectedClub && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div>
                <h2 className="text-xl font-black mb-4">Pending Requests ({selectedClub.pendingRequests?.length || 0})</h2>
                {selectedClub.pendingRequests?.length === 0 ? (
                  <p className="text-gray-500 bg-gray-50 p-4 rounded-xl">No pending requests.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedClub.pendingRequests.map(req => (
                      <div key={req._id} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                            <img src={req.profilePicture !== 'default.jpg' ? req.profilePicture : `https://ui-avatars.com/api/?name=${req.name}`} alt={req.name} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{req.name}</p>
                            <p className="text-xs text-gray-500">{req.email} • Roll: {req.roll_no}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleMemberAction(req._id, 'approve')} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"><Check size={20}/></button>
                          <button onClick={() => handleMemberAction(req._id, 'reject')} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><X size={20}/></button>
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
                       <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                          <img src={member.profilePicture !== 'default.jpg' ? member.profilePicture : `https://ui-avatars.com/api/?name=${member.name}`} alt={member.name} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.department}</p>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'events' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col lg:flex-row gap-8">
             <div className="flex-1">
               <h2 className="text-xl font-black mb-4">{isEditingEvent ? 'Edit Event' : 'Create New Event'}</h2>
               <form onSubmit={handleEventSubmit} className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                   <input required type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                   <textarea required rows="3" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"></textarea>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Date & Time</label>
                     <input required type="datetime-local" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Max Participants (0=Unlimited)</label>
                     <input required type="number" min="0" value={eventForm.maxParticipants} onChange={e => setEventForm({...eventForm, maxParticipants: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                   </div>
                 </div>
                 <div className="flex gap-2 pt-2">
                   <button type="submit" className="flex-1 bg-primary-600 text-white font-bold py-3 rounded-lg hover:bg-primary-700 transition-colors">
                     {isEditingEvent ? 'Update Event' : 'Create Event'}
                   </button>
                   {isEditingEvent && (
                     <button type="button" onClick={() => { setIsEditingEvent(false); setEventForm({ title: '', description: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' }); }} className="px-4 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">Cancel</button>
                   )}
                 </div>
               </form>
             </div>

             <div className="flex-1">
               <h2 className="text-xl font-black mb-4">Existing Events</h2>
               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {events.length === 0 ? <p className="text-gray-500">No events yet.</p> : events.map(event => (
                   <div key={event._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div>
                       <h3 className="font-bold text-lg">{event.title}</h3>
                       <p className="text-sm text-gray-500">{new Date(event.date).toLocaleString()}</p>
                     </div>
                     <div className="flex gap-2">
                       <button onClick={() => handleEditEventClick(event)} className="p-2 text-gray-500 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors"><Edit size={18}/></button>
                       <button onClick={() => handleDeleteEvent(event._id)} className="p-2 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </motion.div>
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

          {activeTab === 'matches' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <h2 className="text-xl font-black mb-4">Club Matches</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {clubMatches.length === 0 ? <p className="text-gray-500">No matches found for this club.</p> : clubMatches.map(match => (
                    <div key={match._id} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${match.status === 'live' ? 'bg-red-100 text-red-600' : match.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {match.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">{new Date(match.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-center flex-1">
                          <p className="font-black text-lg">{match.teamA}</p>
                          <p className="text-3xl font-black text-gray-900 mt-2">{match.scoreA}</p>
                        </div>
                        <div className="text-gray-300 font-black px-4">VS</div>
                        <div className="text-center flex-1">
                          <p className="font-black text-lg">{match.teamB}</p>
                          <p className="text-3xl font-black text-gray-900 mt-2">{match.scoreB}</p>
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
