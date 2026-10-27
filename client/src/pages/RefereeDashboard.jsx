import { useState, useEffect } from 'react';
import useMatchStore from '../store/matchStore';
import useAuthStore from '../store/authStore';
import { Shield, Plus, Minus, Check, Flag, Timer, Trophy, ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const RefereeDashboard = () => {
  const { matches, fetchMatches, updateScore, endMatch, isLoading } = useMatchStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user || (user.role !== 'referee' && user.role !== 'admin' && !user.isReferee)) {
      navigate('/', { replace: true });
      return;
    }
  }, [user, navigate]);
  
  // Filter matches assigned to this referee or unassigned (or all if admin) that are scheduled/live
  const activeMatches = matches.filter(m => {
    const isAssigned = (m.refereeId?._id?.toString() === user?._id?.toString()) ||
                       (m.refereeId?.toString() === user?._id?.toString()) ||
                       !m.refereeId;
    return (user?.role === 'admin' || isAssigned) && (m.status === 'scheduled' || m.status === 'live');
  });

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
    if (window.confirm('Are you sure you want to conclude and publish this match?')) {
      await endMatch(id, { walkover, winner });
      fetchMatches();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Referee Terminal Banner */}
      <div className="mb-8 p-8 rounded-[32px] text-white relative overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
              <Timer size={14} className="text-emerald-400" />
              <span>Official Match Terminal</span>
            </div>
            <h1 className="text-3xl font-black mb-1 flex items-center">
              Referee Terminal <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse ml-3"></span>
            </h1>
            <p className="text-slate-400 font-medium text-sm">
              Logged in as: <span className="text-white font-bold">{user?.name}</span> ({user?.role?.toUpperCase()})
            </p>
          </div>

          <Link to="/matches" className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition flex items-center gap-1.5">
            View Public Matches <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {activeMatches.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <Shield size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-800">No Active Assignments</h2>
          <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
            You don't have any scheduled or live matches assigned to you right now. As soon as a match is scheduled, it will appear here.
          </p>
          <div className="mt-6">
            <Link to="/matches" className="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl text-sm hover:bg-teal-700 transition">
              Browse Matches
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {activeMatches.map(match => (
            <motion.div 
              key={match._id} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-md relative overflow-hidden"
            >
              {match.status === 'live' ? (
                <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1.5 rounded-bl-2xl font-black text-xs flex items-center tracking-wider">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span> LIVE
                </div>
              ) : (
                <div className="absolute top-0 right-0 bg-teal-600 text-white px-4 py-1.5 rounded-bl-2xl font-black text-xs flex items-center tracking-wider">
                  SCHEDULED
                </div>
              )}
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8 mt-2">
                {/* Team A */}
                <div className="flex-1 text-center w-full">
                  <h2 className="text-xl font-black text-gray-900 mb-4 truncate">{match.teamA}</h2>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="text-6xl font-black tabular-nums tracking-tighter text-gray-900 mb-5">
                      {match.scoreA}
                    </div>
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => handleUpdateScore(match._id, 'A', -1)} 
                        className="w-12 h-12 bg-white border border-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold text-lg hover:bg-gray-100 active:scale-95 transition shadow-xs cursor-pointer"
                        title="Deduct point"
                      >
                        <Minus size={20} />
                      </button>
                      <button 
                        onClick={() => handleUpdateScore(match._id, 'A', 1)} 
                        className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-lg hover:bg-teal-700 shadow-md shadow-teal-500/25 active:scale-95 transition cursor-pointer"
                        title="Add point"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* VS */}
                <div className="flex-shrink-0 text-2xl font-black text-gray-300">VS</div>

                {/* Team B */}
                <div className="flex-1 text-center w-full">
                  <h2 className="text-xl font-black text-gray-900 mb-4 truncate">{match.teamB}</h2>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="text-6xl font-black tabular-nums tracking-tighter text-gray-900 mb-5">
                      {match.scoreB}
                    </div>
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => handleUpdateScore(match._id, 'B', -1)} 
                        className="w-12 h-12 bg-white border border-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold text-lg hover:bg-gray-100 active:scale-95 transition shadow-xs cursor-pointer"
                        title="Deduct point"
                      >
                        <Minus size={20} />
                      </button>
                      <button 
                        onClick={() => handleUpdateScore(match._id, 'B', 1)} 
                        className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-lg hover:bg-teal-700 shadow-md shadow-teal-500/25 active:scale-95 transition cursor-pointer"
                        title="Add point"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="border-t border-gray-100 pt-5 mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => handleEndMatch(match._id, true, match.teamA)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-xs flex items-center justify-center hover:bg-amber-100 transition cursor-pointer"
                  >
                    <Flag size={14} className="mr-1.5" /> W.O. {match.teamA}
                  </button>
                  <button 
                    onClick={() => handleEndMatch(match._id, true, match.teamB)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-xs flex items-center justify-center hover:bg-amber-100 transition cursor-pointer"
                  >
                    <Flag size={14} className="mr-1.5" /> W.O. {match.teamB}
                  </button>
                </div>

                <button 
                  onClick={() => handleEndMatch(match._id)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm flex items-center justify-center hover:bg-red-700 shadow-md shadow-red-500/20 transition cursor-pointer"
                >
                  <Check size={18} className="mr-2" /> End Match & Finalize Result
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
