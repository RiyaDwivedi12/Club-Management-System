import { Info } from 'lucide-react';
import { useState } from 'react';

const StatusBadge = ({ status, note }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const normalizedStatus = status?.toLowerCase() || 'pending';

  let badgeClass, label;

  switch (normalizedStatus) {
    case 'approved':
      badgeClass = 'badge-green';
      label = 'Approved';
      break;
    case 'rejected':
      badgeClass = 'badge-red';
      label = 'Rejected';
      break;
    case 'pending':
    default:
      badgeClass = 'badge-amber';
      label = 'Pending Review';
      break;
  }

  return (
    <div className="relative inline-flex items-center gap-1.5 ml-2 shrink-0">
      <span className={`${badgeClass} whitespace-nowrap`}>
        {label}
        {normalizedStatus === 'rejected' && note && (
          <button
            type="button"
            aria-label="Show rejection reason"
            className="ml-0.5 text-red-600 hover:text-red-800 focus:outline-none cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
              e.preventDefault();
              setShowTooltip(!showTooltip);
            }}
          >
            <Info size={12} strokeWidth={2.5} />
          </button>
        )}
      </span>

      {showTooltip && normalizedStatus === 'rejected' && note && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 max-w-[70vw] p-2.5 bg-dark-900 text-white text-xs rounded-xl shadow-lg z-50 pointer-events-none">
          <div className="font-semibold mb-1">Rejection Reason:</div>
          <div className="text-slate-200 break-words">{note}</div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-dark-900"></div>
        </div>
      )}
    </div>
  );
};

export default StatusBadge;
