import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Trophy, ArrowLeft, Calendar, Shield, CheckCircle2, AlertCircle, RefreshCw, Award, ChevronRight, FileDown, Medal, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const TournamentBracket = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState(null);

  const fetchBracketData = async () => {
    setLoading(true);
    try {
      const [tourneyRes, bracketRes] = await Promise.all([
        axios.get(`/api/tournaments/${id}`),
        axios.get(`/api/tournaments/${id}/bracket`)
      ]);
      setTournament(tourneyRes.data);
      setMatches(bracketRes.data || []);
    } catch (err) {
      toast.error('Failed to load tournament bracket data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBracketData();
  }, [id]);

  const handleGetAiRecommendations = async () => {
    setAiLoading(true);
    try {
      const res = await axios.post(`/api/tournaments/${id}/recommend-next-round`, {}, { withCredentials: true });
      setAiRecommendations(res.data.recommendations || []);
      toast.success('AI recommendations generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate recommendations');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-500 font-bold">Loading Tournament Bracket...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-8 text-center">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-gray-800">Tournament Not Found</h2>
        <Link to="/tournaments" className="mt-4 inline-flex items-center text-primary-600 font-bold hover:underline">
          <ArrowLeft size={16} className="mr-1" /> Back to Tournaments
        </Link>
      </div>
    );
  }

  // Group matches by round
  const roundsMap = {};
  matches.forEach(m => {
    const r = m.round || 1;
    if (!roundsMap[r]) roundsMap[r] = [];
    roundsMap[r].push(m);
  });
  const roundKeys = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);
  const totalRounds = roundKeys.length;

  const getRoundTitle = (roundNum, total) => {
    if (roundNum === total) return 'Finals 🏆';
    if (roundNum === total - 1 && total > 1) return 'Semi-Finals';
    if (roundNum === total - 2 && total > 2) return 'Quarter-Finals';
    return `Round ${roundNum}`;
  };

  // Find final winner if tournament completed
  const finalRoundMatches = roundsMap[totalRounds] || [];
  const finalMatch = finalRoundMatches[0];
  const champion = finalMatch && finalMatch.status === 'completed' ? finalMatch.winner : null;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto font-sans pb-20">
      {/* Back Button */}
      <Link 
        to="/tournaments" 
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 font-bold mb-6 transition-colors"
      >
        <ArrowLeft size={18} /> Back to Tournaments
      </Link>

      {/* Header Banner */}
      <div className="mb-8 p-8 rounded-[32px] bg-gradient-to-br from-dark-900 via-primary-950 to-slate-900 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 font-bold text-xs uppercase tracking-wider mb-3">
              <Trophy size={14} /> Knockout Elimination Bracket
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">
              {tournament.name}
            </h1>
            <p className="text-slate-400 font-medium text-base">
              {tournament.clubId?.name || 'Club Tournament'} • {tournament.sections?.length || matches.length * 2} Teams • Wing: {tournament.wing || 'General'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/api/tournaments/${id}/export/pdf`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-bold transition-all backdrop-blur-md text-xs shadow-sm cursor-pointer"
              title="Download PDF Fixture Schedule"
            >
              <FileDown size={16} className="text-rose-400" />
              <span>Export PDF Bracket</span>
            </a>
            <button
              onClick={fetchBracketData}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all backdrop-blur-md"
              title="Refresh Bracket"
            >
              <RefreshCw size={20} />
            </button>
            {user && ['admin', 'faculty'].includes(user.role) && (
              <button
                onClick={handleGetAiRecommendations}
                disabled={aiLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-50"
              >
                <Trophy size={18} />
                {aiLoading ? 'Analyzing...' : 'Bracket Insights'}
              </button>
            )}
          </div>
        </div>

        {/* Glows */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-600 opacity-20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Champion & Podium Standings (1st, 2nd, 3rd) */}
      {(champion || tournament.results?.firstPlaceName) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-dark-900 shadow-xl font-black"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner">
                🏆
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-amber-950 font-black">Tournament Champion (1st Place)</div>
                <div className="text-3xl tracking-tight text-white drop-shadow-md">{tournament.results?.firstPlaceName || champion}</div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {tournament.results?.secondPlaceName && (
                <div className="px-3.5 py-1.5 bg-white/30 backdrop-blur-md rounded-2xl text-white text-xs font-bold flex items-center gap-1.5">
                  <span>🥈 2nd:</span> <span>{tournament.results.secondPlaceName}</span>
                </div>
              )}
              {tournament.results?.thirdPlaceName && (
                <div className="px-3.5 py-1.5 bg-white/30 backdrop-blur-md rounded-2xl text-white text-xs font-bold flex items-center gap-1.5">
                  <span>🥉 3rd:</span> <span>{tournament.results.thirdPlaceName}</span>
                </div>
              )}
              <div className="px-3.5 py-1.5 bg-amber-950/20 backdrop-blur-md rounded-2xl text-white text-xs font-bold flex items-center gap-1">
                <Award size={14} /> Official Podium
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations Panel */}
      <AnimatePresence>
        {aiRecommendations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-6 bg-purple-50 border border-purple-200 rounded-[28px] shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-black text-purple-900 text-lg">
                <Shield size={22} className="text-purple-600" />
                Matchup Recommendations
              </div>
              <button 
                onClick={() => setAiRecommendations(null)}
                className="text-purple-600 hover:text-purple-800 font-bold text-xs"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiRecommendations.length > 0 ? (
                aiRecommendations.map((rec, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
                    <div className="flex items-center justify-between font-black text-gray-900 mb-2">
                      <span className="text-primary-600">{rec.teamA}</span>
                      <span className="text-xs text-gray-400 px-2 font-bold">VS</span>
                      <span className="text-indigo-600">{rec.teamB}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">{rec.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-purple-700 font-medium">All current round matches are completed and next matchups are fixed in tree!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bracket Tree Columns */}
      <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-gray-100 overflow-x-auto">
        <div className="flex items-stretch gap-8 min-w-[800px] justify-between pb-6">
          {roundKeys.map((roundNum) => {
            const roundMatches = roundsMap[roundNum] || [];
            return (
              <div key={roundNum} className="flex-1 flex flex-col min-w-[240px]">
                {/* Round Header */}
                <div className="text-center mb-8 pb-3 border-b-2 border-primary-100">
                  <h3 className="font-black text-gray-900 text-lg tracking-tight">
                    {getRoundTitle(roundNum, totalRounds)}
                  </h3>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
                  </span>
                </div>

                {/* Match Cards in Column */}
                <div className="flex flex-col justify-around flex-1 gap-6">
                  {roundMatches.map((m, idx) => {
                    const isCompleted = m.status === 'completed' || m.status === 'walkover';
                    const isLive = m.status === 'live';
                    const isBye = m.teamA === 'BYE' || m.teamB === 'BYE';

                    return (
                      <motion.div
                        key={m._id || idx}
                        whileHover={{ y: -3 }}
                        className={`rounded-2xl p-4 border transition-all shadow-sm ${
                          isLive 
                            ? 'bg-red-50/40 border-red-200 shadow-md ring-2 ring-red-400/30' 
                            : isCompleted 
                            ? 'bg-gray-50/70 border-gray-200' 
                            : 'bg-white border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        {/* Status bar */}
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                          <div className="flex items-center gap-1.5">
                            <span>Match #{idx + 1}</span>
                            {m.isThirdPlaceMatch && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[9px]">
                                🥉 3rd Place Playoff
                              </span>
                            )}
                          </div>
                          {isLive && (
                            <span className="flex items-center text-red-600 font-black animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1"></span> LIVE
                            </span>
                          )}
                          {isCompleted && <span className="text-green-600 font-black">COMPLETED</span>}
                          {!isLive && !isCompleted && <span>SCHEDULED</span>}
                        </div>

                        {/* Team A */}
                        <div className={`flex items-center justify-between p-2 rounded-xl mb-1.5 transition-colors ${
                          m.winner === m.teamA 
                            ? 'bg-green-100/70 font-black text-green-900' 
                            : 'bg-white font-bold text-gray-800'
                        }`}>
                          <div className="flex items-center gap-2 truncate pr-2">
                            {m.winner === m.teamA && <CheckCircle2 size={14} className="text-green-600 shrink-0" />}
                            <span className="truncate">{m.teamA || 'TBD'}</span>
                          </div>
                          {(isCompleted || isLive) && (
                            <span className="font-black px-2 py-0.5 rounded-lg bg-gray-100 text-gray-900 text-xs shrink-0">
                              {m.scoreA ?? 0}
                            </span>
                          )}
                        </div>

                        {/* Team B */}
                        <div className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                          m.winner === m.teamB 
                            ? 'bg-green-100/70 font-black text-green-900' 
                            : 'bg-white font-bold text-gray-800'
                        }`}>
                          <div className="flex items-center gap-2 truncate pr-2">
                            {m.winner === m.teamB && <CheckCircle2 size={14} className="text-green-600 shrink-0" />}
                            <span className="truncate">{m.teamB || 'TBD'}</span>
                          </div>
                          {(isCompleted || isLive) && (
                            <span className="font-black px-2 py-0.5 rounded-lg bg-gray-100 text-gray-900 text-xs shrink-0">
                              {m.scoreB ?? 0}
                            </span>
                          )}
                        </div>

                        {/* Bye auto-advance notice */}
                        {isBye && (
                          <div className="mt-2 text-[10px] text-teal-600 font-bold text-center">
                            Auto-advanced via BYE
                          </div>
                        )}

                        {/* Slotted Time & Referee info */}
                        {(m.timeSlot || m.refereeId) && (
                          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400">
                            {m.timeSlot && (
                              <span className="flex items-center text-slate-500">
                                <Clock size={10} className="mr-1 text-teal-600" /> {m.timeSlot}
                              </span>
                            )}
                            {m.refereeId && (
                              <span className="truncate max-w-[120px] text-gray-600">
                                Ref: {m.refereeId.name || 'Assigned'}
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;
