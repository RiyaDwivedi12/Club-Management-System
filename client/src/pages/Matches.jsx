import { useState, useEffect } from 'react';
import useMatchStore from '../store/matchStore';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, Plus, Filter, Activity, X, FileSpreadsheet, FileDown, Clock } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/EmptyState';

const Matches = () => {
  const { matches, fetchMatches, createMatch, isLoading, error } = useMatchStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    teamA: '',
    teamB: '',
    refereeEmail: '',
    date: '',
    tournamentId: '',
    clubId: '',
    sport: 'Cricket',
    wing: 'General',
    timeSlot: '09:00 AM - 10:30 AM'
  });

  useEffect(() => {
    fetchMatches();
    axios.get('/api/tournaments').then(res => setTournaments(res.data || [])).catch(console.error);

    // For faculty coordinator, president, vice_president: only load assigned clubs
    let clubsEndpoint = '/api/clubs';
    if (user?.role === 'faculty') {
      clubsEndpoint = '/api/clubs/coordinator';
    } else if (user?.role === 'president' || user?.role === 'vice_president') {
      clubsEndpoint = '/api/clubs/president';
    }

    axios.get(clubsEndpoint, { withCredentials: true }).then(res => {
      const list = res.data || [];
      setClubs(list);
      if (list.length === 1) {
        setFormData(prev => ({
          ...prev,
          clubId: list[0]._id,
          sport: list[0].sportType || list[0].category || prev.sport
        }));
      }
    }).catch(console.error);
  }, [fetchMatches, user]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teamA.trim() || !formData.teamB.trim() || !formData.date) {
      toast.error('Please enter Team A, Team B, and Match Date/Time');
      return;
    }

    if (formData.teamA.trim().toLowerCase() === formData.teamB.trim().toLowerCase()) {
      toast.error('Team A and Team B must be different');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await createMatch({
        teamA: formData.teamA.trim(),
        teamB: formData.teamB.trim(),
        refereeEmail: formData.refereeEmail.trim() || user?.email,
        date: formData.date,
        tournamentId: formData.tournamentId || undefined,
        clubId: formData.clubId || undefined,
        sport: formData.sport,
        wing: formData.wing,
        timeSlot: formData.timeSlot
      });

      if (success) {
        setShowCreateModal(false);
        setFormData({
          teamA: '',
          teamB: '',
          refereeEmail: '',
          date: '',
          tournamentId: '',
          clubId: '',
          sport: 'Cricket',
          wing: 'General',
          timeSlot: '09:00 AM - 10:30 AM'
        });
        fetchMatches();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMatches = filter === 'all' ? matches : matches.filter(m => m.status === filter);

  const canCreateMatch = user && (user.role === 'president' || user.role === 'vice_president' || user.role === 'faculty' || user.role === 'admin');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6 pb-8"
    >
      <PageHeader
        variant="hero"
        eyebrow="Sports"
        eyebrowIcon={Trophy}
        icon={Trophy}
        title="Tournaments & Matches"
        description="Keep track of ongoing sports events and past results."
        actions={
          <>
            <a
              href="/api/matches/export/pdf"
              target="_blank"
              rel="noreferrer"
              className="btn bg-white/10 hover:bg-white/20 text-white border border-white/15"
              title="Download PDF Match Fixture"
            >
              <FileDown size={16} />
              <span>PDF Fixture</span>
            </a>
            <a
              href="/api/matches/export/excel"
              className="btn bg-white/10 hover:bg-white/20 text-white border border-white/15"
              title="Download Excel Schedule"
            >
              <FileSpreadsheet size={16} />
              <span>Excel Sheet</span>
            </a>
            {canCreateMatch && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn bg-white text-blue-700 hover:bg-blue-50 shadow-md"
              >
                <Plus size={18} />
                <span>Schedule Match</span>
              </button>
            )}
          </>
        }
      />

      {/* Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="section-title">
          {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
        </h2>
        <div className="relative w-full sm:w-56">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input input-icon cursor-pointer font-semibold"
          >
            <option value="all">All Matches</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-100 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading matches…" />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          <AnimatePresence>
            {filteredMatches.length > 0 ? (
              filteredMatches.map((match, index) => (
                <motion.div
                  key={match._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={`card card-hover p-5 sm:p-6 flex flex-col min-w-0 ${match.status === 'live' ? 'ring-2 ring-red-200 border-red-200' : ''}`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                    {match.status === 'live' ? (
                      <div className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-600 rounded-full ring-1 ring-inset ring-red-600/15">
                        <span className="relative flex h-2.5 w-2.5 mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                        <span className="text-xs font-bold">Live Now</span>
                      </div>
                    ) : (
                      <span className={`capitalize ${match.status === 'scheduled' ? 'badge-blue' : match.status === 'completed' ? 'badge-green' : 'badge-slate'}`}>
                        {match.status}
                      </span>
                    )}

                    <div className="flex flex-wrap justify-end items-center gap-1.5">
                      <span className="badge-slate">
                        <Calendar size={12} />
                        {format(new Date(match.date), 'MMM d, yyyy')}
                      </span>
                      {match.timeSlot && (
                        <span className="badge-blue">
                          <Clock size={12} />
                          {match.timeSlot}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sport & Wing Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 min-w-0">
                    <span className="badge-slate">
                      {match.sport || 'Sports'}
                    </span>
                    {match.wing && (
                      <span className={
                        match.wing === 'Junior' ? 'badge-indigo' :
                        match.wing === 'Senior' ? 'badge-amber' : 'badge-slate'
                      }>
                        {match.wing} Wing
                      </span>
                    )}
                    {match.clubId?.name && (
                      <span className="text-xs font-medium text-slate-400 truncate max-w-[160px]">
                        {match.clubId.name}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center gap-2 my-2 flex-1">
                    {/* Team A */}
                    <div className="text-center flex-1 min-w-0 flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                         <span className="text-lg sm:text-2xl font-extrabold">{match.teamA.substring(0,2).toUpperCase()}</span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-lg text-dark-900 leading-tight px-1 break-words w-full">{match.teamA}</h3>
                    </div>

                    {/* Score Box */}
                    <div className="px-1 sm:px-3 text-center shrink-0">
                      <div className="bg-dark-900 rounded-2xl px-3 sm:px-5 py-3 sm:py-4 shadow-lg shadow-blue-900/10">
                        <div className="text-2xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-white whitespace-nowrap">
                          {match.scoreA} <span className="text-slate-500 font-medium mx-0.5">-</span> {match.scoreB}
                        </div>
                      </div>
                      {match.status === 'completed' && (
                          <div className="mt-3 badge-green max-w-[140px]">
                              <Trophy size={12} className="shrink-0" /> <span className="truncate">Winner: {match.winner}</span>
                          </div>
                      )}
                       {match.status === 'walkover' && (
                          <div className="mt-3 badge-amber max-w-[140px]">
                              <span className="truncate">Walkover: {match.winner}</span>
                          </div>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="text-center flex-1 min-w-0 flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                         <span className="text-lg sm:text-2xl font-extrabold">{match.teamB.substring(0,2).toUpperCase()}</span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-lg text-dark-900 leading-tight px-1 break-words w-full">{match.teamB}</h3>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center min-w-0">
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-2 min-w-0">
                        <Activity size={14} className="text-blue-500 shrink-0" />
                        <span className="truncate">Referee: <span className="font-semibold text-dark-900">{match.refereeId?.name || 'Assigned soon'}</span></span>
                      </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full card border-dashed"
              >
                <EmptyState icon={Trophy} title="No matches found" description="No matches found for this filter." />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* FAB for Mobile Schedule Match */}
      {canCreateMatch && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="md:hidden fixed bottom-24 right-5 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-brand z-40 hover:bg-blue-700 transition-all"
          aria-label="Schedule Match"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Functional Schedule Match Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-panel sm:max-w-xl p-5 sm:p-7"
            >
              <div className="flex justify-between items-start gap-3 mb-6">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-dark-900 tracking-tight">Schedule Match</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Set up a fixture between two campus teams</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-icon"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">{user?.role !== 'admin' ? 'Assigned Club *' : 'Club'}</label>
                    <select
                      value={formData.clubId}
                      onChange={(e) => {
                        const sel = clubs.find(c => c._id === e.target.value);
                        setFormData({ 
                          ...formData, 
                          clubId: e.target.value,
                          ...(sel ? { sport: sel.sportType || sel.category || formData.sport } : {})
                        });
                      }}
                      className="input font-semibold"
                      required={user?.role !== 'admin'}
                      disabled={user?.role !== 'admin' && clubs.length === 1}
                    >
                      {clubs.length === 0 ? (
                        <option value="">No Assigned Club Found</option>
                      ) : clubs.length === 1 ? (
                        <option value={clubs[0]._id}>🔒 {clubs[0].name} (Your Assigned Club)</option>
                      ) : (
                        <>
                          <option value="">Select Your Assigned Club</option>
                          {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </>
                      )}
                    </select>
                    {user?.role !== 'admin' && clubs.length === 0 && (
                      <p className="text-[11px] text-red-500 font-bold mt-1">
                        ⚠️ You have not been assigned to any club yet. Please ask the Admin to assign you.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label">Sport</label>
                    <select
                      value={formData.sport}
                      onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                      className="input"
                    >
                      <option value="Cricket">Cricket</option>
                      <option value="Football">Football / Soccer</option>
                      <option value="Volleyball">Volleyball</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Badminton">Badminton</option>
                      <option value="Table Tennis">Table Tennis</option>
                      <option value="Chess">Chess</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Wing</label>
                    <select
                      value={formData.wing}
                      onChange={(e) => setFormData({ ...formData, wing: e.target.value })}
                      className="input"
                    >
                      <option value="General">General Wing</option>
                      <option value="Junior">Junior Wing</option>
                      <option value="Senior">Senior Wing</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Class / Section A *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSE-Alpha, IT-2nd Year"
                      value={formData.teamA}
                      onChange={(e) => setFormData({ ...formData, teamA: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Class / Section B *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSE-Beta, MECH-2nd Year"
                      value={formData.teamB}
                      onChange={(e) => setFormData({ ...formData, teamB: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Match Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Slotted Time</label>
                    <select
                      value={formData.timeSlot}
                      onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                      className="input"
                    >
                      <option value="09:00 AM - 10:30 AM">09:00 AM - 10:30 AM</option>
                      <option value="10:45 AM - 12:15 PM">10:45 AM - 12:15 PM</option>
                      <option value="01:30 PM - 03:00 PM">01:30 PM - 03:00 PM</option>
                      <option value="03:15 PM - 04:45 PM">03:15 PM - 04:45 PM</option>
                      <option value="05:00 PM - 06:30 PM">05:00 PM - 06:30 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Referee Email</label>
                  <input
                    type="email"
                    placeholder="referee@example.com (Auto-creates referee account if new)"
                    value={formData.refereeEmail}
                    onChange={(e) => setFormData({ ...formData, refereeEmail: e.target.value })}
                    className="input"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Leave blank to assign yourself or edit later.</p>
                </div>

                <div>
                  <label className="label">Associated Tournament (Optional)</label>
                  <select
                    value={formData.tournamentId}
                    onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                    className="input"
                  >
                    <option value="">Friendly / Standalone Match</option>
                    {tournaments.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.wing})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full sm:w-auto"
                  >
                    {isSubmitting ? 'Scheduling...' : 'Schedule Match'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Matches;
