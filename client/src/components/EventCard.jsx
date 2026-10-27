import { Calendar, Clock, MapPin, Users, QrCode } from 'lucide-react';
import useAuthStore from '../store/authStore';

const EventCard = ({ event, onJoin, onViewPass }) => {
  const { user } = useAuthStore();

  const eventDate = new Date(event.date);
  const monthName = eventDate.toLocaleDateString('en-US', { month: 'short' });
  const dayNumber = eventDate.getDate();
  const yearNumber = eventDate.getFullYear();

  const statusStyles = {
    upcoming: 'bg-teal-50 text-teal-700 border-teal-200',
    ongoing: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const isJoined = user && event.participants?.includes(user._id);

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-teal-200 overflow-hidden flex flex-col sm:flex-row h-full group">
      {/* Left side: Date Stub */}
      <div className="bg-teal-50/80 border-b sm:border-b-0 sm:border-r border-dashed border-teal-200 w-full sm:w-28 flex flex-row sm:flex-col justify-center items-center py-4 sm:py-6 px-4 shrink-0 gap-2 sm:gap-0">
        <span className="text-teal-700 font-extrabold uppercase text-xs tracking-wider">
          {monthName}
        </span>
        <span className="text-3xl sm:text-4xl font-black text-gray-900 my-0 sm:my-1">
          {dayNumber}
        </span>
        <span className="text-teal-600 font-bold text-xs">{yearNumber}</span>
      </div>

      {/* Right side: Content */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3 gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
            {event.category || 'Event'}
          </span>
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              statusStyles[event.status] || statusStyles.upcoming
            }`}
          >
            {event.status}
          </span>
        </div>

        <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-teal-700 transition-colors">
          {event.title}
        </h3>
        <p className="text-gray-500 text-xs sm:text-sm mb-4 line-clamp-2 flex-grow font-medium leading-relaxed">
          {event.description}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-t border-gray-100 text-xs font-bold text-gray-600 mb-4">
          <div className="flex items-center text-gray-600">
            <Clock size={15} className="mr-1.5 text-teal-600" />
            <span>
              {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users size={15} className="mr-1.5 text-teal-600" />
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
                className="w-full py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-emerald-200 transition-all cursor-pointer"
              >
                <QrCode size={16} /> View Event QR Pass
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onJoin && onJoin(event._id)}
                className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all bg-teal-600 text-white hover:bg-teal-700 shadow-sm cursor-pointer"
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
