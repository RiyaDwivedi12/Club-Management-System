import { useState, useEffect } from 'react';
import useEventStore from '../store/eventStore';
import useAuthStore from '../store/authStore';
import EventCard from '../components/EventCard';
import { Plus, Calendar as CalendarIcon, X, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/EmptyState';

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        variant="hero"
        eyebrow="Campus Gatherings"
        eyebrowIcon={CalendarIcon}
        icon={CalendarIcon}
        title="Campus Events & Meets"
        description="Register for sports tournaments, guest lectures, cultural fests, workshops, and get your digital QR event pass instantly."
      />

      {/* Filter Tabs & Actions */}
      <div className="card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1 min-w-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`tab ${filter === tab.key ? 'tab-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {canCreateEvent && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary shrink-0"
          >
            <Plus size={18} />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading campus events..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <motion.div
                key={event._id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                className="h-full min-w-0"
              >
                <EventCard event={event} onJoin={handleJoin} onViewPass={handleViewPass} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full card border-dashed">
              <EmptyState
                icon={CalendarIcon}
                title="No events found for this filter."
                description="Check back soon for new club events and workshops."
              />
            </div>
          )}
        </div>
      )}

      {/* FAB for Mobile Create Event */}
      {canCreateEvent && (
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          aria-label="Create event"
          className="md:hidden fixed bottom-24 right-5 w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-brand z-40 hover:bg-blue-700 transition-all"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Functional Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="modal-panel sm:max-w-xl p-5 sm:p-7"
            >
              <div className="flex justify-between items-start gap-3 mb-6">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-dark-900 tracking-tight">Create New Event</h2>
                  <p className="text-sm text-slate-500">Schedule a campus event for your club</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-icon"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="label">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Inter-Collegiate Football Match"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe event rules, venue, schedule, and guidelines..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Host Club *</label>
                    <select
                      required
                      value={formData.clubId}
                      onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                      className="input"
                    >
                      <option value="">Select Club</option>
                      {clubs.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input"
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
                    <label className="label">Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Max Participants</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0 for unlimited"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Poster URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/poster.jpg"
                    value={formData.poster}
                    onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                    className="input"
                  />
                </div>

                {user?.role === 'president' && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <input
                      type="checkbox"
                      id="requiresApproval"
                      checked={formData.requiresApproval}
                      onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 shrink-0"
                    />
                    <label htmlFor="requiresApproval" className="text-sm font-semibold text-slate-700 cursor-pointer">
                      Send to Faculty Coordinator for Approval
                    </label>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
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
          <div className="modal-overlay">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="modal-panel sm:max-w-sm p-6 text-center relative"
            >
              <button
                type="button"
                onClick={() => setActivePass(null)}
                className="btn-icon absolute top-3 right-3"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <span className="badge-green">
                <QrCode size={12} /> Official Campus Event Pass
              </span>

              <h3 className="text-lg font-bold text-dark-900 mt-3 break-words">{activePass.event?.title}</h3>
              <p className="text-xs text-blue-600 font-semibold">{activePass.event?.clubName}</p>

              {/* QR Image Graphic */}
              <div className="my-5 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activePass.pass?.ticketCode || 'CAMPUS')}`}
                  alt="QR Pass"
                  className="w-44 h-44 mx-auto rounded-xl shadow-sm"
                />
              </div>

              {/* Ticket Details */}
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1.5 text-left">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-semibold text-dark-900 text-right break-words min-w-0">{activePass.user?.name}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Roll Number:</span>
                  <span className="font-mono font-semibold text-blue-700">{activePass.user?.roll_no || 'N/A'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Ticket Code:</span>
                  <span className="font-mono font-semibold text-dark-900 break-all text-right">{activePass.pass?.ticketCode}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-3">
                Show this QR pass at the entrance scanner to verify your attendance and unlock your verified certificate.
              </p>

              <button
                type="button"
                onClick={() => setActivePass(null)}
                className="btn w-full mt-4 bg-dark-900 hover:bg-dark-800 text-white"
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
