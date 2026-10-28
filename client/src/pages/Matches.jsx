import { useState, useEffect } from 'react';
import useMatchStore from '../store/matchStore';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, Shield, Plus, Filter, Activity, X, FileSpreadsheet, FileDown, Clock } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';

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
    axios.get('/api/clubs').then(res => setClubs(res.data || [])).catch(console.error);
  }, [fetchMatches]);

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
  
  const canCreateMatch = user && (user.role === 'president' || user.role === 'faculty' || user.role === 'admin');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 relative min-h-screen"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Tournaments & Matches</h1>
          <p className="text-gray-500 font-medium text-lg">Keep track of ongoing sports events and past results.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/matches/export/pdf"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl text-xs font-bold shadow-sm transition-all hover:border-gray-300"
            title="Download PDF Match Fixture"
          >
            <FileDown size={16} className="text-rose-500" />
            <span>PDF Fixture</span>
          </a>
          <a
            href="/api/matches/export/excel"
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl text-xs font-bold shadow-sm transition-all hover:border-gray-300"
            title="Download Excel Schedule"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Excel Sheet</span>
          </a>

          <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-primary-300 transition-colors">
            <Filter size={18} className="text-primary-500 ml-3" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 py-2 pl-2 pr-8 cursor-pointer rounded-2xl"
            >
              <option value="all">All Matches</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          {canCreateMatch && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-3.5 rounded-2xl font-black shadow-md shadow-teal-500/20 transition-all hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              <Plus size={18} />
              <span>Schedule Match</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
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
                  className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col"
                >
                  <div className="flex justify-between items-center mb-6">
                    {match.status === 'live' ? (
                      <div className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-100">
                        <span className="relative flex h-3 w-3 mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest">Live Now</span>
                      </div>
                    ) : (
                      <span className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-full ${
                        match.status === 'scheduled' ? 'bg-primary-50 text-primary-600 border border-primary-100' : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}>
                        {match.status}
                      </span>
                    )}
                    
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                        <Calendar size={13} className="mr-1.5 text-primary-400" />
                        {format(new Date(match.date), 'MMM d, yyyy')}
                      </div>
                      {match.timeSlot && (
                        <div className="flex items-center text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                          <Clock size={11} className="mr-1 text-teal-600" />
                          {match.timeSlot}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sport & Wing Tags */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {match.sport || 'Sports'}
                    </span>
                    {match.wing && (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        match.wing === 'Junior' ? 'bg-sky-100 text-sky-800' :
                        match.wing === 'Senior' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {match.wing} Wing
                      </span>
                    )}
                    {match.clubId?.name && (
                      <span className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">
                        {match.clubId.name}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center my-2 flex-1">
                    {/* Team A */}
                    <div className="text-center flex-1 flex flex-col items-center">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-gray-200">
                         <span className="text-3xl font-black text-gray-300">{match.teamA.substring(0,2).toUpperCase()}</span>
                      </div>
                      <h3 className="font-black text-base sm:text-xl text-gray-900 leading-tight px-2">{match.teamA}</h3>
                    </div>
                    
                    {/* Score Box */}
                    <div className="px-2 sm:px-4 text-center shrink-0">
                      <div className="bg-gray-900 rounded-2xl px-4 sm:px-6 py-4 shadow-xl border-t border-gray-700">
                        <div className="text-3xl sm:text-5xl font-black tabular-nums tracking-tighter text-white">
                          {match.scoreA} <span className="text-gray-500 font-medium text-3xl mx-1">-</span> {match.scoreB}
                        </div>
                      </div>
                      {match.status === 'completed' && (
                          <div className="mt-4 text-xs font-black uppercase tracking-wider text-green-600 flex items-center justify-center gap-1 bg-green-50 py-1.5 px-3 rounded-full border border-green-100">
                              <Trophy size={14} /> Winner: {match.winner}
                          </div>
                      )}
                       {match.status === 'walkover' && (
                          <div className="mt-4 text-xs font-black uppercase tracking-wider text-orange-600 flex items-center justify-center gap-1 bg-orange-50 py-1.5 px-3 rounded-full border border-orange-100">
                              Walkover: {match.winner}
                          </div>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="text-center flex-1 flex flex-col items-center">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-gray-200">
                         <span className="text-3xl font-black text-gray-300">{match.teamB.substring(0,2).toUpperCase()}</span>
                      </div>
                      <h3 className="font-black text-base sm:text-xl text-gray-900 leading-tight px-2">{match.teamB}</h3>
                    </div>
                  </div>
                  
                  <div className="pt-6 mt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-primary-400" />
                        Referee: <span className="text-gray-600">{match.refereeId?.name || 'Assigned soon'}</span>
                      </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="col-span-full py-16 text-center text-gray-500 font-medium bg-white rounded-[32px] border border-dashed border-gray-200"
              >
                <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-lg">No matches found for this filter.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* FAB for Mobile Schedule Match */}
      {canCreateMatch && (
        <button 
          onClick={() => setShowCreateModal(true)}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(79,70,229,0.8)] z-40 hover:bg-primary-700 hover:scale-105 transition-all"
        >
          <Plus size={24} />
        </button>
      )}
      
      {/* Functional Schedule Match Modal */}
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
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Schedule Match</h2>
                  <p className="text-sm font-semibold text-gray-400">Set up a fixture between two campus teams</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Club</label>
                    <select
                      value={formData.clubId}
                      onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-primary-500/20"
                    >
                      <option value="">Select Club</option>
                      {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Sport</label>
                    <select
                      value={formData.sport}
                      onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-primary-500/20"
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
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Wing</label>
                    <select
                      value={formData.wing}
                      onChange={(e) => setFormData({ ...formData, wing: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-primary-500/20"
                    >
                      <option value="General">General Wing</option>
                      <option value="Junior">Junior Wing</option>
                      <option value="Senior">Senior Wing</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Class / Section A *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSE-Alpha, IT-2nd Year"
                      value={formData.teamA}
                      onChange={(e) => setFormData({ ...formData, teamA: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Class / Section B *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSE-Beta, MECH-2nd Year"
                      value={formData.teamB}
                      onChange={(e) => setFormData({ ...formData, teamB: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Match Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Slotted Time</label>
                    <select
                      value={formData.timeSlot}
                      onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-primary-500/20"
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
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Referee Email</label>
                  <input
                    type="email"
                    placeholder="referee@example.com (Auto-creates referee account if new)"
                    value={formData.refereeEmail}
                    onChange={(e) => setFormData({ ...formData, refereeEmail: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-400 mt-1 font-semibold">Leave blank to assign yourself or edit later.</p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Associated Tournament (Optional)</label>
                  <select
                    value={formData.tournamentId}
                    onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="">Friendly / Standalone Match</option>
                    {tournaments.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.wing})</option>
                    ))}
                  </select>
                </div>

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
                    className="px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
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
