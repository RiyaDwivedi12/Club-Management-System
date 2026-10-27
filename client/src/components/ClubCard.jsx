import { Link } from 'react-router-dom';
import { Users, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ClubCard = ({ club }) => {
  const categoryColors = {
    Sports: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    Cultural: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    Literary: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  };

  const catStyle = categoryColors[club.category] || {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-teal-200 overflow-hidden flex flex-col h-full group">
      {/* Top Banner */}
      <div className="h-44 relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 flex items-center justify-center">
        {club.logo ? (
          <img
            src={club.logo}
            alt={club.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl font-black text-white tracking-wider">
                {club.name ? club.name.substring(0, 2).toUpperCase() : 'CL'}
              </span>
            </div>
            <span className="text-xs font-bold text-teal-100 tracking-wide uppercase opacity-90">
              Campus Club
            </span>
          </div>
        )}

        {/* Category Badge Overlaid */}
        {club.category && (
          <span
            className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/90 backdrop-blur-md shadow-sm ${catStyle.text}`}
          >
            {club.category}
          </span>
        )}

        {/* Accepting Members Indicator */}
        {club.isAcceptingMembers && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={12} /> Recruiting
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="text-xl font-black text-gray-900 group-hover:text-teal-700 transition-colors line-clamp-1">
            {club.name}
          </h3>
          <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-1 min-h-[32px]">
            {club.description || 'Join this student organization to connect, learn, and lead campus events.'}
          </p>
        </div>

        {/* Member & Fee details */}
        <div className="flex items-center justify-between text-xs font-bold text-gray-600 py-3 border-y border-gray-100 my-3">
          <div className="flex items-center gap-1.5 text-gray-700">
            <Users size={15} className="text-teal-600" />
            <span>{club.members?.length || 0} Members</span>
          </div>
          {club.joinFee !== undefined && (
            <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md">
              {club.joinFee === 0 ? 'Free to Join' : `₹${club.joinFee} Fee`}
            </span>
          )}
        </div>

        {/* Action Button */}
        <Link
          to={`/clubs/${club._id}`}
          className="mt-auto flex items-center justify-center gap-2 w-full py-3 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-xl font-bold text-sm transition-all duration-200 group/btn shadow-sm"
        >
          <span>View Details & Join</span>
          <ChevronRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default ClubCard;
