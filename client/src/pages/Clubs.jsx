import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useClubStore from '../store/clubStore';
import ClubCard from '../components/ClubCard';
import { Search, Compass, CreditCard } from 'lucide-react';
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
        actions={
          <Link
            to="/membership-fees"
            className="btn-primary text-sm inline-flex items-center gap-2 shadow-sm"
          >
            <CreditCard size={15} />
            Pay Membership Fee
          </Link>
        }
      />

      {/* Quick membership dues callout banner */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CreditCard size={20} />
          </div>
          <div>
            <h4 className="font-bold text-dark-900 text-sm">Official Club Membership Fee Gateway</h4>
            <p className="text-slate-600 text-xs">
              Pay your annual membership dues directly through Razorpay to unlock voting rights and official collegiate receipts.
            </p>
          </div>
        </div>
        <Link
          to="/membership-fees"
          className="btn-secondary text-xs font-semibold shrink-0 py-2 px-3.5 inline-flex items-center gap-1.5"
        >
          View Dues & Pay
        </Link>
      </div>

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
