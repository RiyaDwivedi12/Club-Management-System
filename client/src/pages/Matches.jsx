import { useState, useEffect } from 'react';
import useMatchStore from '../store/matchStore';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, Shield, Plus, Filter, Activity } from 'lucide-react';
import { format } from 'date-fns';

const Matches = () => {
  const { matches, fetchMatches, isLoading, error } = useMatchStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

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
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-primary-300 transition-colors">
            <Filter size={18} className="text-primary-500 ml-3" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 py-3 pl-2 pr-8 cursor-pointer rounded-2xl"
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
              className="hidden md:flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-4 rounded-2xl font-black shadow-[0_8px_20px_-8px_rgba(79,70,229,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.6)]"
            >
              <Plus size={20} />
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
                    
                    <div className="flex items-center text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                      <Calendar size={14} className="mr-2 text-primary-400" />
                      {format(new Date(match.date), 'MMM d, h:mm a')}
                    </div>
                  </div>

                  <div className="flex justify-between items-center my-2 flex-1">
                    {/* Team A */}
                    <div className="text-center flex-1 flex flex-col items-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-gray-200">
                         <span className="text-3xl font-black text-gray-300">{match.teamA.substring(0,2).toUpperCase()}</span>
                      </div>
                      <h3 className="font-black text-xl text-gray-900 leading-tight px-2">{match.teamA}</h3>
                    </div>
                    
                    {/* Score Box */}
                    <div className="px-4 text-center shrink-0">
                      <div className="bg-gray-900 rounded-2xl px-6 py-4 shadow-xl border-t border-gray-700">
                        <div className="text-5xl font-black tabular-nums tracking-tighter text-white">
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
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-gray-200">
                         <span className="text-3xl font-black text-gray-300">{match.teamB.substring(0,2).toUpperCase()}</span>
                      </div>
                      <h3 className="font-black text-xl text-gray-900 leading-tight px-2">{match.teamB}</h3>
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
      
      {/* Schedule Match Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
             <h2 className="text-2xl font-black mb-4">Schedule Match</h2>
             <p className="text-gray-500 mb-6">Match scheduling form goes here.</p>
             <button onClick={() => setShowCreateModal(false)} className="w-full py-3 bg-gray-100 rounded-xl font-bold">Close</button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Matches;
