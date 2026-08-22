import { useState, useEffect } from 'react';
import useMatchStore from '../store/matchStore';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';
import { Trophy, Clock, Calendar, Shield, Plus } from 'lucide-react';
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
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Tournaments & Matches</h1>
          <p className="text-gray-500 font-medium">Keep track of ongoing sports events and past results.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
            <FilterIcon size={18} className="text-primary-500 ml-3" />
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
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl font-bold shadow-soft-purple transition-transform hover:-translate-y-1"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Schedule Match</span>
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
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match, index) => (
              <motion.div
                key={match._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="soft-card p-6 border-l-4 border-primary-500 flex flex-col"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                    match.status === 'live' ? 'bg-red-100 text-red-600 animate-pulse' :
                    match.status === 'scheduled' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {match.status}
                  </span>
                  <div className="flex items-center text-sm font-bold text-gray-500">
                    <Calendar size={16} className="mr-1" />
                    {format(new Date(match.date), 'MMM d, h:mm a')}
                  </div>
                </div>

                <div className="flex justify-between items-center my-6 flex-1">
                  <div className="text-center flex-1">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                       <Shield size={32} className="text-gray-400" />
                    </div>
                    <h3 className="font-black text-xl text-gray-900">{match.teamA}</h3>
                  </div>
                  
                  <div className="px-6 text-center">
                    <div className="text-4xl font-black tabular-nums tracking-tighter text-gray-900">
                      {match.scoreA} - {match.scoreB}
                    </div>
                    {match.status === 'completed' && (
                        <div className="mt-2 text-sm font-bold text-green-600 flex items-center justify-center gap-1">
                            <Trophy size={16} /> Winner: {match.winner}
                        </div>
                    )}
                     {match.status === 'walkover' && (
                        <div className="mt-2 text-sm font-bold text-orange-600 flex items-center justify-center gap-1">
                            Walkover to {match.winner}
                        </div>
                    )}
                  </div>

                  <div className="text-center flex-1">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                       <Shield size={32} className="text-gray-400" />
                    </div>
                    <h3 className="font-black text-xl text-gray-900">{match.teamB}</h3>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                    <span className="text-sm font-bold text-gray-400">Referee: {match.refereeId?.name || 'Assigned soon'}</span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 font-medium bg-white rounded-3xl shadow-sm border border-gray-100">
              No matches found for this filter.
            </div>
          )}
        </motion.div>
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
    </div>
  );
};

// Extracted Filter icon to avoid missing import if lucide-react doesn't have it directly named as FilterIcon
function FilterIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export default Matches;
