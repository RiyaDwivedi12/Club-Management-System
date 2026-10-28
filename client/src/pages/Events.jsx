import { useState, useEffect } from 'react';
import useEventStore from '../store/eventStore';
import useAuthStore from '../store/authStore';
import EventCard from '../components/EventCard';
import { Filter, Plus, Calendar as CalendarIcon, X, Image as ImageIcon, Users, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const Events = () => {
  const { events, fetchEvents, createEvent, joinEvent, isLoading, error } = useEventStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePass, setActivePass] = useState(null);
  const [loadingPass, setLoadingPass] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clubId: '',
    category: 'Sports',
    maxParticipants: 0,
    date: '',
    poster: '',
    requiresApproval: false
  });

  useEffect(() => {
    fetchEvents();
    axios.get('/api/clubs').then(res => setClubs(res.data || [])).catch(console.error);
  }, [fetchEvents]);

  const handleJoin = async (eventId) => {
    await joinEvent(eventId);
    handleViewPass({ _id: eventId });
  };

  const handleViewPass = async (event) => {
    setLoadingPass(true);
    try {
      const res = await axios.post('/api/attendance/pass', { eventId: event._id }, { withCredentials: true });
      setActivePass(res.data);
    } catch (err) {
      toast.error('Failed to retrieve event pass');
    } finally {
      setLoadingPass(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.clubId || !formData.date) {
      toast.error('Please fill in title, club, and event date');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await createEvent(formData);
      if (success) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          clubId: '',
          category: 'Sports',
          maxParticipants: 0,
          date: '',
          poster: '',
          requiresApproval: false
        });
        fetchEvents();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeEvents = Array.isArray(events) ? events : [];
  const filteredEvents = filter === 'all' ? safeEvents : safeEvents.filter(e => e.status === filter);
  
  const canCreateEvent = user && (user.role === 'president' || user.role === 'vice_president' || user.role === 'faculty' || user.role === 'admin');

  const filterTabs = [
    { key: 'all', label: 'All Events' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ongoing', label: 'Live / Ongoing' },
    { key: 'completed', label: 'Past Events' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 rounded-3xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <CalendarIcon size={280} />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-teal-100 text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
            <CalendarIcon size={14} className="text-teal-200" />
            <span>Campus Gatherings</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            Campus Events & Meets
          </h1>
          <p className="text-teal-100 text-sm md:text-base font-medium leading-relaxed">
            Register for sports tournaments, guest lectures, cultural fests, workshops, and get your digital QR event pass instantly.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === tab.key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {canCreateEvent && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-bold text-gray-500">Loading campus events...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <motion.div
                key={event._id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                className="h-full"
              >
                <EventCard event={event} onJoin={handleJoin} onViewPass={handleViewPass} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-gray-500 font-medium bg-white rounded-2xl border border-dashed border-gray-200">
              <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-bold text-gray-700">No events found for this filter.</p>
              <p className="text-sm text-gray-400 mt-1">Check back soon for new club events and workshops.</p>
            </div>
          )}
        </div>
      )}

      {/* FAB for Mobile Create Event */}
      {canCreateEvent && (
        <button 
          onClick={() => setShowCreateModal(true)}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(79,70,229,0.8)] z-40 hover:bg-primary-700 hover:scale-105 transition-all"
        >
          <Plus size={24} />
        </button>
      )}
      
      {/* Functional Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-xl w-full shadow-2xl border border-gray-100 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create New Event</h2>
                  <p className="text-sm font-semibold text-gray-400">Schedule a campus event for your club</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Inter-Collegiate Football Match"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe event rules, venue, schedule, and guidelines..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Host Club *</label>
                    <select
                      required
                      value={formData.clubId}
                      onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      <option value="">Select Club</option>
                      {clubs.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      <option value="Sports">Sports</option>
                      <option value="Literary">Literary</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Technical">Technical</option>
                      <option value="Workshop">Workshop</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Max Participants</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0 for unlimited"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Poster URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/poster.jpg"
                    value={formData.poster}
                    onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                {user?.role === 'president' && (
                  <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl border border-primary-100">
                    <input
                      type="checkbox"
                      id="requiresApproval"
                      checked={formData.requiresApproval}
                      onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="requiresApproval" className="text-sm font-bold text-gray-700 cursor-pointer">
                      Send to Faculty Coordinator for Approval
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-soft-purple transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Event Pass Modal */}
      <AnimatePresence>
        {activePass && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center border border-gray-100 relative"
            >
              <button
                onClick={() => setActivePass(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-50 rounded-full"
              >
                <X size={18} />
              </button>

              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                Official Campus Event Pass
              </span>

              <h3 className="text-lg font-black text-gray-900 mt-2">{activePass.event?.title}</h3>
              <p className="text-xs text-primary-600 font-bold">{activePass.event?.clubName}</p>

              {/* QR Image Graphic */}
              <div className="my-5 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activePass.pass?.ticketCode || 'CAMPUS')}`}
                  alt="QR Pass"
                  className="w-44 h-44 mx-auto rounded-xl shadow-sm"
                />
              </div>

              {/* Ticket Details */}
              <div className="bg-gray-50 p-3 rounded-2xl text-xs space-y-1 text-left font-medium">
                <div className="flex justify-between">
                  <span className="text-gray-400">Student:</span>
                  <span className="font-bold text-gray-800">{activePass.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Roll Number:</span>
                  <span className="font-mono font-bold text-primary-700">{activePass.user?.roll_no || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ticket Code:</span>
                  <span className="font-mono font-bold text-gray-900">{activePass.pass?.ticketCode}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 mt-3 font-medium">
                Show this QR pass at the entrance scanner to verify your attendance and unlock your verified certificate.
              </p>

              <button
                onClick={() => setActivePass(null)}
                className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Events;
