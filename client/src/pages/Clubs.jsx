import { useState, useEffect } from 'react';
import useClubStore from '../store/clubStore';
import ClubCard from '../components/ClubCard';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

const Clubs = () => {
  const { clubs, fetchClubs, isLoading, error } = useClubStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const filteredClubs = clubs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Clubs</h1>
          <p className="text-gray-500 font-medium">Find and join communities that match your interests.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search clubs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm text-gray-700 font-medium placeholder-gray-400"
          />
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
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredClubs.length > 0 ? (
            filteredClubs.map((club, index) => (
              <motion.div
                key={club._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ClubCard club={club} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 font-medium bg-white rounded-3xl">
              No clubs found matching your search.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Clubs;
