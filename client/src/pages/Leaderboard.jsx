import { useEffect, useState, useRef } from 'react';
import useMatchStore from '../store/matchStore';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Upload, Calendar, XCircle, CheckCircle, Clock, Medal, Award, Search, RefreshCw, BarChart2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

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
        return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle size={14} /> Completed</span>;
      case 'walkover':
        return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold"><Trophy size={14} /> Walkover</span>;
      case 'disqualified':
        return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold"><XCircle size={14} /> Disqualified</span>;
      case 'live':
        return <span className="flex items-center gap-1 text-red-500 bg-red-50 px-3 py-1 rounded-full text-xs font-bold animate-pulse"><Clock size={14} /> Live</span>;
      case 'scheduled':
      default:
        return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold"><Calendar size={14} /> Scheduled</span>;
    }
  };

  const filteredLeaderboard = (leaderboard || []).filter(item =>
    item.teamName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMatches = (matches || []).filter(m =>
    m.teamA?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.teamB?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="mb-8 p-8 md:p-10 rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-teal-100 font-bold text-xs uppercase tracking-wider mb-3 border border-white/20">
              <Trophy size={14} className="text-teal-200" /> Championship League
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">
              Standings & Fixtures
            </h1>
            <p className="text-teal-100 font-medium text-sm md:text-base max-w-xl">
              Real-time college tournaments, class vs class match points, and athletic standings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { fetchLeaderboard(); fetchMatches(); toast.success('Data refreshed'); }}
              className="p-3 bg-white/15 hover:bg-white/25 rounded-2xl text-white transition-all backdrop-blur-md cursor-pointer shadow-sm"
              title="Refresh Stats"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            {isAdmin && (
              <div>
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
                  className="flex items-center gap-2 bg-white text-teal-700 hover:bg-teal-50 px-5 py-3 rounded-2xl font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Upload size={18} />
                  {isUploading ? 'Uploading...' : 'Import Schedule (Excel)'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-bold flex items-center gap-2 border border-red-200">
          <XCircle size={20} /> {error}
        </div>
      )}

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'standings'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <BarChart2 size={16} /> Points Table
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'matches'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar size={16} /> All Matches ({matches.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search team or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Content Area */}
      {isLoading && !isUploading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : activeTab === 'standings' ? (
        /* Standings Table */
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-black uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-6">Team / Section</th>
                  <th className="py-4 px-4 text-center">Played</th>
                  <th className="py-4 px-4 text-center">Won</th>
                  <th className="py-4 px-4 text-center">Drawn</th>
                  <th className="py-4 px-4 text-center">Lost</th>
                  <th className="py-4 px-4 text-center hidden md:table-cell">GF</th>
                  <th className="py-4 px-4 text-center hidden md:table-cell">GA</th>
                  <th className="py-4 px-4 text-center">GD</th>
                  <th className="py-4 px-6 text-center font-black text-gray-900">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-gray-700 text-sm">
                {filteredLeaderboard.length > 0 ? (
                  filteredLeaderboard.map((row, idx) => {
                    const gd = row.goalsFor - row.goalsAgainst;
                    const isTopThree = idx < 3;
                    return (
                      <motion.tr
                        key={row.teamName || idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`hover:bg-primary-50/30 transition-colors ${
                          idx === 0 ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-4 px-6 text-center font-black">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 shadow-sm">
                              🥇
                            </span>
                          ) : idx === 1 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 shadow-sm">
                              🥈
                            </span>
                          ) : idx === 2 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 shadow-sm">
                              🥉
                            </span>
                          ) : (
                            <span className="text-gray-400 font-bold">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 font-black flex items-center justify-center shadow-sm">
                              {row.teamName?.charAt(0) || 'T'}
                            </div>
                            <div>
                              <div className="font-black text-gray-900 text-base">{row.teamName}</div>
                              {isTopThree && (
                                <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                                  <Medal size={12} /> Podium Contender
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-bold">{row.played}</td>
                        <td className="py-4 px-4 text-center text-green-600 font-black">{row.won}</td>
                        <td className="py-4 px-4 text-center text-gray-500 font-bold">{row.drawn}</td>
                        <td className="py-4 px-4 text-center text-red-500 font-bold">{row.lost}</td>
                        <td className="py-4 px-4 text-center text-gray-500 hidden md:table-cell">{row.goalsFor}</td>
                        <td className="py-4 px-4 text-center text-gray-500 hidden md:table-cell">{row.goalsAgainst}</td>
                        <td className="py-4 px-4 text-center font-black">
                          <span className={gd > 0 ? 'text-green-600' : gd < 0 ? 'text-red-500' : 'text-gray-400'}>
                            {gd > 0 ? `+${gd}` : gd}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-black">
                          <span className="inline-block px-3 py-1 rounded-xl bg-primary-600 text-white font-black text-base shadow-soft-purple">
                            {row.points}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <Trophy size={48} className="mx-auto text-gray-300 mb-3" />
                      <h4 className="text-lg font-bold text-gray-800">No Standings Available Yet</h4>
                      <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                        Once matches are played and completed, the standings table and goal differences will automatically compute here.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Match Fixtures Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match, index) => (
              <motion.div 
                key={match._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-bold text-gray-400">
                    {new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {getStatusBadge(match.status)}
                </div>

                <div className="flex justify-between items-center flex-1 my-4">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`text-xl font-black text-center ${match.winner === match.teamA ? 'text-green-600' : 'text-gray-800'}`}>
                      {match.teamA}
                    </div>
                    {(match.status === 'completed' || match.status === 'live') && (
                      <div className="text-3xl font-black mt-2 text-gray-900">{match.scoreA}</div>
                    )}
                  </div>
                  
                  <div className="px-4 text-gray-400 font-black text-sm">VS</div>
                  
                  <div className="flex flex-col items-center flex-1">
                    <div className={`text-xl font-black text-center ${match.winner === match.teamB ? 'text-green-600' : 'text-gray-800'}`}>
                      {match.teamB}
                    </div>
                    {(match.status === 'completed' || match.status === 'live') && (
                      <div className="text-3xl font-black mt-2 text-gray-900">{match.scoreB}</div>
                    )}
                  </div>
                </div>

                {(match.status === 'completed' || match.status === 'walkover') && match.winner && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                    <span className="text-sm text-gray-500 font-medium">Winner:</span>
                    <span className="ml-2 font-bold text-primary-600">{match.winner}</span>
                  </div>
                )}
                
                {match.status === 'disqualified' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                    <span className="text-sm text-red-500 font-bold">Match Disqualified</span>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Matches Found</h3>
              <p className="text-gray-500">There are no matches scheduled or matching your search.</p>
              {isAdmin && (
                <p className="text-gray-500 mt-2">Use the upload button above to import a match schedule.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
