import { useEffect } from 'react';
import useMatchStore from '../store/matchStore';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';

const Leaderboard = () => {
  const { leaderboard, fetchLeaderboard, isLoading, error } = useMatchStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Club Leaderboard</h1>
        <p className="text-gray-500 font-medium">Rankings based on match performance across all sports.</p>
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
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 font-bold text-gray-600 uppercase text-xs tracking-wider rounded-tl-3xl">Rank</th>
                  <th className="py-4 px-6 font-bold text-gray-600 uppercase text-xs tracking-wider">Team</th>
                  <th className="py-4 px-6 font-bold text-gray-600 uppercase text-xs tracking-wider text-center">Played</th>
                  <th className="py-4 px-6 font-bold text-gray-600 uppercase text-xs tracking-wider text-center">W</th>
                  <th className="py-4 px-6 font-bold text-gray-600 uppercase text-xs tracking-wider text-center">D</th>
                  <th className="py-4 px-6 font-bold text-gray-600 uppercase text-xs tracking-wider text-center">L</th>
                  <th className="py-4 px-6 font-bold text-gray-600 uppercase text-xs tracking-wider text-center">GF</th>
                  <th className="py-4 px-6 font-bold text-gray-600 uppercase text-xs tracking-wider text-center">GA</th>
                  <th className="py-4 px-6 font-bold text-gray-600 uppercase text-xs tracking-wider text-center">GD</th>
                  <th className="py-4 px-6 font-bold text-primary-600 uppercase text-xs tracking-wider text-center rounded-tr-3xl">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length > 0 ? (
                  leaderboard.map((teamData, index) => (
                    <motion.tr 
                      key={teamData.team}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 font-black text-gray-900">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                          {index === 0 ? <Trophy size={16} className="text-yellow-500" /> : 
                           index === 1 ? <Medal size={16} className="text-gray-400" /> : 
                           index === 2 ? <Medal size={16} className="text-amber-600" /> : 
                           index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900 flex items-center gap-2">
                        {index === 0 && <Star size={16} className="text-yellow-500" fill="currentColor" />}
                        {teamData.team}
                      </td>
                      <td className="py-4 px-6 text-center font-medium text-gray-600">{teamData.played}</td>
                      <td className="py-4 px-6 text-center font-bold text-green-600">{teamData.won}</td>
                      <td className="py-4 px-6 text-center font-medium text-gray-500">{teamData.drawn}</td>
                      <td className="py-4 px-6 text-center font-bold text-red-500">{teamData.lost}</td>
                      <td className="py-4 px-6 text-center font-medium text-gray-600">{teamData.goalsFor}</td>
                      <td className="py-4 px-6 text-center font-medium text-gray-600">{teamData.goalsAgainst}</td>
                      <td className="py-4 px-6 text-center font-bold text-gray-900">{teamData.goalsFor - teamData.goalsAgainst}</td>
                      <td className="py-4 px-6 text-center font-black text-primary-600 text-lg bg-primary-50/30">{teamData.points}</td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-gray-500 font-medium">
                      No matches completed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
