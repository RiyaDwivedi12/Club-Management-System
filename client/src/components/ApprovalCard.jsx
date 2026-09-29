import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, MapPin, DollarSign, CheckCircle2, XCircle, ChevronRight, UserCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ApprovalCard = ({ event, onApprove, onReject, isRemoving }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Determine left border color based on status
  let borderClass = 'border-amber-500';
  if (event.approvalStatus === 'approved') borderClass = 'border-green-500';
  if (event.approvalStatus === 'rejected') borderClass = 'border-red-500';

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (rejectReason.trim()) {
      onReject(event._id, rejectReason);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
      className={`bg-white rounded-xl shadow-sm border-l-4 ${borderClass} border-t border-b border-r border-gray-100 overflow-hidden mb-4 relative ${isRemoving ? 'pointer-events-none opacity-50' : ''}`}
    >
      <div className="p-5 flex flex-col md:flex-row justify-between gap-6">
        {/* Left Side: Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <span className="text-primary-600 bg-primary-50 p-1.5 rounded-lg">
                <Calendar size={20} strokeWidth={2.5} />
              </span>
              {event.title}
            </h3>
            <StatusBadge status={event.approvalStatus} note={event.approvalNote} />
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm font-semibold text-gray-600">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md">
              <UserCircle size={16} className="text-slate-400" />
              <span>{event.clubId?.name || 'Club'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md">
              <DollarSign size={16} className="text-slate-400" />
              <span>Budget: TBD</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md">
              <MapPin size={16} className="text-slate-400" />
              <span>{event.category}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md">
              <Users size={16} className="text-slate-400" />
              <span>{event.maxParticipants > 0 ? event.maxParticipants : 'Unlimited'} Cap</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 line-clamp-2 mt-2">{event.description}</p>
        </div>

        {/* Right Side: Actions */}
        {event.approvalStatus === 'pending' && (
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 min-w-[160px] justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
            <button 
              onClick={() => onApprove(event._id)}
              className="flex items-center justify-center gap-2 w-full bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2.5 px-4 rounded-lg transition-colors group"
            >
              <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
              Approve
            </button>
            <button 
              onClick={() => setShowRejectForm(!showRejectForm)}
              className="flex items-center justify-center gap-2 w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 px-4 rounded-lg transition-colors group"
            >
              <XCircle size={18} className="group-hover:scale-110 transition-transform" />
              Reject
            </button>
            <button className="flex items-center justify-center gap-1 w-full text-slate-500 hover:text-slate-800 font-bold py-2 px-4 rounded-lg transition-colors text-sm mt-1">
              View Details <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Reject Inline Form */}
      <AnimatePresence>
        {showRejectForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-red-100 bg-red-50/50 overflow-hidden"
          >
            <form onSubmit={handleRejectSubmit} className="p-4 md:px-6 flex gap-3 items-start">
              <div className="flex-1">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Provide a reason for rejection..." 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-sm font-medium"
                />
              </div>
              <button 
                type="submit" 
                disabled={!rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm"
              >
                Confirm Rejection
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ApprovalCard;
