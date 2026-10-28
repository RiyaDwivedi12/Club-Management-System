import { Clock, Users, QrCode } from 'lucide-react';
import useAuthStore from '../store/authStore';

const EventCard = ({ event, onJoin, onViewPass }) => {
  const { user } = useAuthStore();

  const eventDate = new Date(event.date);
  const monthName = eventDate.toLocaleDateString('en-US', { month: 'short' });
  const dayNumber = eventDate.getDate();
  const yearNumber = eventDate.getFullYear();

  const statusStyles = {
    upcoming: 'badge-blue',
    ongoing: 'badge-green',
    completed: 'badge-slate',
  };

  const isJoined = user && event.participants?.includes(user._id);

  return (
    <div className="card card-hover overflow-hidden flex flex-col sm:flex-row h-full group">
      {/* Left side: Date Stub */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-full sm:w-28 flex flex-row sm:flex-col justify-center items-center py-3 sm:py-6 px-4 shrink-0 gap-2 sm:gap-0">
        <span className="text-blue-100 font-semibold uppercase text-xs tracking-wider">
          {monthName}
        </span>
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight my-0 sm:my-1">
          {dayNumber}
        </span>
        <span className="text-blue-100/90 font-semibold text-xs">{yearNumber}</span>
      </div>

      {/* Right side: Content */}
      <div className="p-5 flex flex-col flex-1 min-w-0">
        <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
          <span className="badge-indigo">
            {event.category || 'Event'}
          </span>
          <span className={`${statusStyles[event.status] || statusStyles.upcoming} capitalize`}>
            {event.status}
          </span>
        </div>

        <h3 className="text-lg font-bold text-dark-900 mb-1.5 leading-snug group-hover:text-blue-700 transition-colors break-words">
          {event.title}
        </h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2 flex-grow leading-relaxed">
          {event.description}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 border-t border-slate-100 text-xs font-semibold text-slate-600 mb-4">
          <div className="flex items-center">
            <Clock size={15} className="mr-1.5 text-blue-600" />
            <span>
              {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center">
            <Users size={15} className="mr-1.5 text-blue-600" />
            <span>
              {event.participants?.length || 0} /{' '}
              {event.maxParticipants === 0 ? 'Unlimited' : event.maxParticipants} Attendees
            </span>
          </div>
        </div>

        {user && user.role === 'student' && event.status === 'upcoming' && (
          <div className="mt-auto">
            {isJoined ? (
              <button
                type="button"
                onClick={() => onViewPass && onViewPass(event)}
                className="btn w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              >
                <QrCode size={16} /> View Event QR Pass
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onJoin && onJoin(event._id)}
                className="btn-primary w-full"
              >
                Register for Event
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
