import { Link } from 'react-router-dom';
import { Users, ChevronRight, CheckCircle2 } from 'lucide-react';

const ClubCard = ({ club }) => {
  const categoryColors = {
    Sports: 'text-amber-700',
    Cultural: 'text-indigo-700',
    Literary: 'text-sky-700',
  };

  const catText = categoryColors[club.category] || 'text-blue-700';

  return (
    <div className="card card-hover overflow-hidden flex flex-col h-full group">
      {/* Top Banner */}
      <div className="h-40 relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
        {club.logo ? (
          <img
            src={club.logo}
            alt={club.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <>
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="relative flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {club.name ? club.name.substring(0, 2).toUpperCase() : 'CL'}
                </span>
              </div>
              <span className="text-xs font-semibold text-blue-100/90">
                Campus Club
              </span>
            </div>
          </>
        )}

        {/* Category Badge Overlaid */}
        {club.category && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 backdrop-blur-md shadow-sm ${catText}`}
          >
            {club.category}
          </span>
        )}

        {/* Accepting Members Indicator */}
        {club.isAcceptingMembers && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={12} /> Recruiting
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 min-w-0">
        <h3 className="text-lg font-bold text-dark-900 group-hover:text-blue-700 transition-colors line-clamp-1 break-words">
          {club.name}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mt-1 min-h-[40px]">
          {club.description || 'Join this student organization to connect, learn, and lead campus events.'}
        </p>

        {/* Member & Fee details */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold py-3 border-t border-slate-100 mt-4 mb-4">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Users size={15} className="text-blue-600" />
            <span>{club.members?.length || 0} Members</span>
          </div>
          {club.joinFee !== undefined && (
            <span className={club.joinFee === 0 ? 'badge-green' : 'badge-blue'}>
              {club.joinFee === 0 ? 'Free to Join' : `₹${club.joinFee} Fee`}
            </span>
          )}
        </div>

        {/* Action Button */}
        <Link
          to={`/clubs/${club._id}`}
          className="btn-soft w-full mt-auto group/btn"
        >
          <span>View Details & Join</span>
          <ChevronRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default ClubCard;
