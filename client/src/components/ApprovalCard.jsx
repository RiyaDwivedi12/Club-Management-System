import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, MapPin, DollarSign, CheckCircle2, XCircle, ChevronRight, UserCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ApprovalCard = ({ event, onApprove, onReject, isRemoving }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Determine left border color based on status
  let borderClass = 'border-l-amber-500';
  if (event.approvalStatus === 'approved') borderClass = 'border-l-emerald-500';
  if (event.approvalStatus === 'rejected') borderClass = 'border-l-red-500';

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
      className={`card border-l-4 ${borderClass} overflow-hidden mb-4 relative ${isRemoving ? 'pointer-events-none opacity-50' : ''}`}
    >
      <div className="p-5 flex flex-col md:flex-row justify-between gap-5 md:gap-6">
        {/* Left Side: Info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </span>
            <div className="min-w-0 flex flex-wrap items-center gap-y-1 pt-1.5">
              <h3 className="text-lg font-bold tracking-tight text-dark-900 break-words">
                {event.title}
              </h3>
              <StatusBadge status={event.approvalStatus} note={event.approvalNote} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg min-w-0">
              <UserCircle size={15} className="text-slate-400 shrink-0" />
              <span className="truncate">{event.clubId?.name || 'Club'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              <DollarSign size={15} className="text-slate-400 shrink-0" />
              <span>Budget: TBD</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              <MapPin size={15} className="text-slate-400 shrink-0" />
              <span>{event.category}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              <Users size={15} className="text-slate-400 shrink-0" />
              <span>{event.maxParticipants > 0 ? event.maxParticipants : 'Unlimited'} Cap</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{event.description}</p>
        </div>

        {/* Right Side: Actions */}
        {event.approvalStatus === 'pending' && (
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 md:w-44 shrink-0 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <button
              onClick={() => onApprove(event._id)}
              className="btn-success w-full sm:flex-1 md:flex-none group"
            >
              <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
              Approve
            </button>
            <button
              onClick={() => setShowRejectForm(!showRejectForm)}
              className="btn w-full sm:flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-700 group"
            >
              <XCircle size={18} className="group-hover:scale-110 transition-transform" />
              Reject
            </button>
            <button className="btn-ghost btn-sm w-full sm:flex-1 md:flex-none">
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
            <form onSubmit={handleRejectSubmit} className="p-4 md:px-6 flex flex-col sm:flex-row gap-3 sm:items-start">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  autoFocus
                  placeholder="Provide a reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input border-red-200 focus:border-red-400 focus:ring-red-100"
                />
              </div>
              <button
                type="submit"
                disabled={!rejectReason.trim()}
                className="btn-danger w-full sm:w-auto"
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
