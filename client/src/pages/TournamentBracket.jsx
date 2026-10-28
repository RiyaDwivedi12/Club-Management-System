import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Trophy, ArrowLeft, Shield, CheckCircle2, AlertCircle, RefreshCw, Award, FileDown, Medal, Clock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import PageHeader from '../components/ui/PageHeader';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/EmptyState';

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
    return <LoadingState label="Loading tournament bracket…" className="min-h-[60vh]" />;
  }

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card">
          <EmptyState
            icon={AlertCircle}
            title="Tournament Not Found"
            description="This tournament may have been removed or the link is incorrect."
            action={
              <Link to="/tournaments" className="btn-secondary">
                <ArrowLeft size={16} /> Back to Tournaments
              </Link>
            }
          />
        </div>
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

  const heroBtn = 'btn bg-white/10 hover:bg-white/20 text-white border border-white/15';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8 min-w-0">
      {/* Back Button */}
      <Link
        to="/tournaments"
        className="btn-ghost btn-sm -ml-2"
      >
        <ArrowLeft size={16} /> Back to Tournaments
      </Link>

      <PageHeader
        variant="hero"
        eyebrow="Knockout Elimination Bracket"
        eyebrowIcon={Trophy}
        icon={Trophy}
        title={tournament.name}
        description={`${tournament.clubId?.name || 'Club Tournament'} • ${tournament.sections?.length || matches.length * 2} Teams • Wing: ${tournament.wing || 'General'}`}
        actions={
          <>
            <a
              href={`/api/tournaments/${id}/export/pdf`}
              target="_blank"
              rel="noreferrer"
              className={heroBtn}
              title="Download PDF Fixture Schedule"
            >
              <FileDown size={16} />
              <span>Export PDF Bracket</span>
            </a>
            <button
              onClick={fetchBracketData}
              className={`${heroBtn} px-3`}
              title="Refresh Bracket"
              aria-label="Refresh Bracket"
            >
              <RefreshCw size={18} />
            </button>
            {user && ['admin', 'faculty'].includes(user.role) && (
              <button
                onClick={handleGetAiRecommendations}
                disabled={aiLoading}
                className="btn bg-white text-blue-700 hover:bg-blue-50 shadow-md"
              >
                <Sparkles size={16} />
                {aiLoading ? 'Analyzing...' : 'Bracket Insights'}
              </button>
            )}
          </>
        }
      />

      {/* Champion & Podium Standings (1st, 2nd, 3rd) */}
      {(champion || tournament.results?.firstPlaceName) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-5 sm:p-6 border-amber-200 bg-gradient-to-r from-amber-50 to-white"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Trophy size={28} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Tournament Champion (1st Place)</div>
                <div className="text-2xl font-extrabold tracking-tight text-dark-900 break-words">{tournament.results?.firstPlaceName || champion}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {tournament.results?.secondPlaceName && (
                <span className="badge-slate text-xs py-1">
                  <Medal size={13} /> 2nd: {tournament.results.secondPlaceName}
                </span>
              )}
              {tournament.results?.thirdPlaceName && (
                <span className="badge bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/15 text-xs py-1">
                  <Medal size={13} /> 3rd: {tournament.results.thirdPlaceName}
                </span>
              )}
              <span className="badge-amber text-xs py-1">
                <Award size={13} /> Official Podium
              </span>
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
            className="card overflow-hidden"
          >
            <div className="card-header">
              <div className="flex items-center gap-3 min-w-0">
                <div className="icon-tile bg-indigo-50 text-indigo-600">
                  <Shield size={20} />
                </div>
                <h2 className="card-title">Matchup Recommendations</h2>
              </div>
              <button
                onClick={() => setAiRecommendations(null)}
                className="btn-ghost btn-sm"
              >
                Dismiss
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiRecommendations.length > 0 ? (
                aiRecommendations.map((rec, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 min-w-0">
                    <div className="flex items-center justify-between gap-2 font-bold mb-2 min-w-0">
                      <span className="text-blue-600 truncate">{rec.teamA}</span>
                      <span className="text-[11px] text-slate-400 px-2 font-semibold shrink-0">VS</span>
                      <span className="text-indigo-600 truncate">{rec.teamB}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rec.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">All current round matches are completed and next matchups are fixed in tree!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bracket Tree Columns — scrolls horizontally inside its own card */}
      <div className="card p-4 sm:p-6 lg:p-8 min-w-0">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-stretch gap-5 sm:gap-6 min-w-[760px] justify-between pb-2">
            {roundKeys.map((roundNum) => {
              const roundMatches = roundsMap[roundNum] || [];
              return (
                <div key={roundNum} className="flex-1 flex flex-col min-w-[230px]">
                  {/* Round Header */}
                  <div className="text-center mb-6 pb-3 border-b-2 border-blue-100">
                    <h3 className="font-bold text-dark-900 text-base tracking-tight">
                      {getRoundTitle(roundNum, totalRounds)}
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
                    </span>
                  </div>

                  {/* Match Cards in Column */}
                  <div className="flex flex-col justify-around flex-1 gap-5">
                    {roundMatches.map((m, idx) => {
                      const isCompleted = m.status === 'completed' || m.status === 'walkover';
                      const isLive = m.status === 'live';
                      const isBye = m.teamA === 'BYE' || m.teamB === 'BYE';

                      return (
                        <motion.div
                          key={m._id || idx}
                          whileHover={{ y: -3 }}
                          className={`rounded-2xl p-3.5 border transition-all ${
                            isLive
                              ? 'bg-red-50/40 border-red-200 shadow-md ring-2 ring-red-400/30'
                              : isCompleted
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-white border-slate-200 shadow-sm hover:border-blue-300'
                          }`}
                        >
                          {/* Status bar */}
                          <div className="flex justify-between items-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="shrink-0">Match #{idx + 1}</span>
                              {m.isThirdPlaceMatch && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[9px] normal-case truncate">
                                  🥉 3rd Place Playoff
                                </span>
                              )}
                            </div>
                            {isLive && (
                              <span className="flex items-center text-red-600 font-bold animate-pulse shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1"></span> LIVE
                              </span>
                            )}
                            {isCompleted && <span className="text-emerald-600 font-bold shrink-0">COMPLETED</span>}
                            {!isLive && !isCompleted && <span className="shrink-0">SCHEDULED</span>}
                          </div>

                          {/* Team A */}
                          <div className={`flex items-center justify-between p-2 rounded-xl mb-1.5 text-sm transition-colors ${
                            m.winner === m.teamA
                              ? 'bg-emerald-50 font-bold text-emerald-800 ring-1 ring-inset ring-emerald-600/15'
                              : 'bg-white font-semibold text-dark-900'
                          }`}>
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {m.winner === m.teamA && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                              <span className="truncate">{m.teamA || 'TBD'}</span>
                            </div>
                            {(isCompleted || isLive) && (
                              <span className="font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-dark-900 text-xs tabular-nums shrink-0">
                                {m.scoreA ?? 0}
                              </span>
                            )}
                          </div>

                          {/* Team B */}
                          <div className={`flex items-center justify-between p-2 rounded-xl text-sm transition-colors ${
                            m.winner === m.teamB
                              ? 'bg-emerald-50 font-bold text-emerald-800 ring-1 ring-inset ring-emerald-600/15'
                              : 'bg-white font-semibold text-dark-900'
                          }`}>
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {m.winner === m.teamB && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                              <span className="truncate">{m.teamB || 'TBD'}</span>
                            </div>
                            {(isCompleted || isLive) && (
                              <span className="font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-dark-900 text-xs tabular-nums shrink-0">
                                {m.scoreB ?? 0}
                              </span>
                            )}
                          </div>

                          {/* Bye auto-advance notice */}
                          {isBye && (
                            <div className="mt-2 text-[10px] text-blue-600 font-semibold text-center">
                              Auto-advanced via BYE
                            </div>
                          )}

                          {/* Slotted Time & Referee info */}
                          {(m.timeSlot || m.refereeId) && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-400">
                              {m.timeSlot && (
                                <span className="flex items-center text-slate-500 shrink-0">
                                  <Clock size={10} className="mr-1 text-blue-600" /> {m.timeSlot}
                                </span>
                              )}
                              {m.refereeId && (
                                <span className="truncate max-w-[120px] text-slate-600">
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
    </div>
  );
};

export default TournamentBracket;
