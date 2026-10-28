import { useState, useEffect } from 'react';
import useClubStore from '../store/clubStore';
import ClubCard from '../components/ClubCard';
import { Search, Compass } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/EmptyState';

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        variant="hero"
        eyebrow="Campus Communities"
        eyebrowIcon={Compass}
        icon={Compass}
        title="Discover Campus Clubs"
        description="Connect with student organizations, develop leadership skills, participate in regional tournaments, and build lifelong friendships."
      />

      {/* Search and Filters Bar */}
      <div className="card p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1 min-w-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`tab ${selectedCategory === cat ? 'tab-active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clubs by name or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-icon"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Clubs Grid */}
      {isLoading ? (
        <LoadingState label="Loading campus clubs..." />
      ) : filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredClubs.map((club) => (
            <ClubCard key={club._id} club={club} />
          ))}
        </div>
      ) : (
        <div className="card border-dashed">
          <EmptyState
            icon={Compass}
            title="No clubs found"
            description="No clubs matched your current search or category filter. Try clearing filters."
            action={
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="btn-primary"
              >
                Reset Filters
              </button>
            }
          />
        </div>
      )}
    </div>
  );
};

export default Clubs;
