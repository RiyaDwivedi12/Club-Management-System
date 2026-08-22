import { useState, useEffect } from 'react';
import useMatchStore from '../store/matchStore';
import useAuthStore from '../store/authStore';
import { Shield, Plus, Minus, Check, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

const RefereeDashboard = () => {
  const { matches, fetchMatches, updateScore, endMatch, isLoading } = useMatchStore();
  const { user } = useAuthStore();
  
  // Filter matches assigned to this referee that are not completed/cancelled/walkover
  const activeMatches = matches.filter(
    m => m.refereeId?._id === user?._id && (m.status === 'scheduled' || m.status === 'live')
  );

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleUpdateScore = async (id, team, increment) => {
      const match = activeMatches.find(m => m._id === id);
      if (!match) return;

      const newScore = team === 'A' 
        ? Math.max(0, match.scoreA + increment)
        : Math.max(0, match.scoreB + increment);

      await updateScore(id, {
          scoreA: team === 'A' ? newScore : match.scoreA,
          scoreB: team === 'B' ? newScore : match.scoreB
      });
  };

  const handleEndMatch = async (id, walkover = false, winner = null) => {
      if (window.confirm('Are you sure you want to end this match? This action cannot be undone.')) {
          await endMatch(id, { walkover, winner });
      }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 bg-slate-900 text-white p-6 rounded-3xl">
        <h1 className="text-3xl font-black mb-2 flex items-center">
            Referee Terminal <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse ml-3"></span>
        </h1>
        <p className="text-slate-400 font-medium">Logged in as: {user?.name}</p>
      </div>

      {activeMatches.length === 0 ? (
        <div className="soft-card p-12 text-center">
            <Shield size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700">No Active Assignments</h2>
            <p className="text-gray-500 mt-2">You don't have any scheduled or live matches assigned to you at the moment.</p>
        </div>
      ) : (
        <div className="space-y-8">
            {activeMatches.map(match => (
                <motion.div key={match._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="soft-card p-6 md:p-10 border-2 border-primary-100 relative overflow-hidden">
                    
                    {match.status === 'live' && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 rounded-bl-xl font-bold text-sm flex items-center">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span> LIVE
                        </div>
                    )}
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
                        {/* Team A */}
                        <div className="flex-1 text-center w-full">
                            <h2 className="text-2xl font-black mb-6 truncate">{match.teamA}</h2>
                            <div className="bg-gray-50 rounded-3xl p-6 shadow-inner">
                                <div className="text-7xl font-black tabular-nums tracking-tighter text-gray-900 mb-6">
                                    {match.scoreA}
                                </div>
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => handleUpdateScore(match._id, 'A', -1)} className="w-14 h-14 bg-white border-2 border-gray-200 text-gray-500 rounded-full flex items-center justify-center font-bold text-xl hover:bg-gray-100 active:scale-95 transition-all">
                                        <Minus size={24} />
                                    </button>
                                    <button onClick={() => handleUpdateScore(match._id, 'A', 1)} className="w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl hover:bg-primary-700 shadow-soft-purple active:scale-95 transition-all">
                                        <Plus size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* VS */}
                        <div className="flex-shrink-0 text-3xl font-black text-gray-300">VS</div>

                        {/* Team B */}
                        <div className="flex-1 text-center w-full">
                            <h2 className="text-2xl font-black mb-6 truncate">{match.teamB}</h2>
                            <div className="bg-gray-50 rounded-3xl p-6 shadow-inner">
                                <div className="text-7xl font-black tabular-nums tracking-tighter text-gray-900 mb-6">
                                    {match.scoreB}
                                </div>
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => handleUpdateScore(match._id, 'B', -1)} className="w-14 h-14 bg-white border-2 border-gray-200 text-gray-500 rounded-full flex items-center justify-center font-bold text-xl hover:bg-gray-100 active:scale-95 transition-all">
                                        <Minus size={24} />
                                    </button>
                                    <button onClick={() => handleUpdateScore(match._id, 'B', 1)} className="w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl hover:bg-primary-700 shadow-soft-purple active:scale-95 transition-all">
                                        <Plus size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => handleEndMatch(match._id, true, match.teamA)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl font-bold text-sm flex items-center justify-center hover:bg-orange-100 transition-colors"
                            >
                                <Flag size={16} className="mr-1" /> W.O. {match.teamA}
                            </button>
                            <button 
                                onClick={() => handleEndMatch(match._id, true, match.teamB)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl font-bold text-sm flex items-center justify-center hover:bg-orange-100 transition-colors"
                            >
                                <Flag size={16} className="mr-1" /> W.O. {match.teamB}
                            </button>
                        </div>

                        <button 
                            onClick={() => handleEndMatch(match._id)}
                            className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-xl font-black flex items-center justify-center hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                        >
                            <Check size={20} className="mr-2" /> End Match & Publish
                        </button>
                    </div>

                </motion.div>
            ))}
        </div>
      )}
    </div>
  );
};

export default RefereeDashboard;
