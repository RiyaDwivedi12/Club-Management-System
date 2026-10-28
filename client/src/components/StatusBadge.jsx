import { Info } from 'lucide-react';
import { useState } from 'react';

const StatusBadge = ({ status, note }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const normalizedStatus = status?.toLowerCase() || 'pending';

  let bgClass, textClass, ringClass, label;

  switch (normalizedStatus) {
    case 'approved':
      bgClass = 'bg-emerald-100';
      textClass = 'text-emerald-800';
      ringClass = 'ring-emerald-600/20';
      label = 'Approved';
      break;
    case 'rejected':
      bgClass = 'bg-red-100';
      textClass = 'text-red-800';
      ringClass = 'ring-red-600/20';
      label = 'Rejected';
      break;
    case 'pending':
    default:
      bgClass = 'bg-amber-100';
      textClass = 'text-amber-800';
      ringClass = 'ring-amber-600/20';
      label = 'Pending Review';
      break;
  }

  return (
    <div className="relative inline-flex items-center gap-1.5 ml-2">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ring-1 ring-inset ${ringClass} ${bgClass} ${textClass}`}>
        {label}
        {normalizedStatus === 'rejected' && note && (
          <button 
            className="ml-1 text-red-600 hover:text-red-900 focus:outline-none cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
              e.preventDefault();
              setShowTooltip(!showTooltip);
            }}
          >
            <Info size={12} strokeWidth={3} />
          </button>
        )}
      </span>

      {showTooltip && normalizedStatus === 'rejected' && note && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-50 pointer-events-none">
          <div className="font-bold mb-1">Rejection Reason:</div>
          <div>{note}</div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};

export default StatusBadge;
