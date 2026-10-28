import { useEffect, useState, useRef } from 'react';
import useMatchStore from '../store/matchStore';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';
import { Trophy, Upload, Calendar, XCircle, CheckCircle, Clock, Medal, Search, RefreshCw, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/EmptyState';

// Gold / silver / bronze accents for the podium positions.
const PODIUM = [
  { medal: '🥇', chip: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20', row: 'bg-amber-50/40' },
  { medal: '🥈', chip: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20', row: '' },
  { medal: '🥉', chip: 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-600/20', row: '' },
];

const RankBadge = ({ idx }) => {
  const podium = PODIUM[idx];
  if (podium) {
    return (
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-base ${podium.chip}`}>
        {podium.medal}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-500 text-xs font-bold">
      #{idx + 1}
    </span>
  );
};

const Leaderboard = () => {
  const { matches, leaderboard, fetchMatches, fetchLeaderboard, uploadMatchesFromExcel, isLoading, error } = useMatchStore();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('standings');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMatches();
    fetchLeaderboard();
  }, [fetchMatches, fetchLeaderboard]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setIsUploading(true);
    const success = await uploadMatchesFromExcel(file);
    if (success) {
      await Promise.all([fetchMatches(), fetchLeaderboard()]);
    }
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isAdmin = user && (user.role === 'admin' || user.role === 'faculty' || user.role === 'president');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge-green"><CheckCircle size={12} /> Completed</span>;
      case 'walkover':
        return <span className="badge-blue"><Trophy size={12} /> Walkover</span>;
      case 'disqualified':
        return <span className="badge-red"><XCircle size={12} /> Disqualified</span>;
      case 'live':
        return <span className="badge-red animate-pulse"><Clock size={12} /> Live</span>;
      case 'scheduled':
      default:
        return <span className="badge-amber"><Calendar size={12} /> Scheduled</span>;
    }
  };

  const filteredLeaderboard = (leaderboard || []).filter(item =>
    item.teamName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMatches = (matches || []).filter(m =>
    m.teamA?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.teamB?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gdClass = (gd) => (gd > 0 ? 'text-emerald-600' : gd < 0 ? 'text-red-500' : 'text-slate-400');

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <PageHeader
        variant="hero"
        eyebrow="Championship League"
        eyebrowIcon={Trophy}
        icon={BarChart2}
        title="Standings & Fixtures"
        description="Real-time college tournaments, class vs class match points, and athletic standings."
        actions={
          <>
            <button
              onClick={() => { fetchLeaderboard(); fetchMatches(); toast.success('Data refreshed'); }}
              className="btn bg-white/10 hover:bg-white/20 text-white border border-white/15 px-3"
              title="Refresh Stats"
              aria-label="Refresh Stats"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            {isAdmin && (
              <>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isLoading}
                  className="btn bg-white text-blue-700 hover:bg-blue-50 shadow-md"
                >
                  <Upload size={18} />
                  {isUploading ? 'Uploading...' : 'Import Schedule (Excel)'}
                </button>
              </>
            )}
          </>
        }
      />

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100">
          <XCircle size={18} className="shrink-0" /> {error}
        </div>
      )}

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-2xl overflow-x-auto hide-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('standings')}
            className={`tab flex-1 sm:flex-none inline-flex items-center justify-center gap-2 ${activeTab === 'standings' ? 'tab-active' : ''}`}
          >
            <BarChart2 size={16} /> Points Table
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`tab flex-1 sm:flex-none inline-flex items-center justify-center gap-2 ${activeTab === 'matches' ? 'tab-active' : ''}`}
          >
            <Calendar size={16} /> All Matches ({matches.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search team or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-icon"
          />
        </div>
      </div>

      {/* Content Area */}
      {isLoading && !isUploading ? (
        <LoadingState label="Loading standings…" />
      ) : activeTab === 'standings' ? (
        /* Standings */
        <div className="card overflow-hidden">
          {filteredLeaderboard.length > 0 ? (
            <>
              {/* md+: full points table */}
              <div className="table-wrap hidden md:block">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-center w-16">Rank</th>
                      <th>Team / Section</th>
                      <th className="text-center">Played</th>
                      <th className="text-center">Won</th>
                      <th className="text-center">Drawn</th>
                      <th className="text-center">Lost</th>
                      <th className="text-center">GF</th>
                      <th className="text-center">GA</th>
                      <th className="text-center">GD</th>
                      <th className="text-center">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaderboard.map((row, idx) => {
                      const gd = row.goalsFor - row.goalsAgainst;
                      const isTopThree = idx < 3;
                      return (
                        <motion.tr
                          key={row.teamName || idx}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={idx === 0 ? PODIUM[0].row : ''}
                        >
                          <td className="text-center"><RankBadge idx={idx} /></td>
                          <td>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0">
                                {row.teamName?.charAt(0) || 'T'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-dark-900 truncate">{row.teamName}</div>
                                {isTopThree && (
                                  <div className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                                    <Medal size={12} /> Podium Contender
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center font-semibold">{row.played}</td>
                          <td className="text-center text-emerald-600 font-bold">{row.won}</td>
                          <td className="text-center text-slate-500">{row.drawn}</td>
                          <td className="text-center text-red-500 font-semibold">{row.lost}</td>
                          <td className="text-center text-slate-500">{row.goalsFor}</td>
                          <td className="text-center text-slate-500">{row.goalsAgainst}</td>
                          <td className="text-center font-bold">
                            <span className={gdClass(gd)}>
                              {gd > 0 ? `+${gd}` : gd}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="inline-block min-w-[2.5rem] px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold tabular-nums">
                              {row.points}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* <md: compact ranking list */}
              <ul className="md:hidden divide-y divide-slate-100">
                {filteredLeaderboard.map((row, idx) => {
                  const gd = row.goalsFor - row.goalsAgainst;
                  const isTopThree = idx < 3;
                  return (
                    <motion.li
                      key={row.teamName || idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`p-4 ${idx === 0 ? PODIUM[0].row : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <RankBadge idx={idx} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-dark-900 truncate">{row.teamName}</div>
                          {isTopThree && (
                            <div className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                              <Medal size={12} /> Podium Contender
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block min-w-[2.5rem] px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-center tabular-nums">
                            {row.points}
                          </span>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">PTS</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-xs">
                        <div className="rounded-lg bg-slate-50 py-1.5">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">P</div>
                          <div className="font-bold text-dark-900">{row.played}</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 py-1.5">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">W-D-L</div>
                          <div className="font-bold">
                            <span className="text-emerald-600">{row.won}</span>
                            <span className="text-slate-300">-</span>
                            <span className="text-slate-500">{row.drawn}</span>
                            <span className="text-slate-300">-</span>
                            <span className="text-red-500">{row.lost}</span>
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-50 py-1.5">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">GF:GA</div>
                          <div className="font-bold text-slate-600">{row.goalsFor}:{row.goalsAgainst}</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 py-1.5">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">GD</div>
                          <div className={`font-bold ${gdClass(gd)}`}>{gd > 0 ? `+${gd}` : gd}</div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            </>
          ) : (
            <EmptyState
              icon={Trophy}
              title="No Standings Available Yet"
              description="Once matches are played and completed, the standings table and goal differences will automatically compute here."
            />
          )}
        </div>
      ) : (
        /* Match Fixtures Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match, index) => (
              <motion.div
                key={match._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card card-hover p-5 flex flex-col min-w-0 ${match.status === 'live' ? 'ring-2 ring-red-200 border-red-200' : ''}`}
              >
                <div className="flex justify-between items-center gap-2 mb-4">
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Calendar size={13} className="text-blue-500" />
                    {new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {getStatusBadge(match.status)}
                </div>

                <div className="flex justify-between items-center gap-2 flex-1 my-2">
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className={`text-base font-bold text-center break-words w-full ${match.winner === match.teamA ? 'text-emerald-600' : 'text-dark-900'}`}>
                      {match.teamA}
                    </div>
                    {(match.status === 'completed' || match.status === 'live') && (
                      <div className="text-3xl font-extrabold mt-2 text-dark-900 tabular-nums">{match.scoreA}</div>
                    )}
                  </div>

                  <div className="px-2 text-slate-300 font-bold text-xs shrink-0">VS</div>

                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className={`text-base font-bold text-center break-words w-full ${match.winner === match.teamB ? 'text-emerald-600' : 'text-dark-900'}`}>
                      {match.teamB}
                    </div>
                    {(match.status === 'completed' || match.status === 'live') && (
                      <div className="text-3xl font-extrabold mt-2 text-dark-900 tabular-nums">{match.scoreB}</div>
                    )}
                  </div>
                </div>

                {(match.status === 'completed' || match.status === 'walkover') && match.winner && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-center text-sm">
                    <span className="text-slate-500">Winner:</span>
                    <span className="ml-2 font-semibold text-blue-600">{match.winner}</span>
                  </div>
                )}

                {match.status === 'disqualified' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                    <span className="text-sm text-red-600 font-semibold">Match Disqualified</span>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full card">
              <EmptyState
                icon={Trophy}
                title="No Matches Found"
                description={
                  <>
                    There are no matches scheduled or matching your search.
                    {isAdmin && (
                      <span className="block mt-2">Use the upload button above to import a match schedule.</span>
                    )}
                  </>
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
