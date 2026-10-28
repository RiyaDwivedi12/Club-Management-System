import { useState, useEffect } from 'react';
import useClubStore from '../store/clubStore';
import ClubCard from '../components/ClubCard';
import { Search, Compass, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'Sports', 'Cultural', 'Literary'];

const Clubs = () => {
  const { clubs, fetchClubs, isLoading, error } = useClubStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const safeClubs = Array.isArray(clubs) ? clubs : [];
  const filteredClubs = safeClubs.filter((c) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 rounded-3xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Compass size={280} />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-teal-100 text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
            <Compass size={14} className="text-teal-200" />
            <span>Campus Communities</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            Discover Campus Clubs
          </h1>
          <p className="text-teal-100 text-sm md:text-base font-medium leading-relaxed">
            Connect with student organizations, develop leadership skills, participate in regional tournaments, and build lifelong friendships.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clubs by name or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 border border-gray-200 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Clubs Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-bold text-gray-500">Loading campus clubs...</p>
        </div>
      ) : filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClubs.map((club) => (
            <ClubCard key={club._id} club={club} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200 p-8">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
            <Compass size={32} />
          </div>
          <h3 className="text-lg font-black text-gray-800 mb-1">No clubs found</h3>
          <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto mb-4">
            No clubs matched your current search or category filter. Try clearing filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
            }}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Clubs;
