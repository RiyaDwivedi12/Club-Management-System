import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';

const EventCard = ({ event, onJoin }) => {
  const { user } = useAuthStore();
  
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const statusColors = {
    upcoming: 'bg-primary-100 text-primary-700',
    ongoing: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
  };

  const isJoined = user && event.participants?.includes(user._id);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.1)] overflow-hidden transition-all duration-300 border border-gray-100 flex flex-row h-full group"
    >
      {/* Left side: Date (Ticket stub style) */}
      <div className="bg-primary-50 border-r border-gray-100 border-dashed w-24 flex flex-col justify-center items-center py-6 px-2 shrink-0">
        <span className="text-primary-600 font-black uppercase text-sm tracking-widest">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
        <span className="text-4xl font-black text-primary-700 my-1">{new Date(event.date).getDate()}</span>
        <span className="text-primary-600 font-bold text-xs">{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric' })}</span>
      </div>

      {/* Right side: Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-primary-500 bg-primary-50 px-2 py-1 rounded-md">
            {event.category}
          </span>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColors[event.status] || statusColors.upcoming}`}>
            {event.status}
          </span>
        </div>
        
        <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-primary-600 transition-colors">{event.title}</h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow font-medium leading-relaxed">{event.description}</p>
        
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center text-sm font-bold text-gray-600">
            <Clock size={16} className="mr-2 text-gray-400" />
            <span>{new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center text-sm font-bold text-gray-600">
            <Users size={16} className="mr-2 text-gray-400" />
            <span>{event.participants?.length || 0} / {event.maxParticipants === 0 ? 'Unlimited' : event.maxParticipants} Attendees</span>
          </div>
        </div>
        
        {user && user.role === 'student' && event.status === 'upcoming' && (
          <button 
            onClick={() => onJoin && onJoin(event._id)}
            disabled={isJoined}
            className={`w-full mt-auto py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
              isJoined 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-soft-purple hover:-translate-y-0.5'
            }`}
          >
            {isJoined ? 'Already Joined' : 'Join Event'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default EventCard;
