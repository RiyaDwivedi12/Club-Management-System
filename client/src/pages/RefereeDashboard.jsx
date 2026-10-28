import { useEffect } from 'react';
import useMatchStore from '../store/matchStore';
import useAuthStore from '../store/authStore';
import { Shield, Plus, Minus, Check, Flag, Timer, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/EmptyState';

const ScorePanel = ({ team, score, onMinus, onPlus, tint }) => (
  <div className="flex-1 w-full min-w-0 text-center">
    <h2 className="text-lg font-bold text-dark-900 mb-3 truncate px-1" title={team}>{team}</h2>
    <div className={`rounded-2xl p-5 sm:p-6 border ${tint}`}>
      <div className="text-5xl sm:text-6xl font-extrabold tabular-nums tracking-tight text-dark-900 mb-5">
        {score}
      </div>
      <div className="flex justify-center gap-3">
        <button
          onClick={onMinus}
          className="w-12 h-12 bg-white border border-slate-200 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-100 hover:text-dark-900 active:scale-95 transition shadow-sm cursor-pointer"
          title="Deduct point"
          aria-label={`Deduct point from ${team}`}
        >
          <Minus size={20} />
        </button>
        <button
          onClick={onPlus}
          className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 shadow-md shadow-blue-600/25 active:scale-95 transition cursor-pointer"
          title="Add point"
          aria-label={`Add point to ${team}`}
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  </div>
);

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
  // Strict Time Expiry Check
  const isTimeExpired = Boolean(
    user?.role !== 'admin' &&
    user?.refereeExpiresAt &&
    new Date(user.refereeExpiresAt).getTime() < Date.now()
  );

  const formattedExpiry = user?.refereeExpiresAt
    ? new Date(user.refereeExpiresAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

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
    return <LoadingState label="Loading assigned matches…" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <PageHeader
        variant="hero"
        eyebrow="Official Match Terminal"
        eyebrowIcon={Timer}
        icon={Timer}
        title={
          <span className="inline-flex items-center gap-3">
            Referee Terminal
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </span>
        }
        description={
          <>
            Logged in as: <span className="text-white font-semibold">{user?.name}</span> ({user?.role?.toUpperCase()})
          </>
        }
        actions={
          <Link to="/matches" className="btn bg-white/10 hover:bg-white/20 text-white border border-white/15">
            View Public Matches <ArrowRight size={16} />
          </Link>
        }
      >
        {formattedExpiry && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
            isTimeExpired
              ? 'bg-red-500/20 text-red-200 border-red-400/40'
              : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
          }`}>
            <Timer size={13} className="shrink-0" />
            <span>
              {isTimeExpired ? `Officiating Window Expired on ${formattedExpiry}` : `Valid Officiating Window: Until ${formattedExpiry}`}
            </span>
          </div>
        )}
      </PageHeader>

      {isTimeExpired ? (
        <div className="card border-red-200 bg-red-50/60 px-6 py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <Lock size={26} />
          </div>
          <h3 className="text-lg font-bold text-red-900">Match Officiating Window Closed</h3>
          <p className="text-sm text-red-700 max-w-md mx-auto mt-1.5 leading-relaxed">
            Your designated referee access expired on <strong>{formattedExpiry}</strong>. You are only authorized to officiate matches during your valid designated window.
          </p>
        </div>
      ) : activeMatches.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Shield}
            title="No Active Assignments"
            description="You don't have any scheduled or live matches assigned to you right now. As soon as a match is scheduled, it will appear here."
            action={
              <Link to="/matches" className="btn-primary">
                Browse Matches
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {activeMatches.map(match => (
            <motion.div
              key={match._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card overflow-hidden ${match.status === 'live' ? 'ring-2 ring-red-200 border-red-200' : ''}`}
            >
              <div className="card-header">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Match</p>
                  <p className="card-title truncate">{match.teamA} vs {match.teamB}</p>
                </div>
                {match.status === 'live' ? (
                  <span className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-600 rounded-full ring-1 ring-inset ring-red-600/15 text-xs font-bold">
                    <span className="relative flex h-2.5 w-2.5 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    LIVE
                  </span>
                ) : (
                  <span className="badge-blue">Scheduled</span>
                )}
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8">
                  <ScorePanel
                    team={match.teamA}
                    score={match.scoreA}
                    tint="bg-blue-50/60 border-blue-100"
                    onMinus={() => handleUpdateScore(match._id, 'A', -1)}
                    onPlus={() => handleUpdateScore(match._id, 'A', 1)}
                  />

                  {/* VS */}
                  <div className="shrink-0 text-lg font-extrabold text-slate-300">VS</div>

                  <ScorePanel
                    team={match.teamB}
                    score={match.scoreB}
                    tint="bg-indigo-50/60 border-indigo-100"
                    onMinus={() => handleUpdateScore(match._id, 'B', -1)}
                    onPlus={() => handleUpdateScore(match._id, 'B', 1)}
                  />
                </div>

                {/* Action buttons */}
                <div className="border-t border-slate-100 pt-5 mt-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="flex flex-col min-[400px]:flex-row gap-2 w-full sm:w-auto min-w-0">
                    <button
                      onClick={() => handleEndMatch(match._id, true, match.teamA)}
                      className="btn bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 flex-1 sm:flex-none min-w-0"
                    >
                      <Flag size={14} className="shrink-0" /> <span className="truncate">W.O. {match.teamA}</span>
                    </button>
                    <button
                      onClick={() => handleEndMatch(match._id, true, match.teamB)}
                      className="btn bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 flex-1 sm:flex-none min-w-0"
                    >
                      <Flag size={14} className="shrink-0" /> <span className="truncate">W.O. {match.teamB}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleEndMatch(match._id)}
                    className="btn-danger w-full sm:w-auto"
                  >
                    <Check size={18} /> End Match & Finalize Result
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RefereeDashboard;
